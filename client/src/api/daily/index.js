import axios from 'src/libs/api.request'
import { getProjectId } from 'src/libs/util'

// 获取所有的有权限的项目列表
export const getAllProject = () => {
  return axios.request({
    url: `project/${getProjectId()}/api/project/daily/getAllProject`,
    method: 'get'
  })
}

// 获取已经订阅的项目列表
export const getSubscribeProject = () => {
  return axios.request({
    url: `project/${getProjectId()}/api/project/daily/getSubscribeList`,
    method: 'get'
  })
}

// 更新订阅信息
export const updateSubscribe = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/project/daily/update`,
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    data: {
      ...params
    }
  })
}
