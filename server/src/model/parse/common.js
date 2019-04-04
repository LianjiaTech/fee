import moment from 'moment'
import _ from 'lodash'
import Knex from '~/src/library/mysql'

const SPLIT_BY = {
  PROJECT: 'project',
  MONTH: 'month'
}

function getTableName (tableName, splitBy, projectId) {
  const yearMonth = moment().format('YYYYMM')
  if (splitBy === 'project') {
    return `${tableName}_${projectId}`
  } else if (splitBy === 'month') {
    return `${tableName}_${projectId}_${yearMonth}`
  }
  return tableName
}

/**
 * 入库
 * @param {object} datas
 */
async function insertInto (infos) {
  const { projectId, tableName, splitBy, datas } = infos
  let updateAt = moment().unix()
  if (!datas['create_time']) {
    datas['create_time'] = updateAt
  }
  if (!datas['update_time']) {
    datas['update_time'] = updateAt
  }
  const TableName = getTableName(tableName, splitBy, projectId)
  return Knex(TableName)
    .insert(datas)
    .catch(() => { return 0 })
}

async function getRecordList (infos) {
  const { projectId, tableName, select, where, splitBy } = infos
  const TableName = getTableName(tableName, splitBy, projectId)
  return Knex(TableName)
    .select(select)
    .where(where)
    .catch(() => { return [] })
}

async function updateInto (params) {
  const { projectId, tableName, where, splitBy, datas } = params
  let updateAt = moment().unix()
  datas['update_time'] = updateAt
  const TableName = getTableName(tableName, splitBy, projectId)
  return Knex(TableName)
    .where(where)
    .update(datas)
    .catch(() => { return 0 })
}

/**
 * 封装knex，按照指定条件查询，有数据更新，无数据添加
 * @param {object} params
 */
async function replaceInto (params) {
  const { tableName, where, datas, splitBy, projectId } = params
  const table = getTableName(tableName, splitBy, projectId)
  let res = await Knex.from(table).select('id').where(where)
  let id = _.get(res, [0, 'id'], 0)
  let updateAt = moment().unix()
  let isSuccess = false
  if (id > 0) {
    datas['update_time'] = updateAt
    const affectRows = await Knex(table)
      .where(`id`, '=', id)
      .update(datas)
      .catch(() => { return 0 })
    isSuccess = affectRows > 0
  } else {
    datas['create_time'] = updateAt
    datas['update_time'] = updateAt
    const insertId = await Knex
      .insert(datas)
      .into(table)
      .catch(() => { return 0 })
    isSuccess = insertId > 0
  }
  return isSuccess
}

export default {
  SPLIT_BY,
  insertInto,
  updateInto,
  replaceInto,
  getTableName,
  getRecordList
}
