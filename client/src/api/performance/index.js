import axios from '@/libs/api.request'
import { getProjectId } from '@/libs/util'

export const fetchUrlList = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/performance/url_list`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const fetchTimeLine = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/performance/url/overview`,
    method: 'get',
    params: {
      ...params
    }
  })
}

export const fetchTimeDetail = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/performance/url/line_chart`,
    method: 'get',
    params: {
      ...params
    }
  })
}
