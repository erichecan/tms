# 报价 Excel 图片报价 OCR 导入实现方案 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将《合作单位报价卡.xlsx》中以图片形式存在的报价（约 20 张图）自动解析并导入到 `pricing_matrices` 等报价表中，实现“全自动导入”，不再遗漏图片报价。

**Architecture:** 继续复用现有 Python 脚本 `scripts/import_excel_to_prod.py` 负责一次性导入工作；在该脚本中增加对 Excel sheet 内嵌图片的检测与 OCR 解析逻辑（使用本地 Tesseract + `pytesseract`），将 OCR 文本解析为与现有 `parse_quote_sheet` 相同的数据结构后统一入库。OCR 与解析逻辑保持与业务相解耦，便于后续替换或增强。

**Tech Stack:** Python 3、openpyxl、psycopg2、pytesseract、Pillow、Tesseract OCR 二进制（系统级依赖）、PostgreSQL。

---

### Task 1: 熟悉现有导入脚本与数据流

**Files:**
- Modify: `scripts/import_excel_to_prod.py`

**Step 1: 通读现有脚本，确认职责边界**
- 确认：
  - `import_transfer` 负责《2026年转运汇总表.xlsx》→ containers/container_items。
  - `import_quote` + `parse_quote_sheet` 负责《合作单位报价卡.xlsx》→ pricing_matrices。
  - 目前 `parse_quote_sheet` 仅依赖单元格文本，不处理图片。

**Step 2: 与 PRD 对齐**
- 对照 `docs/PRD_Pricing_Management_Full.md`，确认：
  - 报价最终落地表：`pricing_matrices` 为主；后续可以被快速报价、运单等复用。
  - 导入脚本属于一次性“数据初始化/迁移”工具，对线上运行时 API 行为无直接影响。

---

### Task 2: 设计图片报价 OCR 与解析的模块边界

**Files:**
- Modify: `scripts/import_excel_to_prod.py`

**Step 1: 定义 OCR 抽象接口**
- 设计一个纯 Python 函数签名（后续可单元测试）：
  - `def parse_ocr_pricing_text(text: str) -> list[dict]:`
  - 输入：单张图片 OCR 出来的整段文本。
  - 输出：若干 dict，字段与 `parse_quote_sheet` 返回值保持一致：`destination_code`, `pallet_tier`, `base_price`, `per_pallet_price`。

**Step 2: 定义基于图片的 sheet 解析入口**
- 设计函数：
  - `def parse_quote_sheet_from_images(ws) -> list[dict]:`
  - 通过 openpyxl 的 `ws._images`（或等价 API）取得嵌入图片，逐张做 OCR，再调用 `parse_ocr_pricing_text` 得到报价行。
  - 保持返回结构与 `parse_quote_sheet` 一致，便于 `import_quote` 统一处理。

**Step 3: 决策回退策略**
- 在 `import_quote` 中按顺序尝试：
  1. 调用 `parse_quote_sheet(ws)`（单元格模式）。
  2. 若结果为空，再调用 `parse_quote_sheet_from_images(ws)`（图片模式）。
  3. 若仍为空，则跳过该 sheet。

---

### Task 3: 为解析逻辑编写单元测试（TDD - 针对纯文本解析）

**Files:**
- Create: `scripts/test_import_excel_to_prod.py`

**Step 1: 为 `parse_ocr_pricing_text` 设计样例文本**
- 构造一个接近 OCR 结果的多行字符串，例如：
  - 包含目的仓代码（如 `YYZ3`, `YHM1` 等）；
  - 每行后面跟随若干数字，按照列顺序对应不同板数档（如 1-4、5-14、15-28）。

**Step 2: 编写 failing test**
- 使用 pytest 约定（函数名以 `test_` 开头），断言：
  - 返回的 list 非空；
  - `destination_code` 提取正确；
  - 不同数字被映射到预期的 `pallet_tier`（按照默认顺序：`1-4板`, `5-14板`, `9-13板`, `15-28板` 等）；
  - `base_price` / `per_pallet_price` 字段类型正确（float 或 None）。

**Step 3: 运行测试确保失败**
- 在项目根目录运行：
  - `pytest scripts/test_import_excel_to_prod.py -q`
- 预期：因 `parse_ocr_pricing_text` 尚未实现而失败。

---

### Task 4: 实现 `parse_ocr_pricing_text` 并通过测试

**Files:**
- Modify: `scripts/import_excel_to_prod.py`

