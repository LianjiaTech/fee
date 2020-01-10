import axios from 'src/libs/api.request'
import { getProjectId } from 'src/libs/util'

const TYPE = {
  SYSTEM: 'os',
  RUNTIMEVERSION: 'runtime_version',
  BROWSER: 'browser',
  DEVICE: 'device'
}
export { TYPE }

export const getSysCount = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/os`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const getSysDevice = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/device`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const getSysRuntimeVersion = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/runtimeVersion`,
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

export const getClientDistribution = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/client/distribution`,
    method: 'get',
    params: {
      ...params
    }
  })
}
