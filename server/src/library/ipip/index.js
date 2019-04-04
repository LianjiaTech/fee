// 引入ipip-datx模块
// 基于ipip.net提供的地址库数据
// 最后更新时间: 2018-09-19
import path from 'path'
import datx from 'ipip-datx'
import _ from 'lodash'

let ipDatabaseUri = path.resolve(__dirname, './ip2locate_ipip.net_20180910.datx')

let DatabaseClient = new datx.City(ipDatabaseUri)

function isIp (ip) {
  return /^(([1-9]?\d|1\d\d|2[0-4]\d|25[0-5])(\.(?!$)|$)){4}$/.test(ip)
}

function ip2Locate (ip) {
  let country = ''
  let province = ''
  let city = ''
  if (isIp(ip) === false) {
    return {
      country, //  国家
      province, //  省
      city //  市
    }
  }
  let res = DatabaseClient.findSync(ip)
  country = _.get(res, [0], '')
  province = _.get(res, [1], '')
  city = _.get(res, [2], '')
  return {
    country, //  国家
    province, //  省
    city //  市
  }
}

export default {
  ip2Locate
}
