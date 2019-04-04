'use strict'
/**
 * 统一获取http数据
 * Created by yaoze on 2017/2/17.
 */
import axios from 'axios' // 引入axios组件
import querystring from 'query-string'
import _ from 'lodash'

// 创建axios实例
let http = axios.create()

/**
 * post form表单
 * @param {string} url
 * @param {object} formData
 * @param {object} config
 */
function postForm (url, formData = {}, config = {}) {
  return http.post(url, querystring.stringify(formData), {
    ...config,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ..._.get(config, ['headers'], {})
    }
  })
}
http.postForm = postForm

export default http
