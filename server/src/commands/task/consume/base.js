import fs from 'fs'
import md5 from 'md5'
import _ from 'lodash'
import path from 'path'
import moment from 'moment'
import shell from 'shelljs'
import parser from 'ua-parser-js'
import queryString from 'query-string'

import LKafka from '~/src/library/kafka'
import Util from '~/src/library/utils/modules/util'
import { Rules } from '~/src/constants/rules.js'

import ErrorLogValidator from '~/src/commands/task/consume/validator/error/index'
import PerfLogValidator from '~/src/commands/task/consume/validator/perf/index'
import EventValidator from '~/src/commands/task/consume/validator/event/index'
import MenuClickLogValidator from '~/src/commands/task/consume/validator/product/menu_click'
import TimeOnSiteLogValidator from '~/src/commands/task/consume/validator/product/time_on_site'

import ESRawRecord from '~/src/model/elastic_search/parse/raw_record'
import ESDotRecord from '~/src/model/elastic_search/dot/event'

const TEST_LOG_FLAG = 'b47ca710747e96f1c523ebab8022c19e9abaa56b'
const RANDOM = _.random(10000)
const DOT_LOG = 'DOT'
const RAW_LOG = 'RAW'

class SaveLogBase {
  constructor (log) {
    this.projectMap = {}
    this.projectDotMap = {}
    this.eventName = ''
    this.propsConfig = {}
    this.logCounter = 0
    this.legalLogCounter = 0
    this.failedCounter = 0
    this.testLogCounter = 0
    this.dataCache = new Map()
    this.rawList = []
    this.dotList = []
    this.log = log
  }

  init (projectMap, projectDotMap) {
    // 挂载在this中, 供全局使用
    this.projectMap = projectMap
    this.projectDotMap = projectDotMap
  }
  /**
   * 将日志解析后落在磁盘上
   * @param {*} content
   */
  async save2Disk (data = []) {
    let content = ''
    let record = ''
    let projectName = ''
    let projectRate = 100
    let skipIt = false

    let dataType = ''
    let parseResult = {}
    let logCreateAt = null
    let isDotEventRecord = false
    for (let item of data) {
      this.logCounter++
      content = _.get(item, ['value'], '').toString()

      // 获取日志时间, 没有原始日志时间则直接跳过
      logCreateAt = this.parseLogCreateAt(content)

      if (_.isFinite(logCreateAt) === false || logCreateAt <= 0) {
        record = this.getFaildRecord(`${logCreateAt} 日志时间不合法，自动跳过`, content)
        this.writeLine2FileSync(record, logCreateAt, LKafka.LOG_TYPE_TEST)
        continue
      }

      // 首先判断是不是测试数据, 如果是测试数据, 直接保存, 跳过后续所有逻辑
      if (this.isTestLog(content)) {
        this.testLogCounter++
        this.writeLine2FileSync(content, logCreateAt, LKafka.LOG_TYPE_TEST)
        continue
      }

      // 检查日志格式, 只录入解析后, 符合规则的log
      let { error: parseLogError, data: rawParseResult } = await this.parseLog(content, this.projectMap)
      if (parseLogError) {
        record = this.getFaildRecord(parseLogError, content)
        this.writeLine2FileSync(record, logCreateAt, LKafka.LOG_TYPE_FAILED)
        continue
      }

      dataType = _.get(rawParseResult, ['type'], '')
      isDotEventRecord = dataType === 'event'

      // 对【打点类型】的数据(type="event")的数据单独处理
      // 格式化一遍, 确保所有字段类型都是稳定的
      parseResult = isDotEventRecord ? this.formatForDotData(rawParseResult) : this.format(rawParseResult)

      const { error: legalError } = this.isParseResultLegal(parseResult)

      if (legalError) {
        // 这里记录位failed日志
        record = this.getFaildRecord(legalError, content)
        this.writeLine2FileSync(record, logCreateAt, LKafka.LOG_TYPE_FAILED)
        continue
      }

      projectName = _.get(parseResult, ['project_name'], 0)
      projectRate = _.get(this.projectMap, [projectName, 'rate'], 100)
      skipIt = RANDOM > projectRate

      if (!isDotEventRecord && skipIt) {
        // 根据项目抽样比率，过滤打点数据，如果没有命中，直接返回
        // 这里也认为是failed写入失败的日志
        record = this.getFaildRecord('未命中抽样比, 自动跳过', content)
        this.writeLine2FileSync(record, logCreateAt, LKafka.LOG_TYPE_FAILED)
        continue
      }

      this.legalLogCounter++
      isDotEventRecord ? this.dotList.push(parseResult) : this.rawList.push(parseResult)
      continue
    }
    // 打点数据没有实时性要求，可以设置大一些也没问题
    if (this.dotList.length > 1000) {
      await this.save2DB(this.dotList, DOT_LOG)
      this.dotList = []
    }
    // 其他数据有实时性要求，所以尽量不要改动
    if (this.rawList.length > 1000) {
      await this.save2DB(this.rawList, RAW_LOG)
      this.rawList = []
    }
    return Promise.resolve(true)
  }

