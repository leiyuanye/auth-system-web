import { defineStore } from 'pinia'
import { login as loginApi } from '@/api/auth'
import { getMenus, getPermissions } from '@/api/menu'

const LOGIN_TIME_KEY = 'login_time'
const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'user_info'

// 登录有效期：12 小时（毫秒）
const LOGIN_EXPIRY = 12 * 60 * 60 * 1000

// 首页菜单项（后端没有返回时兜底）
const HOME_MENU = {
  id: 100,
  path: '/home',
  name: '首页',
  icon: 'HomeFilled',
  children: []
}

// Mock 数据（后端未连接时使用）
const MOCK_USER = {
  userId: 1,
  username: 'admin',
  realName: '系统管理员',
  roles: ['ROLE_ADMIN'],
  permissions: [
    'system:user:view', 'system:user:add', 'system:user:edit', 'system:user:delete',
    'system:role:view', 'system:role:add', 'system:role:edit', 'system:role:delete',
    'system:menu:view', 'system:menu:add', 'system:menu:edit', 'system:menu:delete',
    'phone:list:view', 'phone:list:add', 'phone:list:edit', 'phone:list:delete',
    'phone_device:list:view', 'phone_device:list:add', 'phone_device:list:edit', 'phone_device:list:delete',
    'realname:list:view', 'realname:list:add', 'realname:list:edit', 'realname:list:delete',
    'operation:summary:view', 'operation:summary:edit',
    'operation:report:view', 'operation:report:edit'
  ],
  token: 'mock-token-admin'
}

