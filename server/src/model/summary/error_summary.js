import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'
import Logger from '~/src/library/logger'
import redis from '~/src/library/redis'
import MCityDistribution from '~/src/model/parse/city_distribution'
import DATE_FORMAT from '~/src/constants/date_format'
import DatabaseUtil from '~/src/library/utils/modules/database'

const TABLE_COLUMN = [
  `id`,
  `error_type`,
  `error_name`,
  `url_path`,
  `city_distribution_id`,
  `count_at_time`,
  `count_type`,
  `error_count`,
  `create_time`,
  `update_time`
]

const BASE_TABLE_NAME = 't_r_error_summary'
const MAX_LIMIT = 100

const BASE_REDIS_KEY = 'error_summary'
const REDIS_KEY_ERROR_NAME_DISTRIBUTION_CACHE = BASE_REDIS_KEY + '_' + 'error_name_distribution_cache'

/**
 * 获取表名
 * @param {number} projectId 项目id
 * @param {number} createTimeAt 创建时间, 时间戳
 * @return {String}
 */
function getTableName (projectId, createTimeAt) {
  const DATE_FORMAT = 'YYYYMM'
  let YmDate = moment.unix(createTimeAt).format(DATE_FORMAT)
  return BASE_TABLE_NAME + '_' + projectId + '_' + YmDate
}

async function insertErrorSummaryRecord (projectId, countAt, countType, errorType, errorName, urlPath, cityDistributionId, errorCount) {
  const tableName = getTableName(projectId, countAt)
  const countAtTime = moment.unix(countAt).format(DATE_FORMAT.DATABASE_BY_UNIT[countType])
  const createTime = moment().unix()
  const insertData = {
    error_type: errorType,
    error_name: errorName,
    url_path: urlPath,
    city_distribution_id: cityDistributionId,
    count_at_time: countAtTime,
    count_type: countType,
    error_count: errorCount,
    create_time: createTime,
    update_time: createTime
  }
  const result = await Knex
    .returning('id')
    .insert(insertData)
    .into(tableName)
    .catch((err) => {
      Logger.error(err.message)
      return [0]
    })
  return _.get(result, [0], 0) > 0
}

async function updateErrorSummaryRecord (id, projectId, countAt, countType, errorType, errorName, urlPath, errorCount) {
  const tableName = getTableName(projectId, countAt)
  const countAtTime = moment.unix(countAt).format(DATE_FORMAT.DATABASE_BY_UNIT[countType])
  const updateTime = moment().unix()
  const updateData = {
    error_type: errorType,
    error_name: errorName,
    url_path: urlPath,
    count_at_time: countAtTime,
    count_type: countType,
    error_count: errorCount,
    update_time: updateTime
  }
  const affecRows = await Knex(tableName)
    .update(updateData)
    .where('id', id)
    .catch((err) => {
      Logger.error(err.message)
      return 0
    })
  return affecRows > 0
}

async function replaceSummaryRecord (projectId, countAt, countType, errorType, errorName, urlPath, errorCount, cityDistrubutionJsonString) {
  const rawRecord = await get(projectId, countAt, countType, errorType, errorName, urlPath)

  if (_.isEmpty(rawRecord)) {
    // 如果不存在对应的记录
    // 先插城市分布数据获取id
    const cityDistributionId = await MCityDistribution.insertCityDistributionRecord(cityDistrubutionJsonString, projectId, countAt)

    // 再插errorSummary数据
    const isSuccess = await insertErrorSummaryRecord(projectId, countAt, countType, errorType, errorName, urlPath, cityDistributionId, errorCount)
    return isSuccess
  } else {
    // 如果存在对应的记录
    const { id: errorSummaryId, city_distribution_id: cityDistributionId } = rawRecord

    // 更新城市分布记录
    await MCityDistribution.updateCityDistributionRecord(cityDistributionId, projectId, countAt, cityDistrubutionJsonString)

    // 更新errorSummary记录
    const isSuccess = await updateErrorSummaryRecord(errorSummaryId, projectId, countAt, countType, errorType, errorName, urlPath, errorCount)
    return isSuccess
  }
}

