/**
 * 项目成员处理
 */
import path from 'path'
import _ from 'lodash'
import env from '~/src/configs/env'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import MUser from '~/src/model/project/user'
import MProjetDaily from '~/src/model/project/daily'
// import MDailyReportSubscription from '~/src/model/summary/daily_report_subscription'

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
  const rawUser = MUser.get(ucid)
  if (_.isEmpty(rawUser) === false || rawUser.is_delete === 1) {
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

/**
 * @download 生成附件pdf
 * 根据ucid获取用户下的所有项目
 */
// let downloadDailyPdf = RouterConfigBuilder.routerConfigBuilder('/api/project/daily/download', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
//   // 线上机器不能写文件创建目录等操作，所以这里做一下判断
//   if (env !== 'development') return res.send(API_RES.showResult('线上环境不能生成文件！'))

//   let query = req.query
//   let countType = _.get(query, ['countType'], 'day')
//   let email = _.get(query, ['email'], '')
//   let hash = _.get(query, ['hash'], '')
//   let dir = _.get(query, ['dir'], '')

//   if (!email || !hash || !dir) return res.send(API_RES.showError('参数错误！'))

//   // 获取所需参数
//   let { countAtTime, startAt, endAt, title } = MDailyReportSubscription.getSumaryAt(countType)(dir)
//   // 获取该用户的订阅列表
//   let subscriptionList = await MProjetDaily.getSubscriptionList({ email })
//   let pids = subscriptionList.map(item => item.project_id)
//   let projectsData = await MDailyReportSubscription.summaryDailyReport(pids, startAt, endAt, countType, countAtTime)
//   if (!_.get(projectsData, 'length')) return res.send(API_RES.showError('没有查询到相关数据！'))

//   const dirPath = path.resolve(__dirname, `../../../../../painting/${countType}/${dir}`)
//   /**
//    * 生成邮件内容以及pdf文件
//    * @param {string} dirPath
//    * @param {array} projectsData
//    * @param {string} mailTitle
//    */
//   const html = await MDailyReportSubscription.generateMailContent(dirPath, projectsData, title)
//   /**
//    *  仅当用户点击下载附件的时候才去生成pdf
//    * @param {string} html 内容
//    * @param {string} basePath 存储目录
//    * @param {string} pdfFileName 文件名
//    */
//   // 线上环境不能创建文件
//   const pdf = await MDailyReportSubscription.geteratePdf(html, dirPath, `${email}_${hash}`)

//   res.download(pdf)
// }, false, false)

/**
 * @test 测试回调接口
 * 根据ucid获取用户下的所有项目
 */
let getCallbackData = RouterConfigBuilder.routerConfigBuilder('/api/project/daily/getCallbackData', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  console.log(req.body, '========')
  res.end()
}, false, false)

export default {
  ...add,
  ...getSubscribeList,
  ...update,
  ...getAllProject,
  ...getCallbackData,
  // ...downloadDailyPdf
}
