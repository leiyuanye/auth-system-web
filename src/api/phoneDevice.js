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

// ============================================================
//  主设备 CRUD
// ============================================================
export function getDevice(id) {
    return request({
        url: `/phone/devices/${id}`,
        method: 'get'
    })
}

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
export function getSubAccount(id) {
    return request({
        url: `/phone/sub-accounts/${id}`,
        method: 'get'
    })
}

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

export function getSubAccountStatus(deviceCode) {
    return request({
        url: `/phone/sub-accounts/device-status/${deviceCode}`,
        method: 'get'
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

// ============================================================
//  向后兼容：老接口别名（便于老代码平滑迁移）
//  getPhoneDeviceList -> getDeviceGroups
//  addPhoneDevice / updatePhoneDevice / deletePhoneDevice  -> 调用 addDevice 等
// ============================================================
export function getPhoneDeviceList(params) {
    return getDeviceGroups(params)
}

export function addPhoneDevice(data) {
    return addDevice(data)
}

export function updatePhoneDevice(id, data) {
    return updateDevice(id, data)
}

export function deletePhoneDevice(id) {
    return deleteDevice(id)
}
