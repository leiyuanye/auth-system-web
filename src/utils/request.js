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
    console.log('[响应] HTTP状态:', response.status, 'URL:', response.config.url)

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

    // 业务成功
    if (res.code === 200 || res.code === 0) {
      console.log('[响应] 业务成功，code:', res.code)
      return res.data !== undefined ? res.data : res
    }

    // 业务错误 - 保留response信息，让上层能获取到错误详情
    console.warn('[响应] 业务失败，code:', res.code, 'message:', res.message)

    // 判断是否是登录接口，登录接口的错误由登录页统一处理，不在拦截器里弹窗
    const isLoginApi = response.config?.url?.includes('/auth/login')
    if (!isLoginApi) {
      ElMessage.error(res.message || '请求失败')
    }

    // 创建一个带有response信息的错误对象，这样上层可以通过 error.response 判断是服务器返回的错误
    const error = new Error(res.message || '请求失败')
    error.response = {
      status: response.status,
      data: res,
      config: response.config
    }
    error.code = res.code
    return Promise.reject(error)
  },
  (error) => {
    console.error('[响应] HTTP请求错误:', error.message)

    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      const url = error.config?.url || ''
      const isLoginApi = url.includes('/auth/login')

      console.error('[响应] HTTP错误详情:', {
        status: status,
        data: data,
        url: url
      })

      if (status === 401) {
        // 401 只处理非登录接口（token过期）
        if (!isLoginApi) {
          console.warn('[响应] 收到401未授权，清除Token并跳转登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user_info')
          ElMessage.error(data?.message || '登录已过期，请重新登录')
          window.location.href = '/login'
        }
      } else {
        // 其他HTTP错误（400/500等）
        const errorMsg = data?.message || error.message || '请求失败'
        if (!isLoginApi) {
          ElMessage.error(errorMsg)
        }
      }
    } else {
      // 网络错误
      console.error('[响应] 网络错误:', error.message)
      ElMessage.error('网络连接失败，请检查网络')
    }

    return Promise.reject(error)
  }
)

export default service
