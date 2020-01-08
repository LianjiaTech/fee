import _ from 'lodash'
import moment from 'moment'
import API_RES from '~/src/constants/api_res'
import DATE_FORMAT from '~/src/constants/date_format'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import MBehaviorES from '~/src/model/elastic_search/summary/behavior'

const REQUEST_FILTER_BY_HOUR = DATE_FORMAT.UNIT.HOUR
const REQUEST_FILTER_BY_DAY = DATE_FORMAT.UNIT.DAY
const REQUEST_FILTER_BY_MONTH = DATE_FORMAT.UNIT.MONTH

let onlineRouterConfig = RouterConfigBuilder.routerConfigBuilder(
  '/api/behavior/online',
  RouterConfigBuilder.METHOD_TYPE_GET,
  async (req, res) => {
    let { filterBy, st, et } = req.query
    let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)

    // 传上来的时间戳是毫秒级的
    st = parseInt(st / 1000)
    et = parseInt(et / 1000)
    let countType = DATE_FORMAT.UNIT.DAY
    switch (filterBy) {
      case REQUEST_FILTER_BY_HOUR:
        countType = DATE_FORMAT.UNIT.HOUR
        break
      case REQUEST_FILTER_BY_DAY:
        countType = DATE_FORMAT.UNIT.DAY
        break
      case REQUEST_FILTER_BY_MONTH:
        countType = DATE_FORMAT.UNIT.MONTH
        break
    }

    let startAt = st
    let endAt = et

    let rawRecordList = await MBehaviorES.asyncGetOnlineDistribution(projectId, startAt, endAt, countType)

    let recordList = []

    let format = ''

    for (let rawRecord of rawRecordList) {
      let { average_ms: value, index } = rawRecord
      let countAtMoment = moment.unix(index)
      let startAtKey = ''
      let endAtKey = ''
      let key = ''
      switch (filterBy) {
        case REQUEST_FILTER_BY_HOUR:
          format = 'MM/DD HH:mm'
          startAtKey = countAtMoment.clone().format(format)
          endAtKey = countAtMoment.clone().add(59, 'minutes').format('HH:mm')
          key = `${startAtKey}~${endAtKey}`
          break
        case REQUEST_FILTER_BY_DAY:
          format = 'YYYY/MM/DD'
          startAtKey = countAtMoment.clone().format(format)
          key = `${startAtKey}`
          break
        case REQUEST_FILTER_BY_MONTH:
          format = 'YYYY/MM/DD'
          startAtKey = countAtMoment.clone().format(format)
          endAtKey = countAtMoment.clone().add(1, 'months').subtract(1, 'days').format(format)
          key = `${startAtKey}~${endAtKey}`
          break
      }
      recordList.push({
        key,
        value,
        index_timestamp_ms: index * 1000
      })
    }
    res.send(API_RES.showResult(recordList))
  })

let onlineTime = RouterConfigBuilder.routerConfigBuilder(
  '/api/behavior/online_time',
  RouterConfigBuilder.METHOD_TYPE_GET,
  async (req, res) => {
    let { filterBy, st, et } = req.query
    let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)

    // 传上来的时间戳是毫秒级的
    st = parseInt(st / 1000)
    et = parseInt(et / 1000)
    let countType = DATE_FORMAT.UNIT.DAY
    switch (filterBy) {
      case REQUEST_FILTER_BY_HOUR:
        countType = DATE_FORMAT.UNIT.HOUR
        break
      case REQUEST_FILTER_BY_DAY:
        countType = DATE_FORMAT.UNIT.DAY
        break
      case REQUEST_FILTER_BY_MONTH:
        countType = DATE_FORMAT.UNIT.MONTH
        break
    }

    let startAt = st
    let endAt = et

    let rawRecordList = await MBehaviorES.asyncGetOnlineDistribution(projectId, startAt, endAt, countType)

    let axis = []
    let list = []
    let format = ''
    for (let rawRecord of rawRecordList) {
      let { average_ms: value, index } = rawRecord
      let countAtMoment = moment.unix(index)
      let startAtKey = ''
      let endAtKey = ''
      let key = ''
      switch (filterBy) {
        case REQUEST_FILTER_BY_HOUR:
          format = 'MM/DD HH:00~HH:59'
          key = countAtMoment.clone().format(format)
          break
        case REQUEST_FILTER_BY_DAY:
          format = 'YYYY/MM/DD'
          startAtKey = countAtMoment.clone().format(format)
          key = `${startAtKey}`
          break
        case REQUEST_FILTER_BY_MONTH:
          format = 'YYYY/MM/DD'
          startAtKey = countAtMoment.clone().format(format)
          endAtKey = countAtMoment.clone().add(1, 'months').subtract(1, 'days').format(format)
          key = `${startAtKey}~${endAtKey}`
          break
      }
      axis.push(key)
      list.push(value)
    }
    let result = {
      axis,
      list
    }
    res.send(API_RES.showResult(result))
  })

export default {
  ...onlineRouterConfig,
  ...onlineTime
}
