import request from '@/utils/request'

/**
 * 分页查询企微主体
 * @param {Object} params - { subjectShorts(逗号分隔), customerTypes(逗号分隔), keyword, page, size }
 */
export function getWeCorpList(params) {
  return request({
    url: '/wecorps',
    method: 'get',
    params
  })
}

/**
 * 新增企微主体
 */
export function addWeCorp(data) {
  return request({
    url: '/wecorps',
    method: 'post',
    data
  })
}

/**
 * 更新企微主体
 */
export function updateWeCorp(id, data) {
  return request({
    url: `/wecorps/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除企微主体
 */
export function deleteWeCorp(id) {
  return request({
    url: `/wecorps/${id}`,
    method: 'delete'
  })
}

/**
 * 查询单个企微主体详情（含法人信息）
 */
export function getWeCorpDetail(id) {
  return request({
    url: `/wecorps/${id}`,
    method: 'get'
  })
}

/**
 * 导入企微主体数据
 */
export function importWeCorps(data) {
  return request({
    url: '/wecorps/import',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
