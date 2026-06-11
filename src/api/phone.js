import request from '@/utils/request'

// ==================== 手机卡管理 ====================

/**
 * 分页查询手机卡列表
 * @param {Object} params - { keyword, cardType, cardStatus, page, size }
 */
export function getPhoneCardList(params) {
  return request({
    url: '/api/phone/cards',
    method: 'get',
    params
  })
}

/**
 * 获取单张手机卡详情
 */
export function getPhoneCard(id) {
  return request({
    url: `/api/phone/cards/${id}`,
    method: 'get'
  })
}

/**
 * 新增手机卡
 * @param {Object} data - PhoneCard 对象
 */
export function addPhoneCard(data) {
  return request({
    url: '/api/phone/cards',
    method: 'post',
    data
  })
}

/**
 * 更新手机卡
 */
export function updatePhoneCard(id, data) {
  return request({
    url: `/api/phone/cards/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除手机卡
 */
export function deletePhoneCard(id) {
  return request({
    url: `/api/phone/cards/${id}`,
    method: 'delete'
  })
}

// ==================== 代理商管理 ====================

/**
 * 分页查询代理商列表
 * @param {Object} params - { keyword, status, page, size }
 */
export function getAgentList(params) {
  return request({
    url: '/api/phone/agents',
    method: 'get',
    params
  })
}

/**
 * 获取所有代理商（下拉选择用，不分页）
 */
export function getAllAgents() {
  return request({
    url: '/api/phone/agents',
    method: 'get',
    params: { page: 1, size: 1000 }
  })
}

/**
 * 获取代理商详情
 */
export function getAgent(id) {
  return request({
    url: `/api/phone/agents/${id}`,
    method: 'get'
  })
}

/**
 * 新增代理商
 * @param {Object} data - { agentName, contact, phone, address, status, remark }
 */
export function addAgent(data) {
  return request({
    url: '/api/phone/agents',
    method: 'post',
    data
  })
}

/**
 * 更新代理商
 */
export function updateAgent(id, data) {
  return request({
    url: `/api/phone/agents/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除代理商
 */
export function deleteAgent(id) {
  return request({
    url: `/api/phone/agents/${id}`,
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
    url: '/api/phone/realnames',
    method: 'get',
    params
  })
}

/**
 * 获取所有实名人员（下拉选择用，不分页）
 */
export function getAllRealnames() {
  return request({
    url: '/api/phone/realnames',
    method: 'get',
    params: { page: 1, size: 1000 }
  })
}

/**
 * 获取实名人员详情
 */
export function getRealname(id) {
  return request({
    url: `/api/phone/realnames/${id}`,
    method: 'get'
  })
}

/**
 * 新增实名人员
 * @param {Object} data - { realName, phone, department, scanStatus, remark }
 */
export function addRealname(data) {
  return request({
    url: '/api/phone/realnames',
    method: 'post',
    data
  })
}

/**
 * 更新实名人员
 */
export function updateRealname(id, data) {
  return request({
    url: `/api/phone/realnames/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除实名人员
 */
export function deleteRealname(id) {
  return request({
    url: `/api/phone/realnames/${id}`,
    method: 'delete'
  })
}
