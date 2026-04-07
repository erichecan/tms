#!/usr/bin/env python3
"""
Phase 2.2b: 导入有文本数据的「图片 sheet」中可结构化的定价规则
这些 sheet 虽然主要靠图片，但也有部分文本数据可直接解析。

用法:
  python scripts/import-partner-pricing-text.py --preview
  python scripts/import-partner-pricing-text.py --commit
"""

import os
import re
import json
import argparse

import openpyxl
import psycopg2

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(ROOT, "apps", "backend", ".env")
FILE_QUOTE = os.path.join(ROOT, "合作单位报价卡.xlsx")


def _load_database_url():
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url or "..." in url:
        if os.path.isfile(ENV_PATH):
            with open(ENV_PATH, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DATABASE_URL="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        url = val
                        break
    return url


def _clean(v):
    if v is None:
        return None
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return int(v) if v == int(v) else float(v)
    s = str(v).strip()
    return s if s else None


def expand_destinations(s):
    if not s:
        return []
    s = str(s).strip().upper()
    codes = re.findall(r'[A-Z]{2,3}\d+[A-Z]?', s)
    if codes:
        return codes
    codes = re.findall(r'[A-Z]{2,3}', s)
    return [c for c in codes if len(c) >= 3 and c not in ('AND', 'THE', 'FOR', 'NOT', 'ALL', 'UPS', 'INC')]


# ─── Custom parsers for text-based image sheets ───────────────────────────────

def parse_noahhammert(ws):
    """Noah: 首板125，加板+15; Hammert: 150/趟，尾板10/P封顶60"""
    rules = []
    # Noah
    rules.append({
        "destination_warehouse": "ALL",
        "pricing_type": "flat",
        "transport_mode": None,
        "pallet_tier_min": 1, "pallet_tier_max": 999,
        "unit_type": "per_pallet",
        "base_price": 125, "unit_price": 15,
        "notes": "Noah: 首板125，加板+15 (effective Nov 1 2024)",
    })
    # Hammert
    rules.append({
        "destination_warehouse": "ALL",
        "pricing_type": "flat",
        "transport_mode": None,
        "pallet_tier_min": 1, "pallet_tier_max": 999,
        "unit_type": "per_pallet",
        "base_price": 150, "unit_price": 10,
        "notes": "Hammert: 150/趟 尾板10/P 封顶60",
    })
    # Hammert Belleville
    rules.append({
        "destination_warehouse": "BELLEVILLE",
        "pricing_type": "flat",
        "transport_mode": "53尺",
        "pallet_tier_min": None, "pallet_tier_max": None,
        "unit_type": "per_trip",
        "base_price": 700, "unit_price": 0,
        "notes": "Belleville 53尺单趟700，需发车+50",
    })
    return rules


def parse_terry_ottawa(ws):
    """从渥太华仓库拉货送YOO1: 3板以内100/板, 4-10板90/板, 10+板80/板"""
    return [
        {
            "destination_warehouse": "YOO1",
            "pricing_type": "matrix",
            "transport_mode": None,
            "pallet_tier_min": 1, "pallet_tier_max": 3,
            "unit_type": "per_pallet",
            "base_price": 0, "unit_price": 100,
            "notes": "Ottawa仓→YOO1, 包等待包拒收回程, 不包拒收后二次送仓",
        },
        {
            "destination_warehouse": "YOO1",
            "pricing_type": "matrix",
            "transport_mode": None,
            "pallet_tier_min": 4, "pallet_tier_max": 10,
            "unit_type": "per_pallet",
            "base_price": 0, "unit_price": 90,
            "notes": "Ottawa仓→YOO1",
        },
        {
            "destination_warehouse": "YOO1",
            "pricing_type": "matrix",
            "transport_mode": None,
            "pallet_tier_min": 11, "pallet_tier_max": 999,
            "unit_type": "per_pallet",
            "base_price": 0, "unit_price": 80,
            "notes": "Ottawa仓→YOO1",
        },
    ]


def parse_jeff_don(ws):
    """Location-based pricing with wait fees."""
    rows = list(ws.iter_rows(values_only=True))
    rules = []
    # Manual entries from the text data
    locations = [
        ("Markham", 150, "灯泡厂"),
        ("Mississauga", 175, "sysco都是小车"),
        ("Milton", 200, None),
        ("Peterborough", 375, "彼得堡"),
        ("Woodstock", 375, None),
        ("Vaughan", 325, "大车"),
        ("Vaughan", 175, "小车"),
    ]
    for loc, price, note in locations:
        rules.append({
            "destination_warehouse": loc,
            "pricing_type": "zone",
            "transport_mode": "大车" if note and "大车" in note else ("小车" if note and "小车" in note else None),
            "pallet_tier_min": None, "pallet_tier_max": None,
            "unit_type": "per_trip",
            "base_price": price, "unit_price": 0,
            "surcharges": {"等待费": 50},
            "notes": f"免1小时+50/小时" + (f" ({note})" if note else ""),
        })
    # 阿东 pricing from text
    for dest, price in [("YGK", 700), ("YOO", 350), ("YYZ3", 300), ("YYZ9", 330)]:
        rules.append({
            "destination_warehouse": dest,
            "pricing_type": "zone",
            "transport_mode": "大车",
            "pallet_tier_min": None, "pallet_tier_max": None,
            "unit_type": "per_trip",
            "base_price": price, "unit_price": 0,
            "notes": "阿东大车报价",
        })
    for dest, price, pallet_price in [("YGK", 500, 40), ("YOO", 250, 30), ("YYZ3", 200, 30), ("YYZ9", 230, 30)]:
        rules.append({
            "destination_warehouse": dest,
            "pricing_type": "zone",
            "transport_mode": "小车",
            "pallet_tier_min": None, "pallet_tier_max": None,
            "unit_type": "per_trip",
            "base_price": price, "unit_price": 0,
            "notes": f"阿东小车, 散托{pallet_price}/托",
        })
    # 私人地址
    rules.append({
        "destination_warehouse": "PRIVATE",
        "pricing_type": "zone",
        "transport_mode": None,
        "pallet_tier_min": 1, "pallet_tier_max": 999,
        "unit_type": "per_pallet",
        "base_price": 160, "unit_price": 10,
        "notes": "私人地址 首板160 续板+10/P",
    })
    return rules


def parse_straightship(ws):
    """Straightship阿东: 首板85加板35, 整柜价格"""
    rules = []
    # Standard rate
    rules.append({
        "destination_warehouse": "GTA",
        "pricing_type": "flat",
        "transport_mode": None,
        "pallet_tier_min": 1, "pallet_tier_max": 999,
        "unit_type": "per_pallet",
        "base_price": 85, "unit_price": 35,
        "notes": "首板85加板35, 标准范围: 北HWY7 南Eglinton 东Markham Rd 西Mississauga Rd",
    })
    # Alternative rate
    rules.append({
        "destination_warehouse": "GTA",
        "pricing_type": "flat",
        "transport_mode": None,
        "pallet_tier_min": 1, "pallet_tier_max": 999,
        "unit_type": "per_pallet",
        "base_price": 100, "unit_price": 10,
        "notes": "首板100加板+10/板 (方案2)",
    })
    # Hourly rate
    rules.append({
        "destination_warehouse": "GTA",
        "pricing_type": "flat",
        "transport_mode": "包车",
        "pallet_tier_min": None, "pallet_tier_max": None,
        "unit_type": "per_trip",
        "base_price": 280, "unit_price": 0,
        "notes": "包车模式70/小时, 起租4小时=280",
    })
    # 整柜价格 (from text rows 10-14)
    for dest, price in [("YYZ9", 1650), ("YOO1", 1650), ("YYZ3", 1750), ("YYZ4", 1750), ("YYZ7", 1750)]:
        rules.append({
            "destination_warehouse": dest,
            "pricing_type": "flat",
            "transport_mode": "整柜",
            "pallet_tier_min": None, "pallet_tier_max": None,
            "unit_type": "per_trip",
            "base_price": price, "unit_price": 0,
            "surcharges": {"清关": 100},
            "notes": "整柜价格 包等不包拒",
        })
    # YXU1/YGK1 per pallet
    for dest, pp in [("YXU1", 20), ("YGK1", 20)]:
        rules.append({
            "destination_warehouse": dest,
            "pricing_type": "flat",
            "transport_mode": None,
            "pallet_tier_min": None, "pallet_tier_max": None,
            "unit_type": "per_pallet",
            "base_price": 0, "unit_price": pp,
            "notes": "加板价",
        })
    # YOW
    rules.append({
        "destination_warehouse": "YOW",
        "pricing_type": "flat",
        "transport_mode": None,
        "pallet_tier_min": None, "pallet_tier_max": None,
        "unit_type": "per_pallet",
        "base_price": 0, "unit_price": 40,
        "notes": "加板价 W1/3",
    })
    return rules


def parse_michael(ws):
    """Michael: Z3拼板35, 4P以下有提货费50"""
    return [
        {
            "destination_warehouse": "YYZ3",
            "pricing_type": "matrix",
            "transport_mode": None,
            "pallet_tier_min": 1, "pallet_tier_max": 999,
            "unit_type": "per_pallet",
            "base_price": 0, "unit_price": 35,
            "surcharges": {"提货费_4P以下": 50},
            "notes": "Z3拼板35/P, 4P以下有提货费50一次",
        },
    ]


def parse_sunny_charm(ws):
    """Sunny Charm: 送UPS满车260"""
    return [
        {
            "destination_warehouse": "UPS",
            "pricing_type": "flat",
            "transport_mode": "满车",
            "pallet_tier_min": None, "pallet_tier_max": None,
            "unit_type": "per_trip",
            "base_price": 260, "unit_price": 0,
            "notes": "送UPS满车",
        },
    ]


def parse_ctcgvt(ws):
    """CTC/GVT/Tom: 散板120/P, 26整车1350, 53整车1560"""
    rules = []
    # Tom W1/W3报价
    rules.append({
        "destination_warehouse": "YOW1",
        "pricing_type": "matrix",
        "transport_mode": None,
        "pallet_tier_min": 1, "pallet_tier_max": 999,
        "unit_type": "per_pallet",
        "base_price": 0, "unit_price": 120,
        "notes": "Tom-W1/W3报价 散板",
    })
    rules.append({
        "destination_warehouse": "YOW3",
        "pricing_type": "matrix",
        "transport_mode": None,
        "pallet_tier_min": 1, "pallet_tier_max": 999,
        "unit_type": "per_pallet",
        "base_price": 0, "unit_price": 120,
        "notes": "Tom-W1/W3报价 散板",
    })
    rules.append({
        "destination_warehouse": "YOW1",
        "pricing_type": "matrix",
        "transport_mode": "26尺",
        "pallet_tier_min": None, "pallet_tier_max": None,
        "unit_type": "per_trip",
        "base_price": 1350, "unit_price": 0,
        "notes": "26整车",
    })
    rules.append({
        "destination_warehouse": "YOW1",
        "pricing_type": "matrix",
        "transport_mode": "53尺",
        "pallet_tier_min": None, "pallet_tier_max": None,
        "unit_type": "per_trip",
        "base_price": 1560, "unit_price": 0,
        "notes": "53整车",
    })
    # YGK1
    rules.append({
        "destination_warehouse": "YGK1",
        "pricing_type": "matrix",
        "transport_mode": None,
        "pallet_tier_min": 1, "pallet_tier_max": 999,
        "unit_type": "per_pallet",
        "base_price": 0, "unit_price": 70,
        "notes": "YGK1 70/P",
    })
    # Straightship (ST) YGK1 500
    rules.append({
        "destination_warehouse": "YGK1",
        "pricing_type": "matrix",
        "transport_mode": "整车",
        "pallet_tier_min": None, "pallet_tier_max": None,
        "unit_type": "per_trip",
        "base_price": 500, "unit_price": 0,
        "notes": "ST-500",
    })
    # Row 2 shows 100 (likely a per-unit general price)
    return rules


def parse_qijie(ws):
    """祁杰: 清关+抬头服务费"""
    return [
        {
            "destination_warehouse": "ALL",
            "pricing_type": "service_fee",
            "transport_mode": None,
            "pallet_tier_min": None, "pallet_tier_max": None,
            "unit_type": "per_trip",
            "base_price": 100, "unit_price": 0,
            "surcharges": {"带电抬头": 200, "清关服务费": 100, "超品名加价": 2},
            "notes": "普货抬头100/票, 带电200/票, 清关100/票(含5品名, 超+2/品), 关税实报实销, 垫付+5%",
        },
    ]


def parse_yhwl(ws):
    """缘海YHWL: 清关+抬头服务"""
    return [
        {
            "destination_warehouse": "ALL",
            "pricing_type": "service_fee",
            "transport_mode": None,
            "pallet_tier_min": None, "pallet_tier_max": None,
            "unit_type": "per_trip",
            "base_price": 100, "unit_price": 0,
            "surcharges": {"清关": 100, "超品名加价": 2},
            "notes": "抬头借用100/票, 清关100/票(5品名, 超+2/个), 成本65+2",
        },
    ]


def parse_daifa(ws):
    """代发客户统一报价表"""
    rules = []
    # kulu: 拉到Apony首板100+10/P (直卡)
    rules.append({
        "destination_warehouse": "APONY",
        "pricing_type": "flat",
        "transport_mode": "直卡",
        "pallet_tier_min": 1, "pallet_tier_max": 999,
        "unit_type": "per_pallet",
        "base_price": 100, "unit_price": 10,
        "notes": "给kulu: 拉到Apony",
    })
    # LZ: 1-4板 180
    rules.append({
        "destination_warehouse": "ALL",
        "pricing_type": "matrix",
        "transport_mode": None,
        "pallet_tier_min": 1, "pallet_tier_max": 4,
        "unit_type": "per_trip",
        "base_price": 180, "unit_price": 0,
        "notes": "给LZ",
    })
    return rules


# ─── Sheet router ─────────────────────────────────────────────────────────────
TEXT_PARSERS = {
    'NoahHammert': ('NoahHammert', 'NH', parse_noahhammert),
    'Terry-Ottawa warehouse': ('Terry Ottawa', 'TOW', parse_terry_ottawa),
    'Jeff  Don': ('Jeff Don', 'JFD', parse_jeff_don),
    'Straightship阿东': ('Straightship阿东', 'SSA', parse_straightship),
    'Michael': ('Michael', 'MCL', parse_michael),
    'Sunny Charm': ('Sunny Charm', 'SC', parse_sunny_charm),
    'CTCGVTTomXLY': ('CTC/GVT/Tom/XLY', 'CTCG', parse_ctcgvt),
    '祁杰': ('祁杰', 'QJ', parse_qijie),
    '（缘海）YHWL': ('缘海YHWL', 'YHWL', parse_yhwl),
    '代发客户统一报价表': ('代发统一报价', 'DFTY', parse_daifa),
}


def ensure_partner(conn, name, short_code):
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM partners WHERE name = %s", (name,))
        row = cur.fetchone()
        if row:
            return row[0]
        cur.execute(
            "INSERT INTO partners (name, short_code, type, status) VALUES (%s, %s, 'carrier', 'ACTIVE') RETURNING id",
            (name, short_code)
        )
        pid = cur.fetchone()[0]
        conn.commit()
        return pid


def insert_rules(conn, partner_id, rules, sheet_name, source_type="manual"):
    count = 0
    with conn.cursor() as cur:
        for r in rules:
            surcharges = r.get("surcharges", {})
            try:
                cur.execute("""
                    INSERT INTO partner_pricing_rules
                      (partner_id, pricing_type, destination_warehouse, transport_mode,
                       pallet_tier_min, pallet_tier_max, unit_type,
                       base_price, unit_price, surcharges,
                       source_sheet, source_type, notes)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    partner_id,
                    r.get("pricing_type", "flat"),
                    r["destination_warehouse"],
                    r.get("transport_mode"),
                    r.get("pallet_tier_min"),
                    r.get("pallet_tier_max"),
                    r.get("unit_type", "per_trip"),
                    r.get("base_price", 0),
                    r.get("unit_price", 0),
                    json.dumps(surcharges),
                    sheet_name,
                    source_type,
                    r.get("notes"),
                ))
                count += 1
            except Exception as e:
                print(f"  [WARN] insert error: {e}")
    conn.commit()
    return count


def main():
    parser = argparse.ArgumentParser(description="导入文本可解析的图片 sheet 定价规则")
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--sheet", type=str)
    args = parser.parse_args()

    if not args.preview and not args.commit:
        print("请指定 --preview 或 --commit")
        return 1

    wb = openpyxl.load_workbook(FILE_QUOTE, data_only=True)
    conn = None
    if args.commit:
        url = _load_database_url()
        if not url:
            print("错误: 未找到 DATABASE_URL")
            return 1
        conn = psycopg2.connect(url)

    total_rules = 0
    summary = []

    for sn, (pname, pcode, parser_fn) in TEXT_PARSERS.items():
        if args.sheet and sn != args.sheet:
            continue

        ws = wb[sn]
        rules = parser_fn(ws)

        if not rules:
            summary.append(f"  EMPTY {sn}")
            continue

        status = f"  OK    {sn} → {pname} [{pcode}]: {len(rules)} rules"
        if args.preview:
            status += "\n"
            for r in rules:
                dest = r['destination_warehouse']
                bp = r.get('base_price', 0)
                up = r.get('unit_price', 0)
                ut = r.get('unit_type', '?')
                tm = r.get('transport_mode') or ''
                notes = r.get('notes', '')
                status += f"          {dest:12s} {tm:6s} base=${bp} unit=${up} ({ut}) [{notes[:50]}]\n"

        summary.append(status)
        total_rules += len(rules)

        if args.commit and conn:
            partner_id = ensure_partner(conn, pname, pcode)
            inserted = insert_rules(conn, partner_id, rules, sn)
            summary[-1] += f" → DB: {inserted} inserted"

    wb.close()

    print("=" * 70)
    print("文本解析 报价卡导入摘要")
    print("=" * 70)
    for line in summary:
        print(line)
    print("-" * 70)
    print(f"合计: {total_rules} 条规则")
    if args.preview:
        print("\n确认后执行: python scripts/import-partner-pricing-text.py --commit")

    if conn:
        conn.close()
    return 0


if __name__ == "__main__":
    exit(main())
