/**
 * 用户信息处理
 */
import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import MUser from '~/src/model/project/user'
import ucConfig from '~/src/configs/user_center'
import http from '~/src/library/http'
import moment from 'moment'
import UC from '~/src/library/uc'

let detail = RouterConfigBuilder.routerConfigBuilder('/api/user/detail', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let request = req.query
  let cookieAccount = _.get(req, ['fee', 'user', 'account'], '')
  // 没有指定account则返回当前登录用户信息
  let reqAccount = _.get(request, ['account'], cookieAccount)
  let rawUser = await MUser.getByAccount(reqAccount)
  let user = MUser.formatRecord(rawUser)
  res.send(API_RES.showResult(user))
}, false)

let update = RouterConfigBuilder.routerConfigBuilder('/api/user/update', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let request = req.body

  let updateUcid = _.get(request, 'ucid', 0)
  if (updateUcid === 0) {
    res.send(API_RES.showError('ucid不能为空'))
    return
  }
  let updateRecord = {}
  for (let key of [
    'email',
    'nickname',
    'role',
    'register_type',
    'avatar_url',
    'mobile' ]) {
    if (_.has(request, [key])) {
      updateRecord[key] = _.get(request, [key], '')
    }
  }
  // 密码需要单独处理
  if (_.has(request, 'password')) {
    let password = _.get(request, 'password')
    let passwordMd5 = MUser.hash(password)
    updateRecord['password_md5'] = passwordMd5
  }

  let isUpdateSuccess = await MUser.update(updateUcid, updateRecord)
  if (isUpdateSuccess) {
    res.send(API_RES.showResult(true))
  } else {
    res.send(API_RES.showError('更新失败, 请重试'))
  }
}, false)

let deleteRecord = RouterConfigBuilder.routerConfigBuilder('/api/user/delete', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let request = req.query

  let deleteUcid = _.get(request, 'ucid', 0)
  // 没有指定account则返回当前登录用户信息
  let isUpdateSuccess = await MUser.update(deleteUcid, { is_delete: true })
  res.send(API_RES.showResult(isUpdateSuccess))
}, false)

let search = RouterConfigBuilder.routerConfigBuilder('/api/user/search', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let request = req.query

  let reqAccount = _.get(request, ['account'], '')
  let rawUserList = await MUser.searchByAccount(reqAccount)
  let userList = []
  for (let rawUser of rawUserList) {
    let user = MUser.formatRecord(rawUser)
    userList.push(user)
  }
  res.send(API_RES.showResult(userList))
}, false)

let searchUC = RouterConfigBuilder.routerConfigBuilder('/api/user/search_uc', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let request = req.query
  let account = _.get(request, ['account'], '')
  let pageSize = parseInt(_.get(request, ['size'], 10))

  if (_.isInteger(pageSize) === false) {
    res.send(API_RES.showError('size 格式不正确'))
    return
  }
  const appId = ucConfig.appID
  const key = ucConfig.appkey
  const api = ucConfig.api
  const ts = moment().unix() * 1000

  let queryData = {
    keyword: account,
    pageSize
  }
  let headers = {
    appId,
    ts
  }
  const sign = UC.getSign(queryData, headers, key)
  headers['sign'] = sign
  let resultUC = await http.get(api + '/ehr/user/searchByKeyword', { params: queryData, headers })
  let resultUCList = _.get(resultUC, ['data', 'data', 'list'], [])
  resultUCList.forEach(item => {
    item['ucid'] = item['id']
  })
  res.send(API_RES.showResult(resultUCList))
}, false)

const register = RouterConfigBuilder.routerConfigBuilder('/api/user/register', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const body = _.get(req, ['body'], {})
  const account = _.get(body, ['account'], '')
  const password = _.get(body, ['password'], '')
  const nickname = _.get(body, ['nickname'], '')
  const email = account
  const registerType = MUser.REGISTER_TYPE_SITE
  const role = MUser.ROLE_DEV
  const passwordMd5 = MUser.hash(password)
  const userInfo = {
    email,
    password_md5: passwordMd5,
    nickname,
    register_type: registerType,
    role
  }
  // 判断此账号是否存在
  let rawUser = MUser.getByAccount(account)
  if (_.isEmpty(rawUser) || rawUser.is_delete === 1) {
    const isSuccess = await MUser.register(account, userInfo)
    if (isSuccess) {
      res.send(API_RES.showResult([], '注册成功'))
    } else {
      res.send(API_RES.showError('注册失败'))
    }
  } else {
    res.send(API_RES.showError('账号已存在'))
  }
}, false, false)

const modifyPassword = RouterConfigBuilder.routerConfigBuilder('/api/user/modify/password', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const body = _.get(req, ['body'], {})
  const ucid = _.get(req, ['fee', 'user', 'ucid'], 0)
  const oldPassword = _.get(body, ['oldPassword'], '')
  const password = _.get(body, ['password'], '')

  const rawUser = await MUser.get(ucid)
  if (_.isEmpty(rawUser) || rawUser.is_delete === 1) {
    res.send(API_RES.showError('用户不存在'))
    return
  }

  const oldPasswordMd5 = MUser.hash(oldPassword)
  const userPasswordMd5 = _.get(rawUser, ['password_md5'], '')
  if (oldPasswordMd5 !== userPasswordMd5) {
    res.send(API_RES.showError('密码不正确, 请确认密码'))
    return
  }

  const newPasswordMd5 = MUser.hash(password)
  let updateData = {
    password_md5: newPasswordMd5
  }
  const isSuccess = await MUser.update(ucid, updateData)
  if (isSuccess) {
    res.send(API_RES.showResult([], '密码修改成功'))
  } else {
    res.send(API_RES.showError('密码修改失败'))
  }
}, false)

const modifyMsg = RouterConfigBuilder.routerConfigBuilder('/api/user/modify/msg', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const body = _.get(req, ['body'], {})
  const ucid = _.get(req, ['fee', 'user', 'ucid'], 0)
  const nickname = _.get(body, ['nickname'], '')

  const rawUser = await MUser.get(ucid)
  if (_.isEmpty(rawUser) || rawUser.is_delete === 1) {
    res.send(API_RES.showError('用户不存在'))
    return
  }

  let updateData = {
    nickname
  }
  let isSuccess = await MUser.update(ucid, updateData)
  if (isSuccess) {
    res.send(API_RES.showResult([], '信息修改成功'))
  } else {
    res.send(API_RES.showError('信息修改失败'))
  }
}, false)

const destroyAccount = RouterConfigBuilder.routerConfigBuilder('/api/user/destroy', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const ucid = _.get(req, ['fee', 'user', 'ucid'], 0)
  const rawUser = MUser.get(ucid)

  if (_.isEmpty(rawUser) === false || rawUser.is_delete === 1) {
    res.send(API_RES.showError('用户不存在'))
    return
  }
  let updateData = {
    is_delete: 1
  }
  const isSuccess = await MUser.update(ucid, updateData)
  if (isSuccess) {
    res.clearCookie('fee_token')
    res.clearCookie('ucid')
    res.clearCookie('nickname')
    res.clearCookie('account')
    res.send(API_RES.showResult([], '注销成功'))
  } else {
    res.send(API_RES.showError('注销失败'))
  }
}, false)

export default {
  ...detail,
  ...search,
  ...update,
  ...deleteRecord,
  ...searchUC,
  ...register,
  ...modifyPassword,
  ...modifyMsg,
  ...destroyAccount
}
