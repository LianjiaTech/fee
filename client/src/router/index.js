import Vue from 'vue'
import Router from 'vue-router'
import routes from './routers'
import iView from 'iview'
import { canTurnTo, getToken } from '@/libs/util'

Vue.use(Router)
const router = new Router({
  routes,
  mode: 'history'
})
const LOGIN_PAGE_NAME = 'login'

router.beforeEach((to, from, next) => {
  iView.LoadingBar.start()
  const token = getToken()

  if (!token && to.name !== LOGIN_PAGE_NAME) {
    // 未登录且要跳转的页面不是登录页
    next({
      name: LOGIN_PAGE_NAME // 跳转到登录页
    })
  } else if (!token && to.name === LOGIN_PAGE_NAME) {
    // 未登陆且要跳转的页面是登录页
    next() // 跳转
  } else if (token) {
    if (to.name === LOGIN_PAGE_NAME || !to.name) {
      next({
        name: 'home',
        params: {
          id: 1
        }
      })  
    } else {
      if (canTurnTo(to.name, 'user.access', routes)) next() // 有权限，可访问
      else next({ replace: true, name: 'error_401' }) // 无权限，重定向到401页面
    }
  } else {
    if (canTurnTo(to.name, 'user.access', routes)) next() // 有权限，可访问
    else next({ replace: true, name: 'error_401' }) // 无权限，重定向到401页面
  }
})

router.afterEach(to => {
  iView.LoadingBar.finish()
  window.scrollTo(0, 0)
})

export default router
