import Joi from 'joi'
import moment from 'moment'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constants/date_format'
import Logger from '~/src/library/logger'

class BaseValidate {
  static get typeSchema () {
    return [
      'error', // 技术打点数据
      'product', // 产品打点数据
      'perf', // 性能打点数据
      'info' // 自定义打点数据
    ]
  }

  static get codeSchema () {
    return Joi.number().integer().min(0).required()
  }

  static get detailSchema () {
    return Joi.object()
  }

  static getValidateSchema (record) {
    // let isNewRecordVersion = (_.has(record, ['common', 'record']) === true)
    let isNewRecordVersion = (_.has(record, ['common', 'sdk_version']) === true)

    let newCommonSchema = Joi.object({
      'pid': Joi.string().required(), // 系统pid
      'uuid': Joi.string().allow('').required(), // 唯一设备id
      'ucid': Joi.number().integer().required(), // 唯一用户id
      'is_test': Joi.boolean(), // 是否是测试日志
      // 'record': Joi.object(), // 配置详情
      'version': Joi.string().allow('').required(), // 用户系统版本号
      'timestamp': Joi.number().integer(), // 用户系统毫秒级时间戳, 不需要考虑(用户系统时间不能保证正确性)
      'runtime_version': Joi.string().allow('').required(), // 用户系统版本号 -- 和version相同
      'sdk_version': Joi.string().required(), // sdk版本号
      'page_type': Joi.string().allow('').required()
    })
    let oldCommonSchema = Joi.object({
      'pid': Joi.string().required(), // 系统pid
      'uuid': Joi.string().allow(''), // 唯一设备id
      'ucid': Joi.number().integer().required(), // 唯一用户id
      'timestamp': Joi.number().integer(), // 用户系统毫秒级时间戳, 不需要考虑(用户系统时间不能保证正确性)
      'test': Joi.boolean(), // 是否是测试日志
      'version': Joi.string().allow(''), // sdk版本号
      'performance': Joi.boolean(),
      'jserror': Joi.boolean(),
      'online': Joi.boolean()
    })
    let commonSchema = isNewRecordVersion ? newCommonSchema : oldCommonSchema

    let nowAt = moment().unix()
    let minTimeStamp = nowAt - 86400 * 7
    let maxTimeStamp = nowAt + 86400 * 7
    let schema = Joi.object(
      {
        type: this.typeSchema,
        // code 范围(通过type + code确认具体参数格式) =>
        // 1~9999 技术
        // 10000~19999产品
        // 20000~29999 性能
        // 30000~39999 自定义
        // 已使用值:
        // error =>
        // 1/2/3/4/5/6/7/8 (目前error作为整体使用, 未区分错误类型)
        // product =>
        // 10001, 用户在线时长
        // 10002, 用户点击埋点
        // perf =>
        // 20001, 性能指标打点
        code: this.codeSchema,
        detail: this.detailSchema,
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
   * @return {Boolean}
   */
  static isLegal (record) {
    let validateSchema = this.getValidateSchema(record)
    let checkResult = Joi.validate(record, validateSchema)
    if (_.isEmpty(checkResult.error) === false) {
      // this.log('校验失败, 错误原因=>', _.get(checkResult, ['error', 'details'], ''))
      return false
    }
    if (this.checkLogicLegal(record) === false) {
      // this.log('校验失败, 记录值不合法')
      return false
    }
    return true
  }

  /**
   * 检测记录在具体值的逻辑上是否合法
   * @param {*} record
   * @param {*} returnMessageReplace 返回具体的错误信息, 而不是ture/false
   */
  static checkLogicLegal (record, returnMessageReplace = false) {
    return true
  }

  /**
   * 获取校验信息
   * @param {*} record
   */
  static getValidateMassage (record) {
    if (this.checkLogicLegal(record) === false) {
      let message = this.checkLogicLegal(record, true)
      return message
    }
    let validateSchema = this.getValidateSchema(record)
    let checkResult = Joi.validate(record, validateSchema)
    let message = _.get(checkResult, ['error', 'details'], '')
    return JSON.stringify(message)
  }

  /**
   * 简易logger
   * @returns  null
   */
  static log () {
    let message = ''
    for (let rawMessage of arguments) {
      if (_.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage)
      } else {
        message = message + rawMessage
      }
    }
    let triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
    // console.log(`[${triggerAt}]-[${this.name}] ` + message)
    let logger = Logger.getLogger4Command(this.name)
    logger.info(message)
  }
}

export default BaseValidate
