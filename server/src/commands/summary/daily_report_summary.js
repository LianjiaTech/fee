import Base from '~/src/commands/base'
import moment from 'moment'
import MDailyReport from '~/src/model/summary/daily_report_summary'
import DATE_FORMAT from '~/src/constants/date_format'

class DailyReportSummary extends Base {
  static get signature () {
    return `
     Summary:DailyReport
     {sumaryAtTime:按天统计性能和报错情况${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}格式}
     {countType:统计类型${DATE_FORMAT.UNIT.DAY}/${DATE_FORMAT.UNIT.WEEK}} 
     `
  }

  static get description () {
    return '[按天]基于数据库统计每个项目的性能和报错情况,每天发日报'
  }

  /**
   * 每天跑一次, 获取项目列表
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
    let sumaryAt
    if (countType === DATE_FORMAT.UNIT.WEEK) {
      sumaryAt = moment(sumaryAtTime,
        DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType]).
        subtract(7, DATE_FORMAT.UNIT.DAY).
        startOf(DATE_FORMAT.UNIT.DAY).
        unix()
    } else {
      sumaryAt = moment(sumaryAtTime,
        DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType]).
        subtract(1, DATE_FORMAT.UNIT.DAY).
        startOf(DATE_FORMAT.UNIT.DAY).
        unix()
    }
    const todayData = await MDailyReport.summaryDailyReport(sumaryAt, countType)
    await MDailyReport.dailyReportDataPersistence(todayData.projectsData)
    MDailyReport.sendDailyMail(todayData)
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

export default DailyReportSummary
