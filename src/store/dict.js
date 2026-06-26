import { defineStore } from 'pinia'
import { getDictByType } from '@/api/dict'

/**
 * 全局字典 Store
 * - 统一缓存所有字典数据，避免各页面重复请求
 * - 修改字典后调用 clearCache(type) 清除缓存，下次访问自动重新加载
 */
export const useDictStore = defineStore('dict', {
  state: () => ({
    // 缓存：{ [dictType]: { data: [], timestamp: number } }
    cache: {},
    // 最后一次缓存清除时间戳（用于通知页面数据已变更）
    lastCleared: 0
  }),

  actions: {
    /**
     * 获取指定类型的字典数据（带缓存）
     * @param {string} dictType - 字典类型，如 'we_corp_subject_short'
     * @param {boolean} force - 是否强制刷新
     * @returns {Promise<Array>}
     */
    async getDict(dictType, force = false) {
      const now = Date.now()
      const cached = this.cache[dictType]

      // 安全检查：如果缓存是在上次 clearCache 之前创建的，视为过期
      if (!force && cached && cached.timestamp < this.lastCleared) {
        force = true
      }

      // 有缓存且未过期（5分钟）且不强制刷新
      if (!force && cached && (now - cached.timestamp < 5 * 60 * 1000)) {
        return cached.data
      }

      try {
        const data = await getDictByType(dictType)
        const list = Array.isArray(data) ? data : []
        // 用整个对象替换确保 Pinia 响应式追踪
        this.cache = { ...this.cache, [dictType]: { data: list, timestamp: now } }
        return list
      } catch (e) {
        console.warn('[字典Store] 加载失败:', dictType, e)
        return this.cache[dictType]?.data || []
      }
    },

    /**
     * 批量加载多个字典类型
     * @param {string[]} types - 字典类型数组
     * @returns {Promise<Object>} { [dictType]: Array }
     */
    async getDictBatch(types) {
      const results = {}
      const promises = types.map(async (type) => {
        results[type] = await this.getDict(type)
      })
      await Promise.all(promises)
      return results
    },

    /**
     * 清除指定类型缓存（修改字典后调用）
     * 用整体替换方式确保 Vue 响应式可靠触发
     * @param {string} [dictType] - 为空则清除全部缓存
     */
    clearCache(dictType) {
      if (dictType) {
        const newCache = {}
        for (const key of Object.keys(this.cache)) {
          if (key !== dictType) {
            newCache[key] = this.cache[key]
          }
        }
        this.cache = newCache
      } else {
        this.cache = {}
      }
      this.lastCleared = Date.now()
    },

    /**
     * 同步获取缓存数据（不发起网络请求）
     * @param {string} dictType
     * @returns {Array}
     */
    getCached(dictType) {
      return this.cache[dictType]?.data || []
    },

    /**
     * 根据 dictKey 获取 dictValue（同步）
     * @param {string} dictType
     * @param {*} key
     * @returns {string}
     */
    getLabel(dictType, key) {
      const list = this.getCached(dictType)
      if (!list.length || key == null || key === '') return '-'
      const item = list.find(i => Number(i.dictKey) === Number(key) || String(i.dictKey) === String(key))
      return item ? item.dictValue : String(key)
    },

    /**
     * 根据 dictValue 获取 dictKey（同步）
     * @param {string} dictType
     * @param {string} label
     * @returns {number|null}
     */
    getKey(dictType, label) {
      const list = this.getCached(dictType)
      if (!list.length || !label) return null
      const item = list.find(i => i.dictValue === label)
      return item ? Number(item.dictKey) : null
    }
  }
})
