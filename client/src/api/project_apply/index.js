/** @format */

import axios from 'src/libs/api.request'

export const projectApplyAdd = (params) => {
  return axios.request({
    url: `api/project/apply/add`,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      ...params
    }
  })
}
export const projectApplylist = (params) => {
  return axios.request({
    url: `api/project/apply/list`,
    method: 'get',
    params: {
      ...params
    }
  })
}
export const projectApplyUpdate = (params) => {
  return axios.request({
    url: `/api/project/apply/update`,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      ...params
    }
  })
}
