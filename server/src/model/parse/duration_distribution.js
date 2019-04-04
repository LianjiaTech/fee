import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'
import MCityDistribution from '~/src/model/parse/city_distribution'
import DATE_FORMAT from '~/src/constants/date_format'

const TableName = 't_r_duration_distribution'
const TABLE_COLUMN = [
  `id`,
  `project_id`,
  `total_stay_ms`,
  `total_uv`,
  `count_at_time`,
  `count_type`,
  `city_distribute_id`,
  `create_time`,
  `update_time`
]

/**
 * 获取表名
 * @param {number} projectId 项目id
 * @param {number} createTimeAt 创建时间, 时间戳
 * @return {String}
 */
function getTableName () {
  return TableName
}

/**
 * 自动创建&更新, 并增加total_stay_ms的值
 * @param {number} projectId
 * @param {number} totalStayMs
 * @param {number} totalUv
 * @param {number} countAtTime
 * @param {string} countType
 * @param {object} cityDistribute
 * @return {boolean}
 */
async function replaceUvRecord (projectId, totalStayMs, totalUv, countAtTime, countType, cityDistribute) {
  let tableName = getTableName()
  let updateAt = moment().unix()
  // 返回值是一个列表
  let oldRecordList = await Knex
    .select([`city_distribute_id`, `create_time`, `id`])
    .from(tableName)
    .where('project_id', '=', projectId)
    .andWhere('count_at_time', '=', countAtTime)
    .andWhere('count_type', '=', countType)
    .catch(() => {
      return []
    })
  // 利用get方法, 不存在直接返回0, 没毛病
  let id = _.get(oldRecordList, [0, 'id'], 0)
  let cityDistributeIdInDb = _.get(oldRecordList, [0, 'city_distribute_id'], 0)
  let createTimeInDb = _.get(oldRecordList, [0, 'create_time'], 0)

  let data = {
    project_id: projectId,
    total_uv: totalUv,
    count_at_time: countAtTime,
    update_time: updateAt,
    count_type: countType
  }
  let isSuccess = false
  if (id > 0) {
    // 更新城市分布数据
    let isUpdateSuccess = MCityDistribution.updateCityDistributionRecord(cityDistributeIdInDb, projectId, createTimeInDb, JSON.stringify(cityDistribute))
    if (isUpdateSuccess === false) {
      return false
    }
    data['total_stay_ms'] = totalStayMs
    let affectRows = await Knex(tableName)
      .update(data)
      .where(`id`, '=', id)
    isSuccess = affectRows > 0
  } else {
    // 首先插入城市分布数据
    let cityDistributeId = await MCityDistribution.insertCityDistributionRecord(JSON.stringify(cityDistribute), projectId, updateAt)
    if (cityDistributeId === 0) {
      // 城市分布数据插入失败
      return false
    }
    data['city_distribute_id'] = cityDistributeId
    data['total_stay_ms'] = totalStayMs
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

async function getRecordList (projectId, startAt, finishAt, countType) {
  let tableName = getTableName()
  let countAtTimeList = []
  let dateFormat = DATE_FORMAT.DATABASE_BY_UNIT[countType]
  let addDateRange = 'day'
  switch (countType) {
    case DATE_FORMAT.UNIT.HOUR:
      addDateRange = 'hour'
      break
    case DATE_FORMAT.UNIT.DAY:
      addDateRange = 'day'
      break
    case DATE_FORMAT.UNIT.MONTH:
      addDateRange = 'month'
      break
    default:
      addDateRange = 'month'
  }
  let finishAtMoment = moment.unix(finishAt)

  for (let currentAtMoment = moment.unix(startAt); currentAtMoment.isBefore(finishAtMoment); currentAtMoment = currentAtMoment.clone().add(1, addDateRange)) {
    let currentAtFormated = currentAtMoment.format(dateFormat)
    countAtTimeList.push(currentAtFormated)
  }
  let recordList = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('project_id', projectId)
    .andWhere('count_at_time', 'in', countAtTimeList)
    .andWhere('count_type', '=', countType)
    .orderBy('count_at_time', 'asc')
    .catch(e => {
      return []
    })

  return recordList
}

export default {
  replaceUvRecord,
  getRecordList,
  getTableName
}
