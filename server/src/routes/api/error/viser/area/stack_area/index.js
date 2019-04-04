import _ from 'lodash'
import moment from 'moment'
import MErrorSummary from '~/src/model/summary/error_summary'
import API_RES from '~/src/constants/api_res'
import DATE_FORMAT from '~/src/constants/date_format'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import DatabaseUtil from '~/src/library/utils/modules/database'

/**
 * 提供一个方法, 集中解析request参数
 * @param {*} request
 */
function parseQueryParam (request) {
  let projectId = _.get(request, ['fee', 'project', 'projectId'], 0)
  let startAt = _.get(request, ['query', 'start_at'], 0)
  let endAt = _.get(request, ['query', 'end_at'], 0)
  let url = _.get(request, ['query', 'url'], '')
  let page = _.get(request, ['query', 'page'], 1)
  let countType = _.get(request, ['query', 'count_type'], DATE_FORMAT.UNIT.HOUR)
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
    page,
    errorNameList,
    countType
  }
  return parseResult
}

let stackArea = RouterConfigBuilder.routerConfigBuilder('/api/error/viser/area/stack_area', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let parseResult = parseQueryParam(req)
  let {
    projectId,
    errorNameList,
    startAt,
    endAt,
    url,
    countType
  } = parseResult
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

  // 需要保证传进来的都是整点的数据
  startAt = moment.unix(startAt).startOf(countType).unix()
  endAt = moment.unix(endAt).endOf(countType).unix()

  let rawRecordList = await MErrorSummary.getStackAreaDistribution(projectId, startAt, endAt, countType, errorNameList, url)

  let errorDistributionMap = {}
  for (let rawRecord of rawRecordList) {
    let errorName = _.get(rawRecord, ['error_name'], '')
    let errorCount = _.get(rawRecord, ['error_count'], 0)
    let countAtTime = _.get(rawRecord, ['count_at_time'], '')

    let countAt = moment(countAtTime, DATE_FORMAT.DATABASE_BY_UNIT[countType]).unix()
    let record = {
      index: countAt,
      name: errorName,
      value: errorCount
    }

    if (_.has(errorDistributionMap, [errorName])) {
      errorDistributionMap[errorName].push(record)
    } else {
      errorDistributionMap[errorName] = [record]
    }
  }

  let rawStackAreaRecordList = []
  let stackAreaRecordList = []

  for (let errorName of Object.keys(errorDistributionMap)) {
    let rawRecordList = errorDistributionMap[errorName]
    let paddingResultList = DatabaseUtil.paddingTimeList(rawRecordList, startAt, endAt, countType, {
      name: errorName,
      value: 0
    })
    // 补全后添加到最终结果中
    rawStackAreaRecordList = rawStackAreaRecordList.concat(paddingResultList)
  }

  // 时间格式化
  for (let rawStackAreaRecord of rawStackAreaRecordList) {
    let index = _.get(rawStackAreaRecord, ['index'], 0)
    let formatedIndex = moment.unix(index).format(displayFormatTpl)
    let stackAreaRecord = {
      ...rawStackAreaRecord,
      index_display: formatedIndex
    }
    stackAreaRecordList.push(stackAreaRecord)
  }

  // 按时间顺序排序
  stackAreaRecordList.sort((a, b) => a['index'] - b['index'])
  res.send(API_RES.showResult(stackAreaRecordList))
})

export default {
  ...stackArea
}
