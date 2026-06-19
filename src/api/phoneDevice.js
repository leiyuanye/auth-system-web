import request from '@/utils/request'

// ============================================================
//  分组列表（核心接口）—— 返回设备 + 子账号的分组数据
// ============================================================
export function getDeviceGroups(params) {
    return request({
        url: '/phone/devices/groups',
        method: 'get',
        params
    })
}

export function downloadDeviceTemplate() {
  return request({
    url: '/phone/devices/template',
    method: 'get',
    responseType: 'blob'
  })
}

export function exportDeviceList(params) {
  return request({
    url: '/phone/devices/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

export function importDeviceList(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/phone/devices/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// ============================================================
//  主设备 CRUD
// ============================================================
export function addDevice(data) {
    return request({
        url: '/phone/devices',
        method: 'post',
        data
    })
}

export function updateDevice(id, data) {
    return request({
        url: `/phone/devices/${id}`,
        method: 'put',
        data
    })
}

export function deleteDevice(id) {
    return request({
        url: `/phone/devices/${id}`,
        method: 'delete'
    })
}

// ============================================================
//  子账号 CRUD
// ============================================================
export function addSubAccount(data) {
    return request({
        url: '/phone/sub-accounts',
        method: 'post',
        data
    })
}

export function updateSubAccount(id, data) {
    return request({
        url: `/phone/sub-accounts/${id}`,
        method: 'put',
        data
    })
}

export function deleteSubAccount(id) {
    return request({
        url: `/phone/sub-accounts/${id}`,
        method: 'delete'
    })
}

// ============================================================
//  下拉选项
// ============================================================
export function getRealnameOptions() {
    return request({
        url: '/phone/devices/options/realnames',
        method: 'get'
    })
}

export function getPhoneNumberOptions() {
    return request({
        url: '/phone/devices/options/phone-numbers',
        method: 'get'
    })
}

export function getDeviceCodeOptions() {
    return request({
        url: '/phone/devices/options/device-codes',
        method: 'get'
    })
}

// 仅摩托罗拉设备（phone_type=3）可以挂子号 —— 子号下拉专用
export function getMotorolaDeviceCodeOptions() {
    return request({
        url: '/phone/devices/options/device-codes/motorola',
        method: 'get'
    })
}
