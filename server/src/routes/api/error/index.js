import moment from 'moment'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constants/date_format'
import API_RES from '~/src/constants/api_res'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import Viser from '~/src/routes/api/error/viser'
import PROVINCE_LIST from '~/src/constants/province'
import MErrorES from '~/src/model/elastic_search/summary/error'

const PAGE_SIZE = 10
const DEFAULT_SIZE = 10

/**
 * 提供一个方法, 集中解析request参数
 * @param {*} request
 */
function parseQueryParam (request) {
  let projectId = _.get(request, ['fee', 'project', 'projectId'], 0)
  let startAt = _.get(request, ['body', 'start_at'], 0)
  let endAt = _.get(request, ['body', 'end_at'], 0)
  let url = _.get(request, ['body', 'url'], '')
  let detail = _.get(request, ['body', 'detail'], '')
  let currentPage = _.get(request, ['body', 'current_page'], 1)
  let errorNameList = _.get(request, ['body', 'error_name_list'],
    [])
  let errorDetailText = _.get(request, ['body', 'error_detail'], undefined)
  let errorUuid = _.get(request, ['body', 'error_uuid'], undefined)
  let errorUcid = _.get(request, ['body', 'error_ucid'], undefined)
  let size = _.get(request, ['body', 'size'], DEFAULT_SIZE)
  // 提供默认值
  if (startAt <= 0) {
    startAt = moment().subtract(7, 'day').startOf(DATE_FORMAT.UNIT.DAY).unix()
  }
  if (endAt <= 0) {
    endAt = moment().unix()
  }
  let parseResult = {
    projectId,
    startAt,
    endAt,
    url,
    size,
    detail,
    currentPage,
    errorNameList,
    errorDetailText,
    errorUuid,
    errorUcid
  }
  return parseResult
}

let getErrorDistribution = RouterConfigBuilder.routerConfigBuilder(
  '/api/error/distribution/summary', RouterConfigBuilder.METHOD_TYPE_POST,
  async (req, res) => {
    const projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
    let {
      startAt,
      endAt,
    } = parseQueryParam(req)
    startAt = moment.unix(startAt).startOf(DATE_FORMAT.UNIT.DAY).unix()
    endAt = moment.unix(endAt).endOf(DATE_FORMAT.UNIT.DAY).unix()

    let distributionList = await MErrorES.asyncGetErrorNameDistribution(
      projectId, startAt, endAt)
    res.send(API_RES.showResult(distributionList))
  })

/**
 * 错误日志
 */
let getErrorLogList = RouterConfigBuilder.routerConfigBuilder(
  '/api/error/log/list', RouterConfigBuilder.METHOD_TYPE_POST,
  async (req, res) => {
    let parseResult = parseQueryParam(req)
    let {
      projectId,
      errorNameList,
      errorDetailText,
      errorUuid,
      errorUcid,
      startAt,
      endAt,
      url,
      detail,
      currentPage,
    } = parseResult
    const offset = (currentPage - 1) * PAGE_SIZE
    let urlList = []
    if (url.length > 0) {
      urlList.push(url)
    }
    let detailList = []
    if (detail.length > 0) {
      detailList.push(detail)
    }
    let total = await MErrorES.asyncGetTotalCount(projectId, startAt, endAt,
      errorNameList, urlList, detailList, errorDetailText, errorUuid, errorUcid)
    let rawRecordList = await MErrorES.asyncGetList(projectId, startAt, endAt,
      offset, PAGE_SIZE, errorNameList, urlList, detailList, errorDetailText,
      errorUuid, errorUcid)

    let formatRecordList = []
    let index = 0
    // 适配为旧格式
    for (let rawResult of rawRecordList) {
      index = index + 1
      let extraJson = _.get(rawResult, ['extra'], '{}')
      let extra = {}
      try {
        extra = JSON.parse(extraJson)
      } catch (e) {
        extra = extraJson
      }
      let record = {
        id: index,
        error_type: _.get(rawResult, ['code'], 1),
        error_name: _.get(rawResult, ['detail', 'error_no'], ''),
        http_code: _.get(rawResult, ['detail', 'http_code'], 0),
        during_ms: _.get(rawResult, ['detail', 'during_ms'], 0),
        request_size_b: _.get(rawResult, ['detail', 'request_size_b'], 0),
        response_size_b: _.get(rawResult, ['detail', 'response_size_b'], 0),
        url: _.get(rawResult, ['detail', 'url'], ''),
        country: _.get(rawResult, ['country'], ''),
        province: _.get(rawResult, ['province'], ''),
        city: _.get(rawResult, ['city'], ''),
        log_at: _.get(rawResult, ['time'], 0),
        ext: {
          ...rawResult,
          extra,
        },
      }
      formatRecordList.push(record)
    }

    let pageData = {
      pager: {
        current_page: currentPage,
        page_size: PAGE_SIZE,
        total: total,
      },
      list: formatRecordList,
    }
    res.send(API_RES.showResult(pageData))
  })

