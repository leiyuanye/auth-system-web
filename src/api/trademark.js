import request from '@/utils/request'

export function getTrademarkList(params) {
  return request({
    url: '/trademarks',
    method: 'get',
    params
  })
}

export function getTrademarkDetail(id) {
  return request({
    url: `/trademarks/${id}`,
    method: 'get'
  })
}

export function addTrademark(data) {
  return request({
    url: '/trademarks',
    method: 'post',
    data
  })
}

export function updateTrademark(id, data) {
  return request({
    url: `/trademarks/${id}`,
    method: 'put',
    data
  })
}

export function deleteTrademark(id) {
  return request({
    url: `/trademarks/${id}`,
    method: 'delete'
  })
}
