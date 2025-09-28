# TMS系统状态机图 (Mermaid)

## 运单状态机

```mermaid
stateDiagram-v2
    [*] --> created : 创建运单
    
    created --> assigned : 指派司机/车辆
    created --> canceled : 取消运单
    created --> exception : 标记异常
    
    assigned --> picked_up : 司机确认取货
    assigned --> canceled : 取消运单
    assigned --> exception : 标记异常
    
    picked_up --> in_transit : 开始运输
    picked_up --> exception : 标记异常
    
    in_transit --> delivered : 送达确认
    in_transit --> exception : 标记异常
    
    delivered --> completed : 上传POD并完成
    delivered --> exception : 标记异常
    
    exception --> assigned : 异常恢复(回到指派)
    exception --> picked_up : 异常恢复(回到取货)
    exception --> in_transit : 异常恢复(回到运输)
    exception --> delivered : 异常恢复(回到送达)
    exception --> canceled : 异常转取消
    
    completed --> [*] : 终态
    canceled --> [*] : 终态
    
    note right of created
        运单创建即已确认
        等待调度分配
    end note
    
    note right of assigned
        已指派司机和车辆
        司机开始取货
    end note
    
    note right of delivered
        必须上传至少1张POD
        才能进入completed状态
    end note
    
    note right of exception
        异常状态可以恢复到
        之前的正常状态
    end note
```

## 行程状态机

```mermaid
stateDiagram-v2
    [*] --> planning : 创建行程
    
    planning --> ongoing : 开始执行
    planning --> canceled : 取消行程
    
    ongoing --> completed : 完成所有任务
    ongoing --> canceled : 取消行程
    
    completed --> [*] : 终态
    canceled --> [*] : 终态
    
    note right of planning
        行程规划阶段
        可以添加/移除运单
    end note
    
    note right of ongoing
        行程执行中
        司机和车辆被占用
    end note
    
    note right of completed
        所有运单已完成
        司机和车辆释放
    end note
```

## 司机状态机

```mermaid
stateDiagram-v2
    [*] --> available : 司机上线
    
    available --> busy : 被分配到行程
    available --> offline : 司机下线
    
    busy --> available : 行程完成
    busy --> offline : 司机下线(异常)
    
    offline --> available : 司机上线
    
    note right of available
        司机空闲，可以接受新任务
    end note
    
    note right of busy
        司机正在执行行程
        不可接受新任务
    end note
    
    note right of offline
        司机离线状态
        不可接受任务
    end note
```

## 车辆状态机

```mermaid
stateDiagram-v2
    [*] --> available : 车辆可用
    
    available --> busy : 被分配到行程
    available --> maintenance : 维护中
    available --> offline : 车辆下线
    
    busy --> available : 行程完成
    busy --> maintenance : 需要维护
    busy --> offline : 车辆下线(异常)
    
    maintenance --> available : 维护完成
    maintenance --> offline : 车辆下线
    
    offline --> available : 车辆上线
    offline --> maintenance : 直接维护
    
    note right of available
        车辆空闲，可以接受新任务
    end note
    
    note right of busy
        车辆正在执行行程
        不可接受新任务
    end note
    
    note right of maintenance
        车辆维护中
        不可接受任务
    end note
    
    note right of offline
        车辆离线状态
        不可接受任务
    end note
```

## 状态转换规则

### 运单状态转换规则
1. **created → assigned**: 必须指定司机和车辆，且司机和车辆状态为available
2. **assigned → picked_up**: 司机确认取货，自动记录时间戳
3. **picked_up → in_transit**: 开始运输，可以合并到取货确认
4. **in_transit → delivered**: 司机确认送达
5. **delivered → completed**: 必须上传至少1张POD，且finalCost已填写
6. **任意状态 → exception**: 标记异常，需要填写异常类型和描述
7. **exception → 正常状态**: 异常恢复，需要填写解决方案

### 行程状态转换规则
1. **planning → ongoing**: 行程开始执行，司机和车辆状态变为busy
2. **ongoing → completed**: 所有挂载的运单都已完成
3. **任意状态 → canceled**: 取消行程，释放司机和车辆

### 司机/车辆状态转换规则
1. **available → busy**: 被分配到行程时自动转换
2. **busy → available**: 行程完成时自动转换
3. **任意状态 → offline**: 手动下线或异常情况
4. **offline → available**: 重新上线

## 状态校验规则

### 运单状态校验
- 状态转换必须按照合法顺序进行
- 非法状态转换返回409错误
- delivered→completed前必须上传POD
- assigned前司机和车辆必须为available状态
- 分配后司机和车辆自动变为busy状态

### 行程状态校验
- 一个司机+车辆在特定时间只能属于一个行程
- 行程中的运单状态变更会触发相应的事件
- 行程完成时所有运单必须处于completed状态

### 数据一致性校验
- 状态变更会记录到timeline表
- 状态变更会生成相应的通知
- 财务记录在运单completed时自动生成

<!-- Added by assistant @ 2025-01-27 15:30:00 -->
