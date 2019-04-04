import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'
import MCityDistribution from '~/src/model/parse/city_distribution'
import DATE_FORMAT from '~/src/constants/date_format'
import DatabaseUtil from '~/src/library/utils/modules/database'
import Logger from '~/src/library/logger'
// 统计类别

const BASE_TABLE_NAME = 't_r_unique_view'
const TABLE_COLUMN = [
  `id`,
  `project_id`,
  `total_count`,
  `count_at_time`,
  `count_type`,
  `city_distribute_id`,
  `create_time`,
  `update_time`
]

/**
 * 获取表名
 * @param {number} projectId 项目id
 * @param {number} createTimeAt 创建时间, 时间戳
 * @return {String}
 */
function getTableName () {
  return BASE_TABLE_NAME
}

/**
 * 自动创建/替换总uv记录
 * @param {number} projectId
 * @param {number} totalCount
 * @param {number} countAtTime
 * @param {string} countType
 * @param {object} cityDistribute
 * @return {boolean}
 */
async function replaceUvRecord (projectId, totalCount, countAtTime, countType, cityDistribute) {
  let tableName = getTableName()
  let updateAt = moment().unix()
  // 返回值是一个列表
  let oldRecordList = await Knex
    .select([`city_distribute_id`, `create_time`, `id`])
    .from(tableName)
    .where('project_id', '=', projectId)
    .andWhere('count_at_time', '=', countAtTime)
    .andWhere('count_type', '=', countType)
    .catch(() => {
      return []
    })
  // 利用get方法, 不存在直接返回0, 没毛病
  let id = _.get(oldRecordList, [0, 'id'], 0)
  let cityDistributeIdInDb = _.get(oldRecordList, [0, 'city_distribute_id'], 0)
  let createTimeInDb = _.get(oldRecordList, [0, 'create_time'], 0)

  let data = {
    project_id: projectId,
    count_at_time: countAtTime,
    total_count: totalCount,
    count_type: countType,
    update_time: updateAt
  }
  let isSuccess = false
  if (id > 0) {
    // 更新城市分布数据
    let isUpdateSuccess = MCityDistribution.updateCityDistributionRecord(cityDistributeIdInDb, projectId, createTimeInDb, JSON.stringify(cityDistribute))
    if (isUpdateSuccess === false) {
      return false
    }
    // 更新具体数据
    let affectRows = await Knex(tableName)
      .update(data)
      .where(`id`, '=', id)
    isSuccess = affectRows > 0
  } else {
    // 首先插入城市分布数据
    let cityDistributeId = await MCityDistribution.insertCityDistributionRecord(JSON.stringify(cityDistribute), projectId, updateAt)
    if (cityDistributeId === 0) {
      // 城市分布数据插入失败
      return false
    }
    data['city_distribute_id'] = cityDistributeId
    data['total_count'] = totalCount
    data['create_time'] = updateAt
    let insertResult = await Knex
      .returning('id')
      .insert(data)
      .into(tableName)
      .catch(e => { return [] })
    let insertId = _.get(insertResult, [0], 0)
    isSuccess = insertId > 0
  }
  return isSuccess
}

/**
 * 获取记录
 */
async function getRecord (projectId, countAtTime, countType) {
  let tableName = getTableName()
  let recordList = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('project_id', '=', projectId)
    .andWhere('count_at_time', '=', countAtTime)
    .andWhere('count_type', '=', countType)
    .catch(e => {
      return []
    })
  return _.get(recordList, [0], {})
}

/**
 * 获取总uv, 记录不存在返回0
 * @param {number} projectId
 * @param {string} countAtTime
 * @param {string} countType
 * @return {number}
 */
async function getTotalUv (projectId, countAtTime, countType) {
  let record = await getRecord(projectId, countAtTime, countType)
  return _.get(record, ['total_count'], 0)
}

/**
 * 获取一段时间范围内的uv数
 * @param {*} projectId
 * @param {*} startAt
 * @param {*} finishAt
 * @returns {Number}
 */
async function getUVInRange (projectId, startAt, finishAt) {
  let startAtMoment = moment.unix(startAt).format(DATE_FORMAT.DATABASE_BY_HOUR)
  let finishAtMoment = moment.unix(finishAt).format(DATE_FORMAT.DATABASE_BY_HOUR)
  let tableName = getTableName(projectId, startAt)
  let rawRecord = await Knex
    .from(tableName)
    .sum('total_count as total')
    .where('count_type', '=', DATE_FORMAT.UNIT.HOUR)
    .where('count_at_time', '>', startAtMoment)
    .andWhere('count_at_time', '<', finishAtMoment)
    .catch(e => {
      return 0
    })
  let totalUV = _.get(rawRecord, [0, 'total'], 0)
  return totalUV
}

async function getRawRecordListInRange (projectId, startAt, endAt, countType) {
  let timeList = DatabaseUtil.getDatabaseTimeList(startAt, endAt, countType)
  let tableName = getTableName(projectId, startAt)
  let rawRecordList = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('project_id', projectId)
    .andWhere('count_type', countType)
    .whereIn('count_at_time', timeList)
    .catch(err => {
      Logger.error('unique_view => getRawRecordListInRange', err.message)
      return []
    })
  return rawRecordList
}
export default {
  replaceUvRecord,
  getRecord,
  getTotalUv,
  getTableName,
  getUVInRange,
  getRawRecordListInRange
}
