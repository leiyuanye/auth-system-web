import request from '@/utils/request'

export function getDictByType(type) {
  return request({
    url: `/dict/type/${type}`,
    method: 'get'
  })
}

export function addDict(data) {
  return request({
    url: '/dict',
    method: 'post',
    data
  })
}

export function updateDict(id, data) {
  return request({
    url: `/dict/${id}`,
    method: 'put',
    data
  })
}

export function deleteDict(id) {
  return request({
    url: `/dict/${id}`,
    method: 'delete'
  })
}
