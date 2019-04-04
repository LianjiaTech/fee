import Base from '~/src/commands/base'
import DATE_FORMAT from '~/src/constants/date_format'
import moment from 'moment'
import _ from 'lodash'
import MProject from '~/src/model/project/project'
import MMonitor from '~/src/model/parse/monitor'
import MErrorSummary from '~/src/model/summary/error_summary'
import MCityDistribution from '~/src/model/parse/city_distribution'
import isUrl from 'is-url'
import URL from 'url'
class SummaryError extends Base {
  static get signature () {
    return `
     Summary:Error

     {countAtTime:所统计时间, ${DATE_FORMAT.UNIT.MINUTE} 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE},${DATE_FORMAT.UNIT.HOUR} 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_HOUR}, ${DATE_FORMAT.UNIT.DAY} 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}}
     {countType:统计类型${DATE_FORMAT.UNIT.MINUTE}/${DATE_FORMAT.UNIT.HOUR}/${DATE_FORMAT.UNIT.DAY}} 
     `
  }

  static get description () {
    return '[按分钟/按小时/按天] 根据历史数据, 汇总分析错误数'
  }

  async execute (args, options) {
    let { countAtTime, countType } = args
    if (this.isArgumentsLegal(args, options) === false) {
      this.warn('参数不正确, 自动退出')
      return false
    }
    let countAtMoment = moment(countAtTime, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType])
    let startAt = countAtMoment.unix()
    let endAt = 0
    switch (countType) {
      case DATE_FORMAT.UNIT.MINUTE:
        endAt = countAtMoment.clone().add(1, 'minute').unix() - 1
        break
      case DATE_FORMAT.UNIT.HOUR:
        endAt = countAtMoment.clone().add(1, 'hours').unix() - 1
        break
      case DATE_FORMAT.UNIT.DAY:
        endAt = countAtMoment.clone().add(1, 'days').unix() - 1
        break
      default:
        endAt = startAt + 3600 - 1
    }
    let startAtMoment = moment.unix(startAt)
    let endAtMoment = moment.unix(endAt)

