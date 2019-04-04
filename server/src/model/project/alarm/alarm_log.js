import Knex from '~/src/library/mysql'
import Logger from '~/src/library/logger'
import moment from 'moment'
import DATE_FORMAT from '~/src/constants/date_format'

const TABLE_COLUMN = [
  `id`,
  `project_id`,
  `config_id`,
  `send_at`,
  `error_type`,
  `error_name`,
  `message`,
  `create_time`,
  `update_time`
]
const BASE_TABLE_NAME = 't_r_alarm_log'

function getTableName () {
  return BASE_TABLE_NAME
}

async function insert (projectId, configId, sendAt, errorName, message) {
  const tableName = getTableName()
  const createTime = moment().unix()
  const updateTime = createTime
  let insertData = {
    project_id: projectId,
    config_id: configId,
    send_at: sendAt,
    error_name: errorName,
    message: message,
    create_time: createTime,
    update_time: updateTime
  }
  const affectRows = Knex
    .insert(insertData)
    .into(tableName)
    .catch(err => {
      Logger.error(err.message)
      return 0
    })
  return affectRows > 0
}

async function getAlarmLogInRange (projectId, startAt, endAt) {
  const tableName = getTableName()
  const result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('send_at', '>', startAt)
    .andWhere('send_at', '<', endAt)
    .andWhere('project_id', projectId)
    .catch((err) => {
      Logger.error(err.message)
      return []
    })
  return result
}

async function getLineAlarmLogInRange (projectId, startAt, endAt) {
  const tableName = getTableName()
  let sqlGroupByFormat = DATE_FORMAT.SQL_GROUP_BY_HOUR
  const resultList = await Knex
    .count('* as log_count')
    .select('config_id', 'error_name', Knex.raw(`FROM_UNIXTIME(\`send_at\`, '${sqlGroupByFormat}') as group_by`))
    .from(tableName)
    .where('send_at', '>', startAt)
    .andWhere('send_at', '<', endAt)
    .andWhere('project_id', projectId)
    .groupBy('config_id', 'error_name', 'group_by')
    .catch(err => {
      Logger.error(err.message)
      return []
    })
  return resultList
}

export default {
  getAlarmLogInRange,
  getTableName,
  insert,
  getLineAlarmLogInRange
}
