import moment from 'moment'
import _ from 'lodash'
import Knex from '~/src/library/mysql'

export const SPLIT_BY = {
  PROJECT: 'project',
  MONTH: 'month',
  NONE: 'none'
}

function getTableName (tableName, splitBy, projectId) {
  const yearMonth = moment().format('YYYYMM')
  switch (splitBy) {
    case 'project':
      return `${tableName}_${projectId}`
    case 'month':
      return `${tableName}_${projectId}_${yearMonth}`
    default:
      return tableName
  }
}

async function getAll (tableName) {
  const datas = await Knex.select('*').from(tableName)
  return datas
}

async function getDistinct (params) {
  const { tableName, where, distinctName } = params
  const datas = await Knex(tableName).select().distinct(distinctName).where(where)
  return datas
}

async function getSelect (params) {
  const { tableName, where, splitBy, projectId } = params
  const table = getTableName(tableName, splitBy, projectId)
  const datas = await Knex(table).select().where(where)
  return datas
}

async function getSelectOffset (params, limit, offset) {
  const { tableName, where, splitBy, projectId } = params
  const table = getTableName(tableName, splitBy, projectId)
  const datas = await Knex(table)
    .select()
    .where(where)
    .limit(limit)
    .offset(offset)
  return datas
}

/**
 * 统计某一列的个数
 * @param {object} params
 */
async function groupBy (params) {
  const { tableName, column, where, splitBy, projectId } = params
  const table = getTableName(tableName, splitBy, projectId)
  let res = await Knex(table).select(column).count('*').groupBy(column).where(where)
  return res
}

async function getTotalCount (params) {
  const { tableName, where, splitBy, projectId } = params
  const table = getTableName(tableName, splitBy, projectId)
  let res = await Knex(table).count('id as count').where(where)
  const count = _.get(res, [0, 'count'], 0)
  return count
}

export default {
  getAll,
  getSelect,
  getDistinct,
  getSelectOffset,
  groupBy,
  getTotalCount,
  SPLIT_BY
}
