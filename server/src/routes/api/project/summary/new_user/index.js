import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import moment from 'moment'
import DATE_FORMAT from '~/src/constants/date_format'
import MNewUserSummary from '~/src/model/summary/new_user_summary'
import MCityDistribution from '~/src/model/parse/city_distribution'
import PROVINCE_LIST from '~/src/constants/province'

let distributionByLine = RouterConfigBuilder.routerConfigBuilder('/api/project/summary/new_user/distribution_line', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const query = _.get(req, ['query'], {})
  let st = parseInt(_.get(query, ['st'], moment().unix() * 1000))
  let et = parseInt(_.get(query, ['et'], moment().unix() * 1000))
  const type = _.get(query, ['type'], 'country')
  const country = _.get(query, ['country'], '中国')
  const province = _.get(query, ['province'], '')
  const city = _.get(query, ['city'], '')
  const filterBy = _.get(query, ['filterBy'], '')
  const projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
  if (_.isInteger(st) === false || _.isInteger(et) === false) {
    res.send(API_RES.showError('st或et格式不正确'))
    return
  }

  st = st / 1000
  et = et / 1000
  let timeList = []
  switch (filterBy) {
    case DATE_FORMAT.UNIT.HOUR:
      for (let timeAt = st; timeAt <= et; timeAt += 3600) {
        let timeStr = moment.unix(timeAt).format(DATE_FORMAT.DATABASE_BY_HOUR)
        timeList.push(timeStr)
      }
      break
    case DATE_FORMAT.UNIT.DAY:
      for (let timeAt = st; timeAt <= et; timeAt += 3600 * 24) {
        let timeStr = moment.unix(timeAt).format(DATE_FORMAT.DATABASE_BY_DAY)
        timeList.push(timeStr)
      }
      break
    default:
      res.send(API_RES.showError('filterBy不合法'))
      return
  }

  let rawRecordList = await MNewUserSummary.getNewUserDistribution(projectId, filterBy, timeList)
  let result = []
  switch (type) {
    case 'country':
      for (let rawRecord of rawRecordList) {
        const { count_at_time: countAtTime, total_count: totalCount, count_type: countType } = rawRecord
        let key = getKey(countType, countAtTime)
        let resultItem = {
          key,
          value: totalCount
        }
        result.push(resultItem)
      }
      break
    case 'province':
      for (let rawRecord of rawRecordList) {
        const {
          count_at_time: countAtTime,
          count_type: countType,
          city_distribute_id: cityDistributeId
        } = rawRecord
        let key = getKey(countType, countAtTime)
        let cityDistributionJson = await MCityDistribution.getCityDistributionRecord(cityDistributeId, projectId, moment(countAtTime, 'YYYY-MM-DD_HH').unix())
        let provinceJson = _.get(cityDistributionJson, [country, province], {})
        let sum = getCountUnderProvince(provinceJson)
        let resultItem
        resultItem = {
          key,
          value: sum
        }
        result.push(resultItem)
      }
      break
    case 'city':
      break
    default:
      res.send(API_RES.showError('type不合法'))
      return
  }

  // 如果结果是空，则返回value是0的数据
  if (_.isEmpty(result)) {
    for (let time of timeList) {
      let key = getKey(filterBy, time)
      let resultItem = {
        key,
        value: 0
      }
      result.push(resultItem)
    }
  }
  res.send(API_RES.showResult(result))
})

let distributionByMap = RouterConfigBuilder.routerConfigBuilder('/api/project/summary/new_user/distribution_map', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const query = _.get(req, ['query'], {})
  let st = parseInt(_.get(query, ['st'], moment().unix() * 1000))
  let et = parseInt(_.get(query, ['et'], moment().unix() * 1000))
  let field = _.get(query, ['field'], '')
  let projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
  if (_.isInteger(st) === false || _.isInteger(et) === false) {
    res.send(API_RES.showError('st或et格式不对'))
    return
  }

  st = st / 1000
  et = et / 1000
  let timeList = []
  for (let timeAt = st; timeAt <= et; timeAt += 3600 * 24) {
    let timeStr = moment.unix(timeAt).format(DATE_FORMAT.DATABASE_BY_DAY)
    timeList.push(timeStr)
  }

  let resultMap = {}
  let rawRecordList = await MNewUserSummary.getNewUserDistribution(projectId, 'day', timeList)
  switch (field) {
    case 'province':
      for (let rawRecord of rawRecordList) {
        const {
          count_at_time: countAtTime,
          city_distribute_id: cityDistributeId
        } = rawRecord
        let cityDistributionJson = await MCityDistribution.getCityDistributionRecord(cityDistributeId, projectId, moment(countAtTime.split('_').join(' ')).unix())
        let provinceJson = _.get(cityDistributionJson, ['中国'], {})
        for (let province of Object.keys(provinceJson)) {
          let sum = getCountUnderProvince(provinceJson[province])
          if (_.has(resultMap, [province])) {
            resultMap[province] += sum
          } else {
            resultMap[province] = sum
          }
        }
      }
      break
    default:
      res.send(API_RES.showError('field不合法'))
      return
  }

  // 检查各个省是否存在，如果不存在设为0
  for (let province of PROVINCE_LIST) {
    if (_.has(resultMap, [province]) === false) {
      resultMap[province] = 0
    }
  }

  let result = []
  for (let provinceName of Object.keys(resultMap)) {
    let resultItem = {
      name: provinceName,
      value: resultMap[provinceName]
    }
    result.push(resultItem)
  }
  res.send(API_RES.showResult(result))
})

/**
 * 根据type将time字符串拼接为展示形式
 * @param {string} type
 * @param {string} time
 */
function getKey (type, time) {
  let key = ''
  if (type === DATE_FORMAT.UNIT.HOUR) {
    let timeMoment = moment(time, DATE_FORMAT.DATABASE_BY_HOUR)
    let date = timeMoment.format(DATE_FORMAT.DISPLAY_BY_DAY)
    let hour = timeMoment.hour()
    key += date + ' ' + hour + ':00~' + hour + ':59'
  }
  if (type === DATE_FORMAT.UNIT.DAY) {
    key += time + ' 00:00~23:59'
  }
  return key
}

/**
 * 计算省下各个城市值得总和
 * @param {object} provinceMap
 */
function getCountUnderProvince (provinceMap) {
  let sum = 0
  for (let key of Object.keys(provinceMap)) {
    sum += provinceMap[key]
  }
  return sum
}
export default {
  ...distributionByLine,
  ...distributionByMap
}
