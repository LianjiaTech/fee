import _ from 'lodash'
import Joi from 'joi'
import BaseValidate from '~/src/commands/task/consume/validator/base_validate'

const MAX_INTERVAL_MS = 10 * 1000 // 间隔时间不能超过15分钟
const MIN_INTERVAL_MS = 0 // 间隔时间不能小于0

class PerformanceValidate extends BaseValidate {
  static get typeSchema () {
    return 'perf'
  }

  static get codeSchema () {
    return 20001
  }

  static get detailSchema () {
    return Joi.object()
      // 存在一个 url key
      .keys({ 'url': Joi.string().allow('').required() })
      // 其余 key 都是 performance api里的值, value一定是数字(毫秒数)
      .pattern(/\w+/, Joi.number().integer().min(0))
  }

  static checkLogicLegal (record, returnMessageReplace = false) {
    let detail = _.get(record, ['detail'], {})

    // 部分iOS浏览器上有bug, responseEnd小于responseStart, 因此入库前需要手工校验下

    // 顺序依次递增, 可能由于浏览器性能优化会有例外, 直接忽略这部分数据 参考 =>
    // https://groups.google.com/a/chromium.org/forum/#!topic/chromium-dev/Q3fYD9VZIdo
    let inditorList = [
      'fetchStart',
      'domainLookupStart',
      'domainLookupEnd',
      'connectStart',
      'connectEnd',
      'requestStart',
      'responseStart',
      'responseEnd',
      'domInteractive',
      'domContentLoadedEventEnd'
    ]

    for (let index = 0; index < inditorList.length - 1; index++) {
      let firstIndicator = inditorList[index]
      let nextIndicator = inditorList[index + 1]
      let errorTip = ''
      // 是否是数字
      if (_.isNumber(detail[firstIndicator]) === false) {
        errorTip = `校验失败: detail.${firstIndicator} 不是数字, 原值: ${detail[firstIndicator]}`
      }
      if (_.isNumber(detail[nextIndicator]) === false) {
        errorTip = `校验失败: detail.${firstIndicator} 不是数字, 原值: ${detail[firstIndicator]}`
      }

      // 是否大于0(应为毫秒级时间戳)
      if (detail[firstIndicator] <= 0) {
        errorTip = `校验失败: detail.${firstIndicator} 不能小于等于0, 原值: ${detail[firstIndicator]}`
      }
      if (detail[nextIndicator] <= 0) {
        errorTip = `校验失败: detail.${nextIndicator} 不能小于等于0, 原值: ${detail[nextIndicator]}`
      }

      // 不能超过15分钟
      if ((detail[nextIndicator] - detail[firstIndicator]) > MAX_INTERVAL_MS) {
        errorTip = `校验失败, detail.${nextIndicator}和detail.${firstIndicator}间隔超过${MAX_INTERVAL_MS / 1000}s, 原值: detail.${firstIndicator}: ${detail[firstIndicator]}, detail.${nextIndicator}: ${detail[nextIndicator]}`
      }

      if ((detail[nextIndicator] - detail[firstIndicator]) < MIN_INTERVAL_MS) {
        errorTip = `校验失败, detail.${nextIndicator}和detail.${firstIndicator}间隔小于${MIN_INTERVAL_MS / 1000}s, 原值: detail.${firstIndicator}: ${detail[firstIndicator]}, detail.${nextIndicator}: ${detail[nextIndicator]}`
      }

      if (errorTip !== '') {
        // this.log(errorTip)
        if (returnMessageReplace) {
          return errorTip
        } else {
          return false
        }
      }
    }
    return true
  }
}

export default PerformanceValidate
