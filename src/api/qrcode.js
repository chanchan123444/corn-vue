import request from "@/utils/request";

export function fetchList(query) {
  return request({
    url: "/api/qr/list",
    method: "get",
    params: query,
  });
}
export function fetchInfoList(query) {
  return request({
    url: "/api/info/list",
    method: "get",
    params: query,
  });
}
export function fetchArticle(id) {
  return request({
    url: "/api/qr/detail",
    method: "get",
    params: { id },
  });
}

export function fetchPv(pv) {
  return request({
    url: "/api/qr/pv",
    method: "get",
    params: { pv },
  });
}

export function createArticle(data) {
  return request({
    url: "/api/qr/add",
    method: "post",
    data,
  });
}

export function updateArticle(data) {
  return request({
    url: "/api/qr/edit",
    method: "post",
    data,
  });
}

export function delArticle(data) {
  return request({
    url: "/api/qr/delete",
    method: "post",
    data,
  });
}

export function exportArticle(data) {
  return request({
    url: "/api/qr/exportData",
    method: "post",
    data,
  });
}
