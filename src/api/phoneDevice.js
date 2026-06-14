import request from '@/utils/request'

export function getPhoneDeviceList(params) {
    return request({
        url: '/phone/devices',
        method: 'get',
        params
    })
}

export function getPhoneDevice(id) {
    return request({
        url: `/phone/devices/${id}`,
        method: 'get'
    })
}

export function addPhoneDevice(data) {
    return request({
        url: '/phone/devices',
        method: 'post',
        data
    })
}

export function updatePhoneDevice(id, data) {
    return request({
        url: `/phone/devices/${id}`,
        method: 'put',
        data
    })
}

export function deletePhoneDevice(id) {
    return request({
        url: `/phone/devices/${id}`,
        method: 'delete'
    })
}

export function getRealnameOptions() {
    return request({
        url: '/phone/devices/options/realnames',
        method: 'get'
    })
}

export function getPhoneNumberOptions() {
    return request({
        url: '/phone/devices/options/phones',
        method: 'get'
    })
}
