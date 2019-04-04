import axios from '@/libs/api.request'
import { getProjectId } from '@/libs/util'

export const getAlarmList = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/alarm/config/list`,
    method: 'get',
    params: {
      ...params
    }
  })
}
export const add = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/alarm/config/add`,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      ...params
    }
  })
}
export const remove = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/alarm/config/delete`,
    method: 'get',
    params: {
      ...params
    }
  })
}
export const update = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/alarm/config/update`,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      ...params
    }
  })
}

export const getAlarmErrorNameList = () => {
  return axios.request({
    url: `project/${getProjectId()}/api/error/distribution/summary`,
    method: 'get'
  })
}

export const getAlarmLog = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/alarm/log`,
    method: 'get',
    params
  })
}

export const getLineAlarmLog = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/alarm/log/line`,
    method: 'get',
    params
  })
}
