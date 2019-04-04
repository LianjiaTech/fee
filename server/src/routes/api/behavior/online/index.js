import _ from 'lodash'
import moment from 'moment'
import MDurationDistribution from '~/src/model/parse/duration_distribution'
import API_RES from '~/src/constants/api_res'
import DATE_FORMAT from '~/src/constants/date_format'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'

const REQUEST_FILTER_BY_HOUR = 'hour'
const REQUEST_FILTER_BY_DAY = 'day'
const REQUEST_FILTER_BY_WEEK = 'week'
const REQUEST_FILTER_BY_MONTH = 'month'

async function online (req, res) {
  let { filterBy, st, et } = req.query
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)

  // 传上来的时间戳是毫秒级的
  st = parseInt(st / 1000)
  et = parseInt(et / 1000)
  let startAtMoment = moment.unix(st)
  let endAtMoment = moment.unix(et)
  let countType = DATE_FORMAT.UNIT.DAY
  let momentIncreaceStep = 'hours'
  switch (filterBy) {
    case REQUEST_FILTER_BY_HOUR:
      countType = DATE_FORMAT.UNIT.HOUR
      momentIncreaceStep = 'hours'
      break
    case REQUEST_FILTER_BY_DAY:
      countType = DATE_FORMAT.UNIT.DAY
      momentIncreaceStep = 'days'
      break
    case REQUEST_FILTER_BY_WEEK:
      countType = DATE_FORMAT.UNIT.DAY
      momentIncreaceStep = 'weeks'
      break
    case REQUEST_FILTER_BY_MONTH:
      countType = DATE_FORMAT.UNIT.MONTH
      momentIncreaceStep = 'months'
      break
  }

  let rawRecordList = await MDurationDistribution.getRecordList(projectId, startAtMoment.unix(), endAtMoment.unix(), countType)

  let orderMap = new Map()
  // 对于按周期查看的情况, 需要保证在周期内有所有的数据
  for (let checkAtMoment = startAtMoment.clone(); checkAtMoment.isBefore(endAtMoment); checkAtMoment = checkAtMoment.clone().add(1, momentIncreaceStep)) {
    let startAtKey = ''
    let endAtKey = ''
    let format = ''
    let resultKey = ''
    switch (filterBy) {
      case REQUEST_FILTER_BY_HOUR:
        format = 'MM/DD HH:mm'
        startAtKey = checkAtMoment.clone().format('MM/DD HH:mm')
        endAtKey = checkAtMoment.clone().add(59, 'minutes').format('HH:mm')
        resultKey = `${startAtKey}~${endAtKey}`
        break
      case REQUEST_FILTER_BY_DAY:
        format = 'YYYY/MM/DD'
        startAtKey = checkAtMoment.clone().format(format)
        // endAtKey = checkAtMoment.clone().subtract(1, 'days').format(format)
        resultKey = `${startAtKey}`
        break
      case REQUEST_FILTER_BY_WEEK:
        format = 'YYYY/MM/DD'
        startAtKey = checkAtMoment.clone().format(format)
        endAtKey = checkAtMoment.clone().add(6, 'days').format(format)
        resultKey = `${startAtKey}~${endAtKey}`
        break
      case REQUEST_FILTER_BY_MONTH:
        format = 'YYYY/MM/DD'
        startAtKey = checkAtMoment.clone().format('YYYY/MM/01')
        endAtKey = moment(checkAtMoment.clone().format('YYYY/MM/01'), 'YYYY/MM/DD').add(1, 'months').subtract(1, 'days').format(format)
        resultKey = `${startAtKey}~${endAtKey}`
        break
    }

    orderMap.set(checkAtMoment.format(DATE_FORMAT.DATABASE_BY_UNIT[countType]), {
      key: resultKey,
      value: 0 // 默认为0
    })
  }

  let recordList = []
  for (let rawRecord of rawRecordList) {
    let countAtTime = rawRecord['count_at_time']
    let countAtMoment = moment(countAtTime, DATE_FORMAT.DATABASE_BY_UNIT[countType])

    let startAtKey = ''
    let endAtKey = ''
    let format = ''
    let resultKey = ''
    switch (filterBy) {
      case REQUEST_FILTER_BY_HOUR:
        format = 'MM/DD HH:mm'
        startAtKey = countAtMoment.clone().format('MM/DD HH:mm')
        endAtKey = countAtMoment.clone().add(59, 'minutes').format('HH:mm')
        resultKey = `${startAtKey}~${endAtKey}`
        break
      case REQUEST_FILTER_BY_DAY:
        format = 'YYYY/MM/DD'
        startAtKey = countAtMoment.clone().format(format)
        // endAtKey = countAtMoment.clone().subtract(1, 'days').format(format)
        resultKey = `${startAtKey}`
        break
      case REQUEST_FILTER_BY_WEEK:
        format = 'YYYY/MM/DD'
        startAtKey = countAtMoment.clone().format(format)
        endAtKey = countAtMoment.clone().add(6, 'days').format(format)
        resultKey = `${startAtKey}~${endAtKey}`
        break
      case REQUEST_FILTER_BY_MONTH:
        format = 'YYYY/MM/DD'
        startAtKey = countAtMoment.clone().format(format)
        endAtKey = countAtMoment.clone().add(1, 'months').subtract(1, 'days').format(format)
        resultKey = `${startAtKey}~${endAtKey}`
        break
    }

    // 平均在线时长
    let tosMs = parseInt(_.divide(rawRecord['total_stay_ms'], rawRecord['total_uv']))
    if (!tosMs) {
      tosMs = 0
    }
    let record = {
      key: resultKey,
      value: tosMs,
      index_timestamp_ms: countAtMoment.unix() * 1000 // 折线图数据添加时间戳
    }
    orderMap.set(countAtMoment.format(DATE_FORMAT.DATABASE_BY_UNIT[countType]), record)
    recordList.push(record)
  }

  // 对于按周期查看的情况, 需要保证在周期内有所有的数据
  let bufRecordList = []
  for (let bufRecord of orderMap.values()) {
    bufRecordList.push(bufRecord)
  }
  recordList = bufRecordList

  try {
    res.send(API_RES.showResult(recordList))
  } catch (err) {
    res.send(API_RES.showError(err.message))
  }
}

let onlineRouterConfig = RouterConfigBuilder.routerConfigBuilder(
  '/api/behavior/online',
  RouterConfigBuilder.METHOD_TYPE_GET,
  online
)

export default {
  ...onlineRouterConfig
}
