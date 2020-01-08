import moment from 'moment'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constants/date_format'
import API_RES from '~/src/constants/api_res'
import MPerformance from '~/src/model/parse/performance'
import MPerformanceES from '~/src/model/elastic_search/summary/performance'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import CPerformance from '~/src/commands/summary/per_hour_performance_url_list_summary'
import redis from '~/src/library/redis'

/**
 * 性能指标接口
 *
 * 提供指定项目时间范围内的如下数据(均只取当月数据):
 * 1. 项目下url列表
 * 4. 提供项目整体指标均值
 * 2. 提供指定url下的各项指标平均值(一个接口, 返回所有指标数据)
 * 3. 提供指定url下的各项指标折线图(按url, 指标进行返回)
 */

const MAX_URL_ITEM = 100

/**
 * 获取url列表
 */
let getUrlDistributionList = RouterConfigBuilder.routerConfigBuilder('/api/performance/url/distribution_list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query', 'q'], '{}')
  

  try {
    request = JSON.parse(request)
  } catch (e) {
    request = {}
  }
  // 获取开始&结束时间
  // let startAt = _.get(request, ['startAt'], 0)
  // let endAt = _.get(request, ['endAt'], 0)

  // getByPageType
  let groupBy = _.get(request, ['groupBy'], MPerformanceES.GROUP_BY_PAGE_TYPE)
  let urlList = _.get(request, ['urlList'], [])
  let redisKey = CPerformance.getKey(groupBy, projectId)
  let urlDictributionList = []
  let redisResult = await redis.asyncGetValue(redisKey)
  try {
    urlDictributionList = JSON.parse(redisResult) 
  } catch (error) {
    urlDictributionList = []
  }

  if (urlDictributionList && !urlDictributionList.length) {
    // 如果redis里不存在，则调用CPerformance的asyncGetUrlDictributionList方法，返回结果存到redis里
    urlDictributionList = await CPerformance.asyncGetUrlDictributionList(projectId, MPerformance.INDICATOR_TYPE_页面完全加载耗时, groupBy, 10, urlList)
      .catch(error => {
        throw new Error(`性能查询CPerformance.asyncGetUrlDictributionList部分报错:${error.stack}`)
      })
    await CPerformance.setValue(redisKey, JSON.stringify(urlDictributionList))
  }
  res.send(API_RES.showResult(urlDictributionList))
})

/**
 * 提供时间范围之内指定url的各项指标均值
 */
let getOverview = RouterConfigBuilder.routerConfigBuilder('/api/performance/url/overview', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query', 'q'], '{}')
  try {
    request = JSON.parse(request)
  } catch (e) {
    request = {}
  }
  // 获取开始&结束时间
  let startAt = _.get(request, ['startAt'], 0)
  let endAt = _.get(request, ['endAt'], 0)
  // getByPageType
  let groupBy = _.get(request, ['groupBy'], MPerformanceES.GROUP_BY_PAGE_TYPE)
  let urlList = _.get(request, ['urlList'], [])

  let overview = await MPerformanceES.asyncGetOverview(projectId, startAt, endAt, groupBy, urlList)

  res.send(API_RES.showResult(overview))
})

/**
 * 获取性能指标分布数据
 */
let getIndicatorDistributionList = RouterConfigBuilder.routerConfigBuilder('/api/performance/url/indicator_distribution_list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query', 'q'], '{}')
  try {
    request = JSON.parse(request)
  } catch (e) {
    request = {}
  }
  // 获取开始&结束时间
  let startAt = _.get(request, ['startAt'], 0)
  let endAt = _.get(request, ['endAt'], 0)
  // getByPageType
  let groupBy = _.get(request, ['groupBy'], MPerformanceES.GROUP_BY_PAGE_TYPE)
  let urlList = _.get(request, ['urlList'], [])

  let indicatorDictributionList = await MPerformanceES.asyncGetIndicatorDictributionList(projectId, startAt, endAt, groupBy, urlList)
  res.send(API_RES.showResult(indicatorDictributionList))
})

/**
 * 提供时间范围之内的指定url下所有指标的折线图
 */
let getLineChartData = RouterConfigBuilder.routerConfigBuilder('/api/performance/url/line_chart', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query', 'q'], '{}')
  try {
    request = JSON.parse(request)
  } catch (e) {
    request = {}
  }
  // 获取开始&结束时间
  let startAt = _.get(request, ['startAt'], 0)
  let endAt = _.get(request, ['endAt'], 0)

  let countBy = _.get(request, ['countBy'], DATE_FORMAT.UNIT.HOUR)
  // getByPageType
  let groupBy = _.get(request, ['groupBy'], MPerformanceES.GROUP_BY_PAGE_TYPE)
  let urlList = _.get(request, ['urlList'], [])

  let resultList = await MPerformanceES.asyncGetLineChartData(projectId, startAt, endAt, urlList, groupBy, countBy)
  res.send(API_RES.showResult(resultList))
})
/**
 * 提供按浏览器/设备/操作系统/省份 统计页面打开时间占总数的百分比
 * 区间范围:
 *  0~200ms
 *  200~500ms
 *  500~1000ms
 *  1000~2500ms
 *  >2500
 */
/**
 * 获取各种环境下的数据百分位数
 */
let getPercentLineByEnv = RouterConfigBuilder.routerConfigBuilder('/api/performance/url/percent_line_by_env', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query', 'q'], '{}')
  try {
    request = JSON.parse(request)
  } catch (e) {
    request = {}
  }
  // 获取开始&结束时间
  let startAt = _.get(request, ['startAt'], 0)
  let endAt = _.get(request, ['endAt'], 0)

  // getByPageType
  let groupBy = _.get(request, ['groupBy'], MPerformanceES.GROUP_BY_PAGE_TYPE)
  let urlList = _.get(request, ['urlList'], [])
  let envBy = _.get(request, ['envBy'], MPerformanceES.ENV_BY_OS)

  let resultList = await MPerformanceES.asyncGetPercentLineByEnv(projectId, startAt, endAt, urlList, groupBy, envBy)
  res.send(API_RES.showResult(resultList))
})


/**
 * 获取性能指标的nameList
 */
let perfNameList = RouterConfigBuilder.routerConfigBuilder('/api/performance/name_list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let result = []
  let indicatorTypeMap = MPerformance.INDICATOR_TYPE_MAP
  for (let key of Object.keys(indicatorTypeMap)) {
    result.push({
      label: indicatorTypeMap[key],
      value: key
    })
  }
  res.send(API_RES.showResult(result))
})

/**
 * 提供时间范围之内的所有url列表
 */
let urlList = RouterConfigBuilder.routerConfigBuilder('/api/performance/url_list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let request = _.get(req, ['query'], {})
  // 获取开始&结束时间
  let startAt = _.get(request, ['st'], 0)
  let endAt = _.get(request, ['et'], 0)
  let size = _.get(request, ['size'], MAX_URL_ITEM)

  let listResult = await MPerformanceES.asyncGetDistinctUrlListInRange(projectId, startAt, endAt, size)
  res.send(API_RES.showResult(listResult))
})


export default {
  ...getUrlDistributionList,
  ...getIndicatorDistributionList,
  ...getOverview,
  ...getLineChartData,
  ...getPercentLineByEnv,
  ...perfNameList,
  ...urlList
}
