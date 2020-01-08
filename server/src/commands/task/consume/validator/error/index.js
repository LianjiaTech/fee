import Joi from 'joi'
import BaseValidate from '~/src/commands/task/consume/validator/base_validate'

class ErrorValidate extends BaseValidate {
  static get typeSchema () {
    return 'error'
  }

  static get codeSchema () {
    // 目前并不区分具体数字
    return Joi.number().integer().min(0)
  }

  static get detailSchema () {
    return Joi.object()
      .keys({
        'error_no': Joi.string().allow('').required(),
        'url': Joi.string().allow('').required(),
        // 下边的参数需要预处理
        'http_code': Joi.number().integer().min(0).max(1000),
        'during_ms': Joi.number().integer().min(0),
        'request_size_b': Joi.number().integer().min(0),
        'response_size_b': Joi.number().integer().min(0)
      })
  }
}

export default ErrorValidate
