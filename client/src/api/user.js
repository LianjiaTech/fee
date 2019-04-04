import axios from '@/libs/api.request'

export const login = ({ account, password }) => {
  const data = {
    account: account,
    password
  }
  return axios.request({
    url: 'api/login/uc',
    data,
    method: 'post'
  })
}
export const loginNormal = ({ account, password }) => {
  const data = {
    account,
    password
  }
  return axios.request({
    url: 'api/login/normal',
    data,
    method: 'post'
  })
}
export const getUserInfo = (token) => {
  return axios.request({
    url: 'get_info',
    params: {
      token
    },
    method: 'get'
  })
}

export const logout = (token) => {
  return axios.request({
    url: 'api/logout',
    method: 'get'
  })
}

export const getUserSearch = (params) => {
  return axios.request({
    url: `api/user/search_uc`,
    method: 'get',
    headers: { 'Content-Type': 'application/json' },
    params: {
      ...params
    }
  })
}

export const getLoginUserInfo = () => {
  return axios.request({
    url: `api/user/detail`,
    method: 'get'
  })
}

export const register = (data) => {
  return axios.request({
    url: `api/user/register`,
    method: 'post',
    data
  })
}

export const modifyPassword = (data) => {
  return axios.request({
    url: `api/user/modify/password`,
    method: 'post',
    data
  })
}

export const modifyMessage = (data) => {
  return axios.request({
    url: `api/user/modify/msg`,
    method: 'post',
    data
  })
}

export const destroyAccount = (data) => {
  return axios.request({
    url: `api/user/destroy`,
    method: 'get'
  })
}
