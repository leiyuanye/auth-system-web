import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 200 || res.code === 0 || res.code === undefined) {
      return res.data !== undefined ? res.data : res
    }
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user_info')
        localStorage.removeItem('login_time')
        // 避免在登录页面或登录接口自身上弹出"登录已过期"
        const url = error.config?.url || ''
        const isLoginRelated = url.includes('/login') || window.location.pathname === '/login'
        if (!isLoginRelated) {
          ElMessage.error('登录已过期，请重新登录')
        }
        if (!isLoginRelated) {
          window.location.href = '/login?expired=1'
        }
      } else {
        ElMessage.error(error.response.data?.message || error.message || '请求失败')
      }
    } else {
      ElMessage.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default service
