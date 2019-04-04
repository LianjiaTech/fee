import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constants/date_format'

const TableNameDateFormat = 'YYYYMM'
const VisitAtHourDateFormat = DATE_FORMAT.DATABASE_BY_HOUR
const BASE_TABLE_NAME = 't_o_uv_record'
const TABLE_COLUMN = [
  `id`,
  `uuid`,
  `country`,
  `province`,
  `city`,
  `visit_at_hour`,
  `pv_count`,
  `create_time`,
  `update_time`
]

/**
 * 获取表名
 * @param {number} projectId 项目id
 * @param {number} createTimeAt 创建时间, 时间戳
 * @return {String}
 */
function getTableName (projectId, createTimeAt) {
  let dateYm = moment.unix(createTimeAt).format(TableNameDateFormat)
  return `${BASE_TABLE_NAME}_${projectId}_${dateYm}`
}

/**
 * 自动创建&更新uv记录(不更新pv, pv无意义)
 * @param {number} projectId
 * @param {string} uuid
 * @param {number} visitAt
 * @param {string} country
 * @param {string} province
 * @param {string} city
 * @return {boolean}
 */
async function replaceUvRecord (projectId, uuid, visitAt, country, province, city) {
  // pv数无意义, 不再计算
  let pvCount = 0

  let visitAtHour = moment.unix(visitAt).format(VisitAtHourDateFormat)
  let tableName = getTableName(projectId, visitAt)
  let updateAt = moment().unix()
  // 返回值是一个列表
  let oldRecordList = await Knex
    .select([`id`])
    .from(tableName)
    .where('uuid', '=', uuid)
    .andWhere('visit_at_hour', '=', visitAtHour)
    .catch(() => {
      return []
    })
  // 利用get方法, 不存在直接返回0, 没毛病
  let id = _.get(oldRecordList, [0, 'id'], 0)
  let data = {
    uuid,
    visit_at_hour: visitAtHour,
    pv_count: pvCount,
    country,
    province,
    city,
    update_time: updateAt
  }
  let isSuccess = false
  if (id > 0) {
    let affectRows = await Knex(tableName)
      .update(data)
      .where(`id`, '=', id)
    isSuccess = affectRows > 0
  } else {
    data['create_time'] = updateAt
    let insertResult = await Knex
      .returning('id')
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
 * 获取指定小时内的uuid列表
 * @param {*} projectId
 * @param {*} uuid
 * @param {*} visitAt
 * @return {Object}
 */
async function getExistUuidSetInHour (projectId, visitAt) {
  let visitAtHour = moment.unix(visitAt).format(VisitAtHourDateFormat)
  let tableName = getTableName(projectId, visitAt)
  let rawRecordList = await Knex
    .select('uuid')
    .from(tableName)
    .where('visit_at_hour', '=', visitAtHour)
    .catch(e => {
      return []
    })
  let uuidSet = new Set()
  for (let rawRecord of rawRecordList) {
    let uuid = _.get(rawRecord, ['uuid'], '')
    uuidSet.add(uuid)
  }
  return uuidSet
}

/**
 * 获取一段时间范围内的按城市分布uv数
 * @param {*} projectId
 * @param {*} startAt
 * @param {*} finishAt
 * @returns {Array}
 */
async function getCityDistributeInRange (projectId, startAt, finishAt) {
  let startAtMoment = moment.unix(startAt)
  let finishAtMoment = moment.unix(finishAt)
  let cityDistribute = {}
  // uv记录表按月分表, 因此需要分月计算总uv
  for (let currentAtMoment = startAtMoment; currentAtMoment.isBefore(finishAtMoment); currentAtMoment = currentAtMoment.clone().add(1, 'months')) {
    let tableName = getTableName(projectId, startAt)
    let rawRecordList = await Knex
      .countDistinct('uuid as uv_count')
      .select([`country`, `province`, `city`])
      .from(tableName)
      .where('create_time', '>', startAt)
      .andWhere('create_time', '<', finishAt)
      .groupBy([`country`, `province`, `city`])
      .catch(() => { return [] })

    for (let rawRecord of rawRecordList) {
      let country = _.get(rawRecord, ['country'], '')
      let province = _.get(rawRecord, ['province'], '')
      let city = _.get(rawRecord, ['city'], '')
      let uvCount = _.get(rawRecord, ['uv_count'], '')

      let locationPath = [country, province, city]
      if (_.has(cityDistribute, locationPath)) {
        uvCount = uvCount + _.get(cityDistribute, locationPath, 0)
      }
      _.set(cityDistribute, locationPath, uvCount)
    }
  }
  return cityDistribute
}

export default {
  replaceUvRecord,
  getExistUuidSetInHour,
  getCityDistributeInRange,
  getTableName
}
