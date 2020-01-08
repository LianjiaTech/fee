import moment from 'moment'
import _ from 'lodash'
import Base from '~/src/model/elastic_search/base'
import DATE_FORMAT from '~/src/constants/date_format'
import DatabaseUtil from '~/src/library/utils/modules/database'
import Util from '~/src/library/utils/modules/util'

const INDICATOR_TYPE_DNS查询耗时 = 'dns_lookup_ms'
const INDICATOR_TYPE_TCP链接耗时 = 'tcp_connect_ms'
const INDICATOR_TYPE_请求响应耗时 = 'response_request_ms'
const INDICATOR_TYPE_内容传输耗时 = 'response_transfer_ms'
const INDICATOR_TYPE_DOM解析耗时 = 'dom_parse_ms'
const INDICATOR_TYPE_资源加载耗时 = 'load_resource_ms'
const INDICATOR_TYPE_SSL连接耗时 = 'ssl_connect_ms'

const INDICATOR_TYPE_首次渲染耗时 = 'first_render_ms'
const INDICATOR_TYPE_首包时间耗时 = 'first_tcp_ms'
const INDICATOR_TYPE_首次可交互耗时 = 'first_response_ms'
const INDICATOR_TYPE_DOM_READY_耗时 = 'dom_ready_ms'
const INDICATOR_TYPE_页面完全加载耗时 = 'load_complete_ms'
const INDICATOR_TYPE_首屏加载耗时 = 'first_screen_ms'

// 只能通过中括号形式设置key值
const INDICATOR_TYPE_MAP = {}
INDICATOR_TYPE_MAP[INDICATOR_TYPE_DNS查询耗时] = 'DNS查询耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_TCP链接耗时] = 'TCP链接耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_请求响应耗时] = '请求响应耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_内容传输耗时] = '内容传输耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_DOM解析耗时] = 'DOM解析耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_资源加载耗时] = '资源加载耗时'
/**
 * 忽略对secureConnectionStart相关的检测
 * 在saas中, secureConnectionStart中的值都为0, 无法正常计算
 * Chrome本身对secureConnectionStart的实现也有bug, 而且官方不准备修复. https://bugs.chromium.org/p/chromium/issues/detail?id=404501
 * */ 
INDICATOR_TYPE_MAP[INDICATOR_TYPE_SSL连接耗时] = 'SSL连接耗时'

INDICATOR_TYPE_MAP[INDICATOR_TYPE_首包时间耗时] = '首包时间耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_首次渲染耗时] = '首次渲染耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_首次可交互耗时] = '首次可交互耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_DOM_READY_耗时] = 'DOM_READY_耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_页面完全加载耗时] = '页面完全加载耗时'
INDICATOR_TYPE_MAP[INDICATOR_TYPE_首屏加载耗时] = '首屏加载耗时'

// 指标列表
const INDICATOR_TYPE_LIST = Object.keys(INDICATOR_TYPE_MAP)

class Performance extends Base {
  static get GROUP_BY_PAGE_TYPE () {
    return 'pageType'
  }

  static get GROUP_BY_URL () {
    return 'url'
  }

  static get ENV_BY_DEVICE () {
    return 'device'
  }

  static get ENV_BY_OS () {
    return 'os'
  }

  static get ENV_BY_BROWSER () {
    return 'browser'
  }

  static get ENV_BY_PROVINCE () {
    return 'province'
  }

