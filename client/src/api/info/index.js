import axios from '@/libs/api.request'
import { getProjectId } from '@/libs/util'

export const getSysCount = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/os`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const getChromeCount = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/browser/distribution_version`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const getBrowserList = () => {
  return axios.request({
    url: `project/${getProjectId()}/api/browser/list`,
    method: 'get'
  })
}

export const getTestInfo = (params) => {
  return axios.request({
    url: `api/log/content/test`,
    method: 'get',
    params: {
      ...params
    }
  })
}
