/** @format */

import Vue from 'vue'
import Router from 'vue-router'
import routes from './routers'
import store from 'src/store'
import iView from 'iview'
import _ from 'lodash'
import { canTurnTo, getToken, getProjectId } from 'src/libs/util'

Vue.use(Router)
const router = new Router({
  routes,
  mode: 'history'
})

router.beforeEach(async (to, from, next) => {
  iView.LoadingBar.start()
  const token = getToken()
  // 如果未登录且当前访问的页面不是登陆页
  if (!token) {
    // 不需要登录的页面，则直接跳转
    // 未登录且要跳转的页面不是登录页，则重定向到登录页
    to.meta && to.meta.noLoginRequired ? next() : (window.location.href = `/login`)
  } else {
    // 已登录
    if (!to.name) {
      next({ name: 'home', params: { id: 1 } })
    } else {
      // 区分是系统 admin 还是 dev
      let roles = _.get(to, ['meta', 'roles'], [])
      // 区分是项目 owner 还是 dev
      let accessArr = _.get(to, ['meta', 'access'], [])
      let { ucid, sysRole, access } = _.get(store, ['state', 'user'], {})

      // 根据系统角色进行校验
      if (roles.length) {
        if (!ucid) {
          let user = await store.dispatch('getUserInfo')
          sysRole = user.role
        }
        if (canTurnTo(to.name, [sysRole], routes, 'roles')) return next()
        else return next({ replace: true, name: 'error_401' }) // 无权限，重定向到401页面
      }
      // 根据项目权限进行校验
      if (accessArr.length) {
        let res = null
        !_.get(access, 'length', 0) && (res = await store.dispatch('getProjectList'))
        let plist = _.get(res, ['data'], [])
        access = !plist.length ? access : plist.filter((item) => item.id == getProjectId()).map((item) => item.role)
        if (canTurnTo(to.name, access, routes)) return next()
        // 有权限，可访问
        else return next({ replace: true, name: 'error_401' }) // 无权限，重定向到401页面
      }
      next()
    }
  }
})

router.afterEach((to) => {
  iView.LoadingBar.finish()
  window.scrollTo(0, 0)
})

export default router
