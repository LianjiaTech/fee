import path from 'path'
import Kafka from 'node-rdkafka'
import appConfig from '~/src/configs/app'
import moment from 'moment'

let logPath = appConfig.absoluteLogPath

const YMFormat = 'YYYYMM'
const DDFormat = 'DD'
const HHFormat = 'HH'
const mmFormat = 'mm'

const LOG_TYPE_RAW = 'raw'
const LOG_TYPE_JSON = 'json'
const LOG_TYPE_TEST = 'test'

/**
 * 获得日志所在文件夹
 * @param {string} logType    日志类型 LOG_TYPE_RAW | LOG_TYPE_JSON | LOG_TYPE_TEST
 * @returns {string}
 */
function getAbsoluteBasePathByType (logType = LOG_TYPE_RAW) {
  // 确保logType一定是指定类型
  switch (logType) {
    case LOG_TYPE_RAW:
      break
    case LOG_TYPE_JSON:
      break
    case LOG_TYPE_TEST:
      break
    default:
      logType = LOG_TYPE_RAW
  }
  let fileUri = path.resolve(logPath, 'kafka', logType)
  return fileUri
}

/**
 * 根据开始时间和记录类型, 生成对应日志绝对路径, 按分钟分隔
 * @param {number} logAt    时间戳
 * @param {string} logType    日志类型 LOG_TYPE_RAW | LOG_TYPE_JSON | LOG_TYPE_TEST
 * @returns {string}
 */
function getAbsoluteLogUriByType (logAt, logType = LOG_TYPE_RAW) {
  // 确保logType一定是指定类型
  switch (logType) {
    case LOG_TYPE_RAW:
      break
    case LOG_TYPE_JSON:
      break
    case LOG_TYPE_TEST:
      break
    default:
      logType = LOG_TYPE_RAW
  }
  let startAtMoment = moment.unix(logAt)
  let basePath = getAbsoluteBasePathByType(logType)
  let monthDirName = getMonthDirName(logAt)
  let fileName = `./${monthDirName}/day_${startAtMoment.format(DDFormat)}/${startAtMoment.format(HHFormat)}/${startAtMoment.format(mmFormat)}.log`
  let fileUri = path.resolve(basePath, fileName)
  return fileUri
}

/**
 * 工具函数, 获取时间戳对应的月份名, 方便删除无用日志
 * @param {string} logAt
 * @return {string}
 */
function getMonthDirName (logAt) {
  let startAtMoment = moment.unix(logAt)
  let monthDirName = `month_${startAtMoment.format(YMFormat)}`
  return monthDirName
}

export default {
  // 原型对象
  Kafka,
  // 工具函数
  getAbsoluteLogUriByType,
  getAbsoluteBasePathByType,
  getMonthDirName,
  // 常量
  LOG_TYPE_RAW,
  LOG_TYPE_JSON,
  LOG_TYPE_TEST
}