async function get (projectId, countAt, countType, errorType, errorName, urlPath) {
  const tableName = getTableName(projectId, countAt)
  const countAtTime = moment.unix(countAt).format(DATE_FORMAT.DATABASE_BY_UNIT[countType])

  const wherePrams = {
    count_at_time: countAtTime,
    count_type: countType,
    error_name: errorName,
    url_path: urlPath
  }
  const result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where(wherePrams)
    .catch((err) => {
      Logger.error(err.message)
      return []
    })
  return _.get(result, [0], {})
}

/**
 * 获取指定error_name中的错误分布数, 或指定url下, 指定errorNameList下的错误分布数
 * @param {*} projectId
 * @param {*} startAt
 * @param {*} endAt
 * @param {*} countType
 * @param {*} errorNameList
 * @param {*} url
 */
async function getErrorNameDistributionListInSameMonth (projectId, startAt, endAt, countType, errorNameList = [], url = {}) {
  const tableName = getTableName(projectId, startAt)
  let countAtTimeList = DatabaseUtil.getDatabaseTimeList(startAt, endAt, countType)
  let extendCondition = {}
  if (url.length > 0) {
    extendCondition['url_path'] = url
  }
  let rawRecordList = await Knex
    .select('error_name')
    .sum('error_count as sum_error_count')
    .from(tableName)
    .where('count_type', countType)
    .whereIn('count_at_time', countAtTimeList)
    .whereIn('error_name', errorNameList)
    .andWhere(extendCondition)
    .groupBy('error_name')
    .orderBy('sum_error_count', 'desc')
    .catch(err => {
      Logger.error(err.message)
      return []
    })

  let recordList = []
  for (let rawRecord of rawRecordList) {
    let { sum_error_count: errorCount, error_name: errorName } = rawRecord
    let record = {
      error_count: errorCount,
      error_name: errorName
    }
    recordList.push(record)
  }

  return recordList
}

async function getErrorNameList (projectId, errorType) {
  const nowMoment = moment().endOf('YYYY-MM-DD')
  const sevenDaysAgoMoment = nowMoment.clone().subtract(3, DATE_FORMAT.UNIT.DAY).startOf('YYYY-MM-DD')
  const tableName = getTableName(projectId, nowMoment.unix())

  let timeList = []
  for (let timeAt = sevenDaysAgoMoment.unix(); timeAt < nowMoment.unix(); timeAt += 86400) {
    const time = moment.unix(timeAt).format(DATE_FORMAT.DATABASE_BY_DAY)
    timeList.push(time)
  }
  const rawRecordList = await Knex
    .select()
    .distinct('error_name')
    .from(tableName)
    .where('count_type', DATE_FORMAT.UNIT.DAY)
    .where('error_type', errorType)
    .whereIn('count_at_time', timeList)
    .catch(err => {
      Logger.error(err.message)
      return []
    })
  const errorNameList = []
  for (let rawRecord of rawRecordList) {
    errorNameList.push(rawRecord['error_name'])
  }
  return errorNameList
}

/**
 * 根据errorNameList获取url分布
 * @param {*} projectId
 * @param {*} startAt
 * @param {*} endAt
 * @param {*} errorNameList
 * @param {*} countType
 * @param {*} max
 */
async function getUrlPathDistributionListByErrorNameList (projectId, startAt, endAt, errorNameList, countType, max = 10) {
  const tableName = getTableName(projectId, startAt)
  let countAtTimeList = DatabaseUtil.getDatabaseTimeList(startAt, endAt, countType)
  let rawRecordList = await Knex
    .select('url_path')
    .sum('error_count as total_count')
    .from(tableName)
    .where('count_type', countType)
    .whereIn('error_name', errorNameList)
    .whereIn('count_at_time', countAtTimeList)
    .groupBy('url_path')
    .orderBy('total_count', 'desc')
    .limit(max)
    .catch(err => {
      Logger.error(err.message)
      return []
    })
  let recordList = []
  for (let rawRecord of rawRecordList) {
    let urlPath = _.get(rawRecord, ['url_path'], '')
    let errorCount = _.get(rawRecord, ['total_count'], 0)
    let record = {
      url_path: urlPath,
      error_count: errorCount
    }
    recordList.push(record)
  }
  return recordList
}

