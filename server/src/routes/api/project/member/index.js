/**
 * 项目成员处理
 */
import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import MProjetMember from '~/src/model/project/project_member'
import MProjetDaily from '~/src/model/project/daily'
import MProject from '~/src/model/project/project'
import MUser from '~/src/model/project/user'
import http from '~/src/library/http'
import ucConfig from '~/src/configs/user_center'
import Logger from '~/src/library/logger'
import moment from 'moment'
import UC from '~/src/library/uc'

/**
 *   为新添加的成员自动订阅该项目的日报
 *   ucid,
 *   email,
 *   needCallback,
 *   protocol,
 *   callbackUrl,
 *   send_time: sendTime,
 *   project_id: item.id,
 *   project_display_name: item.name
 */
function handleAddSubscribe () {
  let insertList = []
  return async function insert (data) {
    if (!data) {
      return MProjetDaily.add(insertList)
    }
    let { ucid, projectId } = data
    let { email } = await MUser.get(ucid)
    let { display_name: name } = await MProject.get(projectId)
    let subscribedList = await MProjetDaily.getSubscriptionList({ ucid })
    let subscribedObj = _.get(subscribedList, [0], {})
    // 过滤掉已经订阅的项目
    let exist = _.findIndex(subscribedList, (item) => item.project_id == projectId) > -1
    if (exist) return insert
    let insertData = {
      ucid,
      email,
      need_callback: _.get(subscribedObj, ['need_callback'], 0),
      protocol: _.get(subscribedObj, ['protocol'], 'http'),
      callback_url: _.get(subscribedObj, ['callback_url'], ''),
      send_time: _.get(subscribedObj, ['send_time'], MProjetDaily.SENDTIME),
      project_id: projectId,
      project_display_name: name
    }
    insertList.push(insertData)
    return insert
  }
}

// 添加项目成员，要获取项目id(在路由里)，ucid(body里)，role(body里)，need_alarm(body里)
let add = RouterConfigBuilder.routerConfigBuilder('/api/project/member/add', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let body = _.get(req, ['body'], {})
  // 支持按ucidList添加
  let ucidList = _.get(body, ['ucid_list'], [])
  let role = _.get(body, ['role'], MProjetMember.ROLE_DEV)
  let pidList = _.get(body, ['pids'], [])
  let needAlarm = parseInt(_.get(body, ['need_alarm'], 0))
  let createUcid = _.get(req, ['fee', 'user', 'ucid'], '0')
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  let updateUcid = createUcid
  let errorMsg = ''

  if (_.isInteger(needAlarm) === false) {
    return res.send(API_RES.showError('needAlarm参数错误'))
  }
  if (!pidList.length) {
    return res.send(API_RES.showError('缺少项目列表参数'))
  }

  // 检查权限
  let isAdmin = await MUser.isAdmin(createUcid)
  let isOwner = await MProjetMember.isProjectOwner(projectId, createUcid)
  if (isAdmin === false && isOwner === false) {
    return res.send(API_RES.noPrivilege('只有组长和管理员才可以调整成员'))
  }

  if (_.isEmpty(ucidList)) {
    return res.send(API_RES.showResult([], '添加完毕'))
  }
  let handleInsert = handleAddSubscribe()
  let anyOneSuccess = true
  for (let pid of pidList) {
    if (!_.isInteger(pid) || pid <= 0) {
      continue
    }
    for (let ucid of ucidList) {
      ucid = parseInt(ucid)
      if (_.isInteger(ucid) === false || ucid <= 0) {
        // ucid不合法
        continue
      }
      // 检查user表里是否有ucid对应的记录，用于以后用户登录获取用户信息
      const rawUser = await MUser.get(ucid)
      if (_.isEmpty(rawUser) || rawUser.is_delete === 1) {
        let ts
        let headers
        const appId = ucConfig.appID
        const appkey = ucConfig.appkey
        let sign
        ts = moment().unix() * 1000
        const params = {
          ids: ucid
        }
        headers = {
          ts,
          appId
        }
        sign = UC.getSign(params, headers, appkey)
        headers.sign = sign
        let userInfoResponse = await http.get(ucConfig.api + '/ehr/user/agent', {
          params,
          headers
        }).catch(err => {
          Logger.warn('用户信息接口响应异常 err =>', _.get(err, ['response', 'data'], {}))
          return _.set({}, ['data', 'msg'], _.get(err, ['response', 'data'], {}))
        })
        let userInfo = _.get(userInfoResponse, ['data', 'data', 0], {})
        if (_.isEmpty(userInfo)) {
          continue
        }
        // 从登录结果中提取数据
        let account = _.get(userInfo, ['account'], '')
        let mobile = _.get(userInfo, ['mobile'], '') // 手机号
        let nickname = _.get(userInfo, ['name'], '') // 昵称
        let email = _.get(userInfo, ['email'], `${account}@ke.com`) // 邮箱
        let avatarUrl = _.get(userInfo, ['avatar'], MUser.DEFAULT_AVATAR_URL) // 头像

        // 避免null值
        if (_.isNil(mobile)) {
          mobile = ''
        }
        if (_.isNil(nickname)) {
          nickname = ''
        }
        if (_.isNil(email)) {
          email = `${account}@ke.com`
        }
        if (_.isNil(avatarUrl)) {
          avatarUrl = MUser.DEFAULT_AVATAR_URL
        }

        let isRegisterSuccess = await MUser.register(account, {
          account,
          mobile,
          ucid,
          nickname,
          email,
          avatarUrl
        })
        if (isRegisterSuccess === false) {
          continue
        }
      }
      // 同时向日报订阅表中插入一条记录
      await handleInsert({ ucid, projectId: pid }).catch(err => Logger.warn('追加日报订阅记录失败，失败原因 ===>>', err.message || err.stack || err))
      // 检查member表中，该项目是否存在此ucid
      let record = await MProjetMember.getByProjectIdAndUcid(pid, ucid)

      // 不在数据库中, 直接添加到列表中
      if (_.isEmpty(record)) {
        let insertData = {
          ucid,
          project_id: pid,
          role,
          need_alarm: needAlarm,
          create_ucid: createUcid,
          update_ucid: updateUcid
        }
        let isSuccess = await MProjetMember.add(insertData).catch(e => {
          errorMsg = e.message || e.stack || e
        })
        console.log(isSuccess, '=======')
        anyOneSuccess = anyOneSuccess || isSuccess
        continue
      }

      const { id, is_delete: isDelete } = record
      if (isDelete === 0) {
        // 已有数据, continue
        continue
      }

      // 已有数据, 但被删掉了, 还原之
      let updateData = {
        is_delete: 0,
        update_ucid: updateUcid,
        role,
        need_alarm: needAlarm
      }
      let isSuccess = await MProjetMember.update(id, updateData).catch(e => {
        errorMsg = e.message || e.stack || e
      })
      // 同时向日报订阅表中插入一条记录
      await handleInsert({ ucid, projectId: pid }).catch(err => Logger.warn('追加日报订阅记录失败，失败原因 ===>>', err.message || err.stack || err))
      anyOneSuccess = anyOneSuccess || isSuccess
    }
  }
  // 最后统一插入
  await handleInsert().catch(err => Logger.warn('追加日报订阅记录失败，失败原因 ===>>', err.message || err.stack || err))

  if (anyOneSuccess) {
    res.send(API_RES.showResult([], '添加完毕'))
  } else {
    res.send(API_RES.showError(`添加失败：${errorMsg}，请重试`))
  }
})

