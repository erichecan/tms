
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
                "error": "Error",

                "search": "Search",
                "loading": "Loading...",
                "status": "Status",
                "actions": "Actions",
                "date": "Date",
                "time": "Time",
                "searchPlaceholder": "Search records...",
                "signOut": "Sign Out",
                "user": "User",
                "noRecords": "No records found",
                "generateStatement": "Generate Statement",
                "comingSoon": "Feature coming soon: {{feature}}",
                "pagination": {
                    "showing": "Showing {{start}} to {{end}} of {{total}} items",
                    "previous": "Previous",
                    "next": "Next"
                }
            },
            "status": {
                "NEW": "New",
                "ASSIGNED": "Assigned",
                "IN_TRANSIT": "In Transit",
                "DELIVERED": "Delivered",
                "ALL": "All"
            },
            "roles": {
                "admin": "Administrator",
                "dispatcher": "Dispatcher",
                "driver": "Driver",
                "finance": "Finance Manager",
                "generalManager": "General Manager",
                "fleetManager": "Fleet Manager",
                "user": "User"
            },
            "sidebar": {
                "dashboard": "Dashboard",
                "trackingLoop": "Tracking Loop",
                "waybills": "Waybills",
                "fleetExpenses": "Fleet & Expenses",
                "messages": "Messages",
                "settings": "Settings",
                "core": "CORE",
                "operations": "OPERATIONS",
                "finance": "FINANCE",
                "customers": "Customers",
                "financialOverview": "Financial Overview",
                "receivables": "Receivables",
                "payables": "Payables",
                "priceCalculator": "Price Calculator",
                "universalRules": "Universal Rules",
                "userManagement": "User Management",
                "roleManagement": "Role Management"
            },
            "dashboard": {
                "controlCenter": "Control Center",
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
                "noJobs": "No recent jobs found.",
                "syncData": "Synchronizing Data...",
                "pendingWaybillsSubtitle": "Active logistical deployments requiring immediate executive attention.",
                "analyzeReports": "Analyze Global Reports",
                "table": {
                    "route": "Logistical Route",
                    "status": "Deployment Status",
                    "valuation": "Estimated Valuation",
                    "empty": "No outstanding shipments awaiting deployment.",
                    "dispatch": "Dispatch",
                    "track": "Intercept Tracking"
                },
                "modal": {
                    "title": "Resource Deployment",
                    "subtitle": "Select the optimal driver and vehicle asset for this specific logistical mission.",
                    "driverLabel": "Operational Driver",
                    "driverPlaceholder": "Select Available Driver",
                    "vehicleLabel": "Logistical Asset",
                    "vehiclePlaceholder": "Select Operational Vehicle",
                    "cancel": "Cancel",
                    "confirm": "Assign"
                }
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
                "shipmentAppointment": "Shipment Appointment (ISA)",
                "pasteIsa": "Paste or drag image here",
                "pasteBarcode": "Paste or drag image here",
                "deleteImage": "Delete Image",
                "deleteImageConfirm": "Are you sure you want to delete this image?",
                "deleteImageTitle": "Delete Image",
                "dropToUpload": "Drop to upload",
                "fileTooLarge": "File size exceeds 5MB limit",
                "invalidFileType": "Please upload an image file (PNG, JPG, GIF, WebP)",
                "fcCode": "Fulfillment Center Code",
                "deliveryDate": "Delivery Date",
                "pickupAt": "PICK UP AT (Shipper)",
                "deliverTo": "DELIVER TO (Consignee)",
                "cargoManifest": "Cargo Manifest & PO Tracking",
                "pallets": "PALLETS",
                "items": "ITEMS",
                "proDesc": "PRO # / DESCRIPTION",
                "poList": "PO LIST",
                "addGoodsLine": "Add Goods Line",
                "logisticsEngine": "Real-time Logistics Engine",
                "recordedPrice": "Recorded Price",
                "enterAddressToCalc": "Enter addresses to calculate...",
                "billTo": "BILL TO (Customer)",
                "selectCustomer": "Select Customer",
                "adHocClient": "Ad Hoc Client",
                "updateWaybill": "Update Waybill",
                "createFinish": "Create & Finish Waybill",
                "editMode": "EDIT MODE",
                "viewMode": "VIEW ONLY MODE",
                "default": "Default",
                "amazon": "Amazon",
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
                },
                "menu": {
                    "view": "View Details",
                    "edit": "Edit Waybill",
                    "pdf": "Download PDF",
                    "bol": "Generate BOL",
                    "delete": "Delete",
                    "deleteConfirm": "Are you sure you want to permanently delete this waybill? This action cannot be undone.",
                    "deleteTitle": "Delete Waybill"
                }
            },
            "messages": {

                "updateSuccess": "Information updated successfully",
                "updateSuccessTitle": "Update Successful",
                "saveFailed": "Failed to save information. Please try again.",
                "saveFailedTitle": "Save Failed",
                "connectionError": "Could not connect to the server. Please check your network.",
                "connectionErrorTitle": "Connection Error"
            },


            "finance": {
                "title": "Financial Overview",
                "payable": {
                    "title": "Accounts Payable",
                    "process": "Process Payroll"
                },
                "receivable": {
                    "title": "Accounts Receivable",
                    "invoice": "Create Invoice"
                },
                "metrics": {
                    "revenue": "Total Revenue",
                    "expenses": "Total Expenses",
                    "profit": "Net Profit",
                    "overdue": "Overdue Receivables"
                },
                "dashboard": {
                    "recent": "Recent Transactions",
                    "outstanding": "Outstanding Statements"
                },
                "table": {
                    "id": "ID",
                    "driver": "DRIVER",
                    "customer": "CUSTOMER",
                    "amount": "AMOUNT",
                    "status": "STATUS",
                    "date": "DATE",
                    "action": "ACTION"
                },
                "statement": {
                    "periodStart": "Period Start",
                    "periodEnd": "Period End",
                    "hint": "Generated statements will aggregate all PENDING financial records for the selected entity during this period. You can review and finalize them in the Statements list."
                },
                "errors": {
                    "missingParams": "Please select a reference and date range",
                    "noPending": "No pending records found for this period"
                },
                "messages": {
                    "statementGenerated": "Statement has been generated successfully as a draft."
                }
            },
            "pricing": {
                "title": "Intelligent Price Calculator",
                "subtitle": "Real-time logistics cost estimation powered by Global Rule Engine.",
                "routeParams": "Route Parameters",
                "pickup": "Pickup Location",
                "delivery": "Delivery Destination",
                "pickupPlaceholder": "Enter origin address...",
                "deliveryPlaceholder": "Enter destination address...",
                "businessType": "Business Type",
                "waiting": "Waiting Window (min)",
                "types": {
                    "standard": "Standard Delivery",
                    "waste": "Waste Collection",
                    "warehouse": "Warehouse Transfer"
                },
                "calculate": "Calculate Quote",
                "analyzing": "Analyzing Market Rates...",
                "estimatedTotal": "Estimated Shipment Total",
                "breakdown": "Cost Breakdown",
                "awaiting": "Awaiting parameters...",
                "disclaimer": "Estimates include distance surcharges and current fuel levels.",
                "errors": {
                    "missingAddress": "Please select both pickup and delivery addresses",
                    "timeout": "Pricing Engine Timeout. Check your API configuration."
                }
            },
            "users": {
                "title": "User Management",
                "subtitle": "Manage user access and roles.",
                "add": "Add User",
                "table": {
                    "user": "USER",
                    "username": "USERNAME",
                    "role": "ROLE",
                    "status": "STATUS",
                    "actions": "ACTIONS"
                },
                "modal": {
                    "edit": "Edit User Profile",
                    "new": "New User",
                    "name": "Full Name",
                    "email": "Email",
                    "role": "Role",
                    "status": "Status",
                    "username": "Username (Optional)",
                    "password": "Password",
                    "placeholderName": "Mission Agent Name",
                    "placeholderEmail": "agent@apony.com",
                    "placeholderUsername": "Agent Codename",
                    "placeholderPassword": "Set Entry Cipher",
                    "save": "Save User",
                    "resetPassword": "Reset Password",
                    "newPassword": "New Password",
                    "selectRole": "Select Role",
                    "statusActive": "Active",
                    "statusInactive": "Inactive"
                },
                "empty": "No users found in the registry.",
                "deleteConfirm": "Are you sure you want to delete this user?",
                "deleteTitle": "Delete User"
            },
            "rolePage": {
                "title": "Role & Permissions",
                "subtitle": "Define access levels and granular controls.",
                "create": "Create Role",
                "table": {
                    "name": "ROLE NAME",
                    "desc": "DESCRIPTION",
                    "count": "PERMISSIONS COUNT",
                    "actions": "ACTIONS"
                },
                "modal": {
                    "edit": "Edit Role",
                    "create": "Create Role",
                    "roleName": "Role Name",
                    "desc": "Description",
                    "permissions": "Permissions Configuration",
                    "save": "Save Configuration",
                    "placeholderName": "e.g. Flight Dispatcher",
                    "placeholderDesc": "Role responsibilities..."
                },
                "accessPoints": "{{count}} Access Points",
                "deleteConfirm": "Deleting a role might invalidate permissions for assigned users. Continue?",
                "deleteTitle": "Delete Role",
                "deleteNotImpl": "Delete not implemented for safety in this demo."
            },
            "modal": {
                "cancel": "Cancel",
                "confirm": "Confirm"
            },
            "fleet": {
                "title": "Fleet Management",
                "subtitle": "Real-time coordination and management of your global fleet assets.",
                "drivers": "Drivers",
                "driver": "Driver",
                "vehicles": "Vehicles",
                "vehicle": "Vehicle",
                "expenses": "Expenses",
                "expense": "Expense",
                "schedule": "Schedule",
                "name": "NAME",
                "phone": "PHONE",
                "plateId": "PLATE ID",
                "model": "MODEL",
                "capacity": "CAPACITY",
                "category": "CATEGORY",
                "amount": "AMOUNT",
                "date": "DATE",
                "modal": {
                    "registerNew": "Register New",
                    "updateRegistry": "Update Registry",
                    "driverName": "Driver Full Name",
                    "contactNumber": "Contact Number",
                    "operationalStatus": "Operational Status",
                    "licensePlate": "License Plate",
                    "vehicleModel": "Vehicle Model",
                    "payloadCapacity": "Payload Capacity (T)",
                    "expenseCategory": "Expense Category",
                    "transactionAmount": "Transaction Amount ($)",
                    "transactionDate": "Transaction Date",
                    "paymentStatus": "Payment Status",
                    "dismiss": "Dismiss",
                    "saveUpdates": "Save Updates",
                    "confirmRegistration": "Confirm Registration",
                    "statusOptions": {

                        "idle": "IDLE / STANDBY",
                        "onDuty": "ACTIVE DUTY",
                        "inTransit": "IN TRANSIT",
                        "maintenance": "UNDER SERVICE",
                        "pending": "SETTLEMENT PENDING",
                        "paid": "COMPLETED / PAID"
                    },
                    "expenseCategories": {
                        "fuel": "Fuel / Diesel",
                        "maintenance": "Mechanical Repair",
                        "toll": "Road Tolls",
                        "insurance": "Fleet Insurance",
                        "other": "Miscellaneous"
                    }
                },
                "scheduleTab": {
                    "opsTeam": "OPERATIONS TEAM",
                    "empty": "No drivers assigned to the current roster.",
                    "mission": "Mission"
                },
                "tel": "Tel",
                "fax": "Fax",
                "companyName": "Company Name",
                "contactPerson": "Contact Person",
                "address": "Address",
                "estimated": "Estimated",
                "km": "km",
                "min": "min"
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
                "tabs": {
                    "profile": "Profile Information",
                    "notifications": "Notifications",
                    "security": "Security & Access",
                    "language": "Localization"
                },
                "profile": {
                    "title": "Profile Information",
                    "fullName": "Full Name",
                    "role": "Role",
                    "email": "Email Address",
                    "save": "Save Profile Changes"
                },
                "company": {
                    "title": "Company Management",
                    "legalName": "Company Legal Name",
                    "address": "Registered Address"
                },
                "notifications": {
                    "title": "Notifications",
                    "emailOrder": "Order Updates via Email",
                    "emailOrderDesc": "Receive emails when waybill status changes.",
                    "emailMarketing": "Marketing Emails",
                    "emailMarketingDesc": "Receive news and feature updates.",
                    "smsDelivery": "SMS Delivery Alerts",
                    "smsDeliveryDesc": "Get text messages for critical deliveries.",
                    "smsSecurity": "Security Alerts (SMS)",
                    "smsSecurityDesc": "Get notified of suspicious login attempts.",
                    "save": "Save Preferences",
                    "saved": "Preferences Saved!"
                },
                "security": {
                    "title": "Security & Access",
                    "changePassword": "Change Password",
                    "currentPassword": "Current Password",
                    "newPassword": "New Password",
                    "confirmPassword": "Confirm New Password",
                    "update": "Update Password",
                    "success": "Password changed successfully",
                    "mismatch": "New passwords do not match"
                },
                "language": "Localization",
                "selectLanguage": "Select Language"
            },
            "customers": {
                "title": "Customer Management",
                "subtitle": "Maintain a high-fidelity database of your corporate customers and individual clients.",
                "onboard": "Onboard New Customer",
                "rep": "Rep",
                "approvedLimit": "Approved Limit",
                "table": {
                    "entity": "ACCOUNT ENTITY",
                    "contact": "CONTACT SECURE",
                    "hub": "LOGISTIC HUB",
                    "credit": "CREDIT HEALTH",
                    "status": "STATUS"
                },
                "empty": "The customer roster is currently empty.",
                "archiveConfirm": "Archive this customer account? This will restrict their access to new waybill creation.",
                "archiveTitle": "Archive Customer Account",
                "modal": {
                    "addTitle": "Add Customer Account",
                    "editTitle": "Edit Account Details",
                    "name": "Full Name",
                    "company": "Company Name",
                    "phone": "Phone (+1...)",
                    "email": "Email Address",
                    "address": "HQ / Logistics Node Address",
                    "credit": "Credit Allocation ($)",
                    "standing": "Account Standing",
                    "statusActive": "ACTIVE CUSTOMER",
                    "statusInactive": "SUSPENDED / DORMANT",
                    "cancel": "Cancel",
                    "process": "Processing...",
                    "save": "Save Changes",
                    "create": "Create Account"
                }
            }
        },
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
                "error": "错误",

                "search": "搜索...",
                "loading": "加载中...",
                "status": "状态",
                "actions": "操作",
                "date": "日期",
                "time": "时间",
                "searchPlaceholder": "搜索记录...",
                "signOut": "退出登录",
                "user": "用户",
                "noRecords": "未找到记录",
                "generateStatement": "生成报表",
                "comingSoon": "功能即将上线: {{feature}}",
                "pagination": {
                    "showing": "显示 {{start}} 到 {{end}} 条，共 {{total}} 条记录",
                    "previous": "上一页",
                    "next": "下一页"
                }
            },
            "status": {
                "NEW": "新建",
                "ASSIGNED": "已调度",
                "IN_TRANSIT": "运输中",
                "DELIVERED": "已送达",
                "ALL": "全部"
            },
            "roles": {
                "admin": "管理员",
                "dispatcher": "调度员",
                "driver": "司机",
                "finance": "财务经理",
                "generalManager": "总经理",
                "fleetManager": "车队经理",
                "user": "用户"
            },
            "sidebar": {
                "dashboard": "仪表盘",
                "trackingLoop": "追踪监控",
                "waybills": "运单管理",
                "fleetExpenses": "车队与费用",
                "messages": "消息中心",
                "settings": "系统设置",
                "core": "核心功能",
                "operations": "运营管理",
                "finance": "财务管理",
                "customers": "客户管理",
                "financialOverview": "财务概览",
                "receivables": "应收账款",
                "payables": "应付账款",
                "priceCalculator": "价格计算器",
                "universalRules": "通用规则",
                "userManagement": "用户管理",
                "roleManagement": "角色权限"
            },
            "dashboard": {
                "controlCenter": "控制中心",
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
                "noJobs": "暂无最近任务。",
                "syncData": "同步数据中...",
                "pendingWaybillsSubtitle": "需立即处理的活跃物流部署。",
                "analyzeReports": "分析全局报表",
                "table": {
                    "route": "物流路线",
                    "status": "部署状态",
                    "valuation": "预估价值",
                    "empty": "暂无待部署运单。",
                    "dispatch": "调度",
                    "track": "追踪监控"
                },
                "modal": {
                    "title": "资源分配",
                    "subtitle": "为该特定物流任务选择最佳司机与车辆资产。",
                    "driverLabel": "运营驾驶员",
                    "driverPlaceholder": "选择可用驾驶员",
                    "vehicleLabel": "物流资产",
                    "vehiclePlaceholder": "选择运营车辆",
                    "cancel": "取消",
                    "confirm": "分配"
                }
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
                "shipmentAppointment": "预约单 (ISA)",
                "pasteIsa": "粘贴或拖拽图片到此处",
                "pasteBarcode": "粘贴或拖拽图片到此处",
                "deleteImage": "删除图片",
                "deleteImageConfirm": "确定要删除这张图片吗？",
                "deleteImageTitle": "删除图片",
                "dropToUpload": "释放以上传",
                "fileTooLarge": "文件大小超过 5MB 限制",
                "invalidFileType": "请上传图片文件 (PNG, JPG, GIF, WebP)",
                "fcCode": "配送中心代码",
                "deliveryDate": "送达日期",
                "pickupAt": "提货地 (发货人)",
                "deliverTo": "送达地 (收货人)",
                "cargoManifest": "货物清单 & PO 追踪",
                "pallets": "托盘数",
                "items": "件数",
                "proDesc": "PRO # / 描述",
                "poList": "PO 列表",
                "addGoodsLine": "添加货物行",
                "logisticsEngine": "实时物流引擎",
                "recordedPrice": "记录价格",
                "enterAddressToCalc": "输入地址以计算...",
                "billTo": "账单寄送 (客户)",
                "selectCustomer": "选择客户",
                "adHocClient": "临时客户",
                "updateWaybill": "更新运单",
                "createFinish": "创建并完成运单",
                "editMode": "编辑模式",
                "viewMode": "仅查看模式",
                "default": "默认",
                "amazon": "亚马逊",
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
                },
                "menu": {
                    "view": "查看详情",
                    "edit": "编辑运单",
                    "pdf": "下载 PDF",
                    "bol": "生成 BOL",
                    "delete": "删除",
                    "deleteConfirm": "确定要永久删除此运单吗？此操作无法撤销。",
                    "deleteTitle": "删除运单"
                }
            },
            "messages": {
                "updateSuccess": "信息更新成功",
                "updateSuccessTitle": "更新成功",
                "saveFailed": "保存信息失败，请重试。",
                "saveFailedTitle": "保存失败",
                "connectionError": "无法连接到服务器，请检查网络。",
                "connectionErrorTitle": "连接错误"
            },
            "finance": {

                "title": "财务概览",
                "payable": {
                    "title": "应付账款",
                    "process": "处理薪资"
                },
                "receivable": {
                    "title": "应收账款",
                    "invoice": "创建发票"
                },
                "metrics": {
                    "revenue": "总收入",
                    "expenses": "总支出",
                    "profit": "净利润",
                    "overdue": "逾期应收"
                },
                "dashboard": {
                    "recent": "近期交易",
                    "outstanding": "未结报表"
                },
                "table": {
                    "id": "ID",
                    "driver": "司机",
                    "customer": "客户",
                    "amount": "金额",
                    "status": "状态",
                    "date": "日期",
                    "action": "操作"
                },
                "statement": {
                    "periodStart": "结算起点",
                    "periodEnd": "结算终点",
                    "hint": "生成的报表将汇总所选实体在该期间内的所有“待处理”财务记录。您可以在报表列表中查看并确认。"
                },
                "errors": {
                    "missingParams": "请选择关联实体和日期范围",
                    "noPending": "该期间内未找到待处理记录"
                },
                "messages": {
                    "statementGenerated": "报表已成功生成为草稿。"
                }
            },
            "pricing": {
                "title": "智能价格计算器",
                "subtitle": "由全球规则引擎驱动的实时物流成本估算。",
                "routeParams": "路线参数",
                "pickup": "提货地点",
                "delivery": "送货目的地",
                "pickupPlaceholder": "输入起点地址...",
                "deliveryPlaceholder": "输入终点地址...",
                "businessType": "业务类型",
                "waiting": "等待窗口 (分钟)",
                "types": {
                    "standard": "标准配送",
                    "waste": "废物收集",
                    "warehouse": "仓库调拨"
                },
                "calculate": "计算报价",
                "analyzing": "正在分析市场费率...",
                "estimatedTotal": "预计运费总额",
                "breakdown": "费用明细",
                "awaiting": "等待参数...",
                "disclaimer": "估算包含距离附加费和当前燃油水平。",
                "errors": {
                    "missingAddress": "请选择提货和送货地址",
                    "timeout": "定价引擎超时。请检查API配置。"
                }
            },
            "users": {
                "title": "用户管理",
                "subtitle": "管理用户访问权限和角色。",
                "add": "添加用户",
                "table": {
                    "user": "用户",
                    "username": "用户名",
                    "role": "角色",
                    "status": "状态",
                    "actions": "操作"
                },
                "modal": {
                    "edit": "编辑用户资料",
                    "new": "新建用户",
                    "name": "全名",
                    "email": "邮箱",
                    "role": "角色",
                    "status": "状态",
                    "username": "用户名 (可选)",
                    "password": "密码",
                    "placeholderName": "特工姓名",
                    "placeholderEmail": "agent@apony.com",
                    "placeholderUsername": "特工代号",
                    "placeholderPassword": "设置访问密码",
                    "save": "保存用户",
                    "resetPassword": "重置密码",
                    "newPassword": "新密码",
                    "selectRole": "选择角色",
                    "statusActive": "活跃",
                    "statusInactive": "非活跃"
                },
                "empty": "注册表中未找到用户。",
                "deleteConfirm": "确定要删除此用户吗？",
                "deleteTitle": "删除用户"
            },
            "rolePage": {
                "title": "角色与权限",
                "subtitle": "定义访问级别和精细控制。",
                "create": "创建角色",
                "table": {
                    "name": "角色名称",
                    "desc": "描述",
                    "count": "权限数量",
                    "actions": "操作"
                },
                "modal": {
                    "edit": "编辑角色",
                    "create": "创建角色",
                    "roleName": "角色名称",
                    "desc": "描述",
                    "permissions": "权限配置",
                    "save": "保存配置",
                    "placeholderName": "例如：飞行调度员",
                    "placeholderDesc": "角色职责..."
                },
                "accessPoints": "{{count}} 个权限点",
                "deleteConfirm": "删除角色可能会使分配的用户权限失效。继续吗？",
                "deleteTitle": "删除角色",
                "deleteNotImpl": "演示模式下未实现删除功能以确保安全。"
            },
            "modal": {
                "cancel": "取消",
                "confirm": "确认"
            },
            "fleet": {
                "title": "车队管理",
                "subtitle": "实时协调和管理您的全球车队资产。",
                "drivers": "司机",
                "driver": "司机",
                "vehicles": "车辆",
                "vehicle": "车辆",
                "expenses": "费用支出",
                "expense": "费用",
                "schedule": "排班表",
                "name": "姓名",
                "phone": "电话",
                "plateId": "车牌号",
                "model": "型号",
                "capacity": "载重量",
                "category": "类别",
                "amount": "金额",
                "date": "日期",
                "modal": {
                    "registerNew": "注册新",
                    "updateRegistry": "更新登记",
                    "driverName": "司机全名",
                    "contactNumber": "联系电话",
                    "operationalStatus": "运营状态",
                    "licensePlate": "车牌号码",
                    "vehicleModel": "车辆型号",
                    "payloadCapacity": "载重量 (吨)",
                    "expenseCategory": "费用类别",
                    "transactionAmount": "交易金额 ($)",
                    "transactionDate": "交易日期",
                    "paymentStatus": "支付状态",
                    "dismiss": "关闭",
                    "saveUpdates": "保存更新",
                    "confirmRegistration": "确认注册",
                    "statusOptions": {

                        "idle": "空闲 / 待命",
                        "onDuty": "执勤中",
                        "inTransit": "运输中",
                        "maintenance": "维修保养中",
                        "pending": "待结算",
                        "paid": "已支付 / 完成"
                    },
                    "expenseCategories": {
                        "fuel": "燃油 / 柴油",
                        "maintenance": "机械维修",
                        "toll": "过路费",
                        "insurance": "车队保险",
                        "other": "杂项支出"
                    }
                },
                "scheduleTab": {
                    "opsTeam": "运营团队",
                    "empty": "当前名册中未分配司机。",
                    "mission": "任务"
                },
                "tel": "电话",
                "fax": "传真",
                "companyName": "公司名称",
                "contactPerson": "联系人",
                "address": "地址",
                "estimated": "预估",
                "km": "km",
                "min": "分钟"
            },

            "tracking": {
                "inTransit": "运输中",
                "eta": "预计到达",
                "waybillsOnRoute": "途经运单",
                "timeline": "时间轴",
                "communication": "沟通记录"
            },
            "settings": {
                "title": "系统设置",
                "subtitle": "管理账户与偏好设置。",
                "tabs": {
                    "profile": "个人资料",
                    "notifications": "通知设置",
                    "security": "安全与访问",
                    "language": "语言设置"
                },
                "profile": {
                    "title": "个人资料",
                    "fullName": "全名",
                    "role": "角色",
                    "email": "电子邮箱",
                    "save": "保存更改"
                },
                "company": {
                    "title": "公司管理",
                    "legalName": "公司法定名称",
                    "address": "注册地址"
                },
                "notifications": {
                    "title": "通知设置",
                    "emailOrder": "订单更新邮件",
                    "emailOrderDesc": "当运单状态变更时接收邮件通知。",
                    "emailMarketing": "营销邮件",
                    "emailMarketingDesc": "接收新闻和功能更新。",
                    "smsDelivery": "短信送达提醒",
                    "smsDeliveryDesc": "获取关键配送任务的短信提醒。",
                    "smsSecurity": "安全警报 (短信)",
                    "smsSecurityDesc": "在检测到可疑登录时获取通知。",
                    "save": "保存偏好设置",
                    "saved": "偏好设置已保存！"
                },
                "security": {
                    "title": "安全与访问",
                    "changePassword": "修改密码",
                    "currentPassword": "当前密码",
                    "newPassword": "新密码",
                    "confirmPassword": "确认新密码",
                    "update": "更新密码",
                    "success": "密码修改成功",
                    "mismatch": "两次输入的密码不一致"
                },
                "language": "语言设置",
                "selectLanguage": "选择语言"
            },
            "customers": {
                "title": "客户管理",
                "subtitle": "维护企业客户与个人客户的高保真数据库。",
                "onboard": "新增客户",
                "rep": "代表",
                "approvedLimit": "核准额度",
                "table": {
                    "entity": "账户主体",
                    "contact": "安全联系方式",
                    "hub": "物流节点",
                    "credit": "信用状况",
                    "status": "状态"
                },
                "empty": "客户列表目前为空。",
                "archiveConfirm": "归档此客户账户？这将限制其创建新运单的权限。",
                "archiveTitle": "归档客户账户",
                "modal": {
                    "addTitle": "新增客户账户",
                    "editTitle": "编辑账户详情",
                    "name": "全名",
                    "company": "公司名称",
                    "phone": "电话 (+1...)",
                    "email": "电子邮箱",
                    "address": "总部/物流节点地址",
                    "credit": "信用额度 ($)",
                    "standing": "账户状态",
                    "statusActive": "活跃客户",
                    "statusInactive": "暂停/休眠",
                    "cancel": "取消",
                    "process": "处理中...",
                    "save": "保存更改",
                    "create": "创建账户"
                }
            },
        },
        "messages": {
            "updateSuccess": "信息更新成功",
            "updateSuccessTitle": "更新成功",
            "saveFailed": "保存信息失败，请重试。",
            "saveFailedTitle": "保存失败",
            "connectionError": "无法连接到服务器，请检查网络。",
            "connectionErrorTitle": "连接错误"
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
