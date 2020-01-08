import _ from 'lodash'
import moment from 'moment'
import API_RES from '~/src/constants/api_res'
import DATE_FORMAT from '~/src/constants/date_format'
import MEsUV from '~/src/model/elastic_search/summary/uv'
import MProject from '~/src/model/project/project'
import ESDashboard from '~/src/model/elastic_search/summary/dashboard'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'

let getProjectUV = RouterConfigBuilder.routerConfigBuilder(
  '/api/dashboard/uv', RouterConfigBuilder.METHOD_TYPE_GET,
  async (req, res) => {
    let projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
    let startAt = moment(moment().format(DATE_FORMAT.DISPLAY_BY_DAY)).unix()
    let endAt = moment().unix()

    let total = await MEsUV.asyncGetTotalCount(projectId, startAt, endAt)

    res.send(API_RES.showResult(total))
  })

let getProjectLog = RouterConfigBuilder.routerConfigBuilder(
  '/api/dashboard/log', RouterConfigBuilder.METHOD_TYPE_GET,
  async (req, res) => {
    let projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
    let startAt = moment(moment().format(DATE_FORMAT.DISPLAY_BY_DAY)).unix()
    let endAt = moment().unix()
    const projectList = await MProject.getList()
    const data = await ESDashboard.asyncGetLog(startAt, endAt, projectId, projectList)
    
    res.send(API_RES.showResult(data))
  })

  let getPerfLog = RouterConfigBuilder.routerConfigBuilder(
    '/api/dashboard/perf', RouterConfigBuilder.METHOD_TYPE_GET,
    async (req, res) => {
      let projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
      let startAt = moment(moment().format(DATE_FORMAT.DISPLAY_BY_DAY)).unix()
      let endAt = moment().unix()
      const projectList = await MProject.getList()
      const data = await ESDashboard.asyncGetPerLog(startAt, endAt, projectId, projectList)
      res.send(API_RES.showResult(data))
    })

export default {
  ...getProjectUV,
  ...getProjectLog,
  ...getPerfLog
}
