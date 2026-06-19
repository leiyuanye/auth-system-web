/**
 * 根据字典label获取对应的key值
 * @param {Array} dictOptions - 字典选项数组
 * @param {String} label - 字典label值
 * @returns {Number|String} - 对应的key值
 */
export function dictLabelToKey(dictOptions, label) {
  if (!Array.isArray(dictOptions)) return label
  const item = dictOptions.find(opt => opt.dictValue === label || opt.label === label)
  return item ? Number(item.dictKey || item.value) : label
}

/**
 * 根据字典key获取对应的label值
 * @param {Array} dictOptions - 字典选项数组
 * @param {Number|String} key - 字典key值
 * @param {String} fallback - 未找到时的默认值
 * @returns {String} - 对应的label值
 */
export function dictKeyToLabel(dictOptions, key, fallback = '-') {
  if (!Array.isArray(dictOptions)) return fallback
  if (key == null || key === '') return fallback
  const item = dictOptions.find(opt => Number(opt.dictKey) === Number(key) || Number(opt.value) === Number(key))
  return item ? (item.dictValue || item.label) : fallback
}

/**
 * 根据字典key获取对应的标签类型（用于el-tag）
 * 可自定义映射，默认映射：1=success, 2=warning, 3=info, 4=danger
 * @param {Number|String} key - 字典key值
 * @param {Object} typeMap - 自定义类型映射 { key: tagType }
 * @returns {String} - el-tag的type值
 */
export function dictKeyToTagType(key, typeMap = null) {
  const defaultMap = { 1: 'success', 2: 'warning', 3: 'info', 4: 'danger' }
  const map = typeMap || defaultMap
  return map[Number(key)] || ''
}

/**
 * 检查字典key是否匹配指定的label
 * @param {Array} dictOptions - 字典选项数组
 * @param {Number|String} key - 字典key值
 * @param {String} targetLabel - 目标label值
 * @returns {Boolean}
 */
export function isDictMatch(dictOptions, key, targetLabel) {
  if (!Array.isArray(dictOptions)) return false
  const item = dictOptions.find(opt => opt.dictValue === targetLabel || opt.label === targetLabel)
  return item ? (Number(item.dictKey) === Number(key) || Number(item.value) === Number(key)) : false
}

/**
 * 根据label获取对应的字典key值（用于统计筛选）
 * @param {Array} dictOptions - 字典选项数组
 * @param {String} label - 字典label值
 * @returns {Number|null} - 对应的key值，未找到返回null
 */
export function getDictKeyByLabel(dictOptions, label) {
  if (!Array.isArray(dictOptions)) return null
  const item = dictOptions.find(opt => opt.dictValue === label || opt.label === label)
  return item ? Number(item.dictKey || item.value) : null
}

/**
 * 转换导入数据中的字典label为key
 * @param {Object} data - 单条数据
 * @param {Object} mappings - { field: dictOptions } 映射
 */
export function convertImportData(data, mappings) {
  if (!data || typeof data !== 'object') return data
  const result = { ...data }
  for (const [field, options] of Object.entries(mappings)) {
    if (result[field] !== undefined && result[field] !== null && result[field] !== '') {
      const value = result[field]
      if (typeof value === 'string') {
        const numericValue = dictLabelToKey(options, value)
        if (typeof numericValue === 'number') {
          result[field] = numericValue
        }
      }
    }
  }
  return result
}

/**
 * 批量转换导入数据中的字典label为key
 * @param {Array} list - 数据数组
 * @param {Object} mappings - { field: dictOptions } 映射
 */
export function batchConvertImportData(list, mappings) {
  if (!Array.isArray(list)) return list
  return list.map(item => convertImportData(item, mappings))
}