import _ from 'lodash'
import Auth from '~/src/library/auth'
import API_RES from '~/src/constants/api_res'
import MProjectMember from '~/src/model/project/project_member'
import Logger from '~/src/library/logger'
/**
 * 将用户信息更新到req对象中
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function appendUserInfo (req, res, next) {
  let cookies = req.cookies
  let token = _.get(cookies, ['fee_token'], '')
  let user = Auth.parseToken(token)
  // 将用户信息添加到req.fee中(只添加信息, 在check里在检查是否需要登录)
  _.set(req, ['fee', 'user'], user)
  next()
}

/**
 * 将projectId添加到req.fee中, 只添加数据, 在check中再检查权限
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function appendProjectInfo (req, res, next) {
  let path = req.path
  if (_.startsWith(path, '/project')) {
    let projectId = parseInt(_.get(path.split('/'), [2], 0))
    _.set(req, ['fee', 'project', 'projectId'], projectId)
  }
  next()
}

/**
 * 检查用户是否已登录
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function checkLogin (req, res, next) {
  let ucid = _.get(req, ['fee', 'user', 'ucid'], 0)
  if (ucid === 0) {
    Logger.log('没有登录')
    res.send(API_RES.needLoginIn())
    return
  }
  next()
}

/**
 * 检查用户是否拥有该项目权限
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
async function checkPrivilege (req, res, next) {
  let ucid = _.get(req, ['fee', 'user', 'ucid'], 0)
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  // 查询数据库
  let hasPrivilege = await MProjectMember.hasPrivilege(projectId, ucid)
  if (hasPrivilege === false) {
    Logger.log('没有项目权限')
    res.send(API_RES.noPrivilege())
    return
  }
  next()
}

export default {
  appendProjectInfo,
  appendUserInfo,
  checkLogin,
  checkPrivilege
}
