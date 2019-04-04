import Base from '~/src/commands/base'
import http from '~/src/library/http'
import ucConfig from '~/src/configs/user_center'
import moment from 'moment'
import UC from '~/src/library/uc'

class CommandTest extends Base {
  static get signature () {
    return `
     Utils:TestUC
     `
  }

  static get description () {
    return `测试UC接口`
  }

  async execute (args, options) {
    this.log('开始')
    const appId = ucConfig.appID
    const key = ucConfig.appkey
    const api = ucConfig.api
    const ts = moment().unix() * 1000
    let queryData = {
      query: 'han'
    }
    let headers = {
      appId,
      ts
    }
    const sign = UC.getSign(queryData, headers, key)
    headers['sign'] = sign
    let res = await http.get(api + '/sug/user', { params: queryData, headers })
    this.log(res.data, '================res')
    this.log('结束')
  }
}

export default CommandTest
