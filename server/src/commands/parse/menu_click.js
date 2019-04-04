
import ParseBase from '~/src/commands/parse/base'
import moment from 'moment'
import _ from 'lodash'
import MBehaviorDistribution from '~/src/model/parse/behavior_distribution'
import MCityDistribution from '~/src/model/parse/city_distribution'
import DATE_FORMAT from '~/src/constants/date_format'

const LegalRecordType = 'product'
const LegalRecordCode = 10002

const COUNT_TYPE_HOUR = DATE_FORMAT.UNIT.HOUR
const COUNT_BY_HOUR_DATE_FORMAT = DATE_FORMAT.DATABASE_BY_HOUR

/**
 * 解析用户点击情况
 */
class MenuClick extends ParseBase {
  static get signature () {
    return `
     Parse:MenuClick 
     {startAtYmdHi:日志扫描范围上限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     {endAtYmdHi:日志扫描范围下限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     `
  }

  static get description () {
    return '[按天] 解析kafka日志, 用户点击情况'
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
    let menuName = _.get(record, ['detail', 'name'], '')
    let menuCode = _.get(record, ['detail', 'code'], '')
    let menuUrl = _.get(record, ['detail', 'url'], '')
    code = parseInt(code)
    menuCode = menuCode + '' // 转成字符串
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
    if (menuCode === '') {
      return false
    }
    return true
  }

  /**
   * 更新记录
   */
  async processRecordAndCacheInProjectMap (record) {
    let projectId = _.get(record, ['project_id'], '')
    let name = _.get(record, ['detail', 'name'], '')
    let code = _.get(record, ['detail', 'code'], '')
    let url = _.get(record, ['detail', 'url'], '')
    url = url + '' // 强制转换为字符串
    if (url.length > 200) {
      // url最长是200个字符
      url = url.slice(0, 200)
    }

    let country = _.get(record, ['country'], '')
    let province = _.get(record, ['province'], '')
    let city = _.get(record, ['city'], '')
    let recordAt = _.get(record, ['time'], 0)

    let countAtTime = moment.unix(recordAt).format(COUNT_BY_HOUR_DATE_FORMAT)
    let distributionPath = [country, province, city]

    let distributeCountCount = 1
    let countAtMap = new Map()
    let codeMap = new Map()
    let distribution = {}
    if (this.projectMap.has(projectId)) {
      countAtMap = this.projectMap.get(projectId)
      if (countAtMap.has(countAtTime)) {
        codeMap = countAtMap.get(countAtTime)
        if (codeMap.has(code)) {
          let recordPackage = codeMap.get(code)
          distribution = _.get(recordPackage, ['distribution'], {})
          if (_.has(distribution, distributionPath)) {
            let oldDistributeCount = _.get(distribution, distributionPath, 0)
            distributeCountCount = distributeCountCount + oldDistributeCount
          }
        }
      }
    }
    _.set(distribution, distributionPath, distributeCountCount)
    let recordPackage = {
      code,
      distribution,
      name,
      url
    }
    codeMap.set(code, recordPackage)
    countAtMap.set(countAtTime, codeMap)
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
      for (let [countAtTime, codeMap] of countAtMap) {
        for (let [code, recordPackage] of codeMap) {
          let { distribution, name, url } = recordPackage
          let recordList = MCityDistribution.getFlattenCityRecordListInDistribution(distribution)
          let totalCount = 0
          for (let record of recordList) {
            totalCount = totalCount + record
          }

          let isSuccess = await MBehaviorDistribution.replaceRecord(projectId, code, name, url, totalCount, countAtTime, COUNT_TYPE_HOUR, distribution)
          processRecordCount = processRecordCount + 1
          if (isSuccess) {
            successSaveCount = successSaveCount + 1
          }
          this.reportProcess(processRecordCount, successSaveCount, totalRecordCount)
        }
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
      for (let [countAtTime, codeMap] of countAtMap) {
        for (let [code, recordPackage] of codeMap) {
          totalCount = totalCount + 1
        }
      }
    }
    return totalCount
  }
}

export default MenuClick
