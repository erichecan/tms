-- 检查数据库中各表的数据量
-- 创建时间: 2025-10-21 16:00:00

SELECT 
    'Tenants' as table_name, COUNT(*) as record_count FROM tenants
    UNION ALL
    SELECT 'Users', COUNT(*) FROM users
    UNION ALL
    SELECT 'Customers', COUNT(*) FROM customers
    UNION ALL
    SELECT 'Vehicles', COUNT(*) FROM vehicles
    UNION ALL
    SELECT 'Drivers', COUNT(*) FROM drivers
    UNION ALL
    SELECT 'Shipments', COUNT(*) FROM shipments
    UNION ALL
    SELECT 'Rules', COUNT(*) FROM rules
    UNION ALL
    SELECT 'Trips', COUNT(*) FROM trips
    UNION ALL
    SELECT 'Assignments', COUNT(*) FROM assignments
    UNION ALL
    SELECT 'Notifications', COUNT(*) FROM notifications
    UNION ALL
    SELECT 'Timeline_Events', COUNT(*) FROM timeline_events
    UNION ALL
    SELECT 'Financial_Records', COUNT(*) FROM financial_records
    UNION ALL
    SELECT 'Statements', COUNT(*) FROM statements
    UNION ALL
    SELECT 'Proof_of_Delivery', COUNT(*) FROM proof_of_delivery
    UNION ALL
    SELECT 'Rule_Executions', COUNT(*) FROM rule_executions
ORDER BY table_name;

