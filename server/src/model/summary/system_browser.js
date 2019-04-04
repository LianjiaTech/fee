import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'
import MProject from '~/src/model/project/project'
import MSystem from '~/src/model/parse/system'
import Logger from '~/src/library/logger'
import MCityDistribution from '~/src/model/parse/city_distribution'
import DATE_FORMAT from '~/src/constants/date_format'

const BASE_TABLE_NAME = 't_r_system_browser'
const TABLE_COLUMN = [
  `id`,
  `project_id`,
  `browser`,
  `browser_version`,
  `total_count`,
  `count_at_month`,
  `city_distribute_id`,
  `create_time`,
  `update_time`
]

/**
 * 获取表名
 * @param {number} projectId 项目id
 * @param {number} createTimeAt 创建时间, 时间戳
 * @return {String}
 */
function getTableName() {
  return BASE_TABLE_NAME
}

async function summarySystemBrowser(visitAt) {
  let visitAtMonth = moment.unix(visitAt).format(DATE_FORMAT.DATABASE_BY_MONTH)
  const projectList = await MProject.getList()
  for (let rawProject of projectList) {
    const projectId = _.get(rawProject, 'id', '')
    const projectName = _.get(rawProject, 'project_name', '')
    const systemTableName = MSystem.getTableName(projectId)
    Logger.info(`开始处理项目${projectId}(${projectName})的数据`)
    Logger.info(`[${projectId}(${projectName})] 统计月份:${visitAtMonth}`)
    const sumRes = await Knex
      .count('* as total_count')
      .select([`browser`, `browser_version`, `visit_at_month`, `country`, `province`, `city`])
      .from(systemTableName)
      .where('visit_at_month', '=', visitAtMonth)
      .groupBy('browser')
      .groupBy('browser_version')
      .groupBy('country')
      .groupBy('province')
      .groupBy('city')
      .catch((err) => {
        Logger.error(err)
        return []
      })
    if (sumRes.length === 0) {
      continue
    }
    let browserVersionRecord = {}
    for (let countItem of sumRes) {
      const { browser, browser_version: browserVersion, country, province, city, total_count: totalCount, visit_at_month: countAtMonth } = countItem
      let distribution = {}
      let distributionPath = [country, province, city]
      _.set(distribution, distributionPath, totalCount)
      let browserAndVersion = browser + browserVersion
      if (_.has(browserVersionRecord, browserAndVersion)) {
        // 若是已经有，更新count/distribution
        let oldCount = _.get(browserVersionRecord, [browserAndVersion, 'totalCount'], 0)
        let newCount = oldCount + totalCount
        let oldDistribution = _.get(browserVersionRecord, [browserAndVersion, 'distribution'], {})
        let cityDistribute = MCityDistribution.mergeDistributionData(distribution, oldDistribution, (newCityRecord, oldCityRecord) => { return newCityRecord + oldCityRecord })
        _.set(browserVersionRecord, [browserAndVersion, 'totalCount'], newCount)
        _.set(browserVersionRecord, [browserAndVersion, 'distribution'], cityDistribute)
      } else {
        _.set(browserVersionRecord, [browserAndVersion], {
          totalCount: totalCount,
          browser: browser,
          countAtMonth: countAtMonth,
          browserVersion: browserVersion,
          distribution: distribution
        })
      }
    }

    let totalCount = 0
    for (let item of Object.keys(browserVersionRecord)) {
      if (item) {
        totalCount = totalCount + 1
      }
      let recordInfo = browserVersionRecord[item]
      await replaceAndAutoIncreaseBrowserRecord(projectId, recordInfo, recordInfo['distribution'])
    }
    Logger.info(`项目${projectId}(${projectName})处理完毕, 共处理${totalCount}条数据`)
  }
}

/**
 * 自动创建&更新, 并增加total_count的值
 * @param {number} projectId
 * @param {number} totalCount
 * @param {number} countAtMonth
 * @param {string} countType
 * @param {object} cityDistribute
 * @return {boolean}
 */
async function replaceAndAutoIncreaseBrowserRecord(projectId, recordInfo, cityDistribute) {
  const { totalCount, browser, browserVersion, countAtMonth } = recordInfo
  if (!browserVersion || !browser || !countAtMonth) {
    return false
  }
  let tableName = getTableName()
  let updateAt = moment().unix()
  // 返回值是一个列表
  let oldRecordList = await Knex
    .select([`total_count`, `city_distribute_id`, `create_time`, `id`])
    .from(tableName)
    .where('project_id', '=', projectId)
    .andWhere('count_at_month', '=', countAtMonth)
    .andWhere('browser', '=', browser)
    .andWhere('browser_version', '=', browserVersion)
    .catch(() => {
      return []
    })
  // 利用get方法, 不存在直接返回0, 没毛病
  let id = _.get(oldRecordList, [0, 'id'], 0)
  let cityDistributeIdInDb = _.get(oldRecordList, [0, 'city_distribute_id'], 0)
  let createTimeInDb = _.get(oldRecordList, [0, 'create_time'], 0)

  let data = {
    project_id: projectId,
    count_at_month: countAtMonth,
    total_count: totalCount,
    update_time: updateAt
  }
  let isSuccess = false
  if (id > 0) {
    // 更新城市分布数据
    let isUpdateSuccess = MCityDistribution.updateCityDistributionRecord(cityDistributeIdInDb, projectId, createTimeInDb, JSON.stringify(cityDistribute))
    if (isUpdateSuccess === false) {
      return false
    }
    // 更新具体数据
    let affectRows = await Knex(tableName)
      .update(data)
      .where(`id`, '=', id)
    isSuccess = affectRows > 0
  } else {
    // 首先插入城市分布数据
    let cityDistributeId = await MCityDistribution.insertCityDistributionRecord(JSON.stringify(cityDistribute), projectId, updateAt)
    if (cityDistributeId === 0) {
      // 城市分布数据插入失败
      return false
    }
    data['browser'] = browser
    data['browser_version'] = browserVersion
    data['city_distribute_id'] = cityDistributeId
    data['total_count'] = totalCount
    data['create_time'] = updateAt
    let insertResult = await Knex
      .returning('id')
      .insert(data)
      .into(tableName)
      .catch(e => { return [] })
    let insertId = _.get(insertResult, [0], 0)
    isSuccess = insertId > 0
  }
  return isSuccess
}

/**
 * 获取记录
 */
async function getRecord(projectId, countAtMonth) {
  let tableName = getTableName()
  let recordList = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('project_id', '=', projectId)
    .andWhere('count_at_month', '=', countAtMonth)
    .catch(() => {
      return []
    })
  return _.get(recordList, [0], {})
}

export default {
  getRecord,
  summarySystemBrowser
}
