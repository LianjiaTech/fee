import Knex from '~/src/library/mysql'
import _ from 'lodash'
import Logger from '~/src/library/logger'

const BASE_TABLE_NAME = 't_o_dot_event_tags'
const TABLE_COLUMN = [
  `id`,
  `name`,
  `color`,
  `project_id`
]

function getTableName () {
  return BASE_TABLE_NAME
}

/**
 * 添加打点属性信息
 * @param {object} data
 */
async function add (data) {
  let tableName = getTableName()
  let insertResult = await Knex
  .returning('id')
  .insert(data)
  .into(tableName)
  .catch(err => {
    Logger.log(err.message, 't_o_dot_event_tags    add   出错')
    return []
  })
  
  let id = _.get(insertResult, [0], 0)

  return id
}

/**
 * 查询打点属性信息
 * @param {ids} 单个id，或一个存放了id的数组
 */
async function query({ project_id, name, ids }) {
  let tableName = getTableName()
  let instance = Knex(tableName).select()
  
  if (project_id) instance = instance.where('project_id', project_id)
  if (name) instance = instance.where('name', name)
  if (ids && !Array.isArray(ids)) { 
    ids = [].push(ids)
    instance = instance.whereIn(id, ids)
  }
    
  let result = await instance.catch(err => {
    Logger.log(err.message, 't_o_dot_event_tags    query   出错')
    return []
  })
  return result
}

/**
 * 更新属性信息
 * @param {object} data
 */
async function update (id, data) {
  let tableName = getTableName()
  
  let result = await Knex(tableName)
    .update(data)
    .where('id', id)
    .catch(err => {
      Logger.log(err.message, 't_o_dot_event_tags    update   出错')
      return []
    })
  return result
}

export default {
  add,
  query,
  update
}
