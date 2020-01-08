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
        mail: rawProject.mail,
        role: MProjetMember.ROLE_OWNER,
        need_alarm: 0,
        test_key: 123
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
      mail: rawProject.mail,
      role: _.get(projectMap, [projectId, 'role'], MProjetMember.ROLE_DEV),
      need_alarm: _.get(projectMap, [projectId, 'need_alarm'], 0),
      test_key: 2345
    }
    projectList.push(project)
  }

  res.send(API_RES.showResult(projectList))
}, false)

let deleteProject = RouterConfigBuilder.routerConfigBuilder('/api/project/item/delete', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let id = parseInt(_.get(req, ['body', 'id'], 0))
  let updateUcid = parseInt(_.get(req, ['fee', 'user', 'ucid'], '0'))
  if (_.isInteger(id) === false) {
    res.send(API_RES.showError('参数错误'))
    return
  }

  // 检查权限
  let isAdmin = await MUser.isAdmin(updateUcid)
  let isOwner = await MProjetMember.isProjectOwner(id, updateUcid)
  if (isOwner === false && isAdmin === false) {
    return res.send(API_RES.noPrivilege('只有管理员和项目Owner才可以删除该项目！'))
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
  let updateRecord = {
    display_name: _.get(body, ['pname'], undefined),
    c_desc: _.get(body, ['desc'], undefined),
    project_name: _.get(body, ['pid'], undefined),
    home_page: _.get(body, ['homePage'], undefined),
    mail: _.get(body, ['mail'], undefined)
  }
  updateRecord = _.forOwn(updateRecord, (value, key, object) => {
    if (value === undefined) {
      delete object[key]
    }
    return object
  })
  // 检查权限
  let isOwner = await MProjetMember.isProjectOwner(id, updateUcid)
  let isAdmin = await MUser.isAdmin(updateUcid)
  if (_.has(updateRecord, ['project_name'])) {
    if (isOwner === false && isAdmin === false) {
      return res.send(API_RES.noPrivilege('只有管理员和项目Owner才可以修改项目ID'))
    }
    // 校验是否已经存在相同的project_name
    let hasExist = await MProject.getProjectByProjectName(updateRecord.project_name)
    if (hasExist) {
      return res.send(API_RES.showError('项目pid已经存在了'))
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
