import Base from '~/src/commands/base'
import moment from 'moment'
import MDailyReport from '~/src/model/summary/daily_report_summary'
import DATE_FORMAT from '~/src/constants/date_format'

class DailyCountSummary extends Base {
  static get signature () {
    return `
     Summary:DailyCount
     {sumaryStartAt:按天统计时间段内得报错、pv和uv情况得开始时间${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}格式}
     {sumaryEndAt:按天统计时间段内得报错、pv和uv情况得结束时间${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}格式}
     `
  }

  static get description () {
    return '[按天]基于mysql数据库统计每个项目的错误pv,uv等情况'
  }

  /**
   * 每天跑一次, 获取项目列表
   * @param {*} args
   * @param {*} options
   */
  async execute (args, options) {
    // 每天跑一次，统计错误和性能并入库
    const { sumaryStartAt, sumaryEndAt } = args
    if (this.isArgumentsLegal(args, options) === false) {
      this.warn('参数不正确, 自动退出')
      return false
    }
    let startAtMoment = moment(sumaryStartAt).unix()
    const endAtMoment = moment(sumaryEndAt).unix()
    while (startAtMoment < endAtMoment) {
      const sumaryAt = moment.unix(startAtMoment).
        format(DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY)
      this.log(`正在检索：${sumaryAt} 日得数据`)
      const todayData = await MDailyReport.summaryDailyReport(startAtMoment,
        DATE_FORMAT.UNIT.DAY)
      await MDailyReport.dailyReportDataPersistence(todayData.projectsData)
      startAtMoment = moment(sumaryAt).add(1, 'days').unix()
    }
  }

  /**
   * [可覆盖]检查请求参数, 默认检查传入的时间范围是否正确, 如果有自定义需求可以在子类中进行覆盖
   * @param {*} args
   * @param {*} options
   * @return {Boolean}
   */
  isArgumentsLegal (args, options) {
    let { sumaryStartAt, sumaryEndAt } = args
    let sumaryStartAtMoment = moment(sumaryStartAt,
      DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[DATE_FORMAT.UNIT.DAY])
    let sumaryEndAtMoment = moment(sumaryEndAt,
      DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[DATE_FORMAT.UNIT.DAY])
    if (
      moment.isMoment(sumaryStartAtMoment) === false ||
      sumaryStartAtMoment.isValid() === false ||
      moment.isMoment(sumaryEndAtMoment) === false ||
      sumaryEndAtMoment.isValid() === false
    ) {
      this.warn(
        `参数不正确 sumaryStartAt => ${sumaryStartAt}, sumaryEndAt => ${sumaryEndAt}`)
      return false
    }
    return true
  }
}

export default DailyCountSummary
