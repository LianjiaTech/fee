import ParseBase from '~/src/commands/parse/base'
import moment from 'moment'
import _ from 'lodash'
import MCommon from '~/src/model/parse/common'
import DATE_FORMAT from '~/src/constants/date_format'
import DataCleaning from '~/src/commands/utils/data_cleaning'

let datacleaning = new DataCleaning()
const BaseTableName = 't_o_system_collection'

class ParseDevice extends ParseBase {
  static get signature () {
    return `
      Parse:Device
      {startAtYmdHi:日志扫描范围上限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
      {endAtYmdHi:日志扫描范围下限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
    `
  }

  static get description () {
    return '[按天] 解析kafka日志, 分析指定时间范围Device'
  }

  /**
   * 判断该条记录是不是device记录
   * @param {Object} record
   * @return {Boolean}
   */
  isLegalRecord (record) {
    let ua = _.get(record, ['ua'], {})
    let uuid = _.get(record, ['common', 'uuid'], '')
    let browserVersion = _.get(ua, ['browser', 'version'], '')
    if (_.isEmpty(uuid)) {
      return false
    }
    if (_.isEmpty(ua)) {
      return false
    }
    // 旧的打点UA传的有问题, chrome版本号固定写成了537.36
    if (browserVersion && browserVersion > 537) {
      return false
    }
    return true
  }

  /**
   * 更新记录
   */
  async processRecordAndCacheInProjectMap (record) {
    let commonInfo = _.get(record, ['common'], {})
    let ua = _.get(record, ['ua'], {})
    let uuid = _.get(commonInfo, ['uuid'], '')
    let visitAt = _.get(record, ['time'], 0)
    let projectId = _.get(record, ['project_id'], 0)
    let country = _.get(record, ['country'], '')
    let province = _.get(record, ['province'], '')
    let city = _.get(record, ['city'], '')
    let browser = _.get(ua, ['browser', 'name'], '')
    let browserVersion = _.get(ua, ['browser', 'version'], '')
    let engine = _.get(ua, ['engine', 'name'], '')
    let engineVersion = _.get(ua, ['engine', 'version'], '')
    let deviceVendor = _.get(ua, ['device', 'vendor'], '')
    let deviceModel = _.get(ua, ['device', 'model'], '')
    let os = _.get(ua, ['os', 'name'], '')
    let osVersion = _.get(ua, ['os', 'version'], '')
    let runtimeVersion = _.get(commonInfo, ['runtime_version'], '')
    let visitAtMonth = moment.unix(visitAt).format(DATE_FORMAT.DATABASE_BY_MONTH)
    let deviceRecord = {
      projectId,
      visitAt,
      uuid,
      browser,
      browserVersion,
      engine,
      engineVersion,
      deviceVendor,
      deviceModel,
      os,
      osVersion,
      country,
      province,
      city,
      runtimeVersion
    }

    // 数据清洗迭代器
    // '~/src/commands/utils/data_cleaning'
    if (!datacleaning.getData(deviceRecord, 'deviceConfigDevice')) {
      return false
    }

    let visitAtMap = new Map()
    let deviceMap = new Map()
    if (this.projectMap.has(projectId)) {
      visitAtMap = this.projectMap.get(projectId)
      if (visitAtMap.has(visitAtMonth)) {
        deviceMap = visitAtMap.get(visitAtMonth)
      }
    }
    deviceMap.set(uuid, deviceRecord)
    visitAtMap.set(visitAtMonth, deviceMap)
    this.projectMap.set(projectId, visitAtMap)
    return true
  }

  /**
   * 将数据同步到数据库中
   */
  async save2DB () {
    let totalRecordCount = this.getRecordCountInProjectMap()
    let processRecordCount = 0
    let successSaveCount = 0
    for (let [projectId, visitAtMap] of this.projectMap) {
      const processTableName = MCommon.getTableName(BaseTableName, MCommon.SPLIT_BY.PROJECT, projectId)
      for (let [visitAtMonth, deviceMap] of visitAtMap) {
        for (let [uuid, deviceRecord] of deviceMap) {
          let {
            visitAt
          } = deviceRecord
          const sqlParams = {
            uuid: uuid,
            browser: deviceRecord.browser,
            browser_version: deviceRecord.browserVersion,
            engine: deviceRecord.engine,
            engine_version: deviceRecord.engineVersion,
            device_vendor: deviceRecord.deviceVendor,
            device_model: deviceRecord.deviceModel,
            os: deviceRecord.os,
            os_version: deviceRecord.osVersion,
            country: deviceRecord.country,
            province: deviceRecord.province,
            city: deviceRecord.city,
            runtime_version: deviceRecord.runtimeVersion,
            visit_at_month: visitAtMonth,
            log_at: visitAt
          }
          let isSuccess = await MCommon.replaceInto({
            tableName: BaseTableName,
            splitBy: MCommon.SPLIT_BY.PROJECT,
            projectId: projectId,
            where: { 'visit_at_month': visitAtMonth, 'uuid': uuid },
            datas: sqlParams
          })
          processRecordCount = processRecordCount + 1
          if (isSuccess) {
            successSaveCount = successSaveCount + 1
          }
          this.reportProcess(processRecordCount, successSaveCount, totalRecordCount, processTableName)
        }
      }
    }
    return { totalRecordCount, processRecordCount, successSaveCount }
  }

  /**
   * 统计 projectdeviceMap 中的记录总数
   */
  getRecordCountInProjectMap () {
    let totalCount = 0
    for (let [projectId, visitAtMap] of this.projectMap) {
      for (let [visitAtMonth, deviceMap] of visitAtMap) {
        for (let [uuid, deviceRecord] of deviceMap) {
          totalCount = totalCount + 1
        }
      }
    }
    return totalCount
  }
}

export default ParseDevice
