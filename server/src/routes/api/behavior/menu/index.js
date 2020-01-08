import _ from 'lodash'
import MBehaviorES from '~/src/model/elastic_search/summary/behavior'
import API_RES from '~/src/constants/api_res'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'

/**
 * 只有按星期分布这一种情况
 */
let clickSummaryConfig = RouterConfigBuilder.routerConfigBuilder('/api/behavior/menu', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
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

  let distributionList = await MBehaviorES.asyncGetMenuClickDistribution(projectId, startAt, endAt)
  res.send(API_RES.showResult(distributionList))
})

export default {
  ...clickSummaryConfig
}
