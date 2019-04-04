import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'
import Logger from '~/src/library/logger'

const DateFormat = 'YYYYMM'

const BaseTableName = 't_r_city_distribution'
const TABLE_COLUMN = [
  `id`,
  `city_distribute_json`,
  `create_time`,
  `update_time`
]

/**
 * 获取表名
 * @param {number} projectId 项目id
 * @param {number} createTimeAt 创建时间, 时间戳
 * @return {String}
 */
function getTableName (projectId, createTimeAt) {
  let YmDate = moment.unix(createTimeAt).format(DateFormat)
  return BaseTableName + '_' + projectId + '_' + YmDate
}

/**
 * 获取解析后的城市分布记录, 解析失败返回空对象({})
 * @param {number} id
 * @param {number} projectId
 * @param {number} createTimeAt
 * @return {object}
 */
async function getCityDistributionRecord (id, projectId, createTimeAt) {
  let tableName = getTableName(projectId, createTimeAt)
  let recordList = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('id', '=', id)
    .catch(e => {
      return []
    })
  let resultJson = _.get(recordList, [0, 'city_distribute_json'], '{}')
  let result = {}
  try {
    result = JSON.parse(resultJson)
    return result
  } catch (e) {
    return {}
  }
}

/**
 * 更新城市分布记录, 返回更新是否成功
 * @param {number} id
 * @param {number} projectId
 * @param {number} createTimeAt
 * @param {string} cityDistributeJson
 * @return {boolean}
 */
async function updateCityDistributionRecord (id, projectId, createTimeAt, cityDistributeJson) {
  let tableName = getTableName(projectId, createTimeAt)
  let updateAt = moment().unix()
  let data = {
    city_distribute_json: cityDistributeJson,
    update_time: updateAt
  }
  let affectRows = await Knex(tableName)
    .update(data)
    .where('id', '=', id)
    .catch(e => {
      Logger.warn('城市数据更新失败, 错误原因 =>', e)
      return 0
    })
  return affectRows > 0
}

/**
 * 插入城市分布记录, 返回插入id
 * @param {string} cityDistributeJson
 * @param {number} projectId
 * @param {number} createTimeAt
 * @return {number}
 */
async function insertCityDistributionRecord (cityDistributeJson, projectId, createTimeAt) {
  let tableName = getTableName(projectId, createTimeAt)
  let updateAt = moment().unix()
  let data = {
    city_distribute_json: cityDistributeJson,
    create_time: updateAt,
    update_time: updateAt
  }
  let insertResult = await Knex
    .returning('id')
    .insert(data)
    .into(tableName)
    .catch(e => {
      Logger.warn('城市数据插入失败, 错误原因 =>', e)
      return []
    })
  let insertId = _.get(insertResult, [0], 0)

  return insertId
}

/**
 * 合并分布数据中, 相同城市的数据, 默认直接相加
 * @param {Object} distributionSource   (来源)从数据库中新查出来的数据
 * @param {Object} distributionDist     (目的地)过往累加计入的结果集
 * @param {Function} processCityData
 */
function mergeDistributionData (distributionSource, distributionDist, processCityData = (cityDataDist, cityDataSource) => { return cityDataDist + cityDataSource }) {
  let finalDistribution = _.clone(distributionDist)
  for (let country of Object.keys(distributionSource)) {
    if (_.has(distributionDist, country) === false) {
      // 没有就直接更新上
      _.set(finalDistribution, [country], distributionSource[country])
      continue
    }
    let countryDistributionSource = distributionSource[country]
    let countryDistributionDist = distributionDist[country]
    for (let province of Object.keys(countryDistributionSource)) {
      if (_.has(countryDistributionDist, province) === false) {
        _.set(finalDistribution, [country, province], distributionSource[country][province])
        continue
      }
      let provinceDistributionSource = countryDistributionSource[province]
      let provinceDistributionDist = countryDistributionDist[province]
      for (let city of Object.keys(provinceDistributionSource)) {
        if (_.has(provinceDistributionDist, city) === false) {
          _.set(finalDistribution, [country, province, city], distributionSource[country][province][city])
          continue
        }
        let cityDistributionSource = provinceDistributionSource[city]
        let cityDistributionDist = provinceDistributionDist[city]
        _.set(finalDistribution, [country, province, city], processCityData(cityDistributionDist, cityDistributionSource))
      }
    }
  }
  return finalDistribution
}

/**
 * 根据idList获取原始数据
 * @param {*} projectId
 * @param {*} cityDistributionIdList
 * @param {*} createTimeAt
 */
async function getByIdListInOneMonth (projectId, cityDistributionIdList, createTimeAt) {
  const talbeName = getTableName(projectId, createTimeAt)
  const rawRecordList = await Knex
    .select(TABLE_COLUMN)
    .from(talbeName)
    .whereIn('id', cityDistributionIdList)
    .catch(err => {
      Logger.error('citydistribution => getByIdListInOneMonth:', err.message)
      return []
    })
  return rawRecordList
}
/**
 * 将城市分布数据拍平后, 作为一个列表返回回来, 方便集中处理
 * @param {*} distribution
 * @return {Array}
 */
function getFlattenCityRecordListInDistribution (distribution) {
  let recordList = []
  for (let country of Object.keys(distribution)) {
    let countryDistribution = distribution[country]
    for (let province of Object.keys(countryDistribution)) {
      let provinceDistribution = countryDistribution[province]
      for (let city of Object.keys(provinceDistribution)) {
        let cityRecord = provinceDistribution[city]
        recordList.push(cityRecord)
      }
    }
  }
  return recordList
}

export default {
  getCityDistributionRecord,
  insertCityDistributionRecord,
  updateCityDistributionRecord,
  mergeDistributionData,
  getFlattenCityRecordListInDistribution,
  getTableName,
  getByIdListInOneMonth
}