// 获取当前项目的所有成员 project_id(在路由里)
let list = RouterConfigBuilder.routerConfigBuilder('/api/project/member/list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)

  // 获取projectMemberList，全部数据都拿到遍历数据
  let rawProjectMemberList = await MProjetMember.getProjectMemberList(projectId)
  let projectMemberResult = {}
  let ucidList = []
  for (let rawProjectMember of rawProjectMemberList) {
    // 把（role,id,need_alarm）放到projectMemberResult里，ucid作为key
    projectMemberResult[rawProjectMember.ucid] = {
      id: rawProjectMember.id,
      ucid: rawProjectMember.ucid,
      need_alarm: rawProjectMember['need_alarm'],
      role: rawProjectMember.role
    }

    // 从里面获取到用户的ucid list
    ucidList.push(rawProjectMember.ucid)
  }
  // 根据ucid list去查nickname
  let rawUserList = await MUser.getUserListByUcid(ucidList)
  let userResult = {}
  for (let rawUser of rawUserList) {
    // 把(nickname)拿出来放到userResult里，ucid作为key
    userResult[rawUser.ucid] = {
      nickname: rawUser.nickname
    }
  }
  // 遍历ucid从projectMemberResult里获取id, need_alarm, role,从useResult里获取nickname
  let memberList = []
  for (let ucid of ucidList) {
    let resultItem = {
      ...projectMemberResult[ucid],
      ...userResult[ucid]
    }
    memberList.push(resultItem)
  }

  res.send(API_RES.showResult(memberList))
})

let deleteProject = RouterConfigBuilder.routerConfigBuilder('/api/project/member/delete', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let id = parseInt(_.get(req, ['query', 'id'], 0))
  let ucidId = parseInt(_.get(req, ['query', 'ucidId'], 0))
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
  let updateUcid = parseInt(_.get(req, ['fee', 'user', 'ucid'], '0'))

  if (_.isInteger(id) === false) {
    res.send(API_RES.showError('参数错误'))
    return
  }

  // 检查权限
  let isAdmin = await MUser.isAdmin(updateUcid)
  let isOwner = await MProjetMember.isProjectOwner(projectId, updateUcid)
  if (isAdmin === false && isOwner === false) {
    return res.send(API_RES.noPrivilege('只有组长和管理员才可以调整成员'))
  }

  let updateData = {
    is_delete: 1,
    update_ucid: updateUcid
  }

  let isSuccess = await MProjetMember.update(id, updateData)
  // 删除成员的同时也要删除日报订阅表中的记录
  await MProjetDaily.deleteRecords(ucidId, projectId)

  if (isSuccess) {
    res.send(API_RES.showResult([], '删除成功'))
  } else {
    res.send(API_RES.showError('删除失败'))
  }
})

let update = RouterConfigBuilder.routerConfigBuilder('/api/project/member/update', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let body = _.get(req, ['body'], {})
  let id = parseInt(_.get(body, ['id']), 0)
  let updateUcid = _.get(req, ['fee', 'user', 'ucid'], '0')
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
  let updateData = {
    update_ucid: updateUcid
  }
  for (let key of [
    'role',
    'need_alarm'
  ]) {
    if (_.has(body, [key])) {
      updateData[key] = _.get(body, [key], '')
    }
  }

  if (_.has(updateData, ['role'])) {
    // 修改角色前先检查权限
    let isAdmin = await MUser.isAdmin(updateUcid)
    let isOwner = await MProjetMember.isProjectOwner(projectId, updateUcid)
    if (isAdmin === false && isOwner === false) {
      return res.send(API_RES.noPrivilege('只有组长和管理员才可以调整成员'))
    }
  }

  let isSuccess = await MProjetMember.update(id, updateData)

  if (isSuccess) {
    res.send(API_RES.showResult([], '更新成功'))
  } else {
    res.send(API_RES.showError('更新失败'))
  }
})

export default {
  ...add,
  ...list,
  ...deleteProject,
  ...update
}