    let rawProjectList = await MProject.getList()
    this.log('项目列表获取完毕, =>', rawProjectList)
    for (let rawProject of rawProjectList) {
      let projectId = _.get(rawProject, 'id', '')
      let projectName = _.get(rawProject, 'project_name', '')
      if (projectId === 0 || projectId === '') {
        continue
      }
      this.log(`开始处理项目${projectId}(${projectName})的数据`)
      this.log(`[${projectId}(${projectName})] 时间范围:${startAtMoment.format(DATE_FORMAT.DIAPLAY_BY_MINUTE) + ':00'}~${endAtMoment.format(DATE_FORMAT.DIAPLAY_BY_MINUTE) + ':59'}`)

      // 如果countType是分钟，查询原始数据表
      if (countType === DATE_FORMAT.UNIT.MINUTE) {
        await this.handleMinute(projectId, projectName, startAt, endAt, countType)
      } else {
        await this.handleOther(projectId, projectName, startAt, endAt, countType)
      }
    }
  }

  async handleOther (projectId, projectName, startAt, endAt, countType) {
    // 如果countType是小时或天，查询结果表errorSummary里分钟的数据即可
    let getType
    switch (countType) {
      case DATE_FORMAT.UNIT.HOUR:
        getType = DATE_FORMAT.UNIT.MINUTE
        break
      case DATE_FORMAT.UNIT.DAY:
        getType = DATE_FORMAT.UNIT.HOUR
        break
      default:
        this.log(`指令Summary:Error下countType不是day、hour、minute之一，自动退出！`)
        return
    }
    let rawResultList = await MErrorSummary.getErrorSummaryByCountType(projectId, startAt, endAt, getType)
    let resultMap = {}
    let cityIdSet = new Set()
    for (let rawResult of rawResultList) {
      const {
        error_name: errorName,
        error_count: errorCount,
        url_path: url,
        city_distribution_id: cityDistrubutionId
      } = rawResult
      // 设置错误总数
      let oldTotalCount = _.get(resultMap, [errorName, url, 'totalCount'], 0)
      _.set(resultMap, [errorName, url, 'totalCount'], oldTotalCount + errorCount)
      cityIdSet.add(cityDistrubutionId)
      if (_.has(resultMap, [errorName, url, 'idList'])) {
        resultMap[errorName][url]['idList'].push(cityDistrubutionId)
      } else {
        resultMap[errorName][url]['idList'] = [cityDistrubutionId]
      }
    }
    // 获取城市id全部数据放到内存
    // 处理城市分布数据,由于mysql限制，一次查10000条数据
    let allCityIdList = [...cityIdSet]
    let cityIdLen = allCityIdList.length
    let step = 10000
    let recordList = []
    for (let current = 0; current < cityIdLen; current += step) {
      let sliceIdList = allCityIdList.slice(current, current + step)
      let rawResultList = await MCityDistribution.getByIdListInOneMonth(projectId, sliceIdList, startAt)
      recordList = recordList.concat(rawResultList)
    }
    let cityMap = {}
    for (let rawRecord of recordList) {
      let id = _.get(rawRecord, ['id'], 0)
      let rawJson = JSON.parse(_.get(rawRecord, ['city_distribute_json'], '{}'))
      _.set(cityMap, [id], rawJson)
    }

    let updateCount = 0
    let errorNameList = Object.keys(resultMap)
    for (let errorName of errorNameList) {
      let urlList = Object.keys(resultMap[errorName])
      for (let url of urlList) {
        let totalCount = _.get(resultMap, [errorName, url, 'totalCount'], 0)
        let idList = _.get(resultMap, [errorName, url, 'idList'], [])

        // 开始处理城市分布数据
        // 先处理城市分布数据
        let cityDistributionJson = {}
        for (let cityId of idList) {
          let rawCityDistributionJson = _.get(cityMap, [cityId], {})
          for (let country of Object.keys(rawCityDistributionJson)) {
            for (let province of Object.keys(rawCityDistributionJson[country])) {
              for (let city of Object.keys(rawCityDistributionJson[country][province])) {
                let count = _.get(rawCityDistributionJson, [country, province, city], 0)
                let oldCount = _.get(cityDistributionJson, [country, province, city], 0)
                _.set(cityDistributionJson, [country, province, city], count + oldCount)
              }
            }
          }
        }
        let cityDistributionJsonString = JSON.stringify(cityDistributionJson)
        let isSuccess = await MErrorSummary.replaceSummaryRecord(projectId, startAt, countType, 8, errorName, url, totalCount, cityDistributionJsonString)
        if (isSuccess) {
          updateCount++
        }
      }
    }
    this.log(`项目${projectId}(${projectName})处理完毕, 共插入数据${updateCount}条。`)
  }
  async handleMinute (projectId, projectName, startAt, endAt, countType) {
    let rawRecordMonitorList = await MMonitor.getRecordListInRange(projectId, startAt, endAt)
    let errorTypeNameUrlMap = {}
    for (let rawRecord of rawRecordMonitorList) {
      const {
        error_type: errorType,
        error_name: errorName,
        url,
        country,
        province,
        city
      } = rawRecord
      let urlPath
      if (isUrl(url) === false) {
        urlPath = url
      } else {
        let urlObj = new URL.URL(url)
        urlPath = urlObj.host + urlObj.pathname
      }
      let errorCountByCity = _.get(errorTypeNameUrlMap, [errorType, errorName, urlPath, 'cityDistribution', country, province, city], 0)
      _.set(errorTypeNameUrlMap, [errorType, errorName, urlPath, 'cityDistribution', country, province, city], errorCountByCity + 1)
      let oldErrorCount = _.get(errorTypeNameUrlMap, [errorType, errorName, urlPath, 'errorCount'], 0)
      _.set(errorTypeNameUrlMap, [errorType, errorName, urlPath, 'errorCount'], oldErrorCount + 1)
    }
    let insertCount = 0
    for (let errorType of Object.keys(errorTypeNameUrlMap)) {
      for (let errorName of Object.keys(errorTypeNameUrlMap[errorType])) {
        for (let urlPath of Object.keys(errorTypeNameUrlMap[errorType][errorName])) {
          const {
            cityDistribution,
            errorCount
          } = _.get(errorTypeNameUrlMap, [errorType, errorName, urlPath], {})

          // 替换errorSummary数据
          const cityDistrubutionJson = JSON.stringify(cityDistribution)

          const isSuccess = await MErrorSummary.replaceSummaryRecord(projectId, startAt, countType, errorType, errorName, urlPath, errorCount, cityDistrubutionJson)
          if (isSuccess) {
            insertCount++
          }
        }
      }
    }
    this.log(`项目${projectId}(${projectName})处理完毕, 共插入数据${insertCount}条。`)
  }

  /**
   * [可覆盖]检查请求参数, 默认检查传入的时间范围是否正确, 如果有自定义需求可以在子类中进行覆盖
   * @param {*} args
   * @param {*} options
   * @return {Boolean}
   */
  isArgumentsLegal (args, options) {
    let { countAtTime, countType } = args

    if (countType !== DATE_FORMAT.UNIT.MINUTE && countType !== DATE_FORMAT.UNIT.DAY && countType !== DATE_FORMAT.UNIT.HOUR) {
      this.warn(`统计类别不为 ${DATE_FORMAT.UNIT.MINUTE}/${DATE_FORMAT.UNIT.DAY}/${DATE_FORMAT.UNIT.HOUR} `, 'countType => ', countType)
      return false
    }
    let countAtMoment = moment(countAtTime, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType])
    if (moment.isMoment(countAtMoment) === false || countAtMoment.isValid() === false) {
      this.warn(`countAtTime解析失败`, ' => ', countAtTime)
      return false
    }
    return true
  }
}

export default SummaryError
