import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import Auth from '~/src/library/auth'
import MUser from '~/src/model/project/user'
import UCommon from '~/src/library/utils/modules/util'

let normalLogin = RouterConfigBuilder.routerConfigBuilder(
  '/api/login/normal',
  RouterConfigBuilder.METHOD_TYPE_POST,
  async (req, res) => {
    const body = _.get(req, ['body'], {})
    const account = _.get(body, ['account'], '')
    const password = UCommon.decrypt(_.get(body, ['password'], ''))
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
      let registerType = _.get(
        rawUser,
        ['register_type'],
        MUser.REGISTER_TYPE_SITE
      )
      let token = Auth.generateToken(ucid, account, nickname)
      res.cookie('fee_token', token, {
        maxAge: 100 * 86400 * 1000,
        httpOnly: false
      })
      res.cookie('ucid', ucid, { maxAge: 100 * 86400 * 1000, httpOnly: false })
      res.cookie('nickname', nickname, {
        maxAge: 100 * 86400 * 1000,
        httpOnly: false
      })
      res.cookie('account', account, {
        maxAge: 100 * 86400 * 1000,
        httpOnly: false
      })
      res.send(
        API_RES.showResult({ ucid, nickname, account, avatarUrl, registerType })
      )
    } else {
      res.send(API_RES.showError('密码错误'))
    }
  },
  false,
  false
)

let logout = RouterConfigBuilder.routerConfigBuilder(
  '/api/logout',
  RouterConfigBuilder.METHOD_TYPE_GET,
  async (req, res) => {
    res.clearCookie('fee_token')
    res.clearCookie('ucid')
    res.clearCookie('nickname')
    res.clearCookie('account')
    res.send(API_RES.showResult({}))
  },
  false,
  false
)

export default {
  ...logout,
  ...normalLogin
}