  async save2DB (rawList, type) {
    let totalRecordCount = rawList.length
    let processRecordCount = 0
    let successSaveCount = 0
    let nowAt = moment().unix()
    let cacheList = []
    let maxCacheItem = 5000
    let batchCounter = 0
    this.log(`共${totalRecordCount}条数据，分${Math.ceil(totalRecordCount / maxCacheItem)}批导入!`)
    // 区分打点数据和其他数据
    let Model = type === DOT_LOG ? ESDotRecord : ESRawRecord
    let insertTime = Math.ceil(totalRecordCount / maxCacheItem)

    for (let i = 0; i < insertTime; i++) {
      batchCounter = i + 1
      cacheList = rawList.splice(0, maxCacheItem)
      this.log(`开始导入第${batchCounter}批数据, 预计导入${cacheList.length}条`)
      let { errMsg, totalCount, failedCount, errorRecordList } = await Model.asyncBatchImport(cacheList)
      if (errMsg) throw new Error(errMsg)
      successSaveCount = successSaveCount + (totalCount - failedCount)
      this.log(`第${batchCounter}批数据导入完毕, 实际尝试导入${totalCount}条, 导入成功${totalCount - failedCount}条`)
      if (failedCount > 0) {
        for (let record of errorRecordList) {
          this.writeLine2FileSync(JSON.stringify(record), nowAt, LKafka.LOG_TYPE_RAW)
        }
        this.log(`导入失败原因 =>`, errorRecordList.length)
      }
      cacheList.length = 0
    }
    return { totalRecordCount, processRecordCount, successSaveCount }
  }

  /**
   * 记录错误的日志
   * @param error
   * @param content
   * @param logCreateAt
   */
  getFaildRecord (error, content) {
    this.failedCounter++
    const record = JSON.stringify({ error, data: content })
    return record
  }

  // 检测测试数据
  isTestLog (content) {
    return content.includes(TEST_LOG_FLAG)
  }

  /**
   * 同步向文件中写入一行(自动补换行符)
   * @param content
   * @param nowAt
   * @param logType
   * @returns {any}
   */
  writeLine2FileSync (content, nowAt, logType = LKafka.LOG_TYPE_RAW) {
    // 确保logType一定是指定类型
    switch (logType) {
      case LKafka.LOG_TYPE_RAW:
        break
      case LKafka.LOG_TYPE_JSON:
        break
      case LKafka.LOG_TYPE_TEST:
        break
      case LKafka.LOG_TYPE_FAILED:
        break
      case LKafka.LOG_TYPE_FLAG:
        break
      default:
        logType = LKafka.LOG_TYPE_RAW
    }
    let nowAtLogUri = LKafka.getAbsoluteLogUriByType(nowAt, logType)
    // 创建对应路径
    let logPath = path.dirname(nowAtLogUri)
    try {
      shell.mkdir('-p', logPath)
    } catch (error) {
      this.log(`shell mkdir 报错 ==> ${error.message}`)
    }
    fs.writeFileSync(nowAtLogUri, content + '\n', {flag: 'a'})
  }

