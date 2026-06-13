import request from '@/utils/request'

// ==================== 手机卡管理 ====================

/**
 * 分页查询手机卡列表
 * @param {Object} params - { keyword, cardType, cardStatus, groupBy, page, size }
 */
export function getPhoneCardList(params) {
  return request({
    url: '/phone/cards',
    method: 'get',
    params
  })
}

/**
 * 获取单张手机卡详情
 */
export function getPhoneCard(id) {
  return request({
    url: `/phone/cards/${id}`,
    method: 'get'
  })
}

/**
 * 新增手机卡
 * @param {Object} data - PhoneCard 对象
 */
export function addPhoneCard(data) {
  return request({
    url: '/phone/cards',
    method: 'post',
    data
  })
}

/**
 * 更新手机卡
 */
export function updatePhoneCard(id, data) {
  return request({
    url: `/phone/cards/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除手机卡
 */
export function deletePhoneCard(id) {
  return request({
    url: `/phone/cards/${id}`,
    method: 'delete'
  })
}

// ==================== 实名人员管理 ====================

/**
 * 分页查询实名人员列表
 * @param {Object} params - { keyword, scanStatus, page, size }
 */
export function getRealnameList(params) {
  return request({
    url: '/phone/realnames',
    method: 'get',
    params
  })
}

/**
 * 获取所有实名人员（下拉选择用，不分页）
 */
export function getAllRealnames() {
  return request({
    url: '/phone/realnames',
    method: 'get',
    params: { page: 1, size: 1000 }
  })
}

/**
 * 获取实名人员详情
 */
export function getRealname(id) {
  return request({
    url: `/phone/realnames/${id}`,
    method: 'get'
  })
}

/**
 * 新增实名人员
 * @param {Object} data - { realName, phone, department, scanStatus, remark }
 */
export function addRealname(data) {
  return request({
    url: '/phone/realnames',
    method: 'post',
    data
  })
}

/**
 * 更新实名人员
 */
export function updateRealname(id, data) {
  return request({
    url: `/phone/realnames/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除实名人员
 */
export function deleteRealname(id) {
  return request({
    url: `/phone/realnames/${id}`,
    method: 'delete'
  })
}
