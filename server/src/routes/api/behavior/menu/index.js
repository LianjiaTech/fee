import moment from 'moment'
import DATE_FORMAT from '~/src/constants/date_format'

import MBehaviorDistribution from '~/src/model/parse/behavior_distribution'
import API_RES from '~/src/constants/api_res'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import _ from 'lodash'

const REQUEST_DATE_TYPE = 'YYYY-MM-DD 00:00:00'

/**
 * 只有按星期分布这一种情况
 */
let clickSummaryConfig = RouterConfigBuilder.routerConfigBuilder('/api/behavior/menu', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let startAtMoment = moment(moment().format(REQUEST_DATE_TYPE), REQUEST_DATE_TYPE).subtract(7, 'days')
  let endAtMoment = startAtMoment.clone().add(7, 'days') // 取最近七天的数据

  let rawRecordList = await MBehaviorDistribution.getRecordList(projectId, startAtMoment.unix(), endAtMoment.unix(), DATE_FORMAT.UNIT.DAY)
  let clickDistribution = {}
  for (let rawRecord of rawRecordList) {
    let menuCode = _.get(rawRecord, 'code', 0)
    let totalCount = _.get(rawRecord, 'total_count', 0)
    let menuUrl = _.get(rawRecord, 'url', '')
    let menuName = _.get(rawRecord, 'name', 0)
    if (menuCode === '' || menuCode === 0 || menuUrl === '') {
      continue
    }
    let oldTotalCount = 0
    if (_.has(clickDistribution, menuCode)) {
      oldTotalCount = _.get(clickDistribution, [menuCode, 'totalCount'], 0)
    }
    totalCount = totalCount + oldTotalCount
    _.set(clickDistribution, [menuCode], { menuCode, menuName, menuUrl, totalCount })
  }

  let recordList = []
  for (let objectKey of Object.keys(clickDistribution)) {
    let clickDetail = clickDistribution[objectKey]
    recordList.push({
      ...clickDetail
    })
  }

  try {
    res.send(API_RES.showResult(recordList))
  } catch (err) {
    res.send(API_RES.showError(err.message))
  }
})

export default {
  ...clickSummaryConfig
}
