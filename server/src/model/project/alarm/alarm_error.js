import _ from 'lodash'
import moment from 'moment'

import Knex from '~/src/library/mysql'
import Logger from '~/src/library/logger'
import MErrorES from '~/src/model/elastic_search/summary/error'

const TABLE_COLUMN = [
  `id`,
  `error_es_id`,
  `alarm_log_id`,
  `create_time`,
  `project_id`,
  `es_index_name`
]
const BASE_TABLE_NAME = 't_o_alarm_es_id'

function getTableName () {
  return BASE_TABLE_NAME
}

/**
 * 插入错误记录
 * @param {*} id error ID
 * @param {*} alarmLogId 报警log ID
 * @param {*} projectId 项目ID
 * @param {*} _indexName es索引名称
 */ 
async function insert(id, alarmLogId, projectId, _indexName) {
  const tableName = getTableName()
  const createTime = moment().unix()
  let insertData = {
    error_es_id: id,
    alarm_log_id: alarmLogId,
    create_time: createTime,
    project_id: projectId,
    es_index_name: _indexName
  }
  const affectRows = await Knex
    .insert(insertData)
    .into(tableName)
    .catch(err => {
      Logger.error('alarm_error.js => insert', err)
      return false
    })
  return affectRows
}

/**
 * 清除基于baseTime，days天前的log
 * @param {*} days
 */ 
async function clear(days) { 
  const tableName = getTableName()
  const affectRows = await Knex
    .delete()
    .from(tableName)
    .where('create_time', '<=', moment(moment().subtract(days, 'days')).unix())
    .catch(err => { 
      Logger.error(`alarm_error.js => delete`, err)
      return false
    })
  return affectRows
}

/**
 * 查询指定项目的指定报警log的报警详情信息
 * @param {int} logId alarm log ID
 * @param {int} projectId 项目ID
 * @returns {Array} 错误id list
 */ 
async function getEsIdsByAlarmLogId(logId, projectId, columns = TABLE_COLUMN) { 
  const tableName = getTableName()
  const result = await Knex
    .distinct()
    .select(columns)
    .from(tableName)
    .where('alarm_log_id', logId)
    .andWhere('project_id', projectId)
    .catch(err => { 
      Logger.error('alarm_error.js => getEsIdsByAlarmLogId', err)
      return []
    })
  return result
}

/**
 * 根据projectId & alarmLogId分页查询ES中所有报警错误详情
 * @param {*} lid alarmLogId
 * @param {*} pid projectId
 * @param {*} page 请求页码
 * @param {*} size 每页数据条数
 */ 
async function getErrorListByIds(lid, pid, page, size) { 
  const idsRes = await getEsIdsByAlarmLogId(lid, pid, [`error_es_id`])
  const indexRes = await getEsIdsByAlarmLogId(lid, pid, [`es_index_name`])

  let _errIds = JSON.parse(JSON.stringify(idsRes)).map(item => item.error_es_id)
  let _indexNames = JSON.parse(JSON.stringify(indexRes)).map(item => item.es_index_name)

  const result = await MErrorES.asyncGetErrorDetailList(pid, _errIds, _indexNames, (page-1)*size, size).catch(err => { 
    Logger.error('alarm_log.js => getErrorListByIds', err)
    return []
  })

  return {
    result,
    total: _errIds.length || 0
  }
}

export default {
  getTableName,
  insert,
  clear,
  getEsIdsByAlarmLogId,
  getErrorListByIds
}