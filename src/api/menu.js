import request from '@/utils/request'

export function getMenus() {
  return request({
    url: '/menus',
    method: 'get'
  })
}

export function getPermissions() {
  return request({
    url: '/permissions',
    method: 'get'
  })
}
