import axios from '@/libs/api.request'

export const getProjectList = () => {
  return axios.request({
    url: '/api/project/item/list',
    method: 'get'
  })
}
