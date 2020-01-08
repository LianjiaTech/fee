import moment from 'moment'
import _ from 'lodash'
import Knex from '~/src/library/mysql'
import Logger from '~/src/library/logger'

const BASE_TABLE_NAME = 't_o_dot_event_info'

const TABLE_COLUMN = [
  `id`,
  `event_name`,
  `event_display_name`,
  `event_tag_ids`,
  `event_create_user`,
  `event_edit_user`,
  `event_desc`,
  `is_delete`,
  `is_visible`,
  'create_time',
  `project_id`,
]

function getTableName () {
  return BASE_TABLE_NAME
}

/**
 * 添加事件打点配置
 * @param {object} data
 */
async function add (data) {
  let tableName = getTableName()
  let createTime = moment().unix()
  let updateTime = createTime

  let insertData = {
    ...data,
    create_time: createTime,
    update_time: updateTime,
  }
  
  let insertResult = await Knex
    .returning('id')
    .insert(insertData)
    .into(tableName).catch(err => {
      Logger.log(err.message, 't_o_dot_event_info    add   出错')
      return []
    })
  let id = _.get(insertResult, [0], 0)
  return id
}

/**
 * 查询事件打点配置
 * @param {*} project_id 
 * @param {*} event_name 
 * @param {*} event_id
 * @param {*} is_delete
 */ 
async function query (project_id, event_name = '', event_id, is_delete = 0) {
  let tableName = getTableName()
  let instance = Knex(tableName)
  
  if (project_id) instance = instance.where('project_id', project_id)
  if (event_name) instance = instance.where('event_name', event_name)
  if (event_id) instance = instance.where('id', event_id)

  let queryResult = await instance
    .where('is_delete', is_delete)
    .catch(err => {
      Logger.log(err.message, 't_o_dot_event_info    query   出错')
      return []
    })
  return queryResult
}

/**
 * 更新项目
 * @param {object} data
 */
async function update (id, project_id, data) {
  let tableName = getTableName()
  let update_time = moment().unix()

  let updateData = {
    ...data,
    update_time
  }
  
  let result = await Knex(tableName)
    .update(updateData)
    .where({
      id: id,
      project_id: project_id
    })
    .catch(err => {
      Logger.log(err.message, 't_o_dot_event_info    update   出错')
      return []
    })
  return result
}

export default {
  add,
  query,
  update
}
