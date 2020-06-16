import _ from 'lodash'

import Knex from '~/src/library/mysql'
import Logger from '~/src/library/logger'

const ERROR_TABLE_NAME = `t_o_count_diary`
const PERF_TABLE_NAME = `t_r_count_daily`

const ERROR_COLUMNS = [
  `error_total_count`,
  `pv_total_count`,
  `uv_total_count`,
  `ucid_total_count`,
  `error_percent`
]
const PERF_COLUMNS = [
  `first_render_ms`,
  `first_response_ms`,
  `first_tcp_ms`
]

async function getHistoryData (pid, countType, countAtTime) {
  let colums = [
    ...ERROR_COLUMNS.map(item => `${ERROR_TABLE_NAME}.${item}`),
    ...PERF_COLUMNS.map(item => `${PERF_TABLE_NAME}.${item}`)
  ]
  let result = await Knex
    .select(colums)
    .from(ERROR_TABLE_NAME)
    .innerJoin(PERF_TABLE_NAME, function () {
      this.on(`${ERROR_TABLE_NAME}.project_id`, '=', `${PERF_TABLE_NAME}.project_id`)
        .andOn(`${ERROR_TABLE_NAME}.count_type`, '=', `${PERF_TABLE_NAME}.count_type`)
        .andOn(`${ERROR_TABLE_NAME}.count_at_time`, '=', `${PERF_TABLE_NAME}.count_at_time`)
    })
    .where(`${ERROR_TABLE_NAME}.project_id`, '=', pid)
    .andWhere(`${ERROR_TABLE_NAME}.count_type`, '=', countType)
    .andWhere(`${ERROR_TABLE_NAME}.count_at_time`, '=', countAtTime)
    .catch(e => {
      Logger.error(`获取历史日报数据出错，出错原因 ====> ${e.message || e.stack || e}`)
    })
  return _.get(result, 0, {})
}

export default {
  getHistoryData
}
