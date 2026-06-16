import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

// 请求日志拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
      console.log('[请求] 发送请求:', config.method?.toUpperCase(), config.url)
      console.log('[请求] Token前缀:', token.substring(0, 20) + '...')
    } else {
      console.log('[请求] 发送请求(无Token):', config.method?.toUpperCase(), config.url)
    }
    return config
  },
  (error) => {
    console.error('[请求] 请求配置错误:', error.message)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    console.log('[响应] 请求成功:', response.config.method?.toUpperCase(), response.config.url, '->', response.status)

    if (response.config.responseType === 'blob') {
      return response.data
    }
    const res = response.data
    if (res === null || res === undefined) {
      console.log('[响应] 响应数据为空')
      return null
    }
    if (typeof res !== 'object') {
      return res
    }
    if (res.code === 200 || res.code === 0 || res.code === undefined) {
      console.log('[响应] 业务成功，code:', res.code)
      return res.data !== undefined ? res.data : res
    }

    // 业务错误
    console.warn('[响应] 业务失败，code:', res.code, 'message:', res.message)
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || 'Error'))
  },
  (error) => {
    console.error('[响应] 请求错误:', error.message)
    console.error('[响应] 错误详情:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    })

    if (error.response) {
      if (error.response.status === 401) {
        console.warn('[响应] 收到401未授权响应，清除本地Token')
        localStorage.removeItem('token')
        localStorage.removeItem('user_info')

        const url = error.config?.url || ''
        const isLoginRelated = url.includes('/login') || window.location.pathname === '/login'

        // 显示具体错误信息
        const errorMsg = error.response.data?.message || '认证失败，请检查登录状态'
        if (!isLoginRelated) {
          ElMessage.error(errorMsg)
          console.log('[响应] 跳转登录页，错误原因:', errorMsg)
          window.location.href = '/login'
        }
      } else {
        const errorMsg = error.response.data?.message || error.message || '请求失败'
        ElMessage.error(errorMsg)
        console.error('[响应] HTTP错误:', error.response.status, errorMsg)
      }
    } else {
      // 网络错误
      ElMessage.error('网络连接失败，请检查网络')
      console.error('[响应] 网络错误:', error.message)
    }
    return Promise.reject(error)
  }
)

export default service
