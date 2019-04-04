import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import Auth from '~/src/library/auth'
import MUser from '~/src/model/project/user'
import http from '~/src/library/http'
import ucConfig from '~/src/configs/user_center'
import Logger from '~/src/library/logger'
import moment from 'moment'
import UC from '~/src/library/uc'
import commonConfig from '~/src/configs/common'

const LOGIN_TYPE = _.get(commonConfig, ['loginType'], 'normal')
let siteLogin = RouterConfigBuilder.routerConfigBuilder('/api/login/site', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let user = {}
  let token = Auth.generateToken(user.ucid, user.name, user.account)
  res.cookie('fee_token', token, { maxAge: 100 * 86400 * 1000, httpOnly: false })
  res.cookie('ucid', user.ucid, { maxAge: 100 * 86400 * 1000, httpOnly: false })
  res.cookie('name', user.name, { maxAge: 100 * 86400 * 1000, httpOnly: false })
  res.cookie('account', user.account, { maxAge: 100 * 86400 * 1000, httpOnly: false })
  res.send(API_RES.showResult({ ucid: user.ucid, name: user.name, account: user.account }))
},
false,
false
)

let ucLogin = RouterConfigBuilder.routerConfigBuilder('/api/login/uc', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  await handleUCLogin(req, res)
},
false,
false
)

let normalLogin = RouterConfigBuilder.routerConfigBuilder('/api/login/normal', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  await handleNormalLogin(req, res)
}, false, false)

let getLoginType = RouterConfigBuilder.routerConfigBuilder('/api/login/type', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  res.send(API_RES.showResult(LOGIN_TYPE))
}, false, false)

let login = RouterConfigBuilder.routerConfigBuilder('/api/login', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  switch (LOGIN_TYPE) {
    case 'uc':
      await handleUCLogin(req, res)
      break
    case 'normal':
      await handleNormalLogin(req, res)
      break
    default:
      res.send(API_RES.showError('请确认登录方式'))
  }
}, false, false)

