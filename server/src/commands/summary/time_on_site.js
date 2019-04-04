import ParseBase from '~/src/commands/base'
import moment from 'moment'
import _ from 'lodash'
import MDurationDistribution from '~/src/model/parse/duration_distribution'
import MProject from '~/src/model/project/project'
import MCityDistribution from '~/src/model/parse/city_distribution'
import MUniqueView from '~/src/model/summary/unique_view'
import DATE_FORMAT from '~/src/constants/date_format'

class TimeOnSiteByHour extends ParseBase {
  static get signature () {
    return `
     Summary:TimeOnSite 
     {countAtTime:所统计时间, day 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}, month 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH}}
     {countType:统计类型${DATE_FORMAT.UNIT.DAY}/${DATE_FORMAT.UNIT.MONTH}}
     `
  }

  static get description () {
    return '[按天/按月] 根据历史数据, 汇总分析记录指定时间范围内用户停留时长'
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
      case DATE_FORMAT.UNIT.DAY:
        endAt = countAtMoment.clone().add(1, DATE_FORMAT.UNIT.DAY).unix() - 1 //  为mutable数据, 调用add后原值会变
        break
      case DATE_FORMAT.UNIT.MONTH:
        endAt = countAtMoment.clone().add(1, DATE_FORMAT.UNIT.MONTH).unix() - 1
        break
      default:
        endAt = startAt + 86400 - 1
    }
    let startAtMoment = moment.unix(startAt)
    let endAtMoment = moment.unix(endAt)

    let rawProjectList = await MProject.getList()
    for (let rawProject of rawProjectList) {
      let projectId = _.get(rawProject, 'id', '')
      let projectName = _.get(rawProject, 'project_name', '')
      if (projectId === 0 || projectId === '') {
        continue
      }
      this.log(`开始处理项目${projectId}(${projectName})的数据`)
      this.log(`时间范围:${startAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':00'}~${endAtMoment.format(DATE_FORMAT.DISPLAY_BY_MINUTE) + ':59'}`)
      let rawRecordList = await MDurationDistribution.getRecordList(projectId, startAt, endAt, DATE_FORMAT.UNIT.HOUR)
      let totalStayMs = 0
      let cityDistribute = {}
      for (let rawRecord of rawRecordList) {
        totalStayMs = totalStayMs + _.get(rawRecord, ['total_stay_ms'], 0)
        let cityDistributeId = _.get(rawRecord, ['city_distribute_id'], 0)
        let createTime = _.get(rawRecord, ['create_time'], 0)
        let oldCityDistribute = await MCityDistribution.getCityDistributionRecord(cityDistributeId, projectId, createTime)
        cityDistribute = await MCityDistribution.mergeDistributionData(oldCityDistribute, cityDistribute)
      }
      let totalUv = await MUniqueView.getTotalUv(projectId, countAtTime, countType)
      // 录入数据
      let isSuccess = await MDurationDistribution.replaceUvRecord(
        projectId,
        totalStayMs,
        totalUv,
        countAtMoment.format(DATE_FORMAT.DATABASE_BY_UNIT[countType]),
        countType,
        cityDistribute
      )
      this.log(`项目${projectId}(${projectName})数据处理完毕, 数据录入 => ${isSuccess ? '成功' : '失败'}`)
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

    if (countType !== DATE_FORMAT.UNIT.MONTH && countType !== DATE_FORMAT.UNIT.DAY) {
      this.warn(`统计类别不为 ${DATE_FORMAT.UNIT.MONTH}或:${DATE_FORMAT.UNIT.DAY} `, 'countType => ', countType)
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

export default TimeOnSiteByHour
