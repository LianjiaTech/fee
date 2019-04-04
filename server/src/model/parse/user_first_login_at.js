import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'

const BASE_TABLE_NAME = 't_o_user_first_login_at'
const TABLE_COLUMN = [
  `id`,
  `ucid`,
  `first_visit_at`,
  `country`,
  `province`,
  `city`,
  `create_time`,
  `update_time`
]

/**
 * 获取表名
 * @param {number} projectId 项目id
 * @return {String}
 */
function getTableName (projectId) {
  return `${BASE_TABLE_NAME}_${projectId}`
}

async function getList (projectId, startAt, endAt) {
  let tableName = getTableName(projectId)
  let recordList = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('first_visit_at', '>=', startAt)
    .andWhere('first_visit_at', '<=', endAt)
    .catch(e => {
      return []
    })
  return recordList
}

/**
 * 若数据库中记录的最早登陆时间比传入值更晚, 则更新为传入的更新时间
 * @param {number} projectId
 * @param {string} ucid
 * @param {number} visitAt
 * @param {number} pvCount
 * @param {string} country
 * @param {string} province
 * @param {string} city
 * @return {boolean}
 */
async function replaceInto (projectId, ucid, firstVisitAt, country, province, city) {
  let tableName = getTableName(projectId)
  let updateAt = moment().unix()
  // 返回值是一个列表
  let oldRecordList = await Knex
    .select([`id`, `first_visit_at`])
    .from(tableName)
    .where('ucid', '=', ucid)
    .catch(() => {
      return []
    })
  // 利用get方法, 不存在直接返回0, 没毛病
  let id = _.get(oldRecordList, [0, 'id'], 0)
  let oldFirstVisitAt = _.get(oldRecordList, [0, 'first_visit_at'], 0)
  let data = {
    ucid,
    first_visit_at: firstVisitAt,
    country,
    province,
    city,
    update_time: updateAt
  }
  let isSuccess = false
  if (id > 0) {
    if (oldFirstVisitAt > 0 && oldFirstVisitAt > firstVisitAt) {
      // 有更新的数据时更新一下
      let affectRows = await Knex(tableName)
        .update(data)
        .where(`id`, '=', id)
      isSuccess = affectRows > 0
    } else {
      return true
    }
  } else {
    data['create_time'] = updateAt
    let insertResult = await Knex.returning('id')
      .insert(data)
      .into(tableName)
      .catch(e => {
        return []
      })
    let insertId = _.get(insertResult, [0], 0)
    isSuccess = insertId > 0
  }
  return isSuccess
}

/**
 * 过滤所有已存在在数据库中的ucid(使用Set, 以便区分Map和Object)
 * @param {*} projectId
 * @param {*} allUcidList
 * @returns {object}
 */
async function filterExistUcidSetInDb (projectId, allUcidList) {
  let tableName = getTableName(projectId)
  let rawRecordList = await Knex
    .select('ucid')
    .from(tableName)
    .whereIn('ucid', allUcidList)
  let existUcidSet = new Set()
  for (let rawRecord of rawRecordList) {
    let ucid = _.get(rawRecord, ['ucid'], '')
    existUcidSet.add(ucid)
  }
  return existUcidSet
}

export default {
  getTableName,

  getList,
  filterExistUcidSetInDb,
  replaceInto
}
