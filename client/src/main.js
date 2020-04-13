/**
Copyright(c)  2017  Lianjia, Inc. All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import '@babel/polyfill'
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store'
import iView from 'iview'
import Viser from 'viser-vue'
import i18n from '@/locale'
import config from '@/config'
import importDirective from '@/directive'
import './index.less'
import '@/assets/icons/iconfont.css'
import bus from '@/api/bus'
import Cookies from 'js-cookie'
import md5 from 'md5'
import uuid from 'uuid/v4'
import toolTip from '@/view/components/toolTip'

// 设置设备唯一id,并MD5加密
let onlyUuid = ''
if (window.localStorage) {
  let storage = window.localStorage
  if (storage.getItem('uuid')) {
    onlyUuid = storage.getItem('uuid')
  } else {
    const uuidRandom = uuid()
    onlyUuid = md5(md5(uuidRandom) + uuid())
    storage.setItem('uuid', onlyUuid)
  }
} else {
  onlyUuid = Cookies.get('ucid')
}

Vue.use(iView, {
  i18n: (key, value) => i18n.t(key, value)
})

Vue.use(Viser)
Vue.component('toolTip', toolTip)

Vue.config.productionTip = false
/**
 * @description 全局注册应用配置
 */
Vue.prototype.$config = config

/**
 * @description 注册全局打点函数
 */

/**
 * @description 注册全局bus
 */
Vue.prototype.$bus = bus

Vue.prototype.resize = function () {
  if (document.createEvent) {
    var event = document.createEvent('HTMLEvents')
    event.initEvent('resize', true, true)
    window.dispatchEvent(event)
  } else if (document.createEventObject) {
    window.fireEvent('onresize')
  }
}

/**
 * 注册指令
 */
importDirective(Vue)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  i18n,
  store,
  render: h => h(App)
})
