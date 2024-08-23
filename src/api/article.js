import request from '@/utils/request'

export function fetchList(query) {
  return request({
    url: '/api/info/list',
    method: 'get',
    params: query
  })
}

export function fetchArticle(id) {
  return request({
    url: '/api/info/detail',
    method: 'get',
    params: { id }
  })
}

export function fetchPv(pv) {
  return request({
    url: '/api/info/pv',
    method: 'get',
    params: { pv }
  })
}

export function createArticle(data) {
  return request({
    url: '/api/info/add',
    method: 'post',
    data
  })
}

export function updateArticle(data) {
  return request({
    url: '/api/info/edit',
    method: 'post',
    data
  })
}

export function delArticle(data) {
  return request({
    url: "/api/info/delete",
    method: "post",
    data,
  });
}