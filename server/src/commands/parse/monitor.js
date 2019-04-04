import ParseBase from '~/src/commands/parse/base'
import moment from 'moment'
import _ from 'lodash'
import MCommon from '~/src/model/parse/common'
import MMonitor from '~/src/model/parse/monitor'
import Util from '~/src/library/utils/modules/util'

import DATE_FORMAT from '~/src/constants/date_format'

const COUNT_BY_MINUTE_DATE_FORMAT = DATE_FORMAT.DATABASE_BY_MINUTE

const BaseTableName = 't_o_monitor'
class ParseMonitor extends ParseBase {
  static get signature() {
    return `
      Parse:Monitor
      {startAtYmdHi:日志扫描范围上限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
      {endAtYmdHi:日志扫描范围下限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
    `
  }

  static get description() {
    return '[按分钟] 解析kafka日志, 分析Monitor'
  }

  /**
   * 判断该条记录是不是monitor记录
   * @param {Object} record
   * @return {Boolean}
   */
  isLegalRecord(record) {
    let type = _.get(record, ['type'], '')
    let md5 = _.get(record, ['md5'], '')

    if (type !== 'error') {
      return false
    }
    if (_.isEmpty(md5)) {
      return false
    }
    // 对于旧的打点数据, 忽略处理
    let errorType = _.get(record, ['code'], '')
    let errorTypeStr = `${errorType}`
    let errorName = _.get(record, ['detail', 'error_no'], '')
    if (
      (
        errorTypeStr === MMonitor.ERROR_TYPE_页面加载异常 ||
        errorTypeStr === MMonitor.ERROR_TYPE_启动异常 ||
        errorTypeStr === MMonitor.ERROR_TYPE_登录异常 ||
        errorTypeStr === MMonitor.ERROR_TYPE_NODE报错 ||
        errorTypeStr === MMonitor.ERROR_TYPE_JS异常 ||
        errorTypeStr === MMonitor.ERROR_TYPE_自定义异常
      ) && !errorName
    ) {
      return false
    }
    return true
  }

  /**
   * 更新记录
   */
  async processRecordAndCacheInProjectMap(record) {
    let projectId = _.get(record, ['project_id'], 0)
    let visitAt = _.get(record, ['time'], 0)
    let errorType = _.get(record, ['code'], '')
    let errorName = _.get(record, ['detail', 'error_no'], '')
    let httpCode = _.get(record, ['detail', 'http_code'], 0)
    let duringMsE = _.get(record, ['detail', 'durning_ms'], 0)
    let duringMs = _.get(record, ['detail', 'during_ms'], duringMsE)
    let requestSizeB = _.get(record, ['detail', 'request_size_b'], 0)
    let responseSizeB = _.get(record, ['detail', 'response_size_b'], 0)
    let url = _.get(record, ['detail', 'url'], '')
    let country = _.get(record, ['country'], '')
    let province = _.get(record, ['province'], '')
    let city = _.get(record, ['city'], '')
    let md5 = _.get(record, ['md5'], '')
    let extraData = _.get(record, ['extra'], {})

    url = url + '' // 强制转换为字符串
    if (url.length > 200) {
      // url最长是200个字符
      url = url.slice(0, 200)
    }

    // 对error_name长度做限制
    errorName = errorName + ''
    if (errorName.length > 254) {
      errorName = errorName.slice(0, 254)
    }

    // 处理参数
    httpCode = parseInt(httpCode)
    if (_.isFinite(httpCode) === false) {
      httpCode = 0
    }

    duringMs = parseInt(duringMs)
    if (_.isFinite(duringMs) === false) {
      duringMs = 0
    }

    requestSizeB = parseInt(requestSizeB)
    if (_.isFinite(requestSizeB) === false) {
      requestSizeB = 0
    }

    responseSizeB = parseInt(responseSizeB)
    if (_.isFinite(responseSizeB) === false) {
      responseSizeB = 0
    }

    let visitAtTime = moment.unix(visitAt).format(COUNT_BY_MINUTE_DATE_FORMAT)

    let monitorRecord = {
      visitAt,
      errorType,
      errorName,
      httpCode,
      duringMs,
      requestSizeB,
      responseSizeB,
      url,
      country,
      province,
      city,
      md5,
      extraData
    }

    let visitAtMap = new Map()
    let monitorRecordList = []
    if (this.projectMap.has(projectId)) {
      visitAtMap = this.projectMap.get(projectId)
      if (visitAtMap.has(visitAtTime)) {
        monitorRecordList = visitAtMap.get(visitAtTime)
      }
    }
    monitorRecordList.push(monitorRecord)
    visitAtMap.set(visitAtTime, monitorRecordList)
    this.projectMap.set(projectId, visitAtMap)
    return true
  }

