import _ from 'lodash'
import dateFns from 'date-fns'
import md5 from 'md5'
import Logger from '~/src/library/logger'
const MD5_SALT = '1111111111111111111111111111'

function encodeBase64 (content) {
  return Buffer.from(content).toString('base64')
}

function decodeBase64 (encodeStr) {
  return Buffer.from(encodeStr, 'base64').toString()
}

function generateChecksum (content) {
  let hash1 = md5(content + MD5_SALT)
  return md5(MD5_SALT + hash1)
}

/**
 * 解析cookie中的token字段, 返回用户信息, 没有登录返回空对象
 * @param {Object} cookie
 * @return {Object}
 */
function parseToken (token) {
  let jsonInfo = decodeBase64(token)

  let info = {}
  try {
    info = JSON.parse(jsonInfo)
  } catch (e) {
    Logger.log('info信息不是标准json')
    return {}
  }
  let checksum = generateChecksum(info.user)
  if (checksum !== info.checksum) {
    return {}
  }

  let user = JSON.parse(info.user)

  let ucid = _.get(user, ['ucid'], 0)
  let name = _.get(user, ['name'], '')
  let account = _.get(user, ['account'], '')
  let loginAt = _.get(user, ['loginAt'], 0)
  return {
    ucid,
    name,
    account,
    loginAt
  }
}

/**
 * 生成 cookie token
 * @param {*} ucid
 * @param {*} nickname
 * @param {*} account
 * @return {String}
 */
function generateToken (ucid, account, nickname) {
  let loginAt = dateFns.getUnixTime(new Date())
  let user = JSON.stringify({
    ucid,
    nickname,
    account,
    loginAt
  })
  // 利用checksum和loginAt避免登录信息被篡改
  let checksum = generateChecksum(user)
  let infoJson = JSON.stringify({
    user,
    checksum
  })
  let info = encodeBase64(infoJson)
  return info
}

export default {
  parseToken,
  generateToken
}
