import _ from 'lodash'
import Joi from 'joi'
import BaseValidate from '~/src/commands/task/consume/validator/base_validate'

const MaxAllowRecordDuringMs = 7200000 // 用户停留时长不能超过两小时(避免作弊)
const MinAllowRecordDuringMs = 0 // 用户停留时长不能小于0

class TimeOnSiteValidate extends BaseValidate {
  static get typeSchema () {
    return 'product'
  }

  static get codeSchema () {
    return 10001
  }

  static get detailSchema () {
    return Joi.object({
      duration_ms: Joi.number().integer().min(0).max(7200000).required() // 用户停留时长不能大于2小时
    })
  }

  static checkLogicLegal (record, returnMessageReplace = false) {
    let detail = _.get(record, ['detail'], {})
    let durationMs = _.get(detail, ['duration_ms'], '')
    let errorTip = ''
    if (_.isNumber(durationMs) === false) {
      errorTip = '记录不合法: duration_ms未设置'
    }
    if (durationMs > MaxAllowRecordDuringMs) {
      errorTip = `记录不合法: duration_ms:${durationMs}超过${MaxAllowRecordDuringMs}`
    }
    if (durationMs < MinAllowRecordDuringMs) {
      errorTip = `记录不合法: duration_ms:${durationMs}小于${MinAllowRecordDuringMs}`
    }
    if (errorTip === '') {
      return true
    }

    if (returnMessageReplace) {
      return errorTip
    }
    return false
  }
}

export default TimeOnSiteValidate
