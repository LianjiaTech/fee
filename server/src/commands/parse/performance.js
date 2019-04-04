import _ from 'lodash'
import DATE_FORMAT from '~/src/constants/date_format'
import moment from 'moment'
import MPerformance from '~/src/model/parse/performance'
import ParseBase from '~/src/commands/parse/base'

class ParseUV extends ParseBase {
  static get signature() {
    return `
     Parse:Performance 
     {startAtYmdHi:日志扫描范围上限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     {endAtYmdHi:日志扫描范围下限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     `
  }

  static get description() {
    return '[按小时] 解析kafka日志, 分析分钟级别的指定时间范围内的性能指标'
  }

  /**
   * 判断该条记录是不是perf记录
   * @param {Object} record
   * @return {Boolean}
   */
  isLegalRecord(record) {
    let projectId = _.get(record, ['project_id'], 0)
    if (_.get(record, ['type'], '') !== 'perf') {
      return false
    }
    projectId = parseInt(projectId)
    if (_.isNumber(projectId) === false) {
      return false
    }
    if (projectId <= 0) {
      return false
    }
    return true
  }

  /**
   * 更新并替换projectMap中的总记录数
   * @param {*} indicator
   * @param {*} indicatorValue
   * @param {*} projectId
   * @param {*} url
   * @param {*} countAtMinute
   * @param {*} country
   * @param {*} province
   * @param {*} city
   */
  replaceIndicatorRecord(indicator, indicatorValue, projectId, url, countAtMinute, country, province, city) {
    // 初始化Map路径
    let uniqIdPath = [projectId, url, indicator, countAtMinute] // 记录唯一key
    let locationPath = [country, province, city] // 路径地址

    // 初始化Map对象
    let uniqIdMap = new Map()
    let record = { sum_indicator_value: 0, pv: 0 }
    uniqIdMap.set(locationPath, record)

    // 检查projectMap中是否有对应记录, 如果有, 使用projectMap中的记录
    if (this.projectMap.has(uniqIdPath)) {
      uniqIdMap = this.projectMap.get(uniqIdPath)
      if (uniqIdMap.has(locationPath)) {
        record = uniqIdMap.get(locationPath)
      } else {
        uniqIdMap.set(locationPath, record)
      }
    } else {
      this.projectMap.set(uniqIdPath, uniqIdMap)
    }

    record['sum_indicator_value'] += indicatorValue
    record['pv'] += 1

    // 将记录更新回Map中
    uniqIdMap.set(locationPath, record)
    this.projectMap.set(uniqIdPath, uniqIdMap)
    return true
  }

  /**
   * 根据指标类型, 自动计算指标数据, 数据异常返回-1
   * @param {*} indicator
   * @param {*} indicatorCollection
   */
  computeIndicatorValue(indicator, indicatorCollection) {
    // DNS查询: domainLookupEnd - domainLookupStart
    // TCP连接: connectEnd - connectStart
    // 请求响应: responseStart - requestStart
    // 内容传输: responseEnd - responseStart
    // DOM解析: domInteractive - responseEnd
    // 资源加载: loadEventStart - domContentLoadedEventEnd
    function isLegal(value) {
      return _.isNumber(value) && value > 0 && value < 1000000 // 不能小于等于0, 不能大于1000秒 
    }

    let endAt = 0
    let startAt = 0
    let value = 0
    switch (indicator) {
      // 区间段耗时
      case MPerformance.INDICATOR_TYPE_DNS查询耗时:
        endAt = _.get(indicatorCollection, ['domainLookupEnd'], 0)
        startAt = _.get(indicatorCollection, ['domainLookupStart'], 0)
        break
      case MPerformance.INDICATOR_TYPE_TCP链接耗时:
        endAt = _.get(indicatorCollection, ['connectEnd'], 0)
        startAt = _.get(indicatorCollection, ['connectStart'], 0)
        break
      case MPerformance.INDICATOR_TYPE_请求响应耗时:
        endAt = _.get(indicatorCollection, ['responseStart'], 0)
        startAt = _.get(indicatorCollection, ['requestStart'], 0)
        break
      case MPerformance.INDICATOR_TYPE_内容传输耗时:
        endAt = _.get(indicatorCollection, ['responseEnd'], 0)
        startAt = _.get(indicatorCollection, ['responseStart'], 0)
        break
      case MPerformance.INDICATOR_TYPE_DOM解析耗时:
        endAt = _.get(indicatorCollection, ['domInteractive'], 0)
        startAt = _.get(indicatorCollection, ['responseEnd'], 0)
        break
      case MPerformance.INDICATOR_TYPE_资源加载耗时:
        endAt = _.get(indicatorCollection, ['loadEventStart'], 0)
        startAt = _.get(indicatorCollection, ['domContentLoadedEventEnd'], 0)
        break
      case MPerformance.INDICATOR_TYPE_SSL连接耗时:
        // secureConnectionStart 值可能为0
        // 刷新https页面时, secureConnectionStart值即为0 
        // Chrome已报bug, 不过官方不准备修复. https://bugs.chromium.org/p/chromium/issues/detail?id=404501
        endAt = _.get(indicatorCollection, ['connectEnd'], 0)
        startAt = _.get(indicatorCollection, ['secureConnectionStart'], 0)
        break
      // 关键性能指标
      case MPerformance.INDICATOR_TYPE_首次渲染耗时:
        endAt = _.get(indicatorCollection, ['responseEnd'], 0)
        startAt = _.get(indicatorCollection, ['fetchStart'], 0)
        break
      case MPerformance.INDICATOR_TYPE_首包时间耗时:
        endAt = _.get(indicatorCollection, ['responseStart'], 0)
        startAt = _.get(indicatorCollection, ['domainLookupStart'], 0)
        break
      case MPerformance.INDICATOR_TYPE_首次可交互耗时:
        endAt = _.get(indicatorCollection, ['domInteractive'], 0)
        startAt = _.get(indicatorCollection, ['fetchStart'], 0)
        break
      case MPerformance.INDICATOR_TYPE_DOM_READY_耗时:
        endAt = _.get(indicatorCollection, ['domContentLoadedEventEnd'], 0)
        startAt = _.get(indicatorCollection, ['fetchStart'], 0)
        break
      case MPerformance.INDICATOR_TYPE_页面完全加载耗时:
        endAt = _.get(indicatorCollection, ['loadEventStart'], 0)
        startAt = _.get(indicatorCollection, ['fetchStart'], 0)
        break

      default:
        // 没有匹配到指标处理逻辑, 自动返回
        this.log(`没有匹配到${indicator}指标, 自动跳过`)
        return -1
    }

    // 首先判断参数是否合理
    if (endAt <= 0 || startAt <= 0) {
      this.log(`${indicator}指标计算异常, startAt => ${startAt}, endAt => ${endAt}, 自动跳过`)
      return -1
    }

    value = endAt - startAt
    if (isLegal(value) === false) {
      this.log(`${indicator}指标计算异常, startAt => ${startAt}, endAt => ${endAt}, 自动跳过`)
      return -1
    }
    return value
  }