  /**
   * 解析日志记录所在的时间戳, 取日志时间作为时间戳, 若日志时间不规范, 则返回0
   * 客户端时间不可信, 故直接忽略, 以日志时间为准
   * @param {String} data
   * @return {Number}
   */
  parseLogCreateAt (data) {
    let nowAt = moment().unix()
    if (_.isString(data) === false) {
      return nowAt
    }
    const info = data.split('\t')
    let url = _.get(info, [15], '')

    const urlQS = queryString.parseUrl(url)
    let record = _.get(urlQS, ['query', 'd'], '[]')

    try {
      record = JSON.parse(record)
    } catch (err) {
      return nowAt
    }
    if (_.has(record, ['pub'])) {
      // common是新sdk的字段值, pub是旧值, 这里做下兼容
      record.common = record.pub
    }

    let logAtMoment = moment(info[0], moment.ISO_8601)
    let logAt = 0
    if (moment.isMoment(logAtMoment) && logAtMoment.isValid()) {
      logAt = logAtMoment.unix()
    } else {
      // this.log(`无法解析日志记录时间 => ${info[0]}, 自动跳过`)
    }
    return logAt
  }

  /**
   * 将日志解析为标准格式, 解析失败返回null
   * @param {string} data
   * @param {object} projectMap code => project_id格式的项目字典
   * @returns {object|null}
   */
  async parseLog (data, projectMap) {
    const info = data.split('\t')
    let url = _.get(info, [15], '')

    const urlQS = queryString.parseUrl(url)
    let record = _.get(urlQS, ['query', 'd'], '[]')

    try {
      record = JSON.parse(record)
    } catch (err) {
      // this.log('==== 打点数据异常 ====', err)
      return {error: '无法转化为json'}
    }

    // 记录日志md5
    record.md5 = md5(data)
    if (_.has(record, ['pub'])) {
      // common是新sdk的字段值, pub是旧值, 这里做下兼容
      record.common = record.pub
    }
    //  过滤不合法的打点数据
    //  记录为空, 没有pid, pid没有注册过, 都是非法数据
    if (_.isEmpty(record)) {
      return {error: 'record isEmpty'}
    }
    if (_.has(record, ['common', 'pid']) === false) {
      return {error: 'pid 不存在'}
    }
    if (record.common.pid === '') {
      return {error: '记录中没有record.common.pid'}
    }
    if (_.has(projectMap, [record.common.pid]) === false) {
      return {error: `项目尚未注册projectMap ${record.common.pid}`}
    }

    record.project_id = projectMap[record.common.pid]['id']
    record.project_name = record.common.pid
    let currentAt = moment().unix()
    let logCreateAt = this.parseLogCreateAt(data)
    // 如果入库时间距离现在大于10天, 则认为是不合法数据(kafka中只会存7天以内的数据, 入库时间超出上下10天, 都不正常)
    if (Math.abs(logCreateAt - currentAt) > 864000) {
      return {error: `入库时间超出阈值, 自动跳过 ${logCreateAt}`}
    }
    record.time = logCreateAt
    record.time_ms = logCreateAt * 1000 // 记录毫秒级时间戳, 方便在ES中使用

    // 新版中info[17] 里有%号, 是非法字符, 需要提前处理
    let safeInfo17 = _.replace(info[17], '%', '')
    let safeInfo = ''
    try {
      safeInfo = decodeURIComponent(safeInfo17)
    } catch (error) {
      // this.log(`parseLog出错，错误信息 => ${error.message}，原日志信息 => ${data}`)
      return {error: `parseLog出错，错误信息 => ${error.message}`}
    }
    record.ua = parser(safeInfo)
    // 这里设备信息如果是空的话就标记成pc 不然现在用es查询的话查询不到pc的信息
    if (!_.has(record.ua, ['device', 'model'])) {
      _.set(record.ua, ['device', 'model'], 'pc')
    }
    if (!_.has(record.ua, ['device', 'type'])) {
      _.set(record.ua, ['device', 'type'], 'pc')
    }
    if (!_.has(record.ua, ['device', 'vendor'])) {
      _.set(record.ua, ['device', 'vendor'], '')
    }

    // 兼容处理saas系统打点UA问题, nwjs低版本下获取不到chrome的版本, 解析拿到的为chromium_ver
    let browserVersion = _.get(record.ua, ['browser', 'version'], '')
    if (browserVersion === 'chromium_ver') {
      _.set(record.ua, ['browser', 'version'], '50.0.2661.102')
      _.set(record.ua, ['browser', 'major'], '50')
    }

    // 解析IP地址，映射成城市
    record.ip = info[3] || info[4]
    const location = await Util.ip2Locate(record.ip)
    record.country = location.country
    record.province = location.province
    record.city = location.city
    return {data: record}
  }

