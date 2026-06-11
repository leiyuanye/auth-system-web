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
        path: '/phone/list',
        name: 'PhoneList',
        component: () => import('@/views/phone/PhoneList.vue'),
        meta: { title: '手机卡管理' }
      },
      {
        path: '/operation/summary',
        name: 'ReportSummary',
        component: () => import('@/views/operation/ReportSummary.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: '/operation/report',
        name: 'DailyReport',
        component: () => import('@/views/operation/DailyReport.vue'),
        meta: { title: '日报表' }
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

  // 检查登录是否过期
  if (requiresAuth) {
    const isExpired = userStore.checkLoginExpiry()
    if (isExpired) {
      // 登录已过期，跳转到登录页并提示
      next({
        path: '/login',
        query: { expired: '1' }
      })
      return
    }
  }

  // 无 token 且需要鉴权
  if (requiresAuth && !userStore.token) {
    next({ path: '/login' })
    return
  }

  // 已登录访问登录页 → 跳转首页
  if (to.path === '/login' && userStore.token) {
    const isExpired = userStore.checkLoginExpiry()
    if (!isExpired) {
      next({ path: '/home' })
      return
    }
    // 已过期则允许去登录页重新登录
  }

  next()
})

export default router
