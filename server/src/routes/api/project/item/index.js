/**
 * 项目处理
 */
import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import MUser from '~/src/model/project/user'
import MProject from '~/src/model/project/project'
import MProjetMember from '~/src/model/project/project_member'

let detail = RouterConfigBuilder.routerConfigBuilder('/api/project/item/detail', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let id = parseInt(_.get(req, ['query', 'id'], 0))

  if (_.isInteger(id) === false) {
    res.send(API_RES.showError('参数错误'))
    return
  }

  let project = await MProject.get(id)
  project = MProject.formatRecord(project)

  if (_.isEmpty(project)) {
    res.send(API_RES.showError(`项目id:${id}不存在`))
  } else {
    res.send(API_RES.showResult(project))
  }
}, false)

let add = RouterConfigBuilder.routerConfigBuilder('/api/project/item/add', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let body = _.get(req, ['body'], {})
  let displayName = _.get(body, ['displayName'], '')
  let projectName = _.get(body, ['projectName'], '')
  let cDesc = _.get(body, ['cDesc'], '')
  let createUcid = _.get(req, ['fee', 'user', 'ucid'], '0')
  let updateUcid = createUcid

  // 检查权限
  let isAdmin = await MUser.isAdmin(createUcid)
  if (isAdmin === false) {
    return res.send(API_RES.noPrivilege('只有管理员才可以添加项目'))
  }

  let insertData = {
    project_name: projectName,
    display_name: displayName,
    c_desc: cDesc,
    create_ucid: createUcid,
    update_ucid: updateUcid
  }
  let isSuccess = await MProject.add(insertData)

  if (isSuccess) {
    res.send(API_RES.showResult([], '添加成功'))
  } else {
    res.send(API_RES.showError('添加失败'))
  }
}, false)

let list = RouterConfigBuilder.routerConfigBuilder('/api/project/item/list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let ucid = _.get(req, ['fee', 'user', 'ucid'], '0')
  let offset = 0
  let max = 50

  // 判断是否是管理员，如果是，返回全部项目列表
  const isAdmin = await MUser.isAdmin(ucid)
  if (isAdmin) {
    let rawProjectList = await MProject.getList()
    let projectList = []
    for (let rawProject of rawProjectList) {
      let project = MProject.formatRecord(rawProject)
      project = {
        ...project,
        role: MProjetMember.ROLE_OWNER,
        need_alarm: 0
      }
      projectList.push(project)
    }
    res.send(API_RES.showResult(projectList))
    return
  }

  // 去project_member里拿到ucid对应的项目成员
  let rawProjectMemberList = await MProjetMember.getProjectMemberListByUcid(ucid, offset, max)
  let projectIdList = []
  let projectMap = {} // 以projectId为key
  for (let rawProjectMember of rawProjectMemberList) {
    let id = rawProjectMember['project_id']
    projectMap[id] = rawProjectMember
    projectIdList.push(id)
  }
  // 去project拿到项目的名字
  let rawProjectList = await MProject.getProjectListById(projectIdList)

  let projectList = []
  for (let rawProject of rawProjectList) {
    let project = MProject.formatRecord(rawProject)
    const projectId = project['id']
    project = {
      ...project,
      role: _.get(projectMap, [projectId, 'role'], MProjetMember.ROLE_DEV),
      need_alarm: _.get(projectMap, [projectId, 'need_alarm'], 0)
    }
    projectList.push(project)
  }

  res.send(API_RES.showResult(projectList))
}, false)

let deleteProject = RouterConfigBuilder.routerConfigBuilder('/api/project/item/delete', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let id = parseInt(_.get(req, ['query', 'id'], 0))
  let updateUcid = parseInt(_.get(req, ['fee', 'user', 'ucid'], '0'))
  if (_.isInteger(id) === false) {
    res.send(API_RES.showError('参数错误'))
    return
  }

  // 检查权限
  let isAdmin = await MUser.isAdmin(updateUcid)
  if (isAdmin === false) {
    return res.send(API_RES.noPrivilege('只有管理员才可以删除项目'))
  }

  let updateData = {
    is_delete: 1,
    update_ucid: updateUcid
  }
  let isSuccess = await MProject.update(id, updateData)
  if (isSuccess) {
    res.send(API_RES.showResult([], '删除成功'))
  } else {
    res.send(API_RES.showError('删除失败'))
  }
}, false)

let update = RouterConfigBuilder.routerConfigBuilder('/api/project/item/update', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let body = _.get(req, ['body'], {})
  let id = _.get(body, ['id'], 0)

  let updateUcid = _.get(req, ['fee', 'user', 'ucid'], '0')

  let updateRecord = {}
  for (let itemKey of [
    'displayName',
    'projectName',
    'cDesc'
  ]) {
    if (_.has(body, itemKey)) {
      updateRecord[itemKey] = _.get(body, [itemKey], '')
    }
  }

  // 检查权限
  if (_.has(updateRecord, ['projectName'])) {
    let isAdmin = await MUser.isAdmin(updateUcid)
    if (isAdmin === false) {
      return res.send(API_RES.noPrivilege('只有管理员才可以修改projectName字段'))
    }
  }

  if (_.isEmpty(updateRecord)) {
    res.send(API_RES.showResult([], '更新成功'))
    return
  }

  updateRecord['update_ucid'] = updateUcid
  let isSuccess = await MProject.update(id, updateRecord)
  if (isSuccess) {
    res.send(API_RES.showResult([], '更新成功'))
  } else {
    res.send(API_RES.showError('更新失败'))
  }
}, false)

export default {
  ...detail,
  ...add,
  ...list,
  ...deleteProject,
  ...update
}
