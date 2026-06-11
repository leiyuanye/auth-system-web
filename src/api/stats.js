import request from '@/utils/request'

/**
 * 首页聚合统计
 */
export function getHomeStats() {
  return request({
    url: '/stats/home',
    method: 'get'
  })
}

/**
 * 手机卡数据总览统计
 */
export function getPhoneOverviewStats() {
  return request({
    url: '/stats/phone/overview',
    method: 'get'
  })
}

/**
 * 服务器总览统计
 */
export function getServerOverviewStats() {
  return request({
    url: '/stats/server/overview',
    method: 'get'
  })
}
