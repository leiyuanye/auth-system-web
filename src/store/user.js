import { defineStore } from 'pinia'
import { login as loginApi } from '@/api/auth'
import { getMenus, getPermissions } from '@/api/menu'

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'user_info'

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
    permissions: []
  }),
  getters: {
    hasPermission: (state) => (perm) => {
      return state.permissions.includes(perm)
    },
    isLoggedIn: (state) => {
      // 只检查token是否存在，不再检查过期时间
      return !!state.token
    }
  },
  actions: {
    /**
     * 检查是否已登录（仅检查token是否存在）
     * @returns {boolean}
     */
    checkLogin() {
      const token = localStorage.getItem(TOKEN_KEY)
      console.log('[登录状态检查] token存在:', !!token)
      return !!token
    },

    /**
     * 执行登录
     * @param {Object} credentials { username, password }
     * @returns {Promise<boolean>} 是否成功
     */
    async login({ username, password }) {
      console.log('[登录] 开始登录流程，用户名:', username)

      let loginUser = null

      try {
        console.log('[登录] 正在调用后端API...')
        const res = await loginApi({ username, password })
        loginUser = res || {}
        console.log('[登录] 后端返回数据:', {
          hasToken: !!loginUser.token,
          userId: loginUser.userId,
          username: loginUser.username
        })
      } catch (e) {
        console.error('[登录] 后端请求失败:', e.message)

        // 区分：后端返回了响应（业务错误）vs 后端完全无法连接（网络错误）
        // 如果 error.response 存在，说明服务器返回了错误响应，应该直接抛出
        // 只有网络错误时才使用 Mock 数据进行本地预览
        if (e.response !== undefined) {
          console.warn('[登录] 后端返回业务错误，不使用Mock，抛出异常:', e.response?.data?.message)
          throw new Error(e.response?.data?.message || '登录失败')
        }

        // 只有网络错误时才使用 Mock 数据
        console.warn('[登录] 后端未连接，使用Mock数据进行本地预览')
        if (username === 'admin' && password === 'admin123') {
          loginUser = MOCK_USER
          console.log('[登录] 使用Mock管理员数据')
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
          console.log('[登录] 使用Mock预览数据')
        }
      }

      if (!loginUser || !loginUser.token) {
        console.error('[登录] 失败：后端未返回token')
        throw new Error('登录失败：无 Token 返回')
      }

      // 保存 Token
      this.token = loginUser.token
      localStorage.setItem(TOKEN_KEY, loginUser.token)
      console.log('[登录] Token已保存:', loginUser.token.substring(0, 20) + '...')

      // 保存用户信息
      this.userInfo = {
        userId: loginUser.userId,
        username: loginUser.username,
        realName: loginUser.realName || loginUser.username,
        roles: loginUser.roles || [],
        permissions: loginUser.permissions || []
      }
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(this.userInfo))
      console.log('[登录] 用户信息已保存:', this.userInfo)

      console.log('[登录] 登录成功!')
      return true
    },

    /**
     * 获取用户菜单和权限
     * @returns {Promise<void>}
     */
    async getUserInfo() {
      console.log('[用户信息] 开始获取用户菜单和权限...')
      try {
        const [menus, permissions] = await Promise.all([
          getMenus(),
          getPermissions()
        ])
        console.log('[用户信息] 后端返回菜单数量:', Array.isArray(menus) ? menus.length : 0)
        console.log('[用户信息] 后端返回权限数量:', Array.isArray(permissions) ? permissions.length : 0)

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
              const filteredChildren = m.children.filter(c => {
                const childPath = (c.path || '').trim()
                return childPath !== '/phone/device/list' && childPath !== '/phone/device'
              })
              if (filteredChildren.length === 0) {
                return null
              }
              return {
                ...m,
                children: filteredChildren
              }
            }
            return m
          })
          .filter(m => m !== null)
        // 如果后端没返回"首页"，手动插入
        const hasHome = filteredMenus.some(m => m && (m.path === '/home' || m.path === 'home'))
        this.menuList = hasHome ? filteredMenus : [{ ...HOME_MENU }, ...filteredMenus]
        this.permissions = Array.isArray(permissions) ? permissions : []

        console.log('[用户信息] 最终菜单数量:', this.menuList.length)
        console.log('[用户信息] 最终权限数量:', this.permissions.length)
      } catch (e) {
        console.error('[用户信息] 获取用户信息失败:', e.message)
        // 后端未连接时使用 Mock 数据
        console.warn('[用户信息] 后端未连接，使用 Mock 数据')
        this.menuList = MOCK_MENUS
        this.permissions = MOCK_USER.permissions
      }
    },

    /**
     * 退出登录
     */
    logout() {
      console.log('[退出] 开始退出登录流程...')
      this.clearSession()
      console.log('[退出] 退出登录完成')
    },

    /**
     * 清除会话数据
     */
    clearSession() {
      this.token = ''
      this.userInfo = null
      this.menuList = []
      this.permissions = []
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_INFO_KEY)
      console.log('[会话] 本地会话数据已清除')
    }
  }
})
