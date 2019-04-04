import _ from 'lodash'
import moment from 'moment'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import LKafka from '~/src/library/kafka/index'
import fs from 'fs'

const getTestLogs = RouterConfigBuilder.routerConfigBuilder('/api/log/content/test', RouterConfigBuilder.METHOD_TYPE_GET, (req, res) => {
  const currentAt = moment().unix() * 1000
  let startAt = _.get(req, ['query', 'st'], currentAt)
  let endAt = _.get(req, ['query', 'et'], currentAt)

  startAt = Math.floor(startAt / 1000)
  endAt = Math.ceil(endAt / 1000)
  const distinctUrlListForLog = new Set()
  for (let start = startAt; start <= endAt; start++) {
    distinctUrlListForLog.add(LKafka.getAbsoluteLogUriByType(start, LKafka.LOG_TYPE_TEST))
  }

  let result = ''
  try {
    for (let uri of distinctUrlListForLog) {
      if (fs.existsSync(uri)) {
        result += fs.readFileSync(uri, 'utf8')
      }
    }
    res.send(API_RES.showResult(result))
  } catch (error) {
    res.send(API_RES.showError(error.message))
  }
}, false, false)

export default {
  ...getTestLogs
}
