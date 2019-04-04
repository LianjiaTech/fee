import moment from 'moment'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constants/date_format'

/**
 * 获取一段时间内的tableName, 方便进行跨月查询(假定是按月分表)
 * @param {number} projectId
 * @param {number} startAt
 * @param {number} finishAt
 * @param {function} getTableFunc
 * @param {string} timeSplitUnit 按时间分表单位, 默认按月分表
 */
function getTableNameListInRange (projectId, startAt, finishAt, getTableFunc, timeSplitUnit = DATE_FORMAT.UNIT.MONTH) {
  let startAtMoment = moment.unix(startAt)
  let finishAtMoment = moment.unix(finishAt)
  let tableNameList = []
  for (let currentAtMoment = startAtMoment; currentAtMoment.isBefore(finishAtMoment); currentAtMoment = currentAtMoment.clone().add(1, timeSplitUnit).startOf(timeSplitUnit)) {
    let currentAt = currentAtMoment.unix()
    let tableName = getTableFunc(projectId, currentAt)
    tableNameList.push(tableName)
  }
  return tableNameList
}

/**
 * 计算百分比/除法, 自动处理0/负数的情况, 精确到小数点后两位
 * @param {*} dividend
 * @param {*} divisor
 * @param {*} showAsPercent
 */
function computePercent (dividend, divisor, showAsPercent = true) {
  let RETURN_ERROR
  if (showAsPercent) {
    // 百分比模式下返回 '-'
    RETURN_ERROR = '-'
  } else {
    // 小数模式下返回 0
    RETURN_ERROR = 0
  }

  dividend = parseFloat(dividend)
  divisor = parseFloat(divisor)

  if (dividend <= 0 || divisor <= 0) {
    // 不能出现0或负值
    return RETURN_ERROR
  }

  if (_.isFinite(dividend) === false || _.isFinite(divisor) === false) {
    // 不能是非数字
    return RETURN_ERROR
  }

  let result = RETURN_ERROR
  let resultInt = parseInt(dividend / divisor * 10000)

  if (showAsPercent) {
    result = (resultInt / 100) + '%'
  } else {
    result = resultInt / 10000
  }
  return result
}

/**
 * 补全按时间分布的数据列表, 依照记录中index字段进行补全, 记录不存在则使用defaultRecord进行填充, index必须为时间戳
 * @param {*} rawRecordList
 * @param {*} startAt
 * @param {*} endAt
 * @param {*} countType
 * @param {*} defaultRecord
 */
function paddingTimeList (rawRecordList, startAt, endAt, countType, defaultRecord = {}) {
  let resultList = []
  let startMoment = moment.unix(startAt).startOf(countType)
  let endMoment = moment.unix(endAt).endOf(countType)
  let timeStep
  let recordMap = {}
  switch (countType) {
    case DATE_FORMAT.UNIT.MINUTE:
      timeStep = 60
      break
    case DATE_FORMAT.UNIT.HOUR:
      timeStep = 3600
      break
    case DATE_FORMAT.UNIT.DAY:
      timeStep = 86400
      break
    default:
      return []
  }
  for (let rawRecord of rawRecordList) {
    let indexAt = _.get(rawRecord, ['index'], 0)
    recordMap[indexAt] = rawRecord
  }
  for (let timeAt = startMoment.unix(); timeAt <= endMoment.unix(); timeAt += timeStep) {
    let placeholderRecord = { ...defaultRecord, 'index': timeAt }
    let record = _.get(recordMap, [timeAt], placeholderRecord)
    resultList.push(record)
  }
  return resultList
}

/**
 * 获取数据库时间格式字符串
 * @param {*} startAt
 * @param {*} endAt
 * @param {*} type
 */
function getDatabaseTimeList (startAt, endAt, type) {
  let countAtTimeList = []
  let startMoment
  let endMoment
  let dateBaseFormat
  let timeStep = 3600
  switch (type) {
    case DATE_FORMAT.UNIT.MINUTE:
      dateBaseFormat = DATE_FORMAT.DATABASE_BY_MINUTE
      timeStep = 60
      break
    case DATE_FORMAT.UNIT.HOUR:
      dateBaseFormat = DATE_FORMAT.DATABASE_BY_HOUR
      timeStep = 3600
      break
    case DATE_FORMAT.UNIT.DAY:
      dateBaseFormat = DATE_FORMAT.DATABASE_BY_DAY
      timeStep = 86400
      break
    default:
      return []
  }
  startMoment = moment.unix(startAt).startOf(type)
  endMoment = moment.unix(endAt).endOf(type)
  for (let timeAt = startMoment.unix(); timeAt <= endMoment.unix(); timeAt += timeStep) {
    let time = moment.unix(timeAt).format(dateBaseFormat)
    countAtTimeList.push(time)
  }
  return countAtTimeList
}

export default {
  getTableNameListInRange,
  computePercent,
  paddingTimeList,
  getDatabaseTimeList
}