  /**
   * 获取时间范围内url列表(按指定指标排序)
   *
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} indicator
   * @param {*} groupBy
   * @param {*} max
   */
  static async asyncGetUrlDictributionList (projectId, startAt, endAt, indicator = INDICATOR_TYPE_首包时间耗时, groupBy = Performance.GROUP_BY_PAGE_TYPE, max = 100, urlList = []) {
    
    let queryCondition = this.getBaseQuery(startAt, endAt)

    // 根据参数, 决定是按url进行归类, 还是按pageType进行归类
    let groupByField = groupBy === Performance.GROUP_BY_PAGE_TYPE ? 'common.page_type.keyword' : 'detail.url'
    let filterCondition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt
          }
        }
      },
      {
        match: {
          'project_id': projectId
        }
      },
      {
        match: {
          'type': 'perf'
        }
      }
    ]
    let aggregationCondition = {
      'result_summary': {
        'terms': {
          'field': groupByField,
          // 限制总数, 不填默认显示前10个
          'size': max
        },
        aggregations: {
          avg_indicator: {
            avg: {
              'field': `detail.${indicator}`
            }
          }
        }
      }
    }
    if (_.get(urlList, 'length', false)) {
      filterCondition.push({
        terms: {
          [groupByField]: urlList
        }
      })
    }

    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], filterCondition)
    _.set(queryCondition, ['body', 'aggregations'], aggregationCondition)
    
    let response = await this.client.search(queryCondition).catch(error => null)
    if (response === null) {
      return []
    }

    let bucketList = _.get(response, ['aggregations', 'result_summary', 'buckets'], [])
    let resultList = []
    for (let bucket of bucketList) {
      let url = _.get(bucket, ['key'], '')
      let pv = _.get(bucket, ['doc_count'], 0)
      let averageValue = _.get(bucket, ['avg_indicator', 'value'], 0)
      averageValue = Util.parseIntWithDefault(averageValue)
      resultList.push({
        url,
        pv,
        average_value: averageValue
      })
    }
    // 最后按指标均值从小到大排个序
    resultList = _.sortBy(resultList, [item => item.average_value])
    resultList.reverse() // 取反, 改成按从大到小来
    return resultList
  }

  /**
   * 获取性能概览数据
   * 
   * @param {*} projectId 
   * @param {*} startAt 
   * @param {*} endAt 
   * @param {*} groupBy 
   * @param {*} urlList 
   */ 
  static async asyncGetOverview (projectId, startAt, endAt, groupBy = Performance.GROUP_BY_PAGE_TYPE, urlList = []) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    // 根据参数, 决定是按url进行归类, 还是按pageType进行归类
    let groupByField = groupBy === Performance.GROUP_BY_PAGE_TYPE ? 'common.page_type.keyword' : 'detail.url'

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': []
              }

            }
          }
        },
        'aggregations': {}
      }
    }
    let condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt
          }
        }
      },
      {
        match: {
          'project_id': projectId
        }
      },
      {
        match: {
          'type': 'perf'
        }
      }
    ]
    if (urlList.length > 0) {
      condition.push({
        terms: {
          [groupByField]: urlList
        }
      })
    }
    let indicatorConditionMap = {}
    for (let indicator of INDICATOR_TYPE_LIST) {
      indicatorConditionMap[indicator] = {
        'avg': {
          'field': `detail.${indicator}`
        }
      }
    }

    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], condition)
    _.set(queryCondition, ['body', 'aggregations'], indicatorConditionMap)

    let response = await this.client.search(queryCondition)
    let rawIndicatorMap = {}
    for (let indicator of INDICATOR_TYPE_LIST) {
      rawIndicatorMap[indicator] = Math.ceil(_.get(response, ['aggregations', indicator, 'value'], 0))
    }
    return rawIndicatorMap
  }

  /**
   * 获取性能指标数据折线图
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} urlList
   * @param {*} groupBy
   * @param {*} countBy
   */
  static async asyncGetLineChartData (projectId, startAt, endAt, urlList = [], groupBy = Performance.GROUP_BY_PAGE_TYPE, countBy = DATE_FORMAT.UNIT.HOUR) {
    let queryCondition = this.getBaseQuery(startAt, endAt)
    let groupByField = groupBy === Performance.GROUP_BY_PAGE_TYPE ? 'common.page_type.keyword' : 'detail.url'
    let filterCondition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt
          }
        }
      },
      {
        match: {
          'project_id': projectId
        }
      },
      {
        match: {
          'type': 'perf'
        }
      }
    ]

    if (urlList.length > 0) {
      filterCondition.push(
        {
          terms: {
            [groupByField]: urlList
          }
        }
      )
    }

    let aggregationCondition = {
      result_summary: {
        'date_histogram': {
          'field': 'time_ms',
          'interval': countBy
        },
        aggregations: {}
      }
    }
    let indicatorCondition = {}
    for (let indicator of INDICATOR_TYPE_LIST) {
      indicatorCondition[indicator] = {
        'avg': {
          'field': `detail.${indicator}`
        }
      }
    }
    _.set(aggregationCondition, ['result_summary', 'aggregations'], indicatorCondition)

    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], filterCondition)
    _.set(queryCondition, ['body', 'aggregations'], aggregationCondition)

    let response = await this.client.search(queryCondition)

    let rawResultList = _.get(response, ['aggregations', 'result_summary', 'buckets'], [])
    let resultList = []
    
    for (let rawResult of rawResultList) {
      // 默认key是毫秒级时间戳
      let countAtMs = _.get(rawResult, ['key'], '')
      let index = moment.unix(countAtMs / 1000).startOf(countBy).unix()
      let total = _.get(rawResult, ['doc_count'], 0)
      let rawIndicatorMap = {}
      for (let indicator of INDICATOR_TYPE_LIST) {
        rawIndicatorMap[indicator] = _.get(rawResult, [indicator, 'value'], 0) || 0
      }
      let record = {
        index,
        total,
        overview: rawIndicatorMap
      }
      resultList.push(record)
    }

    let defaultRecord = {
      total: 0,
      overview: {}
    }
    for (let indicator of INDICATOR_TYPE_LIST) {
      _.set(defaultRecord, ['overview', indicator], 0)
    }
    // 补全数据
    let paddingResultList = DatabaseUtil.paddingTimeList(resultList, startAt, endAt, countBy, defaultRecord)

    // 拍平数据
    let flattenResultList = []
    for (let paddingResult of paddingResultList) {
      let index = _.get(paddingResult, ['index'], 0)
      let total = _.get(paddingResult, ['total'], 0)
      let overview = _.get(paddingResult, ['overview'], {})
      overview['index'] = index
      overview['total'] = total
      flattenResultList.push(overview)
    }
    return flattenResultList
  }

  /**
   * 获取时间范围内的指标分布
   *
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} groupBy
   * @param {*} max
   */
  static async asyncGetIndicatorDictributionList (projectId, startAt, endAt, groupBy = Performance.GROUP_BY_PAGE_TYPE, urlList = []) {
    let queryCondition = this.getBaseQuery(startAt, endAt)

    // 根据参数, 决定是按url进行归类, 还是按pageType进行归类
    let groupByField = groupBy === Performance.GROUP_BY_PAGE_TYPE ? 'common.page_type.keyword' : 'detail.url'
    let filterCondition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt
          }
        }
      },
      {
        match: {
          'project_id': projectId
        }
      },
      {
        match: {
          'type': 'perf'
        }
      }
    ]
    if (urlList.length > 0) {
      filterCondition.push({
        terms: {
          [groupByField]: urlList
        }
      })
    }
    let aggregationCondition = {}
    for (let indicator of INDICATOR_TYPE_LIST) {
      aggregationCondition[indicator] = {
        // histogram会把所有数据都统计出来, 因此需要再手工处理一把数据, 把超过上限的数据都归为other
        'histogram': {
          // script: INDICATOR_QUERY_SCRIPT_MAP[indicator],
          'field': `detail.${indicator}`,
          'interval': 50, // 每50ms取一次值
          // 最少要有一个数据
          'min_doc_count': 1
        }
      }
    }

    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], filterCondition)
    _.set(queryCondition, ['body', 'aggregations'], aggregationCondition)

    let response = await this.client.search(queryCondition)
    let indicatorDistribution = {}
    for (let indicator of INDICATOR_TYPE_LIST) {
      let bucketList = _.get(response, ['aggregations', indicator, 'buckets'], [])
      let resultList = []
      let resultBufMap = {}
      // 只计算min~max之间的数据, 大于或小于的都会被归集到最外侧
      let min = 50 // 50ms以下作为一个单独区段
      let max = 10 * 1000 // 最大为10s
      let overMaxItemCount = 0
      let lessMinItemCount = 0
      for (let bucket of bucketList) {
        let duringMs = _.get(bucket, ['key'], '')
        let itemCount = _.get(bucket, ['doc_count'], 0)
        if (duringMs < min) {
          lessMinItemCount = lessMinItemCount + itemCount
          continue
        }
        if (duringMs > max) {
          overMaxItemCount = overMaxItemCount + itemCount
          continue
        }
        resultBufMap[duringMs] = itemCount
      }
      resultList.push({
        'during_ms': `<${min}`,
        'item_count': lessMinItemCount
      })
      // 在resultBufMap中按取值
      for (let key = min; key <= max; key = key + 50) {
        let itemCount = _.get(resultBufMap, [key], 0)
        resultList.push({
          'during_ms': key,
          'item_count': itemCount
        })
      }
      resultList.push({
        'during_ms': '>' + max,
        'item_count': overMaxItemCount
      })
      indicatorDistribution[indicator] = resultList
    }
    return indicatorDistribution
  }

  /**
   * 根据环境统计不同数据范围内的百分比, 搜索时一定要注意, 保证检索key存在, 否则会出现null的情况
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} urlList
   * @param {*} groupBy
   * @param {*} envBy
   */
  static async asyncGetPercentLineByEnv (projectId, startAt, endAt, urlList = [], groupBy = Performance.GROUP_BY_PAGE_TYPE, envBy = Performance.ENV_BY_OS) {
    const TIME_DISTRIBUTION_LIST_BY_ASC = [50, 200, 500, 1000, 2500]
    let indexNameList = this.getIndexNameList(startAt, endAt)
    // 根据参数, 决定是按url进行归类, 还是按pageType进行归类
    let groupByField = groupBy === Performance.GROUP_BY_PAGE_TYPE ? 'common.page_type.keyword' : 'detail.url'
    let envByScriptField = ''
    let envAppendQueryCondition = {}
    switch (envBy) {
      case Performance.ENV_BY_DEVICE:
        envAppendQueryCondition = [
          {'exists': {'field': 'ua.device.vendor'}},
          {'exists': {'field': 'ua.device.model'}}
        ]
        envByScriptField = `return doc['ua.device.vendor'].value + '-'  + doc['ua.device.model'].value`
        break
      case Performance.ENV_BY_BROWSER:
        envAppendQueryCondition = [
          {'exists': {'field': 'ua.browser.name'}},
          {'exists': {'field': 'ua.browser.major'}}
        ]
        envByScriptField = `return doc['ua.browser.name'].value + '-'  + doc['ua.browser.major'].value`
        break
      case Performance.ENV_BY_PROVINCE:
        envAppendQueryCondition = [
          {'exists': {'field': 'ua.browser.name'}},
          {'term': {'country': '中国'}}
        ]
        envByScriptField = `return doc['province'].value`
        break
      case Performance.ENV_BY_OS:
      default:
        envAppendQueryCondition = [
          {'exists': {'field': 'ua.os.name'}},
          {'exists': {'field': 'ua.os.version'}}
        ]
        envByScriptField = `return doc['ua.os.name'].value + '-' + doc['ua.os.version'].value`
    }

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': []
              }
            }
          }
        },
        'aggregations': {}
      }
    }
    let condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt
          }
        }
      },
      {
        match: {
          'project_id': projectId
        }
      },
      {
        match: {
          'type': 'perf'
        }
      },
      ...envAppendQueryCondition
    ]
    if (urlList.length > 0) {
      condition.push({
        terms: {
          [groupByField]: urlList
        }
      })
    }
    let indicatorConditionMap = {}
    
    // 数据库中的指标和用于计算的指标并不相同
    for (let indicator of INDICATOR_TYPE_LIST) {
      indicatorConditionMap[indicator] = {
        terms: {
          script: envByScriptField
        },
        aggregations: {
          time_distribution: {
            'percentile_ranks': {
              // script: INDICATOR_QUERY_SCRIPT_MAP[indicator],
              'field': `detail.${indicator}`,
              'values': TIME_DISTRIBUTION_LIST_BY_ASC
            }
          }
        }
      }
    }

    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], condition)
    _.set(queryCondition, ['body', 'aggregations'], indicatorConditionMap)

    let response = await this.client.search(queryCondition)
    let indicatorDistribution = {}

    for (let indicator of INDICATOR_TYPE_LIST) {
      let rawResultList = _.get(response, ['aggregations', indicator, 'buckets'], [])

      let versionDistributionList = []
      for (let rawResult of rawResultList) {
        let version = _.get(rawResult, ['key'], '')
        let total = _.get(rawResult, ['doc_count'], 0)
        let remainPercent = 100 // 剩余比例
        let rawDuringMsDistribution = _.get(rawResult, ['time_distribution', 'values'], {})
        let duringMsDistributionMap = {}

        let lastPercent = 0
        // 算出来的key都是50.0, 100.0这种浮点类型, 需要专门处理成int
        for (let floatDuringMsKey of Object.keys(rawDuringMsDistribution)) {
          let lessThanDuringMsPercent = _.get(rawDuringMsDistribution, [floatDuringMsKey], 0)
          lessThanDuringMsPercent = Util.parseIntWithDefault(lessThanDuringMsPercent * 100) / 100
          let intDuringMsKey = Util.parseIntWithDefault(floatDuringMsKey)
          remainPercent = Util.parseIntWithDefault((100 - lessThanDuringMsPercent) * 100) / 100
          let rangePercent = lessThanDuringMsPercent - lastPercent
          lastPercent = lessThanDuringMsPercent
          // 展示分段占比
          duringMsDistributionMap[intDuringMsKey] = Util.parseIntWithDefault(rangePercent * 100) / 100
        }
        let lastDurngMs = _.get(TIME_DISTRIBUTION_LIST_BY_ASC, [TIME_DISTRIBUTION_LIST_BY_ASC.length - 1], '')
        // 记录超出限额的性能指标比例
        duringMsDistributionMap[`>${lastDurngMs}`] = remainPercent

        versionDistributionList.push({
          version,
          total,
          during_ms_distribution_map: duringMsDistributionMap
        })
      }
      // 后端不排序, 留给前端展示时再排序
      indicatorDistribution[indicator] = versionDistributionList
    }

    return indicatorDistribution
  }

  /**
   * 获取性能指标数据折线图
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} url
   */
  static async asyncGetPerfAvgData (projectId, startAt, endAt, url, indicators = []) {
    let queryCondition = this.getBaseQuery(startAt, endAt)
    let groupByField = 'common.page_type.keyword'
    let filterCondition = [
      {
        match: {
          'project_id': projectId
        }
      },
      {
        match: {
          'type': 'perf'
        }
      },
      {
        match: {
          [groupByField]: url
        }
      }
    ]

    let aggregationCondition = {
      rangeTime: {
        date_histogram: {
          field: 'time_ms',
          interval: 'day',
          offset: '-8h',
          min_doc_count: 0
        },
        aggs: {}
      }
    }
    for (let indicator of indicators) {
      _.set(aggregationCondition, ['rangeTime', 'aggs', indicator], {
        'avg': {
          'field': `detail.${indicator}`
        }
      })
    }
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], filterCondition)
    _.set(queryCondition, ['body', 'aggregations'], aggregationCondition)

    let response = await this.client.search(queryCondition)
    let rawResultList = _.get(response, ['aggregations', 'rangeTime', 'buckets'], [])
    let result = []
    let record = {}
    for (let item of rawResultList) { 
      record = {
        time: moment(item.key).format(DATE_FORMAT.DISPLAY_BY_DAY),
        count: item.doc_count
      }
      indicators.forEach(key => {
        record[key] = item[key].value
      })
      result.push(record)
    }
    return result
  }

  /** **************@todo(yaozeyuan) 以下为为了适配旧接口添加的接口, 待性能页迁移完毕后需要从前后端移除 *****************/

  /**
   * 获取时间范围内的url列表
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} max
   */
  static async asyncGetDistinctUrlListInRange (projectId, startAt, endAt, max = 100) {
    let indexNameList = this.getIndexNameList(startAt, endAt)

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': []
              }
            }
          }
        },
        'aggregations': {
          'result_summary': {
            'terms': {
              'field': 'detail.url',
              // 限制总数, 不填默认显示前10个
              'size': max
            }
          },
          'page_type': {
            'terms': {
              'size': max,
              'field': 'common.page_type.keyword'
            }
          }
        }
      }
    }
    let condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt
          }
        }
      },
      {
        match: {
          'project_id': projectId
        }
      },
      {
        match: {
          'type': 'perf'
        }
      }
    ]
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], condition)

    let response = await this.client.search(queryCondition)
    let bucketList = _.get(response, ['aggregations', 'result_summary', 'buckets'], [])
    let pageTypeList = _.get(response, ['aggregations', 'page_type', 'buckets'], [])

    let transFuc = (list) => { 
      let urlList = []
      for (let bucket of list) {
        let url = _.get(bucket, ['key'], '')
        urlList.push(url)
      }
      urlList = _.uniq(urlList)
      return urlList
    }
    return {
      urlList: transFuc(bucketList),
      pageTypeList: transFuc(pageTypeList)
    }
  }
}

export default Performance
