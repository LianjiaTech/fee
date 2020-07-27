/**
 * 项目成员处理
 */
import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import MUser from '~/src/model/project/user'
import MProjetDaily from '~/src/model/project/daily'

/**
 * 新增订阅记录
 */
let add = RouterConfigBuilder.routerConfigBuilder('/api/project/daily/add', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const ucid = _.get(req, ['fee', 'user', 'ucid'], 0)
  const params = _.get(req, ['body'], {})

  let email = _.get(params, ['mail'], '')
  let subscribeList = _.get(params, ['list'], [])
  let needCallback = _.get(params, ['needCallback'], 0)
  let protocol = _.get(params, ['protocol'], 'http')
  let callbackUrl = _.get(params, ['callbackUrl'], '')
  let sendTime = _.get(params, ['sendTime'], MProjetDaily.SENDTIME)
  if (!ucid || !email || (needCallback && !callbackUrl) || !protocol) {
    return res.send(API_RES.showError('创建失败！缺少必要参数'))
  }

  let insertData = subscribeList.map(item => ({
    ucid,
    email,
    need_callback: needCallback,
    protocol: protocol,
    callback_url: callbackUrl,
    send_time: sendTime,
    project_id: item.id,
    project_display_name: item.name
  }))

  let isSuccess = await MProjetDaily.add(insertData)
  res.send(API_RES.showResult(isSuccess))
})

/**
 * 更新订阅记录
 * 直接删除所有，再重新插入
 */
let update = RouterConfigBuilder.routerConfigBuilder('/api/project/daily/update', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const ucid = _.get(req, ['fee', 'user', 'ucid'], 0)
  const params = _.get(req, ['body'], {})

  let email = _.get(params, ['mail'], '')
  let subscribeList = _.get(params, ['list'], [])
  let needCallback = _.get(params, ['needCallback'], 0)
  let protocol = _.get(params, ['protocol'], 'http')
  let callbackUrl = _.get(params, ['callbackUrl'], '')
  let sendTime = _.get(params, ['sendTime'], MProjetDaily.SENDTIME)
  if (!ucid || !email || (needCallback && !callbackUrl) || !protocol) {
    return res.send(API_RES.showError('更新失败！缺少必要参数'))
  }

  let updateData = subscribeList.map(item => ({
    ucid,
    email,
    need_callback: needCallback,
    protocol: protocol,
    callback_url: callbackUrl,
    send_time: sendTime,
    project_id: item.id,
    project_display_name: item.name
  }))
  let hasDeleted = await MProjetDaily.deleteRecords(ucid)
  let isSuccess = await MProjetDaily.add(updateData)
  if (hasDeleted || isSuccess) {
    return res.send(API_RES.showError('更新失败原因' + hasDeleted || isSuccess))
  }
  res.send(API_RES.showResult(null, '更新成功！'))
})

/**
 * 获取订阅过的项目列表
 */
let getSubscribeList = RouterConfigBuilder.routerConfigBuilder('/api/project/daily/getSubscribeList', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const ucid = _.get(req, ['fee', 'user', 'ucid'], 0)
  const rawUser = MUser.get(ucid)
  if (_.isEmpty(rawUser) === false || rawUser.is_delete === 1) {
    return res.send(API_RES.showError('用户不存在'))
  }
  let subscribeList = await MProjetDaily.getSubscriptionList({ ucid })
  let result = []
  let sendTime = ''
  let needCallback = ''
  let protocol = ''
  let callbackUrl = ''

  for (let subscribeObj of subscribeList) {
    sendTime = subscribeObj.send_time
    needCallback = subscribeObj.need_callback
    protocol = subscribeObj.protocol
    callbackUrl = subscribeObj.callback_url
    result.push({
      id: subscribeObj.id,
      projectName: subscribeObj.project_display_name,
      projectId: subscribeObj.project_id,
      sendTime: subscribeObj.send_time,
      needCallback: subscribeObj.need_callback,
      protocol: subscribeObj.protocol,
      callbackUrl: subscribeObj.callback_url
    })
  }
  res.send(API_RES.showResult({
    data: result,
    sendTime,
    needCallback,
    protocol,
    callbackUrl
  }))
})

/**
 * 根据ucid获取用户下的所有项目
 */
let getAllProject = RouterConfigBuilder.routerConfigBuilder('/api/project/daily/getAllProject', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const ucid = _.get(req, ['fee', 'user', 'ucid'], 0)
  const rawUser = await MUser.get(ucid)
  if (_.isEmpty(rawUser) === true || rawUser.is_delete === 1) {
    return res.send(API_RES.showError('用户不存在'))
  }
  let list = await MProjetDaily.getProjectMemberListByUcid(ucid)
  let result = []
  for (let item of list) {
    result.push({
      projectName: item.display_name,
      id: item.id
    })
  }
  res.send(API_RES.showResult(result))
})

export default {
  ...add,
  ...getSubscribeList,
  ...update,
  ...getAllProject
}
