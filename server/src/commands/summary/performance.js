import Base from '~/src/commands/base'
import moment from 'moment'
import _ from 'lodash'
import MProject from '~/src/model/project/project'
import MPerformance from '~/src/model/parse/performance'
import MCityDistribution from '~/src/model/parse/city_distribution'
import DATE_FORMAT from '~/src/constants/date_format'

class PerformanceSummary extends Base {
  static get signature () {
    return `
     Summary:Performance

     {countAtTime:所统计时间, ${DATE_FORMAT.UNIT.HOUR} 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_HOUR}, ${DATE_FORMAT.UNIT.DAY} 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}, ${DATE_FORMAT.UNIT.MONTH} 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH}}
     {countType:统计类型${DATE_FORMAT.UNIT.HOUR}/${DATE_FORMAT.UNIT.DAY}/${DATE_FORMAT.UNIT.MONTH}}
     `
  }

  static get description () {
    return '[按小时/按天/按月] 根据历史数据, 汇总分析记录指定时间范围内的性能指标数据'
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
      case DATE_FORMAT.UNIT.HOUR:
        endAt = countAtMoment.clone().add(1, 'hours').unix() - 1
        break
      case DATE_FORMAT.UNIT.DAY:
        endAt = countAtMoment.clone().add(1, 'days').unix() - 1
        break
      case DATE_FORMAT.UNIT.MONTH:
        endAt = countAtMoment.clone().add(1, 'months').unix() - 1
        break
      default:
        endAt = startAt + 24 * 60 * 60 - 1
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
      this.log(`[${projectId}(${projectName})] 时间范围:${startAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':00'}~${endAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':59'}`)
      await this.handleInMemery(projectId, projectName, startAt, endAt, startAtMoment, endAtMoment, countAtMoment, countType)
      this.log(`项目${projectId}(${projectName})数据处理完毕`)
    }
  }

  // 数据全部读取出来，放在内存里统一处理
  async handleInMemery (projectId, projectName, startAt, endAt, startAtMoment, endAtMoment, countAtMoment, countType) {
    let getType
    switch (countType) {
      case DATE_FORMAT.UNIT.HOUR:
        getType = DATE_FORMAT.UNIT.MINUTE
        break
      case DATE_FORMAT.UNIT.DAY:
        getType = DATE_FORMAT.UNIT.HOUR
        break
      case DATE_FORMAT.UNIT.MONTH:
        getType = DATE_FORMAT.UNIT.DAY
        break
      default:
        this.log('指令Summary:Performance参数不对，自动退出！')
        return
    }
    let rawResultList = await MPerformance.getList(projectId, startAt, endAt, {}, getType)
    let resultMap = {}
    let allCityIdList = []
    for (let rawResult of rawResultList) {
      const {
        sum_indicator_value: sumValue,
        pv,
        indicator,
        url,
        city_distribute_id: cityDistributionId
      } = rawResult
      let oldPv = _.get(resultMap, [indicator, url, 'pv'], 0)
      let oldSumValue = _.get(resultMap, [indicator, url, 'sumValue'], 0)
      _.set(resultMap, [indicator, url, 'pv'], pv + oldPv)
      _.set(resultMap, [indicator, url, 'sumValue'], sumValue + oldSumValue)
      allCityIdList.push(cityDistributionId)
      if (_.has(resultMap, [indicator, url, 'cityIdList'])) {
        resultMap[indicator][url]['cityIdList'].push(cityDistributionId)
      } else {
        _.set(resultMap, [indicator, url, 'cityIdList'], [cityDistributionId])
      }
    }
    // 处理城市分布数据,由于mysql限制，一次查10000条数据
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

    // 插入数据
    let indicatorKeys = Object.keys(resultMap)
    for (let indicator of indicatorKeys) {
      let urlKeys = Object.keys(resultMap[indicator])
      for (let url of urlKeys) {
        const {
          pv,
          sumValue,
          cityIdList
        } = _.get(resultMap, [indicator, url], {})

        // 先处理城市分布数据
        let cityDistributionJson = {}
        for (let cityId of cityIdList) {
          let rawCityDistributionJson = _.get(cityMap, [cityId], {})
          for (let country of Object.keys(rawCityDistributionJson)) {
            for (let province of Object.keys(rawCityDistributionJson[country])) {
              for (let city of Object.keys(rawCityDistributionJson[country][province])) {
                let pv = _.get(rawCityDistributionJson, [country, province, city, 'pv'], 0)
                let oldPv = _.get(cityDistributionJson, [country, province, city, 'pv'], 0)
                let sumValue = _.get(rawCityDistributionJson, [country, province, city, 'sum_indicator_value'], 0)
                let oldSumValue = _.get(cityDistributionJson, [country, province, city, 'sum_indicator_value'], 0)
                _.set(cityDistributionJson, [country, province, city, 'pv'], pv + oldPv)
                _.set(cityDistributionJson, [country, province, city, 'sum_indicator_value'], sumValue + oldSumValue)
              }
            }
          }
        }

        // 拿到城市分布数据再更新数据
        let isSuccess = await MPerformance.replaceInto(
          projectId,
          url,
          indicator,
          countAtMoment.unix(),
          countType,
          sumValue,
          pv,
          cityDistributionJson
        )
        this.log(`时间范围:${startAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':00'}~${endAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':59'}`, ` ${projectId}(${projectName})下, ${indicator}指标下url=>${url}城市分布数据处理完毕, 是否更新成功 => `, isSuccess)
      }
    }
  }

  // 实时的与数据库交互拿数据处理数据，时间花在与数据库通讯上，不值
  async handleSummary (projectId, projectName, startAt, endAt, startAtMoment, endAtMoment, countAtMoment, countType, getType) {
    let indicatorMapKeys = Object.keys(MPerformance.INDICATOR_TYPE_MAP)
    for (let indicator of indicatorMapKeys) {
      // 统一使用分钟级别的数据
      let urlList = await MPerformance.getDistinctUrlListInRange(projectId, [indicator], startAt, endAt, getType)
      this.log(`${projectId}(${projectName})下, ${indicator}指标url列表获取完毕, 共`, urlList.length, `条url`)
      for (let url of urlList) {
        let cityDistribute = await MPerformance.getCityDistributeInRange(projectId, [url], [indicator], startAt, endAt, getType)
        this.log(`时间范围:${startAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':00'}~${endAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':59'}`, ` ${projectId}(${projectName})下, ${indicator}指标下url=>${url}城市分布列表获取完毕`)
        let summaryCountList = MCityDistribution.getFlattenCityRecordListInDistribution(cityDistribute)

        let result = {
          sum_indicator_value: 0,
          pv: 0
        }
        for (let summaryCount of summaryCountList) {
          result['sum_indicator_value'] = result['sum_indicator_value'] + summaryCount['sum_indicator_value']
          result['pv'] = result['pv'] + summaryCount['pv']
        }

        this.log(`[${projectId}(${projectName})] 城市分布数据获取完毕 =>`, cityDistribute, `summary=> `, result, `将记录更新到数据库中`)
        let isSuccess = await MPerformance.replaceInto(
          projectId,
          url,
          indicator,
          countAtMoment.unix(),
          countType,
          result['sum_indicator_value'],
          result['pv'],
          cityDistribute
        )
        this.log(`时间范围:${startAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':00'}~${endAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':59'}`, ` ${projectId}(${projectName})下, ${indicator}指标下url=>${url}城市分布数据处理完毕, 是否更新成功 => `, isSuccess)
      }
      this.log(`项目${projectId}(${projectName}) ${indicator}数据处理完毕`)
    }
  }

  /**
   * [可覆盖]检查请求参数, 默认检查传入的时间范围是否正确, 如果有自定义需求可以在子类中进行覆盖
   * @param {*} args
   * @param {*} options
   * @return {Boolean}
   */
  isArgumentsLegal (args, options) {
    let { countAtTime, countType } = args

    if (countType !== DATE_FORMAT.UNIT.MONTH && countType !== DATE_FORMAT.UNIT.DAY && countType !== DATE_FORMAT.UNIT.HOUR) {
      this.warn(`统计类别不为 ${DATE_FORMAT.UNIT.MONTH}/${DATE_FORMAT.UNIT.DAY}/${DATE_FORMAT.UNIT.HOUR} `, 'countType => ', countType)
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

export default PerformanceSummary
