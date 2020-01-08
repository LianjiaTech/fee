import _ from 'lodash'
import Knex from '~/src/library/mysql'
import Logger from '~/src/library/logger'

const TableName = 't_o_count_diary'
const TABLE_COLUMN = [
  `id`,
  `project_id`,
  `project_name`,
  `error_total_count`,
  `pv_total_count`,
  `uv_total_count`,
  `error_rank`,
  `error_percent`,
  `count_type`,
  'count_range',
  `count_at_time`,
  `create_time`,
  `update_time`,
]

/**
 * 根据日期和项目id获取日报数据
 * @param {number} projectId
 * @return {object}
 */
async function getDiaryList (projectId, months) {
  const result = await Knex.select(TABLE_COLUMN).
    from(TableName).
    where('project_id', projectId).
    whereIn('count_range', months)

  return result.map(item => {
    const {
      project_id: projectId,
      project_name: projectName,
      error_total_count: errorTotalCount,
      pv_total_count: pvTotalCount,
      uv_total_count: uvTotalCount,
      error_rank: errorRank,
      error_percent: errorPercent,
      count_type: countType,
      count_range: countRange,
      count_at_time: countAtTime,
      create_time,
      update_time,
    } = item

    return {
      projectId,
      projectName,
      errorTotalCount,
      pvTotalCount,
      uvTotalCount,
      errorRank,
      errorPercent,
      countType,
      countRange,
      countAtTime,
      create_time,
      update_time,
    }
  })
}

/**
 * 获取某个/所有项目某天的数据
 * @param {number} countAtTime 记录日期
 * @param {array} pids 项目id
 * @param {number} countType day/week
 * @return {object}
 */
async function getDiaryListByDay ({ countAtTime, pids, countType }) {
  let knex = Knex
    .select(TABLE_COLUMN)
    .from(TableName)
    .where('count_at_time', countAtTime)

  if (pids) knex = knex.whereIn('project_id', pids)
  if (countType) knex = knex.andWhere('count_type', countType)

  const result = knex
    .catch(_err => {
      Logger.warn('t_o_count_diary getDiaryListByDay 出错，错误原因 ===>' + _err.message || _err.stack || _err)
      return []
    })
  return result
}

export default {
  getDiaryList,
  getDiaryListByDay
}