let logout = RouterConfigBuilder.routerConfigBuilder('/api/logout', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  res.clearCookie('fee_token')
  res.clearCookie('ucid')
  res.clearCookie('nickname')
  res.clearCookie('account')
  res.send(API_RES.showResult({}))
},
false,
false
)
const handleNormalLogin = async (req, res) => {
  const body = _.get(req, ['body'], {})
  const account = _.get(body, ['account'], '')
  const password = _.get(body, ['password'], '')

  const rawUser = await MUser.getSiteUserByAccount(account)
  if (_.isEmpty(rawUser) || rawUser.is_delete === 1) {
    res.send(API_RES.showError('未注册'))
    return
  }
  const savePassword = _.get(rawUser, ['password_md5'], '')
  const passwordMd5 = MUser.hash(password)
  if (savePassword === passwordMd5) {
    let nickname = _.get(rawUser, ['nickname'], '')
    let ucid = _.get(rawUser, ['ucid'], '')
    let avatarUrl = _.get(rawUser, ['avatar_url'], MUser.DEFAULT_AVATAR_URL)
    let registerType = _.get(rawUser, ['register_type'], MUser.REGISTER_TYPE_SITE)
    let token = Auth.generateToken(ucid, account, nickname)

    res.cookie('fee_token', token, { maxAge: 100 * 86400 * 1000, httpOnly: false })
    res.cookie('ucid', ucid, { maxAge: 100 * 86400 * 1000, httpOnly: false })
    res.cookie('nickname', nickname, { maxAge: 100 * 86400 * 1000, httpOnly: false })
    res.cookie('account', account, { maxAge: 100 * 86400 * 1000, httpOnly: false })
    res.send(API_RES.showResult({ ucid, nickname, account, avatarUrl, registerType }))
  } else {
    res.send(API_RES.showError('密码错误'))
  }
}
const handleUCLogin = async (req, res) => {
  let { account, password } = req.body
  let ts = moment().unix() * 1000
  const appId = ucConfig.appID
  const appkey = ucConfig.appkey
  let formData = {
    cid: appId,
    un: account,
    pw: password
  }
  let headers = {
    ts,
    appId
  }
  let sign = await UC.getSign(formData, headers, appkey)
  headers.sign = sign
  let loginResponse = await http.postForm(ucConfig.api + '/security/login', formData, {
    headers
  }).catch(err => {
    Logger.warn('登录接口响应异常 err =>', _.get(err, ['response', 'data'], {}))
    return _.set(
      {},
      ['data', 'msg'],
      _.get(err, ['response', 'data'], {})
    )
  })
  let ucid = _.get(loginResponse, ['data', 'data', 'uid'], 0)
  let LoginErrorResponse = _.get(loginResponse, ['data', 'msg'], '登录失败')
  if (ucid === 0) {
    if (LoginErrorResponse === 'USER_NOT_EXIST') {
      LoginErrorResponse = '用户名不存在'
    } else {
      if (LoginErrorResponse === 'PWD_INCORRECT') {
        LoginErrorResponse = '密码错误'
      }
    }
    res.send(API_RES.showError(LoginErrorResponse, 10001))
    return
  }
  ts = moment().unix() * 1000
  const params = {
    ids: ucid
  }
  headers = {
    ts,
    appId
  }
  sign = UC.getSign(params, headers, appkey)
  headers.sign = sign
  let userInfoResponse = await http.get(ucConfig.api + '/ehr/user/agent', {
    params,
    headers
  }).catch(err => {
    Logger.warn('用户信息接口响应异常 err =>', _.get(err, ['response', 'data'], {}))
    return _.set(
      {},
      ['data', 'msg'],
      _.get(err, ['response', 'data'], {})
    )
  })
  let userInfo = _.get(userInfoResponse, ['data', 'data', 0], {})
  let userInfoError = _.get(userInfoResponse, ['data'], {})
  if (_.isEmpty(userInfo)) {
    res.send(API_RES.showError('用户信息获取失败, 请稍后再试', 10002, { userInfoError, ucid: ucid }))
    return
  }
  // 从登录结果中提取数据
  let mobile = _.get(userInfo, ['mobile'], '') // 手机号
  let nickname = _.get(userInfo, ['name'], '') // 昵称
  let email = _.get(userInfo, ['email'], `${account}@qq.com`) // 邮箱
  let avatarUrl = _.get(userInfo, ['avatar'], MUser.DEFAULT_AVATAR_URL) // 头像

  // 避免null值
  if (_.isNil(mobile)) {
    mobile = ''
  }
  if (_.isNil(nickname)) {
    nickname = ''
  }
  if (_.isNil(email)) {
    email = `${account}@qq.com`
  }
  if (_.isNil(avatarUrl)) {
    avatarUrl = MUser.DEFAULT_AVATAR_URL
  }

  let user = await MUser.getByAccount(account)
  if (_.isEmpty(user) === true || user.is_delete === 1) {
    // 首次登录, 自动在系统中进行注册
    let isRegisterSuccess = await MUser.register(account, {
      account,
      mobile,
      ucid,
      nickname,
      email,
      avatarUrl
    })
    if (isRegisterSuccess === false) {
      res.send(API_RES.showError('uc登录失败, 请稍后再试'))
      return
    }
    user = await MUser.getByAccount(account)
  }

  account = _.get(user, ['account'], '')
  nickname = _.get(user, ['nickname'], '')
  ucid = _.get(user, ['ucid'], '')
  avatarUrl = _.get(user, ['avatar_url'], MUser.DEFAULT_AVATAR_URL)
  let registerType = _.get(user, ['register_type'], MUser.REGISTER_TYPE_SITE)
  let token = Auth.generateToken(ucid, account, nickname)
  res.cookie('fee_token', token, { maxAge: 100 * 86400 * 1000, httpOnly: false })
  res.cookie('ucid', ucid, { maxAge: 100 * 86400 * 1000, httpOnly: false })
  res.cookie('nickname', nickname, { maxAge: 100 * 86400 * 1000, httpOnly: false })
  res.cookie('account', account, { maxAge: 100 * 86400 * 1000, httpOnly: false })
  res.send(API_RES.showResult({ ucid, nickname, account, avatarUrl, registerType }))
}

export default {
  ...siteLogin,
  ...ucLogin,
  ...logout,
  ...normalLogin,
  ...getLoginType,
  ...login
}
