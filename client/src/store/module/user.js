/** @format */

import { getLoginUserInfo, login, logout, loginNormal } from 'src/api/user'
import { getToken, setToken } from 'src/libs/util'

export default {
  state: {
    userName: '',
    userId: '',
    ucid: '',
    mail: '',
    avatorImgPath: '',
    token: getToken(),
    access: [],
    sysRole: ''
  },
  mutations: {
    setAvator(state, avatorPath) {
      state.avatorImgPath = avatorPath
    },
    setUserId(state, id) {
      state.userId = id
    },
    setUserName(state, name) {
      state.userName = name
    },
    setAccess(state, access = []) {
      state.access = access
    },
    setSysRole(state, sysRole) {
      state.sysRole = sysRole
    },
    setUserUcid(state, ucid) {
      state.ucid = ucid
    },
    setMail(state, mail) {
      state.mail = mail
    },
    setToken(state, token) {
      state.token = token
      setToken(token)
    }
  },
  actions: {
    // 登录
    handleLogin({ commit }, { account, password, loginType }) {
      account = account.trim()
      return new Promise((resolve, reject) => {
        if (loginType === 'uc') {
          login({
            account,
            password
          })
            .then((res) => {
              resolve(res)
            })
            .catch((err) => {
              reject(err)
            })
        } else {
          loginNormal({
            account,
            password
          })
            .then((res) => {
              resolve(res)
            })
            .catch((err) => {
              reject(err)
            })
        }
      })
    },
    // 退出登录
    handleLogOut({ state, commit }) {
      return new Promise((resolve, reject) => {
        logout(state.token)
          .then(() => {
            commit('setToken', '')
            commit('setAccess', [])
            resolve()
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
    // 获取用户相关信息
    getUserInfo({ commit }) {
      return new Promise((resolve, reject) => {
        getLoginUserInfo()
          .then((res) => {
            const data = res.data || {}
            commit('setSysRole', data.role)
            commit('setAvator', data.avatar_url)
            commit('setUserName', data.nickname)
            commit('setUserId', data.user_id)
            commit('setAccess', data.access)
            commit('setUserUcid', data.ucid)
            commit('setMail', data.email)
            resolve(data)
          })
          .catch((err) => {
            reject(err)
          })
      })
    }
  }
}
