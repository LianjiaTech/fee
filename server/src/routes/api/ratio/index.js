import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import moment from 'moment'
import API_RES from '~/src/constants/api_res'
import MDiary from '~/src/model/parse/diary'
import ESPerformance from '~/src/model/elastic_search/summary/performance'


/**
 * 提供一个方法, 集中解析request参数
 * @param {*} request
 */
function parseQueryParam (request) {
  const projectId = _.get(request, ['fee', 'project', 'projectId'], 0)
  const startAt = _.get(request, ['query', 'start_at'], 0)
  const endAt = _.get(request, ['query', 'end_at'], 0)
  const type = _.get(request, ['query', 'type'], 'error_num')
  const parseResult = {
    projectId,
    startAt,
    endAt,
    type,
  }
  return parseResult
}

/**
 * 指定error_num分布数
 */
let getRatioErrorDataList = RouterConfigBuilder.routerConfigBuilder(
  '/api/ratio/data/error_num', RouterConfigBuilder.METHOD_TYPE_GET,
  async (req, res) => {

    let parseResult = parseQueryParam(req)
    let {
      projectId,
      startAt,
      endAt,
      type,
    } = parseResult
    // 根据所选的时间段算出中间经历了几个月
    const startAtTime = moment(startAt).unix()
    const endAtTime = moment(endAt).unix()
    const monthSet = new Set()
    let startMonth = startAtTime
    while (startMonth < endAtTime) {
      const month = moment.unix(startMonth).format('YYYY-MM')
      monthSet.add(month)
      startMonth = moment.unix(startMonth).add(1, 'months').unix()
    }
    const months = [...monthSet, moment.unix(endAtTime).format('YYYY-MM')]
    const result = await MDiary.getDiaryList(projectId, months)

    const data = result.map(item => {
      const { countAtTime, countRange } = item
      let value
      switch (type) {
        case 'error_num':
          value = item.errorTotalCount
          break
        case 'error_percent':
          value = item.errorPercent
          break
        case 'error_rank':
          value = item.errorRank
      }
      const day = moment(countAtTime).format('DD')
      return {
        day,
        type: countRange,
        value,
      }
    }).sort(({ day: dayA }, { day: dayB }) => parseInt(dayA) - parseInt(dayB))
    res.send(API_RES.showResult(data))
  })

/**
 * 指定error_num分布数
 */
let getRatioPerfAvgData = RouterConfigBuilder.routerConfigBuilder(
  '/api/ratio/data/perfAvg', RouterConfigBuilder.METHOD_TYPE_GET,
  async (req, res) => {
    const projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
    const startAt = _.get(req, ['query', 'start_at'], 0)
    const endAt = _.get(req, ['query', 'end_at'], 0)
    const pageType = _.get(req, ['query', 'pageType'], '')
    const indicator = _.get(req, ['query', 'indicator'], ['first_render_ms'])

    if (!pageType) res.end(API_RES.showResult(''))
    const result = await ESPerformance.asyncGetPerfAvgData(projectId, startAt, endAt, pageType, indicator).catch(_err => _err.message || _err.stack)
    
    res.send(API_RES.showResult(result))
  })

export default {
  ...getRatioErrorDataList,
  ...getRatioPerfAvgData
}
