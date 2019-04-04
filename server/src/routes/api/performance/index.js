import moment from 'moment'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constants/date_format'
import API_RES from '~/src/constants/api_res'
import MPerformance from '~/src/model/parse/performance'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'

/**
 * 性能指标接口
 *
 * 提供指定项目时间范围内的如下数据(均只取当月数据):
 * 1. 项目下url列表
 * 4. 提供项目整体指标均值
 * 2. 提供指定url下的各项指标平均值(一个接口, 返回所有指标数据)
 * 3. 提供指定url下的各项指标折线图(按url, 指标进行返回)
 */

/**
 * 提供时间范围之内的所有url列表
 */
let urlList = RouterConfigBuilder.routerConfigBuilder('/api/performance/url_list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query'], {})
  // 获取开始&结束时间
  let startAt = _.get(request, ['st'], 0)
  let endAt = _.get(request, ['et'], 0)
  const summaryBy = _.get(request, 'summaryBy', '')
  if (_.includes([DATE_FORMAT.UNIT.DAY, DATE_FORMAT.UNIT.HOUR, DATE_FORMAT.UNIT.MINUTE], summaryBy) === false) {
    res.send(API_RES.showError(`summaryBy参数不正确`))
    return
  }

  const currentStamp = moment().unix()

  if (startAt) {
    startAt = _.floor(startAt / 1000)
  } else {
    startAt = currentStamp
  }
  if (endAt) {
    endAt = _.ceil(endAt / 1000)
  } else {
    endAt = currentStamp
  }
  let urlList = await MPerformance.getDistinctUrlListInRange(projectId, MPerformance.INDICATOR_TYPE_LIST, startAt, endAt, summaryBy)
  res.send(API_RES.showResult(urlList))
}
)

/**
 * 提供时间范围之内指定url的各项指标均值
 */
let urlOverview = RouterConfigBuilder.routerConfigBuilder('/api/performance/url/overview', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query'], {})

  // 获取开始&结束时间
  let startAt = _.get(request, ['st'], 0)
  let endAt = _.get(request, ['et'], 0)
  let url = _.get(request, ['url'])

  const summaryBy = _.get(request, 'summaryBy', '')
  if (_.includes([DATE_FORMAT.UNIT.DAY, DATE_FORMAT.UNIT.HOUR, DATE_FORMAT.UNIT.MINUTE], summaryBy) === false) {
    res.send(API_RES.showError(`summaryBy参数不正确`))
    return
  }

  const currentStamp = moment().unix()

  if (startAt) {
    startAt = _.floor(startAt / 1000)
  } else {
    startAt = currentStamp
  }
  if (endAt) {
    endAt = _.ceil(endAt / 1000)
  } else {
    endAt = currentStamp
  }
  let overview = await MPerformance.getUrlOverviewInSameMonth(projectId, [url], startAt, endAt, summaryBy)

  res.send(API_RES.showResult(overview))
}
)

/**
 * 提供时间范围之内项目总体指标均值
 */
let projectOverview = RouterConfigBuilder.routerConfigBuilder('/api/performance/project/overview', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query'], {})
  // 获取开始&结束时间
  let startAt = _.get(request, ['st'], 0)
  let endAt = _.get(request, ['et'], 0)

  const summaryBy = _.get(request, 'summaryBy', '')
  if (_.includes([DATE_FORMAT.UNIT.DAY, DATE_FORMAT.UNIT.HOUR, DATE_FORMAT.UNIT.MINUTE], summaryBy) === false) {
    res.send(API_RES.showError(`summaryBy参数不正确`))
    return
  }

  const currentStamp = moment().unix()

  if (startAt) {
    startAt = _.floor(startAt / 1000)
  } else {
    startAt = currentStamp
  }
  if (endAt) {
    endAt = _.ceil(endAt / 1000)
  } else {
    endAt = currentStamp
  }
  let urlList = await MPerformance.getDistinctUrlListInRange(projectId, MPerformance.INDICATOR_TYPE_LIST, startAt, endAt, summaryBy)

  let overview = await MPerformance.getUrlOverviewInSameMonth(projectId, urlList, startAt, endAt, summaryBy)

  res.send(API_RES.showResult(overview))
}
)

/**
 * 提供时间范围之内的指定url下所有指标的折线图
 */
let lineChartData = RouterConfigBuilder.routerConfigBuilder('/api/performance/url/line_chart', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query'], {})
  // 获取开始&结束时间
  let startAt = _.get(request, ['st'], 0)
  let endAt = _.get(request, ['et'], 0)
  let url = _.get(request, ['url'], '')

  const summaryBy = _.get(request, 'summaryBy', '')
  if (_.includes([DATE_FORMAT.UNIT.DAY, DATE_FORMAT.UNIT.HOUR, DATE_FORMAT.UNIT.MINUTE], summaryBy) === false) {
    res.send(API_RES.showError(`summaryBy参数不正确`))
    return
  }

  const currentStamp = moment().unix()

  if (startAt) {
    startAt = _.floor(startAt / 1000)
  } else {
    startAt = currentStamp
  }
  if (endAt) {
    endAt = _.ceil(endAt / 1000)
  } else {
    endAt = currentStamp
  }

  let rawResult = {}
  for (let indicator of MPerformance.INDICATOR_TYPE_LIST) {
    let lineChartDataList = await MPerformance.getIndicatorLineChartDataInSameMonth(projectId, url, indicator, startAt, endAt, summaryBy)
    // 适配前端数据结构
    for (let record of lineChartDataList) {
      let { index_timestamp_ms: indexTimestampMs, index, value } = record
      _.set(rawResult, [indexTimestampMs, indicator], value)
      _.set(rawResult, [indexTimestampMs, 'index_timestamp_ms'], indexTimestampMs)
      _.set(rawResult, [indexTimestampMs, 'index'], index)
    }
  }

  let resultList = []
  let timestampMsKeyList = Object.keys(rawResult).sort()
  for (let timestampMsKey of timestampMsKeyList) {
    let record = rawResult[timestampMsKey]
    resultList.push(record)
  }

  res.send(API_RES.showResult(resultList))
}
)

export default {
  ...urlList,
  ...urlOverview,
  ...projectOverview,
  ...lineChartData
}
