import axios from 'src/libs/api.request'
import { getProjectId } from 'src/libs/util'

export const getProjectUV = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/dashboard/uv`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const getProjectLog = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/dashboard/log`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const getPerfLog = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/dashboard/perf`,
    method: 'get',
    params: {
      ...params
    }
  })
}
