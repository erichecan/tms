
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation Resources

const resources = {
    en: {
        translation: {
            "common": {
                "back": "Back",
                "save": "Save",
                "cancel": "Cancel",
                "delete": "Delete",
                "edit": "Edit",
                "add": "Add",
                "search": "Search",
                "loading": "Loading...",
                "status": "Status",
                "actions": "Actions",
                "date": "Date",
                "time": "Time"
            },
            "sidebar": {
                "dashboard": "Dashboard",
                "trackingLoop": "Tracking Loop",
                "waybills": "Waybills",
                "fleetExpenses": "Fleet & Expenses",
                "messages": "Messages",
                "settings": "Settings",
                "core": "CORE",
                "operations": "OPERATIONS"
            },
            "dashboard": {
                "welcome": "Welcome back, {{name}}!",
                "subtitle": "Here's what's happening today.",
                "activeTrips": "Active Trips",
                "pendingWaybills": "Pending Waybills",
                "totalWaybills": "Total Waybills",
                "onTimeRate": "On-Time Rate",
                "recentJobActivity": "Recent Job Activity",
                "quickActions": "Quick Actions",
                "newWaybill": "New Waybill",
                "manageFleet": "Manage Fleet",
                "viewReports": "View Reports",
                "noJobs": "No recent jobs found."
            },
            "waybill": {
                "createTitle": "New Waybill",
                "listTitle": "Waybills",
                "listSubtitle": "Manage shipments and orders.",
                "waybillNo": "Waybill No",
                "customer": "Customer",
                "route": "Route",
                "estPrice": "Est. Price",
                "created": "Created",
                "form": {
                    "shipper": "Shipper",
                    "consignee": "Consignee",
                    "isa": "Shipment Appointment (ISA)",
                    "isaPlaceholder": "Paste ISA # (Click & Paste Ctrl+V)",
                    "barcode": "Barcode",
                    "barcodePlaceholder": "Paste Barcode (Click & Paste Ctrl+V)",
                    "baseInfo": "Base Info",
                    "fulfillmentCenter": "Fulfillment Center (Alias)",
                    "deliveryDate": "Delivery Date",
                    "referenceCode": "Reference Code",
                    "itemsInfo": "Items Info",
                    "palletCount": "Pallet Count",
                    "itemCount": "Item Count",
                    "pro": "PRO",
                    "poList": "PO List",
                    "addGoodsLine": "Add Goods Line",
                    "footerInfo": "Footer Info",
                    "timeIn": "Time In",
                    "timeOut": "Time Out",
                    "clientName": "Client Name",
                    "distance": "Distance (km)",
                    "price": "Price",
                    "createButton": "Create Waybill",
                    "stamp": "Amazon Stamp"
                }
            },
            "fleet": {
                "title": "Fleet Management",
                "drivers": "Drivers",
                "driver": "Driver",
                "vehicles": "Vehicles",
                "vehicle": "Vehicle",
                "expenses": "Expenses",
                "expense": "Expense",
                "name": "NAME",
                "phone": "PHONE",
                "plateId": "PLATE ID",
                "model": "MODEL",
                "capacity": "CAPACITY",
                "category": "CATEGORY",
                "amount": "AMOUNT",
                "date": "DATE"
            },
            "messages": {
                "typeMessage": "Type a message..."
            },
            "tracking": {
                "inTransit": "In Transit",
                "eta": "ETA",
                "waybillsOnRoute": "Waybills on Route",
                "timeline": "Timeline",
                "communication": "Communication"
            },
            "settings": {
                "title": "Settings",
                "subtitle": "Manage your account and preferences.",
                "profile": "Profile",
                "notifications": "Notifications",
                "security": "Security",
                "language": "Language",
                "selectLanguage": "Select Language"
            }
        }
    },
    zh: {
        translation: {
            "common": {
                "back": "返回",
                "save": "保存",
                "cancel": "取消",
                "delete": "删除",
                "edit": "编辑",
                "add": "添加",
                "search": "搜索...",
                "loading": "加载中...",
                "status": "状态",
                "actions": "操作",
                "date": "日期",
                "time": "时间"
            },
            "sidebar": {
                "dashboard": "仪表盘",
                "trackingLoop": "追踪监控",
                "waybills": "运单管理",
                "fleetExpenses": "车队与费用",
                "messages": "消息中心",
                "settings": "系统设置",
                "core": "核心功能",
                "operations": "运营管理"
            },
            "dashboard": {
                "welcome": "欢迎回来, {{name}}!",
                "subtitle": "这是今天的运营概况。",
                "activeTrips": "进行中行程",
                "pendingWaybills": "待处理运单",
                "totalWaybills": "总运单数",
                "onTimeRate": "准点率",
                "recentJobActivity": "最近任务动态",
                "quickActions": "快捷操作",
                "newWaybill": "新建运单",
                "manageFleet": "管理车队",
                "viewReports": "查看报表",
                "noJobs": "暂无最近任务。"
            },
            "waybill": {
                "createTitle": "新建运单",
                "listTitle": "运单列表",
                "listSubtitle": "管理货物运输订单。",
                "waybillNo": "运单号",
                "customer": "客户",
                "route": "路线",
                "estPrice": "预估价格",
                "created": "创建时间",
                "form": {
                    "shipper": "发货人",
                    "consignee": "收货人",
                    "isa": "预约单 (ISA)",
                    "isaPlaceholder": "粘贴 ISA (点击并按 Ctrl+V)",
                    "barcode": "条形码",
                    "barcodePlaceholder": "粘贴条码 (点击并按 Ctrl+V)",
                    "baseInfo": "基本信息",
                    "fulfillmentCenter": "配送中心 (Alias)",
                    "deliveryDate": "送达日期",
                    "referenceCode": "参考编号",
                    "itemsInfo": "货物信息",
                    "palletCount": "托盘数",
                    "itemCount": "商品数量",
                    "pro": "PRO号",
                    "poList": "PO单号",
                    "addGoodsLine": "添加货物行",
                    "footerInfo": "底部信息",
                    "timeIn": "入场时间",
                    "timeOut": "离场时间",
                    "clientName": "客户名称",
                    "distance": "距离 (km)",
                    "price": "价格",
                    "createButton": "创建运单",
                    "stamp": "亚马逊盖章"
                }
            },
            "fleet": {
                "title": "车队管理",
                "drivers": "司机",
                "driver": "司机",
                "vehicles": "车辆",
                "vehicle": "车辆",
                "expenses": "费用支出",
                "expense": "费用",
                "name": "姓名",
                "phone": "电话",
                "plateId": "车牌号",
                "model": "型号",
                "capacity": "载重量",
                "category": "类别",
                "amount": "金额",
                "date": "日期"
            },
            "messages": {
                "typeMessage": "输入消息..."
            },
            "tracking": {
                "inTransit": "运输中",
                "eta": "预计到达",
                "waybillsOnRoute": "途经运单",
                "timeline": "时间轴",
                "communication": "沟通记录"
            },
            "settings": {
                "title": "设置",
                "subtitle": "管理账户与偏好设置。",
                "profile": "个人资料",
                "notifications": "通知",
                "security": "安全",
                "language": "语言设置",
                "selectLanguage": "选择语言"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // Force default to English as requested
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
