import axios from '@/libs/api.request'
import { getProjectId } from '@/libs/util'

export const getMemberInfo = () => {
  return axios.request({
    url: `project/${getProjectId()}/api/project/member/list`,
    method: 'get'
  })
}
export const getMemberAdd = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/project/member/add`,
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    data: {
      ...params
    }
  })
}
export const getMemberDel = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/project/member/delete`,
    method: 'get',
    params: {
      ...params
    }
  })
}
export const getMemberUpdate = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/project/member/update`,
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    data: {
      ...params
    }
  })
}
