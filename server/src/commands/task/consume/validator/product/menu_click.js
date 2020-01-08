import Joi from 'joi'
import BaseValidate from '~/src/commands/task/consume/validator/base_validate'

class MenuClickValidate extends BaseValidate {
  static get typeSchema () {
    return 'product'
  }

  static get codeSchema () {
    return 10002
  }

  static get detailSchema () {
    return Joi.object({
      name: Joi.string().allow('').required(),
      code: Joi.string().allow('').required(),
      url: Joi.string().allow('').required()
    })
  }
}

export default MenuClickValidate
