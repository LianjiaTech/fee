import _ from 'lodash'
import md5 from 'md5'
import http from '~/src/library/http'
import NetworkUtil from '~/src/library/utils/modules/network'
import alarmConfig from '~/src/configs/alarm'
import commonConfig from '~/src/configs/common'

const MAX_CONTENT_CHAR = 1500 // 最大长度2000字, 这里留500字的冗余, 用于添加扩展信息
const wxAddr = _.get(alarmConfig, ['addr'], '')
const app = _.get(alarmConfig, ['app'], '')
const isUsingAlarm = _.get(commonConfig, ['ues', 'alarm'], true)

function sendMessage (rawUcidList = [], message = '') {
  if (isUsingAlarm) {
    sendWXMessage(rawUcidList, message)
  }
}
/**
 *
 * @param {Array}} ucidList
 * @param {String} message
 */
function sendWXMessage (rawUcidList = [], message = '') {
  if (_.isArray(rawUcidList) === false || _.isEmpty(rawUcidList) || _.isString(message) === false || message.length === 0) {
    return true
  }
  let localIpList = NetworkUtil.getLocalIpList()
  let localIpStr = localIpList.join(',')
  // 适配ucid为15位的情况
  let ucidList = []
  for (let rawUcid of rawUcidList) {
    let ucid = `${rawUcid}`
    if (ucid.length > 10) {
      // 对于完整式ucid, 去掉前边的标志位后, 转成数字即为真实ucid
      ucid = parseInt(ucid.substr(1))
    }
    ucidList.push(ucid)
    ucidList = _.uniq(ucidList)
  }

  let sendList = []
  let massageId = md5(message).substring(0, 10)
  // 如果message太长, 就分批发送
  if (message.length > MAX_CONTENT_CHAR) {
    let totalCount = parseInt(message.length / MAX_CONTENT_CHAR) + 1
    let lastIndex = 1
    for (; lastIndex <= totalCount; lastIndex = lastIndex + 1) {
      let subContent = message.substring(MAX_CONTENT_CHAR * (lastIndex - 1), MAX_CONTENT_CHAR * lastIndex)

      let massage = `\
消息:${massageId}(${lastIndex}/${totalCount})
来自机器(${localIpStr}):
${subContent}`
      sendList.push(massage)
    }
  } else {
    sendList = [
      `\
消息:${massageId}
来自机器(${localIpStr}):
${message}`
    ]
  }
  for (let content of sendList) {
    http.post(wxAddr, JSON.stringify({
      'app': app, // via 平台fe
      'content': content, // 报警内容
      'user': ucidList.join('|') // | 分隔
    }))
  }
  return true
}

export default {
  sendMessage
}
