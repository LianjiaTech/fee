import moment from 'moment'
import DATE_FORMAT from '~/src/constants/date_format'
import shell from 'shelljs'
import env from '~/src/configs/env'
import path from 'path'
import Base from '~/src/commands/base'

const projectBaseUri = path.resolve(__dirname, '../../../') // 项目所在文件夹

class CommandReProcessLog extends Base {
  static get signature () {
    return `
     Utils:ReProcessLog
     {startAtYmdHi:日志扫描范围上限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     {endAtYmdHi:日志扫描范围下限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     `
  }

  static get description () {
    return '从跑指定时间数据'
  }

  async execute (args, options) {
    this.log('《重跑开始》')
    const { startAtYmdHi, endAtYmdHi } = args
    await this.runParse(startAtYmdHi, endAtYmdHi)
    await this.runSummary(startAtYmdHi, endAtYmdHi)
    this.log('《重跑结束》')
  }

  async runParse (startAtYmdHi, endAtYmdHi) {
    // t_o_monitor_1_201809 t_o_system_collection_1 [按分钟] 解析kafka日志, 分析Monitor
    this.log(`[按分钟] Parse:Monitor任务开始, 处理时间 => ${startAtYmdHi}~${endAtYmdHi}`)
    await this.execCommand('Parse:Monitor',
      [
        startAtYmdHi, // startAtYmdHi:
        endAtYmdHi // endAtYmdHi:
      ]
    )

    // t_o_uv_record_1_201809 [按小时] 解析kafka日志, 分析记录指定时间范围内的uv
    this.log(`[按小时] Parse:UV任务开始, 处理时间 => ${startAtYmdHi}~${endAtYmdHi}`)
    await this.execCommand('Parse:UV',
      [
        startAtYmdHi, // startAtYmdHi:
        endAtYmdHi // endAtYmdHi:
      ]
    )
    // t_r_duration_distribution [按小时] 解析kafka日志, 分析记录指定时间范围内用户停留时长
    this.log(`[按小时] Parse:TimeOnSiteByHour任务开始, 处理时间 => ${startAtYmdHi}~${endAtYmdHi}`)
    await this.execCommand('Parse:TimeOnSiteByHour',
      [
        startAtYmdHi, // startAtYmdHi:
        endAtYmdHi // endAtYmdHi:
      ]
    )

    // t_o_system_collection [按天] 解析kafka日志, 分析指定时间范围Device
    this.log(`[按天] Parse:Device任务开始, 处理时间 => ${startAtYmdHi}~${endAtYmdHi}`)
    await this.execCommand('Parse:Device',
      [
        startAtYmdHi, // startAtYmdHi:
        endAtYmdHi // endAtYmdHi:
      ]
    )

    // t_r_behavior_distribution [按天] 解析kafka日志, 用户点击情况
    this.log(`[按天] Parse:MenuClick任务开始, 处理时间 => ${startAtYmdHi}~${endAtYmdHi}`)
    await this.execCommand('Parse:MenuClick',
      [
        startAtYmdHi, // startAtYmdHi:
        endAtYmdHi // endAtYmdHi:
      ]
    )
  }

  async runSummary (startAtYmdHi, endAtYmdHi) {
    await this.runSummaryByHour(startAtYmdHi, endAtYmdHi)
    await this.runSummaryByDay(startAtYmdHi, endAtYmdHi)
    await this.runSummaryByMonth(startAtYmdHi, endAtYmdHi)
  }

