import Knex from '~/src/library/mysql'
import Logger from '~/src/library/logger'

const EVENTS_TABLE_NAME = 't_o_dot_event_info'
const INFO_TABLE_NAME = 't_o_dot_event_props'

/**
 * 用于关联查询事件和事件配置
 * @param {*} project_id 
 * @param {*} event_name 
 */ 
async function query (project_id, event_name = '') {
  let instance = Knex(EVENTS_TABLE_NAME)
  
  let queryResult = await instance
    .select(['project_id', 'event_name', 'props_name', 'props_data_type'])
    // .where({
    //   project_id: project_id,
    //   event_name: event_name
    // })
    .innerJoin(INFO_TABLE_NAME, function () { 
      this.on(`${EVENTS_TABLE_NAME}.id`, '=', `${INFO_TABLE_NAME}.event_id`)
        .andOn(`${EVENTS_TABLE_NAME}.is_delete`, '=', 0)
        .andOn(`${INFO_TABLE_NAME}.is_delete`, '=', 0)
    })
    .catch(err => {
      Logger.log(err.message, 't_o_dot_event_info    query   出错')
      return []
    })
  return queryResult
}

export default {
  query
}
