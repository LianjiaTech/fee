/** @format */

import {
  getBreadCrumbList,
  getHomeRoute,
  getMenuByRouter,
  getTagNavListFromLocalstorage,
  setTagNavListInLocalstorage
} from 'src/libs/util'
import routers from 'src/router/routers'
import { getProjectList } from 'src/api/project'

export default {
  state: {
    breadCrumbList: [],
    tagNavList: [],
    homeRoute: getHomeRoute(routers),
    projectList: null
  },
  getters: {
    menuList: (state, getters, rootState) => {
      const { access, sysRole, ucid } = rootState.user
      // if (!ucid) return
      return getMenuByRouter(routers, access, sysRole)
    }
  },
  actions: {
    // 获取项目列表
    getProjectList({ commit }) {
      return new Promise((resolve, reject) => {
        getProjectList()
          .then((res) => {
            const data = res.data
            commit('setProjectList', data)
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })
    }
  },
  mutations: {
    setBreadCrumb(state, routeMetched) {
      state.breadCrumbList = getBreadCrumbList(routeMetched, state.homeRoute)
    },
    setTagNavList(state, list) {
      if (list) {
        state.tagNavList = [...list]
        setTagNavListInLocalstorage([...list])
      } else state.tagNavList = getTagNavListFromLocalstorage()
    },
    addTag(state, item, type = 'unshift') {
      if (state.tagNavList.findIndex((tag) => tag.name === item.name) < 0) {
        if (type === 'push') state.tagNavList.push(item)
        else state.tagNavList.unshift(item)
        setTagNavListInLocalstorage([...state.tagNavList])
      }
    },
    setProjectList: (state, list = []) => {
      if (!Array.isArray(list)) list = []
      state.projectList = list
    }
  }
}
