import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'
import Logger from '~/src/library/logger'

const BASE_TABLE_NAME = 't_o_project_apply'

const TABLE_BASE_PROPS = [
  `display_name`,
  `project_name`,
  `c_desc`,
  `mail`,
  `rate`,
  `pv`,
  `home_page`,
  `owner_ucid`,
  `apply_desc`,
  `review_desc`,
  `apply_ucid`,
  `apply_nick_name`,
  `apply_mail`,
  `review_ucid`,
  `review_nick_name`,
  `status`,
  `create_time`,
  `update_time`
]

const TABLE_COLUMN = [
  `id`,
  ...TABLE_BASE_PROPS
]

function getTableName () {
  return BASE_TABLE_NAME
}

/**
 * 添加项目申请
 * @param {object} data
 */
async function add (data) {
  let tableName = getTableName()
  let createTime = moment().unix()
  let updateTime = createTime
  let insertData = {}
  for (let column of [
    ...TABLE_BASE_PROPS
  ]) {
    if (_.has(data, [column])) {
      insertData[column] = data[column]
    }
  }
  insertData = {
    ...insertData,
    create_time: createTime,
    update_time: updateTime
  }
  let insertResult = await Knex.returning('id').insert(insertData).into(tableName).catch(err => {
    Logger.log(err.message, 'project_item    add   出错')
    return []
  })
  let id = _.get(insertResult, [0], 0)

  // return id > 0
  return id
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

async function count () {
  let tableName = getTableName()
  let result
  result = await Knex
    .from(tableName)
    .count('id')
    .then(data => data[0]['count(`id`)'])
    .catch(err => {
      Logger.log(err.message, 'project_item    getlist   出错')
      result = 0
    })
  return result
}

/**
 * 项目列表
 */
async function getList (limit, offset) {
  let tableName = getTableName()
  let result
  result = await Knex.select(TABLE_COLUMN)
    .from(tableName)
    .limit(limit)
    .offset(offset)
    .orderBy('status', 'asc')
    .orderBy('update_time', 'desc')
    .catch(err => {
      Logger.log(err.message, 'project_item    getlist   出错')
      result = []
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
    ...TABLE_BASE_PROPS
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
    .where('id', id)
    .update(newRecord)
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

  let result = await Knex.select(TABLE_COLUMN).from(tableName).whereIn('id', idList).andWhere('is_delete', 0).catch(err => {
    Logger.log(err.message, 'project_item   getProjectListById   出错')
    return []
  })
  return result
}

async function getProjectByProjectName (projectName) {
  let tableName = getTableName()
  let result = await Knex.select(TABLE_COLUMN).from(tableName).where('project_name', '=', projectName).catch(err => {
    Logger.log(err.message, 'project_item    getlist   出错')
    return [null]
  })
  return result[0]
}

async function queryProjectByFuzzyName (projectName) {
  let tableName = getTableName()
  let result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('status', '=', 1)
    .where('display_name', 'like', `%${projectName}%`)
    .catch(err => {
      Logger.log(err.message, 'project_item    queryProjectByFuzzyName   出错')
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
  count,
  // 获取id对应的名
  getProjectListById,
  getProjectByProjectName,
  queryProjectByFuzzyName
}