  async save2DB() {
    let totalRecordCount = this.getRecordCountInProjectMap()
    let processRecordCount = 0
    let successSaveCount = 0
    for (let [projectId, visitAtMap] of this.projectMap) {
      for (let [visitAtTime, monitorMap] of visitAtMap) {
        let visitAt = moment(visitAtTime, DATE_FORMAT.DATABASE_BY_MINUTE).unix()
        let tenMinutesAgoAt = visitAt - 10 * 60
        let oneMinuteLaterAt = visitAt + 60
        let processTableName = MMonitor.getTableName(projectId, visitAt)
        let rawMonitorList = await MMonitor.getRecordListInRange(projectId, tenMinutesAgoAt, oneMinuteLaterAt)
        let uniqueSet = new Set()
        for (let rawRecord of rawMonitorList) {
          const { log_at: logAt, md5 } = rawRecord
          const uniqueKey = logAt + '' + md5
          uniqueSet.add(uniqueKey)
        }
        for (let monitorRecord of monitorMap) {
          let {
            visitAt,
            extraData,
            md5
          } = monitorRecord
          const sqlParams = {
            error_type: monitorRecord.errorType,
            error_name: monitorRecord.errorName,
            http_code: monitorRecord.httpCode,
            during_ms: monitorRecord.duringMs,
            request_size_b: monitorRecord.requestSizeB,
            response_size_b: monitorRecord.responseSizeB,
            url: monitorRecord.url,
            country: monitorRecord.country,
            province: monitorRecord.province,
            city: monitorRecord.city,
            md5: monitorRecord.md5,
            log_at: visitAt
          }
          // 对接收到的参数做进一步校验，因为数据库里面的类型与传过来的类型不一致
          // 比如http_code在一些情况下传来的是空字符串，数据库中存放的是int型
          const sqlRecord = Util.handleEmptyData(sqlParams)

          // monitor查询参数
          let monitorParams = {
            projectId: projectId,
            tableName: BaseTableName,
            splitBy: MCommon.SPLIT_BY.MONTH,
            select: 'monitor_ext_id',
            where: {
              log_at: visitAt,
              md5: monitorRecord.md5
            }
          }
          // monitor_ext查询更新参数
          let monitorExtParams = {
            projectId: projectId,
            tableName: 't_o_monitor_ext',
            datas: {
              ext_json: JSON.stringify(extraData)
            },
            splitBy: MCommon.SPLIT_BY.MONTH
          }
          const key = visitAt + '' + md5
          if (uniqueSet.has(key) === false) {
            let monitorRes = await MCommon.insertInto(monitorExtParams)
            sqlRecord.monitor_ext_id = monitorRes[0]
            monitorParams.datas = sqlRecord
            let isSuccess = await MCommon.replaceInto(monitorParams)
            if (isSuccess) {
              successSaveCount = successSaveCount + 1
            }
          }
          processRecordCount = processRecordCount + 1
          this.reportProcess(processRecordCount, successSaveCount, totalRecordCount, processTableName)
        }
      }
    }
    return { totalRecordCount, processRecordCount, successSaveCount }
  }
  /**
   * 统计 projectmonitorMap 中的记录总数
   */
  getRecordCountInProjectMap() {
    let totalCount = 0
    for (let [projectId, visitAtMap] of this.projectMap) {
      for (let [visitAtTime, monitorMap] of visitAtMap) {
        for (let monitorRecord of monitorMap) {
          totalCount = totalCount + 1
        }
      }
    }
    return totalCount
  }
}

export default ParseMonitor
