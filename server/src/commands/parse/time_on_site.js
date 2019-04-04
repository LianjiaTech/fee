import ParseBase from '~/src/commands/parse/base'
import moment from 'moment'
import _ from 'lodash'
import MDurationDistribution from '~/src/model/parse/duration_distribution'
import MCityDistribution from '~/src/model/parse/city_distribution'
import MUniqueView from '~/src/model/summary/unique_view'
import DATE_FORMAT from '~/src/constants/date_format'

const LegalRecordType = 'product'
const LegalRecordCode = 10001
const MaxAllowRecordDuringMs = 7200000 // 用户停留时长不能超过两小时(避免作弊)
const MinAllowRecordDuringMs = 0 // 用户停留时长不能小于0

const COUNT_TYPE_HOUR = 'hour'
const COUNT_BY_HOUR_DATE_FORMAT = DATE_FORMAT.DATABASE_BY_HOUR

class TimeOnSiteByHour extends ParseBase {
  static get signature () {
    return `
     Parse:TimeOnSiteByHour 
     {startAtYmdHi:日志扫描范围上限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     {endAtYmdHi:日志扫描范围下限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     `
  }

  static get description () {
    return '[按小时] 解析kafka日志, 分析记录指定时间范围内用户停留时长'
  }

  /**
   * 判断该条记录是不是需要解析的记录
   * @param {Object} record
   * @return {Boolean}
   */
  isLegalRecord (record) {
    let recordType = _.get(record, ['type'], '')
    let code = _.get(record, ['code'], '')
    let projectId = _.get(record, ['project_id'], '')
    let durationMs = _.get(record, ['detail', 'duration_ms'], '')
    code = parseInt(code)
    durationMs = parseInt(durationMs)
    projectId = parseInt(projectId)
    if (recordType !== LegalRecordType) {
      return false
    }
    if (_.isNumber(code) === false) {
      return false
    }
    if (code !== LegalRecordCode) {
      return false
    }
    if (_.isNumber(projectId) === false) {
      return false
    }
    if (projectId < 0) {
      return false
    }
    if (_.isNumber(durationMs) === false) {
      return false
    }
    if (durationMs > MaxAllowRecordDuringMs) {
      return false
    }
    if (durationMs < MinAllowRecordDuringMs) {
      return false
    }
    return true
  }

  /**
   * 更新记录
   */
  async processRecordAndCacheInProjectMap (record) {
    let projectId = _.get(record, ['project_id'], 0)
    let durationMs = _.get(record, ['detail', 'duration_ms'], 0)
    let country = _.get(record, ['country'], '')
    let province = _.get(record, ['province'], '')
    let city = _.get(record, ['city'], '')
    let recordAt = _.get(record, ['time'], 0)

    let countAtTime = moment.unix(recordAt).format(COUNT_BY_HOUR_DATE_FORMAT)
    let distributionPath = [country, province, city]

    let countAtMap = new Map()
    let distribution = {}
    if (this.projectMap.has(projectId)) {
      countAtMap = this.projectMap.get(projectId)
      if (countAtMap.has(countAtTime)) {
        distribution = countAtMap.get(countAtTime)
        if (_.has(distribution, distributionPath)) {
          let oldDurationMs = _.get(distribution, distributionPath, 0)
          durationMs = durationMs + oldDurationMs
        }
      }
    }
    _.set(distribution, distributionPath, durationMs)
    countAtMap.set(countAtTime, distribution)
    this.projectMap.set(projectId, countAtMap)
    return true
  }

  /**
   * 将数据同步到数据库中
   */
  async save2DB () {
    let totalRecordCount = this.getRecordCountInProjectMap()
    let processRecordCount = 0
    let successSaveCount = 0
    for (let [projectId, countAtMap] of this.projectMap) {
      for (let [countAtTime, distribution] of countAtMap) {
        let recordList = MCityDistribution.getFlattenCityRecordListInDistribution(distribution)
        let totalStayMs = 0
        for (let record of recordList) {
          totalStayMs = totalStayMs + record
        }

        let totalUv = await MUniqueView.getTotalUv(projectId, countAtTime, COUNT_TYPE_HOUR)
        let isSuccess = await MDurationDistribution.replaceUvRecord(projectId, totalStayMs, totalUv, countAtTime, COUNT_TYPE_HOUR, distribution)
        processRecordCount = processRecordCount + 1
        if (isSuccess) {
          successSaveCount = successSaveCount + 1
        }
        this.reportProcess(processRecordCount, successSaveCount, totalRecordCount)
      }
    }
    return { totalRecordCount, processRecordCount, successSaveCount }
  }

  /**
   * 统计 projectUvMap 中的记录总数
   */
  getRecordCountInProjectMap () {
    let totalCount = 0
    for (let [projectId, countAtMap] of this.projectMap) {
      for (let [countAtTime, distribution] of countAtMap) {
        totalCount = totalCount + 1
      }
    }
    return totalCount
  }
}

export default TimeOnSiteByHour