/**
 * url分布数
 */
let getUrlDistribution = RouterConfigBuilder.routerConfigBuilder(
  '/api/error/distribution/url', RouterConfigBuilder.METHOD_TYPE_POST,
  async (req, res) => {
    let parseResult = parseQueryParam(req)
    let {
      size,
      projectId,
      startAt,
      endAt,
      errorNameList,
      errorUuid,
      errorUcid,
      errorDetailText
    } = parseResult
    let rawDistributionList = await MErrorES.asyncGetUrlDistributionListByErrorNameList(
      projectId, startAt, endAt, errorNameList, errorDetailText, errorUuid,
      errorUcid, size)
    let distributionList = []
    for (let rawDistribution of rawDistributionList) {
      let { url, error_count: errorCount } = rawDistribution
      let record = {
        name: url,
        value: errorCount
      }
      distributionList.push(record)
    }
    res.send(API_RES.showResult(distributionList))
  })
/**
 * 报错详情分布
 */
const getErrorDetailDistribution = RouterConfigBuilder.routerConfigBuilder(
  '/api/error/distribution/error_detail', RouterConfigBuilder.METHOD_TYPE_POST,
  async (req, res) => {
    const parseResult = parseQueryParam(req)
    const {
      size,
      projectId,
      startAt,
      endAt,
      errorDetailList,
      errorNameList,
      errorDetailText,
      errorUuid,
      errorUcid
    } = parseResult

    let rawDistributionList = await MErrorES.asyncGetErrorDetailDistributionList(
      projectId, startAt, endAt, errorNameList, errorDetailList,
      errorDetailText, errorUuid, errorUcid, size)
    // 只取前max个
    let distributionList = []
    for (let rawDistribution of rawDistributionList) {
      let { key, doc_count: errorCount } = rawDistribution
      let record = {
        name: key,
        value: errorCount
      }
      distributionList.push(record)
    }
    res.send(API_RES.showResult(distributionList))
  })

/**
 * 指定error_name分布数
 */
let getErrorNameList = RouterConfigBuilder.routerConfigBuilder(
  '/api/error/distribution/error_name', RouterConfigBuilder.METHOD_TYPE_POST,
  async (req, res) => {
    let parseResult = parseQueryParam(req)
    let {
      projectId,
      startAt,
      endAt,
      url,
      detail,
      errorNameList,
      errorDetailText,
      errorUuid,
      errorUcid
    } = parseResult
    let urlList = []
    if (url.length > 0) {
      urlList.push(url)
    }
    const detailList = []
    if (detail.length > 0) {
      detailList.push(detail)
    }
    let rawDistributionList = await MErrorES.getErrorNameDistributionList(
      projectId, startAt, endAt, errorNameList, urlList, detailList,
      errorDetailText, errorUuid, errorUcid)
    let distributionList = []
    for (let rawDistribution of rawDistributionList) {
      let { error_count: errorCount, error_name: errorName } = rawDistribution
      let distribution = {
        name: errorName,
        value: errorCount,
      }
      distributionList.push(distribution)
    }

    res.send(API_RES.showResult(distributionList))
  })

let getGeographyDistribution = RouterConfigBuilder.routerConfigBuilder(
  '/api/error/distribution/geography', RouterConfigBuilder.METHOD_TYPE_POST,
  async (req, res) => {
    let parseResult = parseQueryParam(req)
    let {
      projectId,
      startAt,
      endAt,
      url,
      detail,
      errorNameList,
      errorDetailText,
      errorUuid,
      errorUcid,
    } = parseResult

    let urlList = []
    if (url.length > 0) {
      urlList.push(url)
    }
    let detailList = []
    if (detail.length > 0) {
      detailList.push(detail)
    }
    const rawResultList = await MErrorES.asyncGetProvinceDistributionList(
      projectId, startAt, endAt, errorNameList, urlList, detailList,
      errorDetailText, errorUuid, errorUcid)
    let provinceMap = {}
    let resultList = []
    // 按国内省份进行补全
    for (let province of PROVINCE_LIST) {
      provinceMap[province] = 1
    }
    for (let rawResult of rawResultList) {
      let { province, error_count: errorCount } = rawResult
      if (provinceMap[province]) {
        resultList.push({
          name: province,
          value: errorCount,
        })
      } else {
        resultList.push({
          name: province,
          value: 0,
        })
      }
    }
    res.send(API_RES.showResult(resultList))
  })

export default {
  ...Viser,
  ...getErrorLogList,
  ...getUrlDistribution,
  ...getErrorDetailDistribution,
  ...getErrorNameList,
  ...getGeographyDistribution,
  ...getErrorDistribution
}
