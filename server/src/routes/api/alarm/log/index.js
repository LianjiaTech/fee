import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import moment from 'moment'
import MAlarmLog from '~/src/model/project/alarm/alarm_log'
import DATE_FORMAT from '~/src/constants/date_format'
import MAlarmConfig from '~/src/model/project/alarm/alarm_config'
import MPerformance from '~/src/model/parse/performance'

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
  let nameMap = {}
  let configIdList = []
  for (let rawResult of rawResultList) {
    let {
      log_count: logCount,
      group_by: sendTime,
      config_id: configId,
      error_name: errorName
    } = rawResult
    configIdList.push(configId)
    if (_.has(configIdMap, [configId]) === false) {
      _.set(configIdMap, [configId], new Set(timeSet))
    }
    let showName = ' 配置ID:' + configId + '  监控指标:' + errorName
    configIdMap[configId].delete(sendTime)
    nameMap[configId] = errorName
    sendTime = transformTimeString(sendTime, formatTimeString)
    resultList.push({
      index: sendTime,
      value: logCount,
      name: showName,
      configId
    })
  }
  // 补全没有的数据
  for (let configId of Object.keys(configIdMap)) {
    for (let timeString of configIdMap[configId]) {
      let formatString = transformTimeString(timeString, formatTimeString)
      resultList.push({
        index: formatString,
        value: 0,
        name: ' 配置ID:' + configId + '  监控指标:' + nameMap[configId],
        configId
      })
    }
  }

  // 如果查询的时间范围内没有数据，则返回空数据
  let templateList = []
  let errorList = []
  let perfList = []
  let configIdTypeMap = {}
  resultList.sort((a, b) => {
    return moment(a['index'], formatTimeString).unix() - moment(b['index'], formatTimeString).unix()
  })
  for (let timeStr of timeSet) {
    let formatString = transformTimeString(timeStr, formatTimeString)
    templateList.push({
      index: formatString,
      value: 0,
      name: ''
    })
  }
  if (resultList.length === 0) {
    errorList = templateList
    perfList = templateList
  } else {
    // 查询configId对应的配置的type，根据type分类
    let rawRecordList = await MAlarmConfig.getByIdList(projectId, configIdList)
    for (let rawRecord of rawRecordList) {
      _.set(configIdTypeMap, [rawRecord['id']], rawRecord['type'])
    }
    for (let resultItem of resultList) {
      if (configIdTypeMap[resultItem['configId']] === MAlarmConfig.ALARM_TYPE_ERROR) {
        errorList.push(resultItem)
      } else {
        if (configIdTypeMap[resultItem['configId']] === MAlarmConfig.ALARM_TYPE_PERFORMANCE) {
          perfList.push(resultItem)
        }
      }
    }
    if (errorList.length === 0) errorList = templateList
    if (perfList.length === 0) perfList = templateList
  }
  // 遍历perfList，把indicator换为易于理解的名字
  let newPerfList = []
  for (let perfItem of perfList) {
    newPerfList.push({
      ...perfItem,
      name: ' 配置ID:' + perfItem['configId'] + '  监控指标:' + MPerformance.INDICATOR_TYPE_MAP[nameMap[perfItem['configId']]]
    })
  }
  let result = { error: errorList, perf: newPerfList }
  res.send(API_RES.showResult(result))
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
