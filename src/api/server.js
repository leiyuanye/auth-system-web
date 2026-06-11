import request from '@/utils/request'

// ==================== 服务器管理 ====================

/**
 * 分页查询服务器列表
 * @param {Object} params - { keyword, cardType(1=在用,2=备用), serverStatus, stockStatus, page, size }
 */
export function getServerList(params) {
  return request({
    url: '/server/servers',
    method: 'get',
    params
  })
}

/**
 * 获取单台服务器详情
 */
export function getServer(id) {
  return request({
    url: `/server/servers/${id}`,
    method: 'get'
  })
}

/**
 * 新增服务器
 */
export function addServer(data) {
  return request({
    url: '/server/servers',
    method: 'post',
    data
  })
}

/**
 * 更新服务器
 */
export function updateServer(id, data) {
  return request({
    url: `/server/servers/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除服务器
 */
export function deleteServer(id) {
  return request({
    url: `/server/servers/${id}`,
    method: 'delete'
  })
}