  /**
   * 检查解析结果是否正确
   * @param {*} record
   */
  isParseResultLegal (rawRecord) {
    let record = rawRecord
    let errorTip = ''
    switch (record.type) {
      case 'product':
        switch (record.code) {
          case MenuClickLogValidator.codeSchema:
            if (MenuClickLogValidator.isLegal(record)) {
              return {}
            }
            errorTip = MenuClickLogValidator.getValidateMassage(record)
            break
          case TimeOnSiteLogValidator.codeSchema:
            if (TimeOnSiteLogValidator.isLegal(record)) {
              return {}
            }
            errorTip = TimeOnSiteLogValidator.getValidateMassage(record)
            break
          default:
            errorTip = '未匹配到与product类型相对应的code值, 自动跳过.'
            break
        }
        break
      case 'perf':
        switch (record.code) {
          case PerfLogValidator.codeSchema:
            if (PerfLogValidator.isLegal(record)) {
              return {}
            }
            errorTip = PerfLogValidator.getValidateMassage(record)
            break
          default:
            errorTip = '未匹配到与perf类型相对应的code值, 自动跳过.'
        }
        break
      case 'error':
        // error不区分具体code值
        if (ErrorLogValidator.isLegal(record)) {
          return {}
        }
        errorTip = ErrorLogValidator.getValidateMassage(record)
        break
      case 'event':
        if (EventValidator.isLegal(record, this.propsConfig, this.eventName)) {
          return {}
        }
        errorTip = EventValidator.getValidateMassage(record)
        break
      default:
        errorTip = '未匹配到记录类型, 自动跳过.'
        break
    }
    errorTip = `打点日志异常. 异常内容:${errorTip}`

    return {error: errorTip}
  }

  /**
   * 处理extra部分
   * @param {*} rawRecord
   */
  formatExtra (rawRecord) {
    let rawExtra = _.get(rawRecord, 'extra', {})
    // 这个大坑，之前这一部分被stringify了两遍，获取数据的时候也parse了两次
    let extra = JSON.stringify(JSON.stringify(rawExtra))
    return extra
  }

  /**
   * 处理common部分
   * @param {*} rawRecord
   */
  formatCommon (rawRecord) {
    let rawCommon = _.get(rawRecord, 'common', {})
    let common = {}
    if (_.has(rawCommon, ['record'])) {
      // 字符串
      for (let key of [
        'pid',
        'uuid',
        'version',
        'runtime_version',
        'sdk_version',
        'page_type']) {
        common[key] = _.get(rawCommon, [key], '') + ''
      }
      // 数字
      for (let key of ['ucid', 'timestamp']) {
        common[key] = this.parseIntWithDefault(_.get(rawCommon, [key], ''))
      }
      // 布尔
      for (let key of ['is_test']) {
        common[key] = !!_.get(rawCommon, [key], false)
      }
      // 对象
      // for (let key of ['record']) {
      //   common[key] = _.get(rawCommon, [key], {})
      // }
    } else {
      // 字符串
      for (let key of ['pid', 'uuid', 'version']) {
        common[key] = _.get(rawCommon, [key], '') + ''
      }
      // 数字
      for (let key of ['ucid', 'timestamp']) {
        common[key] = this.parseIntWithDefault(_.get(rawCommon, [key], ''))
      }
      // 布尔
      for (let key of ['test', 'performance', 'jserror', 'online']) {
        common[key] = !!_.get(rawCommon, [key], false)
      }
    }
    return common
  }

  /**
   * 处理detail部分
   * @param {*} rawRecord
   */
  formatDetail (rawRecord) {
    let rawDetail = _.get(rawRecord, ['detail'], {})
    let detail = {}
    switch (rawRecord.type) {
      case 'error':
        for (let key of ['error_no', 'url']) {
          detail[key] = _.get(rawDetail, [key], '') + ''
        }
        for (let key of [
          'http_code',
          'during_ms',
          'request_size_b',
          'response_size_b']) {
          detail[key] = this.parseIntWithDefault(_.get(rawDetail, [key], ''))
        }
        break
      case 'perf':
        for (let key of Object.keys(rawDetail)) {
          if (key === 'url') {
            detail[key] = _.get(rawDetail, [key], '') + ''
          } else {
            detail[key] = this.parseIntWithDefault(rawDetail[key])
          }
        }
        /**
         * 将性能关键指标数据前置计算逻辑，方便后续聚合操作
         * @author wagnqiang025
         * */
        detail = this.computePerfByRules(detail)
        break
      case 'product':
        switch (rawRecord.code) {
          case MenuClickLogValidator.codeSchema:
            for (let key of ['name', 'code', 'url']) {
              detail[key] = _.get(rawDetail, [key], '') + ''
            }
            break
          case TimeOnSiteLogValidator.codeSchema:
            for (let key of ['duration_ms']) {
              detail[key] = this.parseIntWithDefault(
                _.get(rawDetail, [key], ''))
            }
            break
        }
    }
    return detail
  }

