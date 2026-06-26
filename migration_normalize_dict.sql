-- ============================================================
-- 数据字典迁移脚本
-- 目的：将业务表中存储的字典文本值统一转换为 dict_key
-- 执行前请先备份数据库！
-- ============================================================

-- 1. sys_server.server_type: 文本 → dict_key
UPDATE sys_server s
INNER JOIN sys_dict d ON d.dict_type = 'server_type' AND d.dict_value = s.server_type
SET s.server_type = d.dict_key
WHERE s.server_type IS NOT NULL AND s.server_type != ''
  AND s.server_type NOT REGEXP '^[0-9]+$';

-- 2. sys_server.specs (所在分组): 文本 → dict_key
UPDATE sys_server s
INNER JOIN sys_dict d ON d.dict_type = 'server_group' AND d.dict_value = s.specs
SET s.specs = d.dict_key
WHERE s.specs IS NOT NULL AND s.specs != ''
  AND s.specs NOT REGEXP '^[0-9]+$';

-- 3. we_corp.customer_type: 文本 → dict_key
UPDATE we_corp w
INNER JOIN sys_dict d ON d.dict_type = 'we_corp_customer_type' AND d.dict_value = w.customer_type
SET w.customer_type = d.dict_key
WHERE w.customer_type IS NOT NULL AND w.customer_type != ''
  AND w.customer_type NOT REGEXP '^[0-9]+$';

-- 4. we_corp.corp_status: 文本 → dict_key
UPDATE we_corp w
INNER JOIN sys_dict d ON d.dict_type = 'we_corp_status' AND d.dict_value = w.corp_status
SET w.corp_status = d.dict_key
WHERE w.corp_status IS NOT NULL AND w.corp_status != ''
  AND w.corp_status NOT REGEXP '^[0-9]+$';

-- 5. phone_card.agent_name: 文本 → dict_key
UPDATE phone_card p
INNER JOIN sys_dict d ON d.dict_type = 'phone_agent' AND d.dict_value = p.agent_name
SET p.agent_name = d.dict_key
WHERE p.agent_name IS NOT NULL AND p.agent_name != ''
  AND p.agent_name NOT REGEXP '^[0-9]+$';

-- ============================================================
-- 验证：检查是否还有未转换的文本值
-- ============================================================
-- SELECT 'server_type' AS field, s.server_type AS val, COUNT(*) AS cnt
-- FROM sys_server s WHERE s.server_type NOT REGEXP '^[0-9]+$' AND s.server_type != ''
-- GROUP BY s.server_type
-- UNION ALL
-- SELECT 'specs', s.specs, COUNT(*) FROM sys_server s WHERE s.specs NOT REGEXP '^[0-9]+$' AND s.specs != '' GROUP BY s.specs
-- UNION ALL
-- SELECT 'customer_type', w.customer_type, COUNT(*) FROM we_corp w WHERE w.customer_type NOT REGEXP '^[0-9]+$' AND w.customer_type != '' GROUP BY w.customer_type
-- UNION ALL
-- SELECT 'corp_status', w.corp_status, COUNT(*) FROM we_corp w WHERE w.corp_status NOT REGEXP '^[0-9]+$' AND w.corp_status != '' GROUP BY w.corp_status;
