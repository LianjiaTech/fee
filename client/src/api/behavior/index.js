import axios from '@/libs/api.request'
import { getProjectId } from '@/libs/util'
// let id = window.location.href.split('/')[4] || axios.getProject()

export const getMenuCount = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/behavior/menu`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const getOnlineTime = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/behavior/online`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const getNewUsersByLine = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/project/summary/new_user/distribution_line`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const getNewUsersByMap = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/project/summary/new_user/distribution_map`,
    method: 'get',
    params: {
      ...params
    }
  })
}
