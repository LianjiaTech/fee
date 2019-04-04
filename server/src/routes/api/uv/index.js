import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import moment from 'moment'
import _ from 'lodash'
import MUniqueView from '~/src/model/summary/unique_view'
import API_RES from '~/src/constants/api_res'

const getUVCount = RouterConfigBuilder.routerConfigBuilder('/api/uv/count', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
  let st = parseInt(_.get(req, ['query', 'st'], moment().unix() * 1000))
  let et = parseInt(_.get(req, ['query', 'et'], moment().unix() * 1000))

  if (_.isInteger(st) === false || _.isInteger(et) === false) {
    res.send(API_RES.showError('st或et格式不对'))
    return
  }
  st = st / 1000
  et = et / 1000
  const uvReord = await MUniqueView.getUVInRange(projectId, st, et)
  res.send(API_RES.showResult(uvReord))
})

export default {
  ...getUVCount
}
