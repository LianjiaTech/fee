/**
 * 前端根据action类型判断接口响应逻辑
 *  1.  success
 *      1.  正常处理
 *  2.  alert
 *      1.  弹出提示框, 展示msg中的内容
 *  3.  redirect
 *      1.  如果msg中有内容, 将msg内容作为Alert弹出
 *      2.  跳转到url对应地址
 *  4.  login(前端可自行处理)
 *      1.  弹出提示: 请先登录
 *      2.  跳转到登录界面
 *  5.  forbitan(前端可自行处理)
 *      1.  弹出提示: 没有权限
 *      2.  跳转到首页(如果也没有首页权限, 则跳转到登录页)
 */

const ACTION_TYPE_SUCCESS = 'success'
const ACTION_TYPE_ALERT = 'alert' // 此处没有专门的Error类型, 因为如果不需要特殊操作的Error, 就不应该告知前端
const ACTION_TYPE_REDIRECT = 'redirect'
const ACTION_TYPE_LOGIN = 'login'
const ACTION_TYPE_FORBIDDEN = 'forbitan'

/**
 * 返回响应值
 * @param {Object} data
 * @param {String} msg
 * @param {Number} code
 * @param {String} action
 * @param {String} url
 */
function showResult (data, msg = '', code = 0, action = ACTION_TYPE_SUCCESS, url = '') {
  return {
    code,
    action,
    data,
    msg,
    url
  }
}

/**
 * 返回错误消息
 * @param {*} errorMsg
 * @param {*} errorCode
 * @param {*} data
 * @param {*} action
 */
function showError (errorMsg = '', errorCode = 10000, data = {}, action = ACTION_TYPE_ALERT) {
  let url = ''
  return showResult(data, errorMsg, errorCode, action, url)
}

/**
 * 跳转到指定url
 * @param {*} url
 * @param {*} msg
 * @param {*} data
 * @param {*} errorNo
 */
function redirectTo (url = '', msg = '', data = {}, errorNo = 10000) {
  let action = ACTION_TYPE_REDIRECT
  return showResult(data, msg, errorNo, action, url)
}

function needLoginIn (msg = '请先登录') {
  return showResult({}, msg, 10000, ACTION_TYPE_LOGIN, '/login')
}

function noPrivilege (msg = '没有权限') {
  return showResult({}, msg, 10000, ACTION_TYPE_FORBIDDEN, '')
}

export default {
  // 标准接口
  noPrivilege,
  needLoginIn,
  showError,
  showResult,
  redirectTo,

  // Action类型
  ACTION_TYPE_SUCCESS,
  ACTION_TYPE_ALERT,
  ACTION_TYPE_REDIRECT,
  ACTION_TYPE_LOGIN,
  ACTION_TYPE_FORBIDDEN
}
