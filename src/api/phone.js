import request from '@/utils/request'

// ==================== 手机卡管理 ====================

/**
 * 分页查询手机卡列表
 * @param {Object} params - { keyword, operatorType, usageStatus, cardStatus, groupBy, page, size }
 */
export function getPhoneCardList(params) {
  return request({
    url: '/phone/cards',
    method: 'get',
    params
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

/**
 * 下载导入模板（前端生成）
 */
export function downloadPhoneCardTemplate() {
  return import('xlsx').then(({ utils, write }) => {
    const data = [
      ['手机号', '运营商', 'ICCID', '实名人', '代理商', '使用状态', '备注'],
      ['13800138000', '移动', '89860123456789012345', '张三', '代理A', '1', '示例数据'],
      ['13900139000', '联通', '89860223456789012345', '李四', '代理B', '1', '']
    ]
    const ws = utils.aoa_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, '手机卡导入模板')
    const buffer = write(wb, { bookType: 'xlsx', type: 'array' })
    return buffer
  })
}

/**
 * 导出手机卡数据
 */
export function exportPhoneCards(params) {
  return request({
    url: '/phone/cards/export',
    method: 'get',
    params,
    responseType: 'arraybuffer'
  })
}

/**
 * 导入手机卡数据
 */
export function importPhoneCards(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/phone/cards/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
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

/**
 * 下载实名人员导入模板（前端生成）
 */
export function downloadRealnameTemplate() {
  return import('xlsx').then(({ utils, write }) => {
    const data = [
      ['姓名', '同事状态', '同事姓名', '扫脸便捷性', '备注'],
      ['张三', 'active', '李四', '2', '示例数据'],
      ['王五', 'resigned', '-', '1', '已离职']
    ]
    const ws = utils.aoa_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, '实名人员导入模板')
    const buffer = write(wb, { bookType: 'xlsx', type: 'array' })
    return buffer
  })
}

/**
 * 导出实名人员数据
 */
export function exportRealnames(params) {
  return request({
    url: '/phone/realnames/export',
    method: 'get',
    params,
    responseType: 'arraybuffer'
  })
}

/**
 * 导入实名人员数据
 */
export function importRealnames(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/phone/realnames/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
