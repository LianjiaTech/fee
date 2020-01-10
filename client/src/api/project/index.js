/** @format */

import axios from 'src/libs/api.request'

export const getProjectList = () => {
  return axios.request({
    url: '/api/project/item/list',
    method: 'get'
  })
}

export const getProjectInfo = (id) => {
  return axios.request({
    url: '/api/project/item/detail',
    method: 'get',
    params: {
      id
    }
  })
}

export const updateProjectInfo = (params) => {
  return axios.request({
    url: '/api/project/item/update',
    method: 'post',
    data: params
  })
}

export const deleteProject = (params) => {
  return axios.request({
    url: '/api/project/item/delete',
    method: 'post',
    data: params
  })
}
