import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import MExtraES from '~/src/model/elastic_search/summary/extra'
import _ from 'lodash'
import API_RES from '~/src/constants/api_res'
import MProject from '~/src/model/project/project'
import moment from 'moment/moment'
import DATE_FORMAT from '~/src/constants/date_format'
import MProjetMember from '~/src/model/project/project_member'
import MUser from '~/src/model/project/user'
import MPerformanceES from '~/src/model/elastic_search/summary/performance'
import Performance from '~/src/model/parse/performance'

const { INDICATOR_TYPE_MAP } = Performance

/**
 * 提供一个方法, 集中解析request参数
 * @param {*} request
 */
function parseQueryParam (request) {
  const pid = _.get(request, ['query', 'pid'], 0)
  let pids = _.get(request, ['query', 'pids'], '[]')
  let startAt = _.get(request, ['query', 'startAt'], undefined)
  let endAt = _.get(request, ['query', 'endAt'], undefined)
  const url = _.get(request, ['query', 'url'], undefined)
  const type = _.get(request, ['query', 'type'], undefined)
  const offset = _.get(request, ['query', 'offset'], 0)
  const size = _.get(request, ['query', 'size'], 15)
  const errorName = _.get(request, ['query', 'errorName'], undefined)
  const name = _.get(request, ['query', 'name'], undefined)
  const ua = _.get(request, ['query', 'ua'], undefined)
  const uuid = _.get(request, ['query', 'uuid'], undefined)
  const ucid = _.get(request, ['query', 'ucid'], undefined)
  const fuzzy = _.get(request, ['query', 'fuzzy'], false) // 是否模糊查询
  // 提供默认值
  startAt = moment(startAt).unix()
  endAt = moment(endAt).unix()
  if (!startAt || startAt <= 0) {
    startAt = moment().subtract(7, 'day').startOf(DATE_FORMAT.UNIT.DAY).unix()
  }
  if (!endAt || endAt <= 0) {
    endAt = moment().unix()
  }
  try {
    pids = JSON.parse(pids)
  } catch (e) {
    pids = []
  }
  let parseResult = {
    pid,
    pids,
    startAt,
    endAt,
    type,
    offset,
    size,
    url,
    errorName,
    name,
    ua,
    fuzzy,
    uuid,
    ucid,
  }
  return parseResult
}

async function checkUserPermission (projectId, req) {
  let cookieAccountUcid = _.get(req, ['fee', 'user', 'ucid'], '')
  let cookieAccount = _.get(req, ['fee', 'user', 'account'], '')
  const rawUser = await MUser.getByAccount(cookieAccount)
  if (!rawUser) {
    return '用户信息不正确'
  }
  const rawProjectMemberList = await MProjetMember.getProjectMemberList(
    projectId)
  if (rawUser.role !== 'admin' &&
    !rawProjectMemberList.some(item => item.ucid === cookieAccountUcid)) {
    return '您没有该项目的权限'
  }
  return
}

const querySearch = RouterConfigBuilder.routerConfigBuilder(
  '/api/jsonp/logsList', RouterConfigBuilder.METHOD_TYPE_GET,
  async (req, res) => {
    const query = parseQueryParam(req)
    const { offset, size, pid } = query
    const projectInfo = await  MProject.getProjectByProjectName(pid)
    if (!projectInfo) {
      return res.jsonp(API_RES.badRequest('pid不正确'))
    }
    const { id: projectId } = projectInfo
    const { error, data } = await MExtraES.asyncGetList({ projectId, ...query })
    if (error) {
      return res.jsonp(API_RES.serverError('服务器查询内部错误', error))
    }
    res.jsonp({ ...data, offset, size })
  }, false, false)

const queryPerformance = RouterConfigBuilder.routerConfigBuilder(
  '/api/jsonp/performance', RouterConfigBuilder.METHOD_TYPE_GET,
  async (req, res) => {
    const query = parseQueryParam(req)
    const { startAt, endAt, pids = [] } = query
    const data = {}
    const indicatorTypeMap = INDICATOR_TYPE_MAP
    for (const pid of pids) {
      const projectInfo = await  MProject.getProjectByProjectName(pid)
      if (!projectInfo) {
        return res.jsonp(API_RES.badRequest('pid不正确'))
      }
      //检测用户是否有权限
      const { id: projectId } = projectInfo
      const permissionError = await checkUserPermission(projectId, req)
      if (permissionError) {
        return res.jsonp(API_RES.badRequest(permissionError))
      }
      //去查询性能数据了
      const result = await MPerformanceES.asyncGetOverview(projectId, startAt,
        endAt)
      data[pid] = result
    }
    res.jsonp({ indicatorTypeMap, data })
  }, false)

export default {
  ...querySearch,
  ...queryPerformance,
}