import _ from 'lodash'
import moment from 'moment'
import Base from '~/src/commands/base'

import DATE_FORMAT from '~/src/constants/date_format'
import MDailyReportSubscription from '~/src/model/summary/daily_report_subscription'

export default class DailyReportAll extends Base {
  static get signature () {
    return `
     Summary:DailyReportAll
     {sumaryAtTime:按天统计性能和报错情况${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}格式}
     {countType:统计类型${DATE_FORMAT.UNIT.DAY}} 
     `
  }

  static get description () {
    return '[按天]基于数据库统计每个项目的性能和报错情况，将所有项目的数据汇总发送给各个leaders'
  }

  /**
   * 每天跑一次
   * @param {*} args
   * @param {*} options
   */
  async execute (args, options) {
    // 每天跑一次，统计错误和性能并入库
    const { sumaryAtTime, countType } = args
    if (this.isArgumentsLegal(args, options) === false) {
      this.warn('参数不正确, 自动退出')
      return false
    }

    let { countAtTime, startAt, endAt, title } = MDailyReportSubscription.getSumaryAt(countType)(sumaryAtTime)
    let { projectsData, lastProjectsData } = await MDailyReportSubscription.summaryDailyReport([], startAt, endAt, countType, countAtTime)
    // 持久化记录
    await MDailyReportSubscription.dailyReportDataPersistence(projectsData)
    let result = {
      title,
      sumaryAtTime,
      countType,
      projectsData,
      lastProjectsData,
      sendAllProjectsData: true
    }
    MDailyReportSubscription.sendDailyMail(result).catch(_err => this.warn(_err.stack))
  }

  /**
   * [可覆盖]检查请求参数, 默认检查传入的时间范围是否正确, 如果有自定义需求可以在子类中进行覆盖
   * @param {*} args
   * @param {*} options
   * @return {Boolean}
   */
  isArgumentsLegal (args, options) {
    let { sumaryAtTime, countType } = args
    let sumaryAtMoment = moment(sumaryAtTime,
      DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType])
    if (
      moment.isMoment(sumaryAtMoment) === false ||
      sumaryAtMoment.isValid() === false ||
      (countType !== DATE_FORMAT.UNIT.DAY && countType !==
        DATE_FORMAT.UNIT.WEEK)
    ) {
      this.warn(
        `参数不正确 sumaryAtTime => ${sumaryAtTime}, countType => ${countType}`)
      return false
    }
    return true
  }
}
