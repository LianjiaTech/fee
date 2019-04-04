import _ from 'lodash'
import moment from 'moment'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import CModel from '~/src/model'
import API_RES from '~/src/constants/api_res'
import DATE_FORMAT from '~/src/constants/date_format'

let os = RouterConfigBuilder.routerConfigBuilder('/api/os', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  try {
    const tableName = 't_r_system_os'
    const currentMonth = moment().format(DATE_FORMAT.DATABASE_BY_MONTH)
    const month = _.get(req, ['query', 'month'], currentMonth)
    const projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
    const osRecordParams = {
      tableName: tableName,
      where: {
        count_at_month: month,
        project_id: projectId
      },
      projectId: projectId
    }
    const osList = await CModel.getSelect(osRecordParams)
    let resultList = []
    for (let osItem of osList) {
      resultList.push({
        type: osItem['os'],
        key: osItem['os_version'],
        value: osItem['total_count']
      })
    }
    res.send(API_RES.showResult(resultList))
  } catch (err) {
    res.send(API_RES.showError(err.message))
  }
}
)
export default {
  ...os
}
