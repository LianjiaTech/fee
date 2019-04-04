import Base from '~/src/commands/base'
import fs from 'fs'
import { writeLine } from 'lei-stream'
import md5 from 'md5'
import moment from 'moment'
import shell from 'shelljs'
import parser from 'ua-parser-js'
import queryString from 'query-string'
import Util from '~/src/library/utils/modules/util'
import _ from 'lodash'
import MProject from '~/src/model/project/project'
import LKafka from '~/src/library/kafka'
import path from 'path'

let jsonWriteStreamPool = new Map()
let rawLogWriteStreamPool = new Map()
const TEST_LOG_FLAG = 'b47ca710747e96f1c523ebab8022c19e9abaa56b'

class SaveLogBase extends Base {
  isTestLog (content) {
    return content.includes(TEST_LOG_FLAG)
  }

  /**
 * 获取写入Stream
 * @param {number} nowAt
 * @returns {WriteStream}
 */
  getWriteStreamClientByType (nowAt, logType = LKafka.LOG_TYPE_RAW) {
    // 确保logType一定是指定类型
    switch (logType) {
      case LKafka.LOG_TYPE_RAW:
        break
      case LKafka.LOG_TYPE_JSON:
        break
      case LKafka.LOG_TYPE_TEST:
        break
      default:
        logType = LKafka.LOG_TYPE_RAW
    }
    let nowAtLogUri = LKafka.getAbsoluteLogUriByType(nowAt, logType)
    // 创建对应路径
    let logPath = path.dirname(nowAtLogUri)
    shell.mkdir('-p', logPath)
    let nowAtWriteStream = null
    if (jsonWriteStreamPool.has(nowAtLogUri)) {
      nowAtWriteStream = jsonWriteStreamPool.get(nowAtLogUri)
    } else {
      nowAtWriteStream = writeLine(fs.createWriteStream(nowAtLogUri, { flags: 'a' }), {
        // 换行符，默认\n
        newline: '\n',
        encoding: null,
        cacheLines: 0 // 直接落磁盘
      })
      jsonWriteStreamPool.set(nowAtLogUri, nowAtWriteStream)
    }
    return nowAtWriteStream
  }

  /**
               * 自动关闭旧Stream
               */
  autoCloseOldStream (isCloseAll = false) {
    let nowAt = moment().unix()
    let startAt = nowAt - 60 * 100
    let finishAt = nowAt - 60 * 100
    let survivalSet = new Set()
    for (let survivalAt = startAt; survivalAt < finishAt; survivalAt = survivalAt + 1) {
      let survivalAtLogUri = LKafka.getAbsoluteLogUriByType(nowAt, LKafka.LOG_TYPE_JSON)
      let survivalAtRawLogUri = LKafka.getAbsoluteLogUriByType(nowAt, LKafka.LOG_TYPE_RAW)
      if (isCloseAll === false) {
        survivalSet.add(survivalAtLogUri)
        survivalSet.add(survivalAtRawLogUri)
      }
    }

    let needCloseLogUriSet = new Set()
    // 获得所有过期uri key
    for (let testLogFileUri of jsonWriteStreamPool.keys()) {
      if (survivalSet.has(testLogFileUri) === false) {
        needCloseLogUriSet.add(testLogFileUri)
      }
    }
    // 依次关闭
    for (let closeLogUri of needCloseLogUriSet) {
      let needCloseStream = jsonWriteStreamPool.get(closeLogUri)
      jsonWriteStreamPool.delete(closeLogUri)
      needCloseStream.end()
    }

    // 重复一次
    needCloseLogUriSet.clear()
    for (let testLogFileUri of rawLogWriteStreamPool.keys()) {
      if (survivalSet.has(testLogFileUri) === false) {
        needCloseLogUriSet.add(testLogFileUri)
      }
    }
    for (let closeLogUri of needCloseLogUriSet) {
      let needCloseStream = rawLogWriteStreamPool.get(closeLogUri)
      rawLogWriteStreamPool.delete(closeLogUri)
      needCloseStream.end()
    }

    return true
  }

  /**
               * 获取项目列表
               * @returns {object}
               */
  async getProjectMap () {
    let projectList = await MProject.getList()
    let projectMap = {}
    for (let project of projectList) {
      projectMap[project.project_name] = {
        id: project.id,
        rate: project.rate
      }
    }
    this.log('项目列表获取成功 =>', projectMap)
    return projectMap
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
      this.log(`无法解析日志记录时间 => ${info[0]}, 自动跳过`)
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
      this.log('==== 打点数据异常 ====', err)
      return null
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
      this.log('record 不规范 =>', record)
      return null
    }
    if (_.has(record, ['common', 'pid']) === false) {
      this.log('pid 不存在 =>', record)
      return null
    }
    if (record.common.pid === '') {
      this.log('记录中没有record.common.pid  =>', record.common.pid)
      return null
    }
    if (_.has(projectMap, [record.common.pid]) === false) {
      this.log('项目尚未注册projectMap[record.common.pid] =>', projectMap, record.common.pid)
      return null
    }
    record.project_id = projectMap[record.common.pid]['id']
    record.project_name = record.common.pid
    let currentAt = moment().unix()
    let logCreateAt = this.parseLogCreateAt(data)
    // 如果入库时间距离现在大于10天, 则认为是不合法数据(kafka中只会存7天以内的数据, 入库时间超出上下10天, 都不正常)
    if (Math.abs(logCreateAt - currentAt) > 864000) {
      this.log('入库时间超出阈值, 自动跳过 finialTimeAt=>', logCreateAt)
      return null
    }
    record.time = logCreateAt

    // 新版中info[17] 里有%号, 是非法字符, 需要提前处理
    let safeInfo17 = _.replace(info[17], '%', '')
    record.ua = parser(decodeURIComponent(safeInfo17))

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
    return record
  }
}

export default SaveLogBase
