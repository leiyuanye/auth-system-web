export function dictLabelToKey(dictOptions, label) {
  if (!Array.isArray(dictOptions)) return label
  const item = dictOptions.find(opt => opt.dictValue === label)
  return item ? Number(item.dictKey) : label
}

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

export function batchConvertImportData(list, mappings) {
  if (!Array.isArray(list)) return list
  return list.map(item => convertImportData(item, mappings))
}