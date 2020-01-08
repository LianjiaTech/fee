import _ from 'lodash'
import moment from 'moment'
import API_RES from '~/src/constants/api_res'
import DATE_FORMAT from '~/src/constants/date_format'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import MErrorES from '~/src/model/elastic_search/summary/error'

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
  let countType = _.get(request, ['body', 'count_type'], 'hour')
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
    detail,
    currentPage,
    errorNameList,
    errorDetailText,
    errorUuid,
    errorUcid,
    countType
  }
  return parseResult
}

let stackArea = RouterConfigBuilder.routerConfigBuilder(
  '/api/error/viser/area/stack_area', RouterConfigBuilder.METHOD_TYPE_POST,
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

    let urlList = []
    if (url.length > 0) {
      urlList.push(url)
    }
    const detailList = []
    if (detail.length > 0) {
      detailList.push(detail)
    }
    let rawRecordList = await MErrorES.asyncGetStackAreaDistribution(projectId,
      startAt, endAt, countType, errorNameList, urlList, detailList,
      errorDetailText, errorUuid, errorUcid)

    let recordList = []
    for (let rawRecord of rawRecordList) {
      let index = _.get(rawRecord, ['index'], 0)
      let errorName = _.get(rawRecord, ['error_name'], '')
      let errorCount = _.get(rawRecord, ['error_count'], 0)

      let formatedIndex = moment.unix(index).format(displayFormatTpl)
      recordList.push({
        index: index,
        name: errorName,
        value: errorCount,
        index_display: formatedIndex
      })
    }

    res.send(API_RES.showResult(recordList))
  })

export default {
  ...stackArea
}
