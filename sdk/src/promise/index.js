import { customerErrorCheck, _ } from '../utils'

export default {
  init (cb) {
    const me = this
    window.addEventListener('unhandledrejection', function (event) {
      // reason可能是正常的字符串, 也可能会有message和stack信息
      // 如果有的话, 就抓一下
      let promiseErrorInfo = ''
      let reason = ''
      try {
        promiseErrorInfo = JSON.stringify(_.get(event, ['promise'], ''))
        reason = JSON.stringify(_.get(event, ['reason'], ''))
      } catch (e) {
        console.log('promise stringify出错===>' + e)
        promiseErrorInfo = _.get(event, ['promise'], '') + '' // 稳稳的 [object Promise]
        reason = _.get(event, ['reason'], '') + ''
      }
      let message = _.get(event, ['reason', 'message'], '')
      let stack = _.get(event, ['reason', 'stack'], '')
      let desc = `Unhandled_Rejection:` + promiseErrorInfo
      // 这里也去调用
      if (desc && stack) {
        const isNeedReport = customerErrorCheck(me.config, desc, stack, me.debugLogger.bind(me))
        if (!!isNeedReport === false) {
          me.debugLogger(`config.record.js_error_report_config.checkErrorNeedReport返回值为false, 跳过此类错误, 页面报错信息为=>`, {
            desc,
            stack
          })
          return
        }
      }
      let url = location.href
      cb && cb.call(me, `JS错误_Unhandled_Rejection`, url, {
        desc,
        reason,
        message,
        stack
      })
    }, true)
  }
}
