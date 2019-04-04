import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import moment from 'moment'
import MAlarmLog from '~/src/model/project/alarm/alarm_log'
import DATE_FORMAT from '~/src/constants/date_format'

const getAlarmLog = RouterConfigBuilder.routerConfigBuilder('/api/alarm/log', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const nowMoment = moment()
  const sevenDaysAgoMoment = nowMoment.clone().subtract(7, DATE_FORMAT.UNIT.DAY)
  let startAt = parseInt(_.get(req, ['query', 'st'], sevenDaysAgoMoment.unix() * 1000))
  let endAt = parseInt(_.get(req, ['query', 'et'], nowMoment.unix() * 1000))
  const projectId = _.get(req, ['fee', 'project', 'projectId'], 1)

  if (_.isInteger(startAt) === false || _.isInteger(endAt) === false) {
    res.send(API_RES.showError('et或st格式不对'))
  }

  // 将时间戳换成秒级
  startAt = startAt / 1000
  endAt = endAt / 1000
  let rawRecordList = await MAlarmLog.getAlarmLogInRange(projectId, startAt, endAt)
  let recordList = rawRecordList.sort((a, b) => b['send_at'] - a['send_at'])
  res.send(API_RES.showResult(recordList))
})

const getLineAlarmLog = RouterConfigBuilder.routerConfigBuilder('/api/alarm/log/line', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const nowMoment = moment(moment().format('YYYY-MM-DD HH:00'))
  const sevenDaysAgoMoment = moment(nowMoment.clone().subtract(7, DATE_FORMAT.UNIT.DAY).format('YYYY-MM-DD HH:59'))
  const query = _.get(req, ['query'], {})
  const startAt = parseInt(_.get(query, ['st'], sevenDaysAgoMoment.unix()))
  const endAt = parseInt(_.get(query, ['et'], nowMoment.unix()))
  const projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
  const isShowDay = moment.unix(startAt).format('YYYY-MM-DD') !== moment.unix(endAt).format('YYYY-MM-DD')
  let formatTimeString
  if (isShowDay) {
    formatTimeString = 'YYYY-MM-DD HH:00~HH:59'
  } else {
    formatTimeString = 'HH:00~HH:59'
  }
  if (_.isInteger(startAt) === false || _.isInteger(endAt) === false) {
    res.send(API_RES.showError('st或et格式错误'))
    return
  }
  let timeSet = getTimeSetByHour(startAt, endAt)
  let rawResultList = await MAlarmLog.getLineAlarmLogInRange(projectId, startAt, endAt)
  let resultList = []
  let configIdMap = {}
  let showNameMap = {}
  for (let rawResult of rawResultList) {
    let {
      log_count: logCount,
      group_by: sendTime,
      config_id: configId,
      error_name: errorName
    } = rawResult
    if (_.has(configIdMap, [configId]) === false) {
      _.set(configIdMap, [configId], new Set(timeSet))
    }
    let showName = ' 配置ID:' + configId + '  监控错误:' + errorName
    configIdMap[configId].delete(sendTime)
    showNameMap[configId] = showName
    sendTime = transformTimeString(sendTime, formatTimeString)
    resultList.push({
      index: sendTime,
      value: logCount,
      name: showName
    })
  }
  // 补全没有的数据
  for (let configId of Object.keys(configIdMap)) {
    for (let timeString of configIdMap[configId]) {
      let formatString = transformTimeString(timeString, formatTimeString)
      resultList.push({
        index: formatString,
        value: 0,
        name: showNameMap[configId]
      })
    }
  }
  // 如果查询的时间范围内没有数据，则返回空数据
  if (resultList.length === 0) {
    for (let timeStr of timeSet) {
      let formatString = transformTimeString(timeStr, formatTimeString)
      resultList.push({
        index: formatString,
        value: 0,
        name: ''
      })
    }
  }
  resultList.sort((a, b) => {
    return moment(a['index'], formatTimeString).unix() - moment(b['index'], formatTimeString).unix()
  })
  res.send(API_RES.showResult(resultList))
})

function getTimeSetByHour (startAt, endAt) {
  let timeSet = new Set()
  let startMoment = moment(moment.unix(startAt).format('YYYY-MM-DD HH:00:00'))
  let endMoment = moment(moment.unix(endAt).format('YYYY-MM-DD HH:59:59'))
  for (let timeAt = startMoment.unix(); timeAt <= endMoment.unix(); timeAt += 3600) {
    let timeString = moment.unix(timeAt).format('YYYY-MM-DD HH')
    timeSet.add(timeString)
  }
  return timeSet
}

function transformTimeString (timeString, formatTimeString) {
  return moment(timeString).format(formatTimeString)
}
export default {
  ...getAlarmLog,
  ...getLineAlarmLog
}