/**
 * 获取错误堆叠图分布
 * @param {*} projectId
 * @param {*} countType
 * @param {*} errorType
 * @param {*} startAt
 * @param {*} endAt
 * @param {*} extendCondition
 */
async function getStackAreaDistribution (projectId, startAt, endAt, countType, errorNameList = [], url = '') {
  const tableName = getTableName(projectId, startAt)
  let timeList = DatabaseUtil.getDatabaseTimeList(startAt, endAt, countType)
  let extendCondition = {}
  if (url.length > 0) {
    extendCondition['url_path'] = url
  }

  let rawRecordList = await Knex
    .sum('error_count as sum_error_count')
    .select(['error_name', 'count_at_time'])
    .from(tableName)
    .where('count_type', countType)
    .andWhere(extendCondition)
    .whereIn('count_at_time', timeList)
    .whereIn('error_name', errorNameList)
    .groupBy(['count_at_time', 'error_name'])
    .catch(err => {
      Logger.error(err.message)
      return []
    })
  let recordList = []
  for (let rawRecord of rawRecordList) {
    let { error_name: errorName, count_at_time: countAtTime, sum_error_count: sumErrorCount } = rawRecord
    let record = {
      error_name: errorName,
      count_at_time: countAtTime,
      error_count: sumErrorCount
    }
    recordList.push(record)
  }
  return recordList
}

async function getList (projectId, startAt, endAt, countType, errorNameList = [], url = '') {
  const tableName = getTableName(projectId, startAt)
  let timeList = DatabaseUtil.getDatabaseTimeList(startAt, endAt, countType)

  let extendCondition = {}
  if (url.length > 0) {
    extendCondition['url_path'] = url
  }

  let rawRecordList = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('count_type', countType)
    .whereIn('count_at_time', timeList)
    .whereIn('error_name', errorNameList)
    .andWhere(extendCondition)
    .orderBy('error_count', 'desc')
    .catch(err => {
      Logger.error(err.message)
      return []
    })
  if (rawRecordList.length === 0) return []
  let cityDistributionIdList = []
  let createAt = 0
  for (let rawRecord of rawRecordList) {
    let cityDistributionId = _.get(rawRecord, ['city_distribution_id'], 0)
    createAt = _.get(rawRecord, ['create_time'], 0)
    cityDistributionIdList.push(cityDistributionId)
  }
  let rawCityDistributionReocrdList = await MCityDistribution.getByIdListInOneMonth(projectId, cityDistributionIdList, createAt)

  let cityDistributionMap = {}
  for (let rawRecord of rawCityDistributionReocrdList) {
    let cityDistributionJson = _.get(rawRecord, ['city_distribute_json'], '{}')
    let cityDistributionId = _.get(rawRecord, ['id'], 0)
    let cityDistribution = {}
    try {
      cityDistribution = JSON.parse(cityDistributionJson)
    } catch (e) {
      cityDistribution = {}
    }
    cityDistributionMap[cityDistributionId] = cityDistribution
  }
  let recordList = []
  for (let rawRecord of rawRecordList) {
    let cityDistributionId = _.get(rawRecord, ['city_distribution_id'], 0)
    let cityDistribution = _.get(cityDistributionMap, [cityDistributionId], {})
    rawRecord['city_distribution'] = cityDistribution
    recordList.push(rawRecord)
  }
  return recordList
}