  /**
   * 对数据进行统一预处理, 确保格式正确
   * @param {*} rawRecord
   */
  format (rawRecord) {
    let record = {}

    // 处理公共字段
    // 字符串
    for (let key of [
      'type',
      'md5',
      'project_name',
      'extra',
      'ip',
      'country',
      'province',
      'city']) {
      record[key] = _.get(rawRecord, [key], '') + ''
    }
    // 数字
    for (let key of ['code', 'project_id', 'time', 'time_ms']) {
      record[key] = this.parseIntWithDefault(_.get(rawRecord, [key], ''))
    }
    // 对象
    for (let key of ['common', 'detail', 'ua']) {
      record[key] = _.get(rawRecord, [key], {})
    }

    // JSON化extra字段
    record.extra = this.formatExtra(rawRecord)

    // 处理common部分
    record['common'] = this.formatCommon(rawRecord)

    // 处理detail
    record['detail'] = this.formatDetail(rawRecord)

    return record
  }

  // 处理打点类型(type="event")数据的props部分
  formatProps (rawRecord) {
    let project_id = _.get(rawRecord, ['project_id'], 0)
    let event_name = _.get(rawRecord, ['name'], '')
    // 用户配置的上报字段
    let propsConfig = _.get(this.projectDotMap.get(project_id + ''), [event_name], {})
    this.propsConfig = propsConfig
    this.eventName = event_name

    // 实际收到的上报字段
    let recordProps = _.get(rawRecord, ['props'], {})
    let props = {}
    // 以用户配置的字段为准，多余字段不会被记录，缺少字段默认给空
    for (let key of Object.keys(propsConfig)) {
      _.set(props, [event_name, key], _.get(recordProps, [key], ''))
    }
    return props
  }

  /**
   * 对【打点数据】(type="event")进行统一预处理, 因为打点数据格式和其他类型的都不一致，这里特殊处理
   * @param {*} rawRecord
   */
  formatForDotData (rawRecord) {
    let record = {}

    // 处理公共字段
    // 字符串
    for (let key of ['name', 'type', 'md5', 'project_name', 'extra', 'ip', 'country', 'province', 'city']) {
      record[key] = _.get(rawRecord, [key], '') + ''
    }
    // 数字
    for (let key of ['project_id', 'time', 'time_ms']) {
      record[key] = this.parseIntWithDefault(_.get(rawRecord, [key], ''))
    }
    // 对象
    for (let key of ['common', 'props', 'ua']) {
      record[key] = _.get(rawRecord, [key], {})
    }

    // JSON化extra字段
    record.extra = this.formatExtra(rawRecord)

    // 处理common部分
    record['common'] = this.formatCommon(rawRecord)

    // 处理props
    record['props'] = this.formatProps(rawRecord)

    return record
  }

  /**
   * 将性能关键指标数据前置计算逻辑，方便后续聚合操作
   * @param {Object} detail
   * @author wagnqiang025
   * */
  computePerfByRules (detail) {
    let keys = Object.keys(Rules)
    for (let key of keys) {
      let end = _.get(Rules, [key, 'end'], 0)
      let start = _.get(Rules, [key, 'start'], 0)
      let value = _.get(detail, [end], 0) - _.get(detail, [start], 0)

      if (value < 0) continue
      detail[key] = this.parseIntWithDefault(value, 0)
    }
    return detail
  }

  /**
   * 安全的parseInt
   * @param {*} string
   * @param {*} defaultValue
   */
  parseIntWithDefault (string, defaultValue = 0) {
    let result = parseInt(string)
    if (_.isNaN(result)) {
      return defaultValue
    }
    return result
  }
}

export default SaveLogBase
