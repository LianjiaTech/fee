import axios from 'src/libs/api.request'
import { getProjectId } from 'src/libs/util'

// 添加配置
export const add = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/dot/config/add`,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      ...params
    }
  })
}
// 查询配置
export const query = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/dot/config/query`,
    method: 'get',
    params: {
      ...params
    }
  })
}
// 更新配置
export const update = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/dot/config/update`,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      ...params
    }
  })
}
// 查询事件属性
export const queryProps = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/dot/config/props/${params.id}`,
    method: 'get'
  })
}
// 添加标签
export const addTag = (params) => { 
  return axios.request({
    url: `project/${getProjectId()}/api/dot/config/tag/add`,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      ...params
    }
  })
}
// 查询标签
export const queryTags = (params) => {
  return axios.request({
    url: `project/${getProjectId()}/api/dot/config/tag/query`,
    method: 'get'
  })
}
// 根据筛选条件查询打点数据
export const queryDotDataByFilters = (params) => { 
  return axios.request({
    url: `project/${getProjectId()}/api/dot/data/query`,
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    data: {
      ...params
    }
  })
}

