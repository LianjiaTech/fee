import Joi from 'joi'
import _ from 'lodash'
import moment from 'moment'
import BaseValidate from '~/src/commands/task/consume/validator/base_validate'

class EventValidate extends BaseValidate {
  static get typeSchema () {
    return 'event'
  }

  static get nameSchema() { 
    return Joi.string().required()
  }

  static get propsSchema() {
    let propsConfig = this.propsConfig

    let keys = Object.keys(propsConfig)
    let schema = keys.reduce((pre, cur) => { 
      switch (propsConfig[cur]) { 
        case 'string':
          pre[cur] = Joi.string().allow('').required()
          break
        case 'number':
          pre[cur] = Joi.number().required()
          break
        case 'boolean':
          pre[cur] = Joi.boolean().required()
          break
        default:
          pre[cur] = Joi.string().allow('').required()
          break
      }
      return pre
    }, Object.create(null))
    return Joi.object().keys(schema)
  }

  static getValidateSchema (record) {
    let commonSchema = Joi.object({
      'pid': Joi.string().required(), // 系统pid
      'uuid': Joi.string().allow('').required(), // 唯一设备id
      'ucid': Joi.number().integer().required(), // 唯一用户id
      'is_test': Joi.boolean(), // 是否是测试日志
      'record': Joi.object(), // 配置详情
      'version': Joi.string().allow('').required(), // 用户系统版本号
      'timestamp': Joi.number().integer(), // 用户系统毫秒级时间戳, 不需要考虑(用户系统时间不能保证正确性)
      'runtime_version': Joi.string().allow('').required(), // 用户系统版本号 -- 和version相同
      'sdk_version': Joi.string().required(), // sdk版本号
      'page_type': Joi.string().allow('').required()
    })

    let nowAt = moment().unix()
    let minTimeStamp = nowAt - 86400 * 7
    let maxTimeStamp = nowAt + 86400 * 7
    let schema = Joi.object(
      {
        type: this.typeSchema,
        name: this.nameSchema,
        props: {
          [this.eventName]: this.propsSchema
        },
        // extra中的信息应该使用json编码后再存入(避免不同项目的schema不一致, 例如, a项目user:{ucid:123456}, b项目user:'123456')
        extra: Joi.string().required(),
        // commom存在两版配置
        common: commonSchema,
        // md5校验值为系统主动加入
        md5: Joi.string().length(32).required(),
        // 项目信息由common中的配置信息解析而出, 因此一定会有
        project_id: Joi.number().integer().min(1).required(),
        project_name: Joi.string().allow('').required(),
        // 时间使用接收到日志的时间, 因此一定会有
        time: Joi.number().integer().min(minTimeStamp).max(maxTimeStamp).required(), // 时间必须位于当前时间前后一周之内
        time_ms: Joi.number().integer().min(minTimeStamp * 1000).max(maxTimeStamp * 1000).required(), // 毫秒级时间戳, 时间必须位于当前时间前后一周之内
        ua: Joi.object(), // ua 为解析出来的字段, 也可能没有ua(用户主动触发埋点)
        ip: Joi.string().ip().required(), // ip字段必须要有
        // 国-省-市 三个字段有可能解析不出来, 但是一定要有
        country: Joi.string().allow('').required(),
        province: Joi.string().allow('').required(),
        city: Joi.string().allow('').required()
      }
    )
    return schema
  }

  /**
   * 判断该条记录是否合法
   * @param {Object} record
   * @param {Object} projectDotMap
   * @return {Boolean}
   */
  static isLegal(record, propsConfig, eventName) {
    this.propsConfig = propsConfig
    this.eventName = eventName

    let validateSchema = this.getValidateSchema(record)
    let checkResult = Joi.validate(record, validateSchema)

    if (_.isEmpty(checkResult.error) === false) {
      this.log('校验失败, 错误原因=>', _.get(checkResult, ['error', 'details'], ''))
      return false
    }
    return true
  }
}

export default EventValidate