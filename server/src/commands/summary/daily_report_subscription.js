import _ from 'lodash'
import moment from 'moment'
import Base from '~/src/commands/base'

import MDiary from '~/src/model/parse/diary'
import MDaily from '~/src/model/project/daily'
import DATE_FORMAT from '~/src/constants/date_format'
import MDailyReportSubscription from '~/src/model/summary/daily_report_subscription'

export default class DailySubscriptionReport extends Base {
  static get signature () {
    return `
     Summary:DailySubscriptionReport
     {sumaryAtTime:按小时统计性能和报错情况${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}格式}
     {countType:统计类型${DATE_FORMAT.UNIT.DAY}} 
     `
  }

  static get description () {
    return '[按小时]基于数据库统计每个项目的性能和报错情况,根据用户订阅记录发日报'
  }

  /**
   * 每个小时跑一次
   * @param {*} args
   * @param {*} options
   */
  async execute (args, options) {
    // 每个小时跑一次，统计错误和性能并入库
    const { sumaryAtTime, countType } = args
    if (this.isArgumentsLegal(args, options) === false) {
      this.warn('参数不正确, 自动退出')
      return false
    }

    let { countAtTime, startAt, endAt, title } = MDailyReportSubscription.getSumaryAt(countType)(sumaryAtTime)
    let hour = moment().hour()
    let sendTime = hour >= 10 ? `${hour}:00` : `0${hour}:00`
    // 获取订阅列表
    let subscriptionList = await MDaily.getSubscriptionList({ sendTime })
    if (!subscriptionList.length) return this.log(`暂无发送时间设定在${sendTime}的订阅记录`)
    this.log(`灯塔【${countAtTime}】日报数据统计情况：` + JSON.stringify(subscriptionList))
    let pids = subscriptionList.map(item => item.project_id)
    /**
     * @todo 先从库中获取，没有的话再取ES
     */
    // let projectsData = await MDiary.getDiaryListByDay({ countAtTime, pids, countType })
    let { projectsData, lastProjectsData } = await MDailyReportSubscription.summaryDailyReport(pids, startAt, endAt, countType, countAtTime)
    // 持久化记录
    await MDailyReportSubscription.dailyReportDataPersistence(projectsData)
    let result = {
      title,
      sumaryAtTime,
      countType,
      projectsData,
      lastProjectsData
    }
    MDailyReportSubscription.sendDailyMail(result, subscriptionList).catch(_err => this.warn(_err.stack))
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