  async runSummaryByHour (startAtYmdHi, endAtYmdHi) {
    const startAt = moment(startAtYmdHi).unix() // 用时间戳来计算
    const endAt = moment(endAtYmdHi).unix() + 3600
    for (let processAt = startAt; processAt <= endAt; processAt += 3600) {
      const formatHour = moment.unix(processAt).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_HOUR) // 获得时间戳对应的时间

      // [按小时/按天/按月] 根据历史数据, 汇总分析记录指定时间范围内的uv
      this.log(`[按小时] Summary:UV任务开始, 处理时间 => ${formatHour}`)
      await this.execCommand('Summary:UV',
        [
          formatHour, // countAtTime:
          DATE_FORMAT.UNIT.HOUR // countType:
        ]
      )
    }
  }

  async runSummaryByDay (startAtYmdHi, endAtYmdHi) {
    const startAt = moment(startAtYmdHi).unix() // 用时间戳来计算
    const endAt = moment(endAtYmdHi).unix() + 3600 * 24

    for (let processAt = startAt; processAt <= endAt; processAt += 3600 * 24) {
      const formatDay = moment.unix(processAt).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY) // 获取规格化日期

      // [按小时/按天/按月] 根据历史数据, 汇总分析记录指定时间范围内的uv
      this.log(`[按天] Summary:UV任务开始, 处理时间 => ${formatDay}`)
      await this.execCommand('Summary:UV',
        [
          formatDay, // countAtTime:
          DATE_FORMAT.UNIT.DAY // countType:
        ]
      )

      // t_r_http_error_distribution [按天/按月] 基于数据表做统计, 按月统计http error占比
      this.log(`[按天] Summary:HttpError任务开始, 处理时间 => ${formatDay}`)
      await this.execCommand('Summary:HttpError',
        [
          formatDay, // sumaryAtTime:
          DATE_FORMAT.UNIT.DAY // countType:
        ]
      )

      // [按天/按月] 根据历史数据, 汇总分析记录指定时间范围内用户停留时长
      this.log(`[按天] Summary:TimeOnSite任务开始, 处理时间 => ${formatDay}`)
      await this.execCommand('Summary:TimeOnSite',
        [
          formatDay, // countAtTime:
          DATE_FORMAT.UNIT.DAY // countType:
        ]
      )
    }
  }

  async runSummaryByMonth (startAtYmdHi, endAtYmdHi) {
    const startMonth = moment(startAtYmdHi).startOf('month')
    const endMonth = moment(endAtYmdHi).endOf('month')
    const endMonthAt = endMonth.unix()

    for (let processMoment = startMonth.clone(); processMoment.unix() <= endMonthAt; processMoment = processMoment.clone().add(1, 'month')) {
      const formatMonth = processMoment.format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH) // 获取规格化日期

      // t_r_system_browser 浏览器版本统计 summary 按月统计 每天跑
      this.log(`[按天] Summary:SystemBrowser任务开始, 处理时间 => ${formatMonth}`)
      await this.execCommand('Summary:SystemBrowser',
        [
          formatMonth, // sumaryYm:
          DATE_FORMAT.UNIT.MONTH
        ]
      )

      // t_r_system_device 设备信息统计 summary 按月统计 每天跑
      this.log(`[按天] Summary:SystemDevice任务开始, 处理时间 => ${formatMonth}`)
      await this.execCommand('Summary:SystemDevice',
        [
          formatMonth, // sumaryYm:
          DATE_FORMAT.UNIT.MONTH
        ]
      )

      // t_r_system_os 操作系统统计 按月统计 每天跑
      this.log(`[按天] Summary:SystemOS任务开始, 处理时间 => ${formatMonth}`)
      await this.execCommand('Summary:SystemOS',
        [
          formatMonth, // sumaryYm:
          DATE_FORMAT.UNIT.MONTH
        ]
      )

      // t_r_project_version 按项目版本进行统计 按月统计 每天跑
      this.log(`[按天] Summary:SystemRuntimeVersion任务开始, 处理时间 => ${formatMonth}`)
      await this.execCommand('Summary:SystemRuntimeVersion',
        [
          formatMonth, // sumaryYm:
          DATE_FORMAT.UNIT.MONTH
        ]
      )

      // [按月] 根据历史数据, 汇总分析记录指定时间范围内的uv
      this.log(`[按月] Summary:UV任务开始, 处理时间 => ${formatMonth}`)
      await this.execCommand('Summary:UV',
        [
          formatMonth, // countAtTime
          DATE_FORMAT.UNIT.MONTH // countType
        ]
      )

      // [按月] 基于数据表做统计, 按月统计browser占比
      this.log(`[按月] Summary:HttpError任务开始, 处理时间 => ${formatMonth}`)
      await this.execCommand('Summary:HttpError',
        [
          formatMonth, // sumaryAtTime:
          DATE_FORMAT.UNIT.MONTH // countType:
        ]
      )

      // [按月] 根据历史数据, 汇总分析记录指定时间范围内用户停留时长
      this.log(`[按月] Summary:TimeOnSite任务开始, 处理时间 => ${formatMonth}`)
      await this.execCommand('Summary:TimeOnSite',
        [
          formatMonth, // countAtTime
          DATE_FORMAT.UNIT.MONTH // countType
        ]
      )
    }
  }

  async execCommand (commandName, args = []) {
    let argvString = args.map((arg) => { return `'${arg}'` }).join('   ')
    let command = `NODE_ENV=${env} node ${projectBaseUri}/dist/fee.js ${commandName}  ${argvString}`
    this.log(`待执行命令=> ${command}`)
    let commandStartAtFormated = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
    await shell.exec(command, {
      async: false,
      silent: false
    })
    let commandFinishAtFormated = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
    this.log(`命令执行完毕 => ${command}, 开始执行时间=> ${commandStartAtFormated}, 执行完毕时间=> ${commandFinishAtFormated}`)
  }
}

export default CommandReProcessLog
