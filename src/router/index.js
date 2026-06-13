import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      // ========== 系统管理 ==========
      {
        path: '/system/user',
        name: 'UserList',
        component: () => import('@/views/system/UserList.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: '/system/role',
        name: 'RoleList',
        component: () => import('@/views/system/RoleList.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: '/system/menu',
        name: 'MenuList',
        component: () => import('@/views/system/MenuList.vue'),
        meta: { title: '菜单管理' }
      },
      {
        path: '/system/log',
        name: 'OperateLog',
        component: () => import('@/views/system/OperateLog.vue'),
        meta: { title: '日志管理' }
      },
      {
        path: '/system/dict',
        name: 'DictList',
        component: () => import('@/views/system/DictList.vue'),
        meta: { title: '数据字典' }
      },
      // ========== 手机卡管理 ==========
      {
        path: '/phone/list',
        name: 'PhoneList',
        component: () => import('@/views/phone/PhoneList.vue'),
        meta: { title: '手机卡' }
      },
      {
        path: '/phone/active',
        name: 'ActivePhone',
        redirect: '/phone/list',
        component: () => import('@/views/phone/PhoneList.vue'),
        meta: { title: '在用手机卡' }
      },
      {
        path: '/phone/backup',
        name: 'BackupPhone',
        redirect: '/phone/list',
        component: () => import('@/views/phone/PhoneList.vue'),
        meta: { title: '备用手机卡' }
      },
      {
        path: '/phone/overview',
        name: 'PhoneOverview',
        component: () => import('@/views/phone/PhoneOverview.vue'),
        meta: { title: '数据总览' }
      },
      // ========== 服务器管理 ==========
      {
        path: '/server/list',
        name: 'ServerList',
        component: () => import('@/views/server/ServerList.vue'),
        meta: { title: '服务器' }
      },
      {
        path: '/server/overview',
        name: 'ServerOverview',
        component: () => import('@/views/server/ServerOverview.vue'),
        meta: { title: '服务器总览' }
      },
      // ========== 实名人员管理 ==========
      {
        path: '/realname/list',
        name: 'RealnameList',
        component: () => import('@/views/realname/RealnameList.vue'),
        meta: { title: '实名人员' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth) {
    const isExpired = userStore.checkLoginExpiry()
    if (isExpired) {
      next({ path: '/login', query: { expired: '1' } })
      return
    }
    if (!userStore.token) {
      next({ path: '/login' })
      return
    }
  }

  if (to.path === '/login' && userStore.token) {
    const isExpired = userStore.checkLoginExpiry()
    if (!isExpired) {
      next({ path: '/home' })
      return
    }
  }

  next()
})

export default router