const MOCK_MENUS = [
  { ...HOME_MENU },
  {
    id: 1, path: '/system', name: '系统管理', icon: 'Setting', children: [
      { id: 11, path: '/system/user', name: '用户管理', icon: 'User', children: [] },
      { id: 12, path: '/system/role', name: '角色管理', icon: 'UserFilled', children: [] },
      { id: 13, path: '/system/menu', name: '菜单管理', icon: 'Menu', children: [] },
      { id: 104, path: '/system/log', name: '日志管理', icon: 'Document', children: [] }
    ]
  },
  {
    id: 2, path: '/phone', name: '手机卡管理', icon: 'Phone', children: [
      { id: 21, path: '/phone/list', name: '卡列表', icon: 'Tickets', children: [] }
    ]
  },
  {
    id: 3, path: '/operation', name: '运营中心', icon: 'DataAnalysis', children: [
      { id: 31, path: '/operation/summary', name: '数据概览', icon: 'Histogram', children: [] },
      { id: 32, path: '/operation/report', name: '日报表', icon: 'Document', children: [] }
    ]
  },
  {
    id: 40, path: '/realname', name: '实名人员管理', icon: 'Avatar', children: [
      { id: 401, path: '/realname/list', name: '实名人员', icon: 'User', children: [] }
    ]
  },
  {
    id: 60, path: '/about', name: '关于', icon: 'InfoFilled', children: []
  }
]

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    userInfo: JSON.parse(localStorage.getItem(USER_INFO_KEY) || 'null'),
    menuList: [],
    permissions: [],
    isLoginExpired: false
  }),
  getters: {
    hasPermission: (state) => (perm) => {
      return state.permissions.includes(perm)
    },
    isLoggedIn: (state) => {
      if (!state.token) return false
      const loginTime = localStorage.getItem(LOGIN_TIME_KEY)
      if (!loginTime) return false
      const elapsed = Date.now() - parseInt(loginTime, 10)
      return elapsed < LOGIN_EXPIRY
    },
    remainingTime: (state) => {
      const loginTime = localStorage.getItem(LOGIN_TIME_KEY)
      if (!loginTime) return 0
      const elapsed = Date.now() - parseInt(loginTime, 10)
      const remaining = LOGIN_EXPIRY - elapsed
      return remaining > 0 ? remaining : 0
    }
  },
  actions: {
    /**
     * 检查登录是否过期
     * 每次应用初始化时调用
     * @returns {boolean} 是否过期
     */
    checkLoginExpiry() {
      const token = localStorage.getItem(TOKEN_KEY)
      const loginTime = localStorage.getItem(LOGIN_TIME_KEY)
      if (!token || !loginTime) {
        // 从未登录过或本地没有登录记录，不是"过期"
        this.isLoginExpired = false
        return false
      }
      const elapsed = Date.now() - parseInt(loginTime, 10)
      if (elapsed >= LOGIN_EXPIRY) {
        this.isLoginExpired = true
        this.clearSession()
        return true
      }
      this.isLoginExpired = false
      return false
    },

    /**
     * 执行登录
     * @param {Object} credentials { username, password }
     * @returns {Promise<boolean>} 是否成功
     */
    async login({ username, password }) {
      let loginUser = null

      try {
        const res = await loginApi({ username, password })
        loginUser = res || {}
      } catch (e) {
        // 后端连接失败时，使用 Mock 数据（仅用于本地预览）
        console.warn('[登录] 后端未连接，使用 Mock 数据')
        if (username === 'admin' && password === 'admin123') {
          loginUser = MOCK_USER
        } else {
          // 任意账号密码均可登录（仅预览模式）
          loginUser = {
            ...MOCK_USER,
            userId: Date.now(),
            username,
            realName: username,
            roles: ['ROLE_VIEWER'],
            permissions: ['phone:list:view', 'operation:summary:view']
          }
        }
      }

      if (!loginUser || !loginUser.token) {
        throw new Error('登录失败：无 Token 返回')
      }

      // 保存登录时间戳
      const loginTime = Date.now()
      localStorage.setItem(LOGIN_TIME_KEY, loginTime.toString())

      // 保存 Token
      this.token = loginUser.token
      localStorage.setItem(TOKEN_KEY, loginUser.token)

      // 保存用户信息
      this.userInfo = {
        userId: loginUser.userId,
        username: loginUser.username,
        realName: loginUser.realName || loginUser.username,
        roles: loginUser.roles || [],
        permissions: loginUser.permissions || []
      }
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.userInfo))

      this.isLoginExpired = false
      return true
    },

    /**
     * 获取用户菜单和权限
     * @returns {Promise<void>}
     */
    async getUserInfo() {
      try {
        const [menus, permissions] = await Promise.all([
          getMenus(),
          getPermissions()
        ])
        // 过滤掉"手机设备管理"菜单（已合并到首页，不需要独立入口）
        const rawMenuArr = Array.isArray(menus) ? menus : []
        const filteredMenus = rawMenuArr
          .filter(m => {
            if (!m) return false
            const name = (m.name || '').trim()
            const path = (m.path || '').trim()
            // 过滤掉手机设备管理相关菜单
            if (name === '手机设备管理') return false
            if (path === '/phone/device') return false
            if (path === '/phone/device/list') return false
            if (m.children && m.children.some(c => {
              const childPath = (c.path || '').trim()
              return childPath === '/phone/device' || childPath === '/phone/device/list'
            })) return false
            return true
          })
          .map(m => {
            if (m.children && m.children.length > 0) {
              return {
                ...m,
                children: m.children.filter(c => {
                  const childPath = (c.path || '').trim()
                  return childPath !== '/phone/device/list' && childPath !== '/phone/device'
                })
              }
            }
            return m
          })
          // 如果过滤后没有子菜单了，也移除父级
          .filter(m => !(m.children && m.children.length === 0 && m.path !== '/'))
        // 如果后端没返回"首页"，手动插入
        const hasHome = filteredMenus.some(m => m && (m.path === '/home' || m.path === 'home'))
        this.menuList = hasHome ? filteredMenus : [{ ...HOME_MENU }, ...filteredMenus]
        this.permissions = Array.isArray(permissions) ? permissions : []
      } catch (e) {
        // 后端未连接时使用 Mock 数据
        console.warn('[菜单] 后端未连接，使用 Mock 数据')
        this.menuList = MOCK_MENUS
        this.permissions = MOCK_USER.permissions
      }
    },

    /**
     * 退出登录
     */
    logout() {
      this.clearSession()
    },

    /**
     * 清除会话数据
     */
    clearSession() {
      this.token = ''
      this.userInfo = null
      this.menuList = []
      this.permissions = []
      this.isLoginExpired = true
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_INFO_KEY)
      localStorage.removeItem(LOGIN_TIME_KEY)
    },

    /**
     * 刷新登录时间（用户每次活跃操作时调用，延长会话）
     */
    refreshLoginTime() {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        // 刷新登录时间
        localStorage.setItem(LOGIN_TIME_KEY, Date.now().toString())
      }
    },

    /**
     * 获取剩余登录时间（格式化）
     * @returns {string} 剩余时间字符串，如 "11小时30分"
     */
    getRemainingTimeFormatted() {
      const remaining = this.remainingTime
      if (remaining <= 0) return '已过期'
      const hours = Math.floor(remaining / (60 * 60 * 1000))
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
      if (hours > 0) {
        return `${hours}小时${minutes}分`
      }
      return `${minutes}分钟`
    }
  }
})
