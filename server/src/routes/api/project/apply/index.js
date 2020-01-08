/**
 * 项目成员处理
 */
import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import MProjet from '~/src/model/project/project'
import MProjectApply from '~/src/model/project/project_apply'
import MProjetMember from '~/src/model/project/project_member'
import applyTemplage from '~/src/views/web_template/html_join_project_apply'
import sendMail from '~/src/library/utils/modules/mailer'
import mailConfig from '~/src/configs/mail'

function formatBody (req) {
  let computeRate = pv => {
    pv = _.parseInt(pv)
    let rate = 100
    if (pv >= 1e7) { // 大于1000万 1%
      rate = 100
    } else if (pv >= 1e6) { // 大于100万 10%
      rate = 1000
    } else { // 其他 100%
      rate = 10000
    }
    return rate
  }

  const body = _.get(req, ['body'], {})
  const id = _.get(body, ['id'], 0)
  const display_name = _.get(body, ['display_name'], '')
  const project_name = _.get(body, ['project_name'], '')
  const c_desc = _.get(body, ['c_desc'], '')
  const mail = _.get(body, ['mail'], '')
  const pv = _.get(body, ['pv'], 0)
  const rate = _.get(body, ['rate'], computeRate(pv))
  const home_page = _.get(body, ['home_page'], '')
  const owner_ucid = _.get(body, ['owner_ucid'], '')
  const apply_desc = _.get(body, ['apply_desc'], '无')
  const apply_ucid = _.get(body, ['apply_ucid'], '')
  const apply_nick_name = _.get(body, ['apply_nick_name'], '')
  const apply_mail = _.get(body, ['apply_mail'], '')
  const status = _.get(body, ['status'], 0)
  const review_desc = _.get(body, ['review_desc'], '无')
  const review_ucid = _.get(body, ['review_ucid'], '')
  const review_nick_name = _.get(body, ['review_nick_name'], '')

  return {
    id,
    display_name,
    project_name,
    c_desc,
    mail,
    rate,
    pv,
    home_page,
    owner_ucid,
    apply_desc,
    apply_ucid,
    apply_nick_name,
    apply_mail,
    status,
    review_desc,
    review_ucid,
    review_nick_name
  }
}
/**
 * 校验对象下的某个字段是否为空字符串值,有空值就返回false
 * @param {*} obj
 * @returns
 */
function checkEmptyFields (obj) {
  let isObj = (o) => typeof o === 'object' && !!obj
  if (!isObj(obj) && obj !== '') return true
  let keys = Object.keys(obj)
  return keys.reduce((pre, cur) => {
    if (isObj(obj[cur])) {
      return pre && checkEmptyFields(obj[cur])
    }
    return pre && obj[cur] !== ''
  }, true)
}

/**
 * 添加方法
 */
const add = RouterConfigBuilder.routerConfigBuilder('/api/project/apply/add', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const payload = formatBody(req)
  const { project_name: pid } = payload
  let errMsg = ''
  let requiredKeys = ['display_name', 'project_name', 'c_desc', 'mail', 'pv', 'home_page']
  for (let key of requiredKeys) {
    if (payload[key] === '') return res.send(API_RES.showError(`${key}字段不能为空！`))
  }
  // 取check  project_name 是否存在
  const checkResult = await MProjet.getProjectByProjectName(pid)
  if (checkResult) {
    return res.send(API_RES.showError('项目pid已经存在了'))
  }
  const applyCheckResult = await MProjectApply.getProjectByProjectName(pid)
  if (applyCheckResult) {
    return res.send(API_RES.showError(`pid为${pid}得申请已经提交过了`))
  }
  const isSuccess = await MProjectApply.add(payload).catch(err => {
    errMsg = `添加失败，失败原因==> ${err.message || err.stack || err || '插入数据库失败！'}`
  })

  if (isSuccess > 0) {
    res.send(API_RES.showResult({id: isSuccess}, '申请已经提交审核，请注意查收邮件！'))
    // 发送申请成功的邮件
    // projectName, pid, mail, homePage, adminName, pv, rate, note
    const {
      display_name: projectName,
      mail,
      home_page: homePage,
      pv,
      rate,
      apply_mail: applyMail,
      apply_desc: note
    } = payload
    const html = applyTemplage({projectName, pid, mail, homePage, pv, rate, note}, 'pending')
    const mails = [mail, applyMail, ...mailConfig.cc]
    await sendMail({
      to: mails,
      title: `"${projectName}"接入灯塔申请`,
      html
    })
  } else {
    res.send(API_RES.showError(errMsg))
  }
}, true, false)
/**
 * 获取列表方法
 */
const list = RouterConfigBuilder.routerConfigBuilder('/api/project/apply/list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const query = _.get(req, ['query'], {})
  const limit = parseInt(_.get(query, ['limit'], 10))
  const offset = parseInt(_.get(query, ['offset'], 0))
  const list = await MProjectApply.getList(limit, offset)
  const total = await MProjectApply.count()
  res.send(API_RES.showResult({
    list,
    offset,
    limit,
    total
  }))
}, true, false)
/**
 * 更新方法
 */
const update = RouterConfigBuilder.routerConfigBuilder('/api/project/apply/update', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const payload = formatBody(req)
  const {project_name: pid, status, id} = payload
  const checkResult = await MProjet.getProjectByProjectName(pid)
  if (checkResult) {
    return res.send(API_RES.showError('项目pid已经存在了'))
  }
  const isSuccess = await MProjectApply.update(id, payload)
  if (!isSuccess) {
    return res.send(API_RES.showError('审核失败，插入数据时失败'))
  }
  const {
    display_name: projectName,
    mail,
    review_nick_name: adminName,
    rate,
    apply_mail: applyMail,
    review_desc: note
  } = payload
  if (status !== 1) {
    // 发送驳回得邮件
    res.send(API_RES.showResult([], '申请已驳回'))
    const html = applyTemplage({
      projectName, pid, mail, rate, adminName, note
    }, 'refused')
    const mails = [mail, applyMail, ...mailConfig.cc]
    return sendMail({
      to: mails,
      title: `"${projectName}"接入灯塔申请被驳回`,
      html
    })
  }
  // 先去添加项目
  const projectId = await MProjet.add(payload)
  if (!projectId) {
    return res.send(API_RES.showError('项目添加失败'))
  }
  const {
    owner_ucid,
    review_ucid
  } = payload
  // 添加项目中的own_到表里
  const ownSuccess = await MProjetMember.add({
    project_id: projectId,
    ucid: owner_ucid,
    role: 'owner',
    need_alarm: 1,
    create_ucid: review_ucid,
    update_ucid: review_ucid
  })
  if (!ownSuccess) {
    return res.send(API_RES.showError('添加owner失败'))
  }

  res.send(API_RES.showResult([], '审核成功'))
  const html = applyTemplage({
    projectName, pid, mail, rate, adminName, note, id: projectId
  }, 'pass')
  const mails = [mail, applyMail, ...mailConfig.cc]
  return sendMail({
    to: mails,
    title: `"${projectName}"接入灯塔申请通过`,
    html
  })
}, true, false)

export default {
  ...add,
  ...list,
  ...update
}
