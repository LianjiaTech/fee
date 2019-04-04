import _ from 'lodash'
import moment from 'moment'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import CModel from '~/src/model'
import API_RES from '~/src/constants/api_res'
import DATE_FORMAT from '~/src/constants/date_format'

const runtimeVersion = RouterConfigBuilder.routerConfigBuilder('/api/runtimeVersion', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  try {
    const tableName = 't_r_system_runtime_version'
    const currentMonth = moment().format(DATE_FORMAT.DATABASE_BY_MONTH)
    const month = _.get(req, ['query', 'month'], currentMonth)
    const projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
    const runtimeVersionRecordParams = {
      tableName: tableName,
      where: {
        count_at_month: month,
        project_id: projectId
      },
      projectId: projectId
    }
    const runtimeVersionList = await CModel.getSelect(runtimeVersionRecordParams)
    let resultList = []
    for (let osItem of runtimeVersionList) {
      resultList.push({
        type: osItem['runtime_version'],
        // key: osItem['runtime_version'],
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
  ...runtimeVersion
}