**Step 1: 实现基本解析规则**
- 对输入文本按行拆分，逐行：
  - 使用与 `parse_quote_sheet` 相近的正则提取目的仓代码（`YYZ3`、`YOO1` 等）。
  - 使用正则提取数字序列（金额），忽略明显不是金额的 token。
  - 按固定顺序将数字映射到板数档数组（例如：`["1-4板", "5-14板", "9-13板", "15-28板", "散板"]`），超出部分丢弃。
- 为每个目的仓代码和对应金额构造 dict：
  - `{"destination_code": code, "pallet_tier": tier, "base_price": value, "per_pallet_price": None}`。

**Step 2: 确保健壮性**
- 忽略无数字或无目的仓代码的行；
- 对无法解析为 float 的数字安全跳过；
- 返回 list，供后续调用方统一处理。

**Step 3: 再次运行测试**
- 执行：
  - `pytest scripts/test_import_excel_to_prod.py -q`
- 预期：所有测试通过。

---

### Task 5: 集成 Tesseract OCR 并从 Excel sheet 抽取图片

**Files:**
- Modify: `scripts/import_excel_to_prod.py`

**Step 1: 引入依赖与配置**
- 在文件顶部新增导入：
  - `import io`
  - `from PIL import Image`
  - `import pytesseract`
- 约定：
  - 默认语言配置为 `chi_sim+eng`（简体中文 + 英文），可后续通过环境变量覆盖。

**Step 2: 实现图片抽取函数**
- 新增函数：
  - `def extract_images_from_sheet(ws) -> list[bytes]:`
  - 通过 `getattr(ws, "_images", [])` 获取 image 对象列表；
  - 尝试通过 image 对象上的数据接口（如 `_data()` 或等价属性）获取二进制内容；
  - 返回 `bytes` 列表；异常时打印 warning 并跳过。

**Step 3: 实现基于图片的 sheet 解析**
- 新增函数：
  - `def parse_quote_sheet_from_images(ws):`
  - 调用 `extract_images_from_sheet(ws)`，对每张图片：
    - 使用 `Image.open(io.BytesIO(img_bytes))` 打开；
    - 使用 `pytesseract.image_to_string(image, lang=os.getenv("TMS_OCR_LANG", "chi_sim+eng"))` 获取文本；
    - 调用 `parse_ocr_pricing_text(text)` 获得报价行，累加。
  - 返回累积的报价行 list。

**Step 4: 在 `import_quote` 中集成流程**
- 在调用 `parse_quote_sheet(ws)` 后：
  - 若返回为空，则调用 `parse_quote_sheet_from_images(ws)`；
  - 若仍为空，则继续跳过该 sheet。

---

### Task 6: 环境准备与运行验证

**Files:**
- Docs/Notes only（如有需要，可更新 README 或内部运维文档）

**Step 1: 确认运行环境可安装 Tesseract**
- 在目标运行环境（本地 / 容器 / 服务器）中安装：
  - macOS（brew）：`brew install tesseract tesseract-lang`
  - Linux（apt）：`apt-get install tesseract-ocr tesseract-ocr-chi-sim`

**Step 2: 安装 Python 依赖**
- 使用 pip 安装：
  - `pip install pytesseract pillow`
- 如项目已有统一 requirements，可将依赖写入对应文件。

**Step 3: 手工跑一轮导入脚本**
- 在保证 `DATABASE_URL` 正确指向测试库 / 预备库前提下，执行：
  - `python scripts/import_excel_to_prod.py`
- 关注：
  - log 中对每个 sheet 的处理情况；
  - `pricing_matrices` 中是否新增对应目的仓 + 板数档的记录。

---

### Task 7: 回归与异常处理完善

**Files:**
- Modify: `scripts/import_excel_to_prod.py`

**Step 1: 增加日志与告警**
- 对以下场景增加清晰的打印：
  - 无法读取 Excel 图片；
  - OCR 结果为空或解析不到任何报价行；
  - 某行 OCR 文本存在明显金额但未能成功入库。

**Step 2: 确保失败不影响其他 sheet 导入**
- 所有异常捕获在单个 sheet / 单行级别：
  - 遇到异常仅打印 warning，继续处理其他行或 sheet；
  - 不让整次导入回滚（当前脚本是一次性导入，不需严格事务一致性）。

**Step 3: 最终验证**
- 结合业务对这 20 张图片报价的手工对照：
  - 随机抽取若干目的仓，对比 Excel 图片与数据库 `pricing_matrices` 的金额和板数档是否一致；
  - 记录当前 OCR 准确率，评估是否需要后续再引入半自动“人工校对”环节。

