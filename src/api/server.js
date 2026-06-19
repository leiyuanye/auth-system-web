import request from '@/utils/request'

// ==================== 服务器管理 ====================

/**
 * 分页查询服务器列表（按状态管理，不再区分在用/备用）
 * @param {Object} params - { keyword, serverStatus, expireSort, page, size }
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

/**
 * 导入服务器
 * @param {FormData} formData - 包含 file 字段
 */
export function importServers(formData) {
  return request({
    url: '/server/servers/import',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
