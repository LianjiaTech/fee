import Base from '~/src/commands/base'
import moment from 'moment'
import MDailyFileReport from '~/src/model/summary/daily_file_report_summary'
import DATE_FORMAT from '~/src/constants/date_format'
import generateHtml from '~/src/views/web_template/html_daily_file_report'
import PaintingAndPhoto from '~/src/library/utils/modules/painting_and_photo'
import generateHistogram from '~/src/views/web_template/html_histogram'
import sendMail from '~/src/library/utils/modules/mailer'

class DailyFileReportSummary extends Base {
  static get signature () {
    return `
     Summary:DailyFileReport
     {sumaryAtTime:按天统计性能和报错情况${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}格式}
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
    const { sumaryAtTime } = args
    if (this.isArgumentsLegal(args, options) === false) {
      this.warn('参数不正确, 自动退出')
      return false
    }
    // 前一天得时间
    const sumaryAt = moment(sumaryAtTime,
      DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[DATE_FORMAT.UNIT.DAY]).
      subtract(1, DATE_FORMAT.UNIT.DAY)
    const sumaryEndAt = moment(sumaryAtTime,
      DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[DATE_FORMAT.UNIT.DAY]).
      subtract(1, DATE_FORMAT.UNIT.SECOND)
    
    const ip = await MDailyFileReport.getLocalIp()
    // 先去读取服务器上磁盘得是用情况
    const { data: diskInfo } = await MDailyFileReport.getDiskInfo()
    this.log(`获取磁盘数据：\n ${diskInfo}`)
    //获取当前这一天的数据占用磁盘得情况
    const { jsonSize, rawSize } = await MDailyFileReport.getFileSizeByDay(
      sumaryAt)
    this.log(`当前这一天的数据占用磁盘得情况：\n ${jsonSize}\n${rawSize}`)
    // 再去查找每个项目的数据
    // const projectSizeData = await MDailyFileReport.getProjectSizeData(sumaryAt, sumaryEndAt)
    const { total: jsonCount, projectSizeData } = await MDailyFileReport.getProjectSizeData(sumaryAt.unix(), sumaryEndAt.unix())
    // this.log(`获取每个项目的数据`)
    // // 统计log的总数
    // let jsonCount = 0
    // for (const { jsonCount: value } of projectSizeData) {
    //   jsonCount += value
    // }
    this.log(`统计log的总数:${jsonCount}`)
    const projectValueData = projectSizeData.map(
      ({ projectName, jsonCount: value }) => ({ projectName, value }))
    const histogramHtml = generateHistogram(projectValueData,
      'log日志柱状图')
    //拍照获取图片base64
    const { png: projectImage } = await PaintingAndPhoto(histogramHtml, {
      width: 800,
      height: 100 + projectValueData.length * 50,
    })
    const mailTitle = `${moment(sumaryAt).
      format('YYYY-MM-DD')}(昨天)灯塔系统所在服务器运行报告(报告来自${ip})`
    // 根据数据去生成一个网页
    const html = generateHtml(
      {
        diskInfo,
        jsonSize,
        rawSize,
        projectSizeData,
        jsonCount,
        mailTitle,
        projectImage,
      })

    await sendMail({
      title: mailTitle,
      html,
    })

  }

  /**
   * [可覆盖]检查请求参数, 默认检查传入的时间范围是否正确, 如果有自定义需求可以在子类中进行覆盖
   * @param {*} args
   * @param {*} options
   * @return {Boolean}
   */
  isArgumentsLegal (args, options) {
    let { sumaryAtTime } = args
    let sumaryAtMoment = moment(sumaryAtTime)
    if (
      moment.isMoment(sumaryAtMoment) === false ||
      sumaryAtMoment.isValid() === false) {
      this.warn(`参数不正确 sumaryAtTime => ${sumaryAtTime}`)
      return false
    }
    return true
  }
}

export default DailyFileReportSummary
