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
        // 区分：后端返回了响应（业务错误）vs 后端完全无法连接（网络错误）
        // 如果 error.response 存在，说明服务器返回了错误响应，应该直接抛出
        // 只有网络错误时才使用 Mock 数据进行本地预览
        if (e.response !== undefined) {
          throw new Error(e.response?.data?.message || '登录失败')
        }

        // 只有网络错误时才使用 Mock 数据
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
        console.error('[登录] 失败：后端未返回token')
        throw new Error('登录失败：无 Token 返回')
      }

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

        const menuArr = Array.isArray(menus) ? menus.filter(Boolean) : []
        // 如果后端没返回"首页"，手动插入
        const hasHome = menuArr.some(m => m && (m.path === '/home' || m.path === 'home'))
        this.menuList = hasHome ? menuArr : [{ ...HOME_MENU }, ...menuArr]
        this.permissions = Array.isArray(permissions) ? permissions : []
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
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_INFO_KEY)
    }
  }
})
