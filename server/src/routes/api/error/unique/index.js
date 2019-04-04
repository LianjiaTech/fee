import moment from 'moment'
import _ from 'lodash'
import MMonitor from '~/src/model/parse/monitor'
import DATE_FORMAT from '~/src/constants/date_format'
import API_RES from '~/src/constants/api_res'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import MErrorSummary from '~/src/model/summary/error_summary'
// import Viser from '~/src/routes/api/error/viser'
import PROVINCE_LIST from '~/src/constants/province'

const PAGE_SIZE = 10
const MAX_URL = 10

/**
 * 提供一个方法, 集中解析request参数
 * @param {*} request
 */
function parseQueryParam (request) {
  let projectId = _.get(request, ['fee', 'project', 'projectId'], 0)
  let startAt = _.get(request, ['query', 'start_at'], 0)
  let endAt = _.get(request, ['query', 'end_at'], 0)
  let url = _.get(request, ['query', 'url'], '')
  let currentPage = _.get(request, ['query', 'current_page'], 1)
  let errorNameListJson = _.get(request, ['query', 'error_name_list_json'], '[]')
  let errorNameList = []
  try {
    errorNameList = JSON.parse(errorNameListJson)
  } catch (error) {
    errorNameList = []
  }

  // 提供默认值
  if (startAt <= 0) {
    startAt = moment().startOf(DATE_FORMAT.UNIT.DAY).unix()
  }
  if (endAt <= 0) {
    endAt = moment().endOf(DATE_FORMAT.UNIT.DAY).unix()
  }

  let parseResult = {
    projectId,
    startAt,
    endAt,
    url,
    currentPage,
    errorNameList
  }
  return parseResult
}

let getErrorDistribution = RouterConfigBuilder.routerConfigBuilder('/api/error/distribution/summary', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const projectId = _.get(req, ['fee', 'project', 'projectId'], 0)

  let errorList = await MErrorSummary.getErrorNameDistributionInLast7DayWithCache(projectId)

  res.send(API_RES.showResult(errorList))
})

/**
 * 错误日志
 */
let getErrorLogList = RouterConfigBuilder.routerConfigBuilder('/api/error/log/list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let parseResult = parseQueryParam(req)
  let {
    projectId,
    errorNameList,
    startAt,
    endAt,
    url,
    currentPage
  } = parseResult
  const offset = (currentPage - 1) * PAGE_SIZE

  let errorCount = await MMonitor.getTotalCountByConditionInSameMonth(projectId, startAt, endAt, offset, PAGE_SIZE, errorNameList, url)
  let errorList = await MMonitor.getListByConditionInSameMonth(projectId, startAt, endAt, offset, PAGE_SIZE, errorNameList, url)

  let pageData = {
    pager: {
      current_page: currentPage,
      page_size: PAGE_SIZE,
      total: errorCount
    },
    list: errorList
  }

  res.send(API_RES.showResult(pageData))
})

/**
 * url分布数
 */
let getUrlDistribution = RouterConfigBuilder.routerConfigBuilder('/api/error/distribution/url', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let parseResult = parseQueryParam(req)
  let {
    projectId,
    startAt,
    endAt,
    errorNameList
  } = parseResult
  let countType = DATE_FORMAT.UNIT.DAY

  let rawDistributionList = await MErrorSummary.getUrlPathDistributionListByErrorNameList(projectId, startAt, endAt, errorNameList, countType, MAX_URL)
  let distributionList = []
  for (let rawDistribution of rawDistributionList) {
    let { url_path: url, error_count: errorCount } = rawDistribution
    let record = {
      name: url,
      value: errorCount
    }
    distributionList.push(record)
  }
  res.send(API_RES.showResult(distributionList))
})

// 指定error_name分布数
let getErrorNameList = RouterConfigBuilder.routerConfigBuilder('/api/error/distribution/error_name', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let parseResult = parseQueryParam(req)
  let {
    projectId,
    startAt,
    endAt,
    url,
    errorNameList
  } = parseResult

  let countType = DATE_FORMAT.UNIT.DAY

  let rawDistributionList = await MErrorSummary.getErrorNameDistributionListInSameMonth(projectId, startAt, endAt, countType, errorNameList, url)
  let distributionList = []
  for (let rawDistribution of rawDistributionList) {
    let { error_count: errorCount, error_name: errorName } = rawDistribution
    let distribution = {
      name: errorName,
      value: errorCount
    }
    distributionList.push(distribution)
  }
  res.send(API_RES.showResult(distributionList))
})

let getGeographyDistribution = RouterConfigBuilder.routerConfigBuilder('/api/error/distribution/geography', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let parseResult = parseQueryParam(req)
  let {
    projectId,
    startAt,
    endAt,
    url,
    errorNameList
  } = parseResult

  let countType = DATE_FORMAT.UNIT.DAY

  const rawRecordList = await MErrorSummary.getList(projectId, startAt, endAt, countType, errorNameList, url)
  let resultList = []
  let distributionMap = {}

  for (let rawRecord of rawRecordList) {
    let cityDistribution = _.get(rawRecord, ['city_distribution'], {})
    // 按省份进行统计
    for (let country of Object.keys(cityDistribution)) {
      let provinceMap = _.get(cityDistribution, [country], {})
      for (let province of Object.keys(provinceMap)) {
        let cityMap = _.get(provinceMap, [province], {})
        for (let city of Object.keys(cityMap)) {
          let errorCount = _.get(cityMap, [city], 0)
          if (_.has(distributionMap, [province])) {
            distributionMap[province] = distributionMap[province] + errorCount
          } else {
            distributionMap[province] = errorCount
          }
        }
      }
    }
  }
  // 只显示国内省份
  for (let province of PROVINCE_LIST) {
    let errorCount = _.get(distributionMap, [province], 0)
    resultList.push({
      name: province,
      value: errorCount
    })
  }
  resultList.sort((a, b) => b['value'] - a['value'])
  res.send(API_RES.showResult(resultList))
})

export default {
  ...getErrorLogList,
  ...getUrlDistribution,

  ...getErrorNameList,
  ...getGeographyDistribution,
  ...getErrorDistribution
}
