import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'
import Logger from '~/src/library/logger'

const BASE_TABLE_NAME = 't_o_project'
const TABLE_COLUMN = [
  `id`,
  `project_name`,
  `display_name`,
  `rate`,
  `c_desc`,
  `create_time`,
  `create_ucid`,
  `update_time`,
  `update_ucid`,
  `is_delete`
]
const DISPLAY_TABLE_COLUMN = [
  `id`,
  `project_name`,
  `display_name`,
  `rate`,
  `c_desc`,
  `create_time`,
  `create_ucid`,
  `update_time`,
  `update_ucid`
]
function getTableName () {
  return BASE_TABLE_NAME
}

/**
 * 删除不必要的字段
 * @param {*} data
 */
function formatRecord (rawRecord) {
  let record = {}
  for (let column of DISPLAY_TABLE_COLUMN) {
    if (_.has(rawRecord, [column])) {
      record[column] = rawRecord[column]
    }
  }
  return record
}

/**
 * 添加项目
 * @param {object} data
 */
async function add (data) {
  let tableName = getTableName()
  let createTime = moment().unix()
  let updateTime = createTime

  let insertData = {}
  for (let column of [
    `project_name`,
    `display_name`,
    `c_desc`,
    `create_ucid`,
    `update_ucid`
  ]) {
    if (_.has(data, [column])) {
      insertData[column] = data[column]
    }
  }
  insertData = {
    ...insertData,
    create_time: createTime,
    update_time: updateTime,
    is_delete: 0
  }
  let insertResult = await Knex
    .returning('id')
    .insert(insertData)
    .into(tableName)
    .catch(err => {
      Logger.log(err.message, 'project_item    add   出错')
      return []
    })
  let id = _.get(insertResult, [0], 0)

  return id > 0
}

/**
 * 获取项目信息
 * @param {number} id
 */
async function get (id) {
  let tableName = getTableName()
  let result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('id', '=', id)
    .catch(err => {
      Logger.log(err.message, 'project_item    get   出错')
      return []
    })
  let project = _.get(result, ['0'], {})
  return project
}

/**
 * 项目列表
 */
async function getList () {
  let tableName = getTableName()
  let result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('is_delete', 0)
    .catch(err => {
      Logger.log(err.message, 'project_item    getlist   出错')
      return []
    })
  return result
}

/**
 * 更新记录
 * @param {number} id
 * @param {object} updateData = {}
 */
async function update (id, updateData) {
  let nowAt = moment().unix()

  let newRecord = {}
  for (let column of [
    'project_name',
    'display_name',
    'c_desc',
    'is_delete',
    'update_ucid'
  ]) {
    if (_.has(updateData, [column])) {
      newRecord[column] = updateData[column]
    }
  }
  newRecord = {
    ...newRecord,
    update_time: nowAt
  }
  let tableName = getTableName()
  let result = await Knex(tableName)
    .update(newRecord)
    .where('id', id)
    .catch(err => {
      Logger.log(err.message, 'project_item    update   出错')
      return []
    })
  return result === 1
}

/**
 * 获取项目id列表
 * @param {*} idList
 */
async function getProjectListById (idList) {
  let tableName = getTableName()

  let result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .whereIn('id', idList)
    .andWhere('is_delete', 0)
    .catch(err => {
      Logger.log(err.message, 'project_item   getProjectListById   出错')
      return []
    })
  return result
}
export default {
  get,
  getList,
  update,
  getTableName,
  add,

  // 限制导出数据
  formatRecord,

  // 获取id对应的名
  getProjectListById
}
