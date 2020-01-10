import fs from 'fs'
import _ from 'lodash'
import LIpip from '~/src/library/ipip'
import moment from 'moment'
import NodeRSA from 'node-rsa'
import ucConfig from '~/src/configs/user_center'

const decrypt = new NodeRSA({ b: 1024 })

decrypt.setOptions({ encryptionScheme: 'pkcs1', environment: 'node' })
decrypt.importKey(ucConfig.privateKey, 'pkcs1')

class Util {
  /**
   * 延迟执行函数, 返回一个 Promise
   * @param {number} ms
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 根据传入得时间获取这一周得时间
   * @param time
   */
  static getWeekByTime(time) {
    const baseDay = moment(time).day() || 7
    const days = []
    for (let i = 1; i <= 7; i++) {
      days.push(
        moment(time)
          .add(i - baseDay, 'day')
          .format('YYYY-MM-DD')
      )
    }
    return days
  }

  /**
   * 带默认值的parseInt
   * @param {*} string
   * @param {*} defaultValue
   */
  static parseIntWithDefault(string, defaultValue = 0) {
    let result = parseInt(string)
    if (_.isNaN(result)) {
      return defaultValue
    }
    return result
  }

  /**
   * 带默认值的parseFloat
   * @param {*} string
   * @param {*} defaultValue
   */
  static parseFloatWithDefault(string, defaultValue = 0) {
    let result = parseFloat(string)
    if (_.isNaN(result)) {
      return defaultValue
    }
    return result
  }

  static ip2Locate(ip) {
    const { ip2Locate } = LIpip

    return ip2Locate(ip)
  }
  static decrypt(msg) {
    return decrypt.decrypt(msg, 'utf-8')
  }

  // 判断一个文件夹是否存在
  static fsExistsSync(path) {
    try {
      fs.accessSync(path, fs.F_OK)
    } catch (e) {
      return false
    }
    return true
  }
}

export default Util
