
import _ from 'lodash'
import moment from 'moment'
import API_RES from '~/src/constants/api_res'
import DATE_FORMAT from '~/src/constants/date_format'
import MD_DOT_E_CONFIG from '~/src/model/project/dot/events'
import MD_DOT_P_CONFIG from '~/src/model/project/dot/props'
import MD_DOT_DATA_QUERY from '~/src/model/elastic_search/dot/event'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'

/**
 * 根据筛选条件获取打点数据
 */
let getDataByFilters = RouterConfigBuilder.routerConfigBuilder('/api/dot/data/query', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let body = _.get(req, ['body'], {})
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)

  let by_fields = _.get(body, ['by_fields'], '')
  let start_date = _.get(body, ['start_date'], moment().format(DATE_FORMAT.DATABASE_BY_DAY))
  let end_date = _.get(body, ['end_date'], moment().format(DATE_FORMAT.DATABASE_BY_DAY))
  let conditions = _.get(body, ['filter', 'conditions'], [])
  let relation = _.get(body, ['filter', 'relation'], 'and')

  // 获取measures相关属性
  let field = _.get(body, ['measures', 'field'], '')
  let aggregator = _.get(body, ['measures', 'aggregator'], 'Count')
  let eventName = _.get(body, ['measures', 'event'], '')

  let countType = _.get(body, ['count_type'], 'day')

  let startAt = moment(moment(start_date)).unix()
  let endAt = moment(moment(`${end_date} 23:59:59`)).unix()

  let event = await MD_DOT_E_CONFIG.query(projectId, eventName)
  let ids = event.map(res => res.id)
  let props = await MD_DOT_P_CONFIG.query(ids)

  let propsConfig = props.reduce((pre, cur) => { 
    pre[cur.props_name] = cur.props_data_type
    return pre
  }, {})
  
  let rawRecord = await MD_DOT_DATA_QUERY.asyncGetDotDataByFilter(by_fields, startAt, endAt, projectId, eventName, field, aggregator, conditions, relation, propsConfig, countType)

  let hits = _.get(rawRecord, ['hitResultList'], [])
  let aggs = _.get(rawRecord, ['aggsList'], [])

  let displayFormatTpl = 'MM-DD HH:mm:ss'
  switch (countType) {
    case DATE_FORMAT.UNIT.MINUTE:
      displayFormatTpl = 'D日HH点mm分'
      break
    case DATE_FORMAT.UNIT.HOUR:
      displayFormatTpl = 'D日HH点'
      break
    case DATE_FORMAT.UNIT.DAY:
      displayFormatTpl = 'MM-DD'
      break
    default:
      countType = DATE_FORMAT.UNIT.HOUR
      displayFormatTpl = 'D日HH点'
  }
  let aggregation = []
  let format = (num) => { 
    if (!typeof num === 'number') return 0
    return (/\./).test(num) ? Number(num.toFixed(2)) : num
  }
  for (let agg of aggs) {
    let index = _.get(agg, ['index'], 0)
    let name = _.get(agg, ['name'], '')
    let value = _.get(agg, ['count'], 0)

    let formatedIndex = moment.unix(index).format(displayFormatTpl)
    aggregation.push({
      index,
      name,
      value: format(value),
      display_time: formatedIndex
    })
  }
  
  res.send(API_RES.showResult({
    hits,
    aggregation
  }))
})


export default {
  ...getDataByFilters,
}