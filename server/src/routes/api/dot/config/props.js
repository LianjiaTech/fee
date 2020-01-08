
import _ from 'lodash'
import API_RES from '~/src/constants/api_res'
import MD_DOT_P_CONFIG from '~/src/model/project/dot/props'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'

/**
 * 根据配置id查询配置属性
 */
let getPropsById = RouterConfigBuilder.routerConfigBuilder('/api/dot/config/props/:id', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let event_id = _.get(req, ['params', 'id'], '')
  if (!event_id) res.send(API_RES.showError('缺少查询参数【id】'))
  let data = await MD_DOT_P_CONFIG.query(event_id)
  res.send(API_RES.showResult(data))
})

export default {
  ...getPropsById,
}


