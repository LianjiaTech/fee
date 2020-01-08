import Knex from '~/src/library/mysql'
import _ from 'lodash'
import Logger from '~/src/library/logger'

const BASE_TABLE_NAME = 't_o_dot_event_props'
const TABLE_COLUMN = [
  `id`,
  `props_name`,
  `props_display_name`,
  `props_data_type`,
  `event_id`,
  `is_delete`,
  `is_vibile`
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
    Logger.log(err.message, 't_o_dot_event_props    add   出错')
    return []
  })
  console.log(insertResult, 'insertResult>>>')
  let id = _.get(insertResult, [0], 0)

  return id
}

/**
 * 查询打点属性信息
 * @param {ids} 单个event_id，或一个存放了event_id的数组
 * @param {name} 属性props_name值
 */
async function query(ids, name) {
  if(!Array.isArray(ids)) ids = [].concat(ids)
  let tableName = getTableName()
  let instance = Knex(tableName).select().whereIn('event_id', ids).where('is_delete', 0)
  if (name) instance = instance.where('props_name', name)
  
  let result = await instance
    .catch(err => {
      Logger.log(err.message, 't_o_dot_event_props    query   出错')
      return []
    })
  return result
}

/**
 * 批量更新属性信息
 * @param {Array} props
 */
async function update (props) {
  let tableName = getTableName()
  let result = false
  await Knex.transaction(trx => {
    const sequence = [];
    for (let prop of props) { 
      const insert = Knex(tableName)
        .where('id', prop.id)
        .update(prop)
        .transacting(trx) // This makes every update be in the same transaction
      sequence.push(insert)
    }
    Promise.all(sequence)
      .then(() => { 
        trx.commit()
        result = true
      })
      .catch(err => { 
        Logger.log(err.message, 't_o_dot_event_props    update   出错')
        trx.rollback()
        result = false
      })
  })
  return result
}

export default {
  add,
  query,
  update
}
