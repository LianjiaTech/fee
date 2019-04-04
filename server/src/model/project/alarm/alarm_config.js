import _ from 'lodash'
import Knex from '~/src/library/mysql'
import moment from 'moment'
import Logger from '~/src/library/logger'

const BASE_TABLE_NAME = 't_o_alarm_config'
const TABLE_COLUMN = [
  `id`,
  `project_id`,
  `owner_ucid`,
  `error_type`,
  `error_name`,
  `time_range_s`,
  `max_error_count`,
  `alarm_interval_s`,
  `is_enable`,
  `note`,
  `is_delete`,
  `create_ucid`,
  `update_ucid`,
  `create_time`,
  `update_time`
]
const DISPKAY_COLUMN = [
  `id`,
  `project_id`,
  `owner_ucid`,
  `error_type`,
  `error_name`,
  `time_range_s`,
  `max_error_count`,
  `alarm_interval_s`,
  `is_enable`,
  `note`,
  `create_ucid`,
  `update_ucid`,
  `create_time`,
  `update_time`
]

/**
 * 删除不必要的字段
 * @param {object} rawRecord
 */
function formatRecord (rawRecord) {
  let result = {}
  for (let column of DISPKAY_COLUMN) {
    if (_.has(rawRecord, [column])) {
      result[column] = rawRecord[column]
    }
  }
  return result
}

function getTableName () {
  return BASE_TABLE_NAME
}
/**
 * 插入一条报警配置
 * @param {object} insertData
 */
async function add (insertData) {
  const tableName = getTableName()
  const createTime = moment().unix()
  const updateTime = createTime

  let newRecord = {}
  for (let allowColumn of [
    `project_id`,
    `owner_ucid`,
    `error_type`,
    `error_name`,
    `time_range_s`,
    `max_error_count`,
    `alarm_interval_s`,
    `is_enable`,
    `note`,
    `create_ucid`,
    `update_ucid`
  ]) {
    if (_.has(insertData, [allowColumn])) {
      newRecord[allowColumn] = insertData[allowColumn]
    }
  }
  newRecord = {
    ...newRecord,
    create_time: createTime,
    update_time: updateTime,
    is_delete: 0
  }
  const insertResult = await Knex
    .returning('id')
    .insert(newRecord)
    .into(tableName)
    .catch(err => {
      Logger.log(err, '===============>加入报警配置错误_数据库_add')
      return []
    })
  const insertId = _.get(insertResult, [0], 0)
  return insertId > 0
}

/**
 * 获取报警平台某个项目的一条报警配置
 * @param {number} id
 */
async function query (id) {
  const tableName = getTableName()

  const result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('id', id)
    .andWhere('is_delete', 0)
    .catch((err) => {
      Logger.log(err, '=============>获取单个报警配置出错_数据库_query')
      return []
    })
  const record = _.get(result, ['0'], {})
  return record
}

/**
 * 获取报警平台某个项目的所有报警配置
 * @param {number} projectId 项目id
 * @param {number} offset    获取数据的偏移量
 * @param {number} max       一页最多展示的数据
 */
async function getList (projectId, offset, max = 10) {
  const tableName = getTableName()
  const result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .limit(max)
    .offset(offset)
    .where('is_delete', 0)
    .andWhere('project_id', projectId)
    .catch((err) => {
      Logger.error(err, '==================>获取所有报警配置出错_数据库_getList')
      return []
    })
  return result
}

/**
 * 删除报警平台某个项目的一条报警配置
 * @param {number} id
 * @param {object} updateData = {owner_ucid, error_type, error_name, alarm_interval_s, max_error_count, time_range_s}
 */
async function update (id, updateData) {
  const tableName = getTableName()
  const updateTime = moment().unix()
  let newRecord = {}
  for (let allowColumn of [
    `project_id`,
    `owner_ucid`,
    `error_type`,
    `error_name`,
    `time_range_s`,
    `max_error_count`,
    `alarm_interval_s`,
    `is_enable`,
    `note`,
    `update_ucid`,
    `is_delete`
  ]) {
    if (_.has(updateData, [allowColumn])) {
      newRecord[allowColumn] = updateData[allowColumn]
    }
  }
  newRecord = {
    ...newRecord,
    update_time: updateTime
  }
  const result = await Knex(tableName)
    .update(newRecord)
    .where('id', id)
    .catch(err => {
      Logger.log(err, '=============>更新报警配置出错_数据库_update')
      return 0
    })
  return result
}
/**
 * 获取报警平台某个项目的报警配置的个数
 * @param {number} projectId
 */
async function getCount (projectId) {
  const tableName = getTableName()
  const result = await Knex(tableName)
    .count('id as totalCount')
    .where('project_id', projectId)
    .andWhere('is_delete', 0)
    .catch(err => {
      Logger.log(err, '==================>获取报警配置总数出错_数据库_getCount')
      return []
    })
  const count = _.get(result, ['0', 'totalCount'], 0)
  return count
}

/**
 * 获取所有配置（内部使用）
 */
async function getAll () {
  const tableName = getTableName()
  const result = await Knex(tableName)
    .select(TABLE_COLUMN)
    .where('is_delete', 0)
    .catch(err => {
      Logger.log(err, '==================>获取报警配置总数出错_数据库_getAll')
      return []
    })
  return result
}

/**
 * 获取所有可用的配置（内部使用）
 */
async function getAllEnabled () {
  const tableName = getTableName()
  const result = await Knex(tableName)
    .select(TABLE_COLUMN)
    .where('is_delete', 0)
    .where('is_enable', 1)
    .catch(err => {
      Logger.log(err, '==================>获取报警配置总数出错_数据库_getAllEnabled')
      return []
    })
  return result
}
export default {
  add,
  query,
  getList,
  update,
  getCount,
  getTableName,
  getAll,
  formatRecord,
  getAllEnabled
}
