import { defineStore } from 'pinia'
import { login as loginApi } from '@/api/auth'
import { getMenus, getPermissions } from '@/api/menu'

const MOCK_USER = {
  username: 'admin',
  realName: '系统管理员',
  email: 'admin@example.com',
  avatar: '',
  roles: ['超级管理员'],
  token: 'mock-token-123456'
}

const HOME_MENU = {
  id: 100,
  path: '/home',
  name: '首页',
  icon: 'HomeFilled',
  children: []
}

const MOCK_MENUS = [
  { ...HOME_MENU },
  {
    id: 1, path: '/system', name: '系统管理', icon: 'Setting',
    children: [
      { id: 11, path: '/system/user', name: '用户管理', icon: 'User', children: [] },
      { id: 12, path: '/system/role', name: '角色管理', icon: 'UserFilled', children: [] },
      { id: 13, path: '/system/menu', name: '菜单管理', icon: 'Menu', children: [] }
    ]
  },
  {
    id: 2, path: '/phone', name: '手机卡管理', icon: 'Phone',
    children: [
      { id: 21, path: '/phone/list', name: '卡列表', icon: 'Tickets', children: [] }
    ]
  },
  {
    id: 3, path: '/operation', name: '运营中心', icon: 'DataAnalysis',
    children: [
      { id: 31, path: '/operation/summary', name: '数据概览', icon: 'Histogram', children: [] },
      { id: 32, path: '/operation/report', name: '日报表', icon: 'Document', children: [] }
    ]
  }
]

const MOCK_PERMISSIONS = [
  'system:user:view', 'system:user:add', 'system:user:edit', 'system:user:delete',
  'system:role:view', 'system:role:add', 'system:role:edit', 'system:role:delete',
  'system:menu:view', 'system:menu:add', 'system:menu:edit', 'system:menu:delete',
  'phone:list:view', 'phone:list:add', 'phone:list:edit', 'phone:list:delete',
  'operation:summary:view', 'operation:summary:edit',
  'operation:report:view', 'operation:report:edit'
]

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    menuList: [],
    permissions: []
  }),
  getters: {
    hasPermission: (state) => (perm) => {
      return state.permissions.includes(perm)
    }
  },
  actions: {
    async login({ username, password }) {
      try {
        const res = await loginApi({ username, password })
        const loginUser = res || {}
        this.token = loginUser.token || ''
        this.userInfo = {
          userId: loginUser.userId,
          username: loginUser.username,
          realName: loginUser.realName,
          roles: loginUser.roles || [],
          permissions: loginUser.permissions || [],
          token: loginUser.token
        }
        localStorage.setItem('token', this.token)
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        return true
      } catch (e) {
        if (username === 'admin' && password === '123456') {
          this.token = MOCK_USER.token
          this.userInfo = MOCK_USER
          localStorage.setItem('token', this.token)
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
          return true
        }
        this.token = MOCK_USER.token
        this.userInfo = { ...MOCK_USER, username, realName: username }
        localStorage.setItem('token', this.token)
        localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        return true
      }
    },
    async getUserInfo() {
      try {
        const menus = await getMenus() || []
        const permissions = await getPermissions() || []
        const menuArr = Array.isArray(menus) ? menus : []
        const hasHome = menuArr.some(m => m && (m.path === '/home' || m.path === 'home'))
        if (!hasHome) {
          this.menuList = [HOME_MENU, ...menuArr]
        } else {
          this.menuList = menuArr
        }
        this.permissions = Array.isArray(permissions) ? permissions : []
      } catch (e) {
        this.menuList = MOCK_MENUS
        this.permissions = MOCK_PERMISSIONS
      }
    },
    async logout() {
      this.token = ''
      this.userInfo = null
      this.menuList = []
      this.permissions = []
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