/**
 * 获取时间范围内, 报错数最多的前max个errorName
 * @param {*} projectId
 * @param {*} startAt
 * @param {*} endAt
 * @return {Array}
 */
async function getErrorNameDistributionInSameMonth (projectId, startAt, endAt, max = 500) {
  let tableName = getTableName(projectId, startAt)
  let timeList = DatabaseUtil.getDatabaseTimeList(startAt, endAt, DATE_FORMAT.UNIT.DAY)
  let rawDistributionList = await Knex
    .sum('error_count as sum_error_count')
    .select('error_name')
    .from(tableName)
    .whereIn('count_at_time', timeList)
    .andWhere('count_type', DATE_FORMAT.UNIT.DAY)
    .groupBy('error_name')
    .orderBy('sum_error_count', 'desc')
    .limit(max)
    .catch((e) => {
      Logger.warn('getErrorNameDistributionInSameMonth查询错误, 错误信息=>', e)
      return []
    })
  let distributionList = []
  for (let rawDistribution of rawDistributionList) {
    let errorName = _.get(rawDistribution, ['error_name'], '')
    let errorCount = _.get(rawDistribution, ['sum_error_count'], '')
    let distribution = {
      error_name: errorName,
      error_count: errorCount
    }
    distributionList.push(distribution)
  }
  return distributionList
}

/**
 * 从缓存中获取最近指定时间范围内的错误数分布, 缓存不存在则重新查询
 * @param {*} projectId
 * @param {*} forceUpdate 是否强制更新缓存
 */
async function getErrorNameDistributionByTimeWithCache (projectId, startAt, endAt, forceUpdate = false) {
  let distributionList = []
  let distributionMap = {}
  for (let timeAt = startAt; timeAt <= endAt; timeAt += 86400) {
    let key = getRedisKey(REDIS_KEY_ERROR_NAME_DISTRIBUTION_CACHE, projectId, timeAt)
    let redisDistributionList = await redis.asyncGet(key)

    if (_.isEmpty(redisDistributionList) || forceUpdate) {
      redisDistributionList = await getErrorNameDistributionInSameMonth(projectId, moment.unix(timeAt).startOf('day').unix(), moment.unix(timeAt).endOf('day').unix())
      await redis.asyncSetex(key, 86400, redisDistributionList)
    }
    for (let redisDistribution of redisDistributionList) {
      let errorName = _.get(redisDistribution, ['error_name'], '')
      let errorCount = _.get(redisDistribution, ['error_count'], 0)
      let oldCount = _.get(distributionMap, [errorName], 0)
      _.set(distributionMap, [errorName], oldCount + errorCount)
    }
  }
  for (let errorName of Object.keys(distributionMap)) {
    distributionList.push({
      error_name: errorName,
      error_count: _.get(distributionMap, [errorName], 0)
    })
  }
  return distributionList
}

/**
 * 获取一个错误name在某一小时或某一天的总次数，服务于errorSummary指令
 * @param {*} projectId
 * @param {*} minuteTimeList
 * @param {*} countType
 */
async function getErrorSummaryByCountType (projectId, startAt, endAt, countType) {
  let tableName = getTableName(projectId, startAt)
  let timeList = DatabaseUtil.getDatabaseTimeList(startAt, endAt, countType)
  let rawResultList = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('count_type', countType)
    .whereIn('count_at_time', timeList)
    .catch(err => {
      Logger.error('getErrorSummary', err.message)
      return []
    })
  return rawResultList
}

function getRedisKey (baseKey, projectId, timeAt) {
  return baseKey + '_' + projectId + '_' + moment.unix(timeAt).format('YYYY-MM-DD')
}
export default {
  insertErrorSummaryRecord,
  getTableName,
  get,
  replaceSummaryRecord,
  getErrorNameList,
  getErrorNameDistributionByTimeWithCache,

  getUrlPathDistributionListByErrorNameList,
  getErrorNameDistributionListInSameMonth,
  getList,
  getStackAreaDistribution,
  getErrorSummaryByCountType
}