  /**
   * 更新记录
   */
  async processRecordAndCacheInProjectMap(record) {
    let visitAt = _.get(record, ['time'], 0)
    let projectId = _.get(record, ['project_id'], 0)
    let country = _.get(record, ['country'], '')
    let province = _.get(record, ['province'], '')
    let city = _.get(record, ['city'], '')
    // 数据都在detail里
    let detail = _.get(record, ['detail'], {})
    let url = _.get(detail, ['url'], '')
    if (_.isNumber(visitAt) === false || visitAt === 0 || _.isEmpty(detail) || _.isString(url) === false || url.length === 0) {
      this.log(`数据不合法, 自动跳过 visitAt => ${visitAt}`, 'detail =>', detail, 'url =>', url)
      return false
    }
    let visitAtMinute = moment.unix(visitAt).format(DATE_FORMAT.DATABASE_BY_MINUTE)

    // 计算响应指标数据
    for (let indicator of [
      //  资源加载指标
      MPerformance.INDICATOR_TYPE_DNS查询耗时,
      MPerformance.INDICATOR_TYPE_TCP链接耗时,
      MPerformance.INDICATOR_TYPE_请求响应耗时,
      MPerformance.INDICATOR_TYPE_DOM解析耗时,
      MPerformance.INDICATOR_TYPE_内容传输耗时,
      MPerformance.INDICATOR_TYPE_资源加载耗时,
      MPerformance.INDICATOR_TYPE_SSL连接耗时,

      // 关键性能指标
      MPerformance.INDICATOR_TYPE_首包时间耗时,
      MPerformance.INDICATOR_TYPE_首次渲染耗时,
      MPerformance.INDICATOR_TYPE_首次可交互耗时,
      MPerformance.INDICATOR_TYPE_DOM_READY_耗时,
      MPerformance.INDICATOR_TYPE_页面完全加载耗时,
    ]) {
      let indicatorValue = this.computeIndicatorValue(indicator, detail)
      if (indicatorValue >= 0) {
        this.replaceIndicatorRecord(indicator, indicatorValue, projectId, url, visitAtMinute, country, province, city)
      }
    }

    return true
  }

  /**
   * 将数据同步到数据库中
   */
  async save2DB() {
    let totalRecordCount = this.getRecordCountInProjectMap()
    let processRecordCount = 0
    let successSaveCount = 0

    for (let [[projectId, url, indicator, countAtMinute], uniqIdMap] of this.projectMap) {
      let cityDistribute = {}
      let sumIndicatorValueTotal = 0
      let pvTotal = 0
      for (let [[country, province, city], record] of uniqIdMap) {
        let {
          sum_indicator_value: sumIndicatorValue,
          pv
        } = record

        _.set(cityDistribute, [country, province, city], {
          pv,
          sum_indicator_value: sumIndicatorValue
        })

        pvTotal = pvTotal + pv
        sumIndicatorValueTotal = sumIndicatorValueTotal + sumIndicatorValue
      }
      let countAt = moment(countAtMinute, DATE_FORMAT.DATABASE_BY_UNIT[DATE_FORMAT.UNIT.MINUTE]).unix()
      let isSuccess = await MPerformance.replaceInto(projectId, url, indicator, countAt, DATE_FORMAT.UNIT.MINUTE, sumIndicatorValueTotal, pvTotal, cityDistribute)
      processRecordCount = processRecordCount + 1
      if (isSuccess) {
        successSaveCount = successSaveCount + 1
      }
      this.reportProcess(processRecordCount, successSaveCount, totalRecordCount)
    }
    return { totalRecordCount, processRecordCount, successSaveCount }
  }

  /**
   * 统计 projectUvMap 中的记录总数
   */
  getRecordCountInProjectMap() {
    let totalCount = 0
    for (let [[projectId, url, indicator, countAtMinute], uniqIdMap] of this.projectMap) {
      for (let [[country, province, city], record] of uniqIdMap) {
        totalCount = totalCount + 1
      }
    }
    return totalCount
  }
}

export default ParseUV
