import moment from 'moment'
import _ from 'lodash'
import API_RES from '~/src/constants/api_res'
import DATE_FORMAT from '~/src/constants/date_format'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import MClientDistributionES from '~/src/model/elastic_search/summary/client_distribution'

const MAX_ITEM_COUNT = 100

let getClientDistribution = RouterConfigBuilder.routerConfigBuilder('/api/client/distribution', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const currentMonth = moment().format(DATE_FORMAT.DATABASE_BY_DAY)
  const month = _.get(req, ['query', 'month'], currentMonth)
  const projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  const type = _.get(req, ['query', 'type'], MClientDistributionES.TYPE_OS)
  let startAt = moment(month, DATE_FORMAT.DATABASE_BY_DAY).startOf('day').unix()
  let endAt = moment(month, DATE_FORMAT.DATABASE_BY_DAY).endOf('day').unix()

  const clientType = [MClientDistributionES.TYPE_RUNTIME_VERSION, MClientDistributionES.TYPE_OS, MClientDistributionES.TYPE_DEVICE, MClientDistributionES.TYPE_BROWSER]
  if (_.includes(clientType, type) === false) {
    res.send(API_RES.showError('type格式不正确'))
    return
  }
  let rawDistributionList = await MClientDistributionES.asyncGetClientDistribution(projectId, startAt, endAt, type, MAX_ITEM_COUNT)
  let distributionList
  switch (type) {
    case MClientDistributionES.TYPE_OS:
      distributionList = dealOS(rawDistributionList)
      break
    case MClientDistributionES.TYPE_BROWSER:
      distributionList = dealBrowser(rawDistributionList)
      break
    case MClientDistributionES.TYPE_DEVICE:
      distributionList = dealDevice(rawDistributionList)
      break
    case MClientDistributionES.TYPE_RUNTIME_VERSION:
      distributionList = dealRunTimeVersion(rawDistributionList)
      break
    default:
      distributionList = []
      break
  }

  res.send(API_RES.showResult(distributionList))
})

function dealOS (rawDistributionList) {
  let distributionList = []
  for (let rawDistribution of rawDistributionList) {
    let osName = _.get(rawDistribution, ['name'], '')
    let detailList = _.get(rawDistribution, ['detail_list'], [])
    for (let detail of detailList) {
      let osVersion = _.get(detail, ['name'], '')
      let totalCountByVersion = _.get(detail, ['total_count'], 0)
      distributionList.push({
        type: osName,
        key: osVersion,
        value: totalCountByVersion
      })
    }
  }
  return distributionList
}
function dealBrowser (rawDistributionList) {
  let distributionList = []
  for (let rawDistribution of rawDistributionList) {
    let browserName = _.get(rawDistribution, ['name'], '')
    let detailList = _.get(rawDistribution, ['detail_list'], [])
    for (let detail of detailList) {
      let browserVersion = _.get(detail, ['name'], '')
      let totalCountByVersion = _.get(detail, ['total_count'], 0)
      // 将浏览器版本 chromium_ver 改为 50.0.2661.102
      if (browserVersion === 'chromium_ver') {
        browserVersion = '50'
      }

      distributionList.push({
        total_count: totalCountByVersion,
        version: browserVersion,
        browser: browserName
      })
    }
  }
  return distributionList
}
function dealDevice (rawDistributionList) {
  let distributionList = []
  for (let rawDistribution of rawDistributionList) {
    let osName = _.get(rawDistribution, ['name'], '')
    let detailList = _.get(rawDistribution, ['detail_list'], [])
    for (let detail of detailList) {
      let osVersion = _.get(detail, ['name'], '')
      let totalCountByVersion = _.get(detail, ['total_count'], 0)
      distributionList.push({
        type: osName,
        key: osVersion,
        value: totalCountByVersion
      })
    }
  }
  return distributionList
}
function dealRunTimeVersion (rawDistributionList) {
  let distributionList = []
  for (let rawDistribution of rawDistributionList) {
    let runtimeVersion = _.get(rawDistribution, ['name'], '')
    let totalCount = _.get(rawDistribution, ['total_count'], 0)

    distributionList.push({
      type: runtimeVersion,
      // key: osItem['runtime_version'],
      value: totalCount
    })
  }
  return distributionList
}
export default {
  ...getClientDistribution
}
