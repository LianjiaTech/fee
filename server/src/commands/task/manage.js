import Base from '~/src/commands/base'
import moment from 'moment'
import DATE_FORMAT from '~/src/constants/date_format'
import shell from 'shelljs'
import _ from 'lodash'
import env from '~/src/configs/env'
import Alert from '~/src/library/utils/modules/alert'
import WatchIdList from '~/src/configs/alarm'
import Util from '~/src/library/utils/modules/util'
import commonConfig from '~/src/configs/common'
import path from 'path'
import schedule from 'node-schedule'

const isUsingKafka = _.get(commonConfig, ['use', 'kafka'], true)
let projectBaseUri = path.resolve(__dirname, '../../../') // 项目所在文件夹
class TaskManager extends Base {
  static get signature () {
    return `
     Task:Manager
     `
  }

  static get description () {
    return '任务调度主进程, 只能启动一次'
  }

  /**
   * 在最外层进行一次封装, 方便获得报错信息
   * @param args
   * @param options
   * @returns {Promise<void>}
   */
  async handle (args, options) {
    this.log('任务主进程启动')

    this.log('关闭其他TaskManager进程')
    await this.closeOtherTaskManager()
    this.log('其他TaskManager进程已关闭')
    this.log('避免当前还有正在运行的save2Log命令, 等待30s')
    this.log('开始休眠')
    for (let i = 0; i < 30; i++) {
      await Util.sleep(1 * 1000)
      this.log(`休眠中, 第${i + 1}秒`)
    }
    this.log('休眠完毕')
    this.log('开始注册cron任务')

    // 注册定时任务
    this.log('注册每分钟执行一次的任务')
    this.registerTaskRepeatPer1Minute()
    this.log('注册每10分钟执行一次的任务')
    this.registerTaskRepeatPer10Minute()
    this.log('注册每1小时执行一次的任务')
    this.registerTaskRepeatPer1Hour()
    this.log('注册每6小时执行一次的任务')
    this.registerTaskRepeatPer6Hour()
    this.log('全部定时任务注册完毕, 等待执行')
  }

  async getOtherTaskMangerPidList () {
    // 命令本身也会被检测出来, sh -c npm run warning && NODE_ENV=development node dist/fee.js "Task:Manager"
    let command = 'ps aS|grep Task:Manager|grep node|grep fee|grep -v grep | grep -v  \'"Task:Manager"\''
    this.log(`检测命令 => ${command}`)
    let rawCommandOutput = shell.exec(command, {
      async: false,
      silent: true
    })
    let rawCommandOutputList = rawCommandOutput.split('\n')
    let taskManagerPidList = []
    for (let rawCommandOutput of rawCommandOutputList) {
      let commandOutput = _.trim(rawCommandOutput)
      commandOutput = _.replace(commandOutput, '\t', ' ')
      let pid = commandOutput.split(' ')[0]
      pid = parseInt(pid)
      if (_.isNumber(pid) && pid > 0) {
        if (pid !== process.pid) {
          taskManagerPidList.push(pid)
        }
      }
    }
    return taskManagerPidList
  }

  async closeOtherTaskManager () {
    let taskManagerPidList = await this.getOtherTaskMangerPidList()
    this.log('当前process.pid =>', process.pid)
    this.log(`其余TaskManger进程Pid列表 => `, taskManagerPidList)
    this.log('执行kill操作, 关闭其余进程')
    for (let pid of taskManagerPidList) {
      this.log(`kill pid => ${pid}`)
      try {
        process.kill(pid)
      } catch (e) {
        let message = `TaskManger进程pid => ${pid} kill失败, 该pid不存在或者没有权限kill`
        this.log(message)
      }
    }
    this.log('kill操作执行完毕, 休眠3s, 再次检测剩余TaskManager进程数')
    await Util.sleep(3 * 1000)
    this.log('开始检测剩余TaskManager进程数')
    taskManagerPidList = await this.getOtherTaskMangerPidList()
    if (taskManagerPidList.length === 0) {
      this.log('剩余TaskManager为空, 可以继续执行任务调度进程')
      return true
    }
    // PM2 3.2.2 有bug, 无法保证TaskManager只有一个实例, 因此需要主动进行检测
    // 否则, 直接终止该进程
    let alertMessage = '仍然有残留TaskManager进程, 程序不能保证正常执行, 自动退出. 剩余 TaskManager pid List => ' + JSON.stringify(taskManagerPidList)
    this.warn(alertMessage)
    Alert.sendMessage(WatchIdList.WATCH_UCID_LIST_DEFAULT, alertMessage)
    // 花式自尽
    process.kill(process.pid)
    process.exit(1)
  }

  /**
   * 每分钟启动一次
   */
  async registerTaskRepeatPer1Minute () {
    let that = this
    // 每分钟的第0秒启动
    schedule.scheduleJob('0 */1 * * * *', function () {
      that.log('registerTaskRepeatPer1Minute 开始执行')

      let nowByMinute = moment().format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)
      let twoMinuteAgoByMinute = moment().subtract(2, DATE_FORMAT.UNIT.MINUTE).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)
      let threeMinuteAgoByMinute = moment().subtract(3, DATE_FORMAT.UNIT.MINUTE).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)
      let fourMinuteAgoByMinute = moment().subtract(4, DATE_FORMAT.UNIT.MINUTE).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)
      let fiveMinuteAgoByMinute = moment().subtract(5, DATE_FORMAT.UNIT.MINUTE).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)
      let tenMinuteAgoByMinute = moment().subtract(10, DATE_FORMAT.UNIT.MINUTE).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)

      that.log(`[按分钟] 每分钟启动一次SaveLog `)
      if (isUsingKafka) {
        that.execCommand('SaveLog:Kafka', [])
      } else {
        that.execCommand('SaveLog:Nginx', [])
      }
      that.log(`[按分钟] 每分钟启动一次WatchDog:Alarm, 监控平台运行情况 `)
      that.execCommand('WatchDog:Alarm', [])

      that.log(`[按分钟] 解析kafka日志, 分析错误详情`)
      that.dispatchParseCommand('Parse:Monitor', twoMinuteAgoByMinute, nowByMinute)

      that.log(`[按分钟] 每分钟运行Summary:Error, 分别统计前2,3,4,5,10分钟内的数据`)
      that.dispatchParseCommand('Summary:Error', twoMinuteAgoByMinute, DATE_FORMAT.UNIT.MINUTE)
      that.dispatchParseCommand('Summary:Error', threeMinuteAgoByMinute, DATE_FORMAT.UNIT.MINUTE)
      that.dispatchParseCommand('Summary:Error', fourMinuteAgoByMinute, DATE_FORMAT.UNIT.MINUTE)
      that.dispatchParseCommand('Summary:Error', fiveMinuteAgoByMinute, DATE_FORMAT.UNIT.MINUTE)
      that.dispatchParseCommand('Summary:Error', tenMinuteAgoByMinute, DATE_FORMAT.UNIT.MINUTE)

      that.log('registerTaskRepeatPer1Minute 命令分配完毕')
    })
  }

  /**
   * 每10分钟启动一次
   */
  async registerTaskRepeatPer10Minute () {
    let that = this
    // 每10分钟的第30秒启动
    schedule.scheduleJob('15 */10 * * * *', function () {
      that.log('registerTaskRepeatPer10Minute 开始执行')

      let nowByHour = moment().format(DATE_FORMAT.COMMAND_ARGUMENT_BY_HOUR)
      let nowByMinute = moment().format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)

      let oneHourAgoByHour = moment().subtract(1, DATE_FORMAT.UNIT.HOUR).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_HOUR)

      let fifteenMinuteAgoByminute = moment().subtract(15, DATE_FORMAT.UNIT.MINUTE).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)

      // 周期性执行命令
      let intervalCommandList = [
        'CreateCache:UpdatePerOneMinute'
      ]
      for (let intervalCommand of intervalCommandList) {
        // 周期性执行命令
        that.execCommand(intervalCommand)
      }

      let parseCommandList = [
        'Parse:UV',
        'Parse:TimeOnSiteByHour',
        'Parse:Performance',
        'Parse:Monitor'
      ]
      for (let parseCommand of parseCommandList) {
        // 解析最近15分钟内的数据
        that.dispatchParseCommand(parseCommand, fifteenMinuteAgoByminute, nowByMinute)
      }

      // 汇总命令
      let summaryCommandList = [
        'Summary:UV',
        'Summary:NewUser',
        'Summary:Performance',
        'Summary:Error'
      ]
      for (let summaryCommand of summaryCommandList) {
        // 当前小时
        that.dispatchParseCommand(summaryCommand, nowByHour, DATE_FORMAT.UNIT.HOUR)
        // 一小时前
        that.dispatchParseCommand(summaryCommand, oneHourAgoByHour, DATE_FORMAT.UNIT.HOUR)
      }

      that.log('registerTaskRepeatPer10Minute 命令分配完毕')
    })
  }

  /**
   * 每小时启动一次
   */
  async registerTaskRepeatPer1Hour () {
    let that = this
    // 每小时15分30秒启动
    schedule.scheduleJob('30 15 * * * *', function () {
      that.log('registerTaskRepeatPer1Hour 开始执行')

      let nowByDay = moment().format(DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY)
      let nowByMinute = moment().format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)

      let lastDayStartAtByMinute = moment().subtract(1, DATE_FORMAT.UNIT.DAY).startOf(DATE_FORMAT.UNIT.DAY).format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)

      // 解析命令
      let parseCommandList = [
        'Parse:Device',
        'Parse:MenuClick',
        'Parse:UserFirstLoginAt'
      ]
      for (let parseCommand of parseCommandList) {
        // 解析昨天到今天的数据
        that.dispatchParseCommand(parseCommand, lastDayStartAtByMinute, nowByMinute)
      }

      // 汇总命令
      let summaryCommandList = [
        'Summary:UV',
        'Summary:NewUser',
        'Summary:Performance',
        'Summary:Error',
        'Summary:TimeOnSite'
      ]
      for (let summaryCommand of summaryCommandList) {
        // 当日数据
        that.dispatchParseCommand(summaryCommand, nowByDay, DATE_FORMAT.UNIT.DAY)
      }

      that.log('registerTaskRepeatPer1Hour 命令分配完毕')
    })
  }

  /**
   * 每6小时启动一次
   */
  async registerTaskRepeatPer6Hour () {
    let that = this
    // 每过6小时, 在35分45秒启动
    schedule.scheduleJob('45 35 */6 * * *', function () {
      that.log('registerTaskRepeatPer6Hour 开始执行')
      let nowByMonth = moment().format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH)

      let oneMonthAgo = moment().subtract(1, DATE_FORMAT.UNIT.MONTH)
      let oneMonthAgoByMonth = oneMonthAgo.format(DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH)

      let oneDayAgo = moment().subtract(1, DATE_FORMAT.UNIT.DAY)
      let oneDayAgoByDay = oneDayAgo.format(DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY)

      // 汇总命令-昨日数据
      let summaryCommandList = [
        'Summary:UV',
        'Summary:NewUser',
        'Summary:Performance',
        'Summary:Error',
        'Summary:TimeOnSite'
      ]
      for (let summaryCommand of summaryCommandList) {
        // 当日数据
        that.dispatchParseCommand(summaryCommand, oneDayAgoByDay, DATE_FORMAT.UNIT.DAY)
      }

      // 汇总命令-按月统计
      let summaryByMonthCommandList = [
        'Summary:UV',
        'Summary:NewUser',
        'Summary:Performance',
        'Summary:TimeOnSite',

        'Summary:SystemBrowser',
        'Summary:SystemDevice',
        'Summary:SystemOS'
        // 'Summary:SystemRuntimeVersion'
      ]
      for (let summaryCommand of summaryByMonthCommandList) {
        // 当月数据
        that.dispatchParseCommand(summaryCommand, nowByMonth, DATE_FORMAT.UNIT.MONTH)
        // 上月数据
        that.dispatchParseCommand(summaryCommand, oneMonthAgoByMonth, DATE_FORMAT.UNIT.MONTH)
      }

      // 清理历史log
      that.execCommand('Utils:CleanOldLog')

      that.log('registerTaskRepeatPer6Hour 命令分配完毕')
    })
  }

  /**
   * 分发日志Parse命令
   * @param {*} commandName
   * @param {*} startAt
   * @param {*} endAt
   */
  async dispatchParseCommand (commandName, startAtStr, endAtStr) {
    this.log(`${commandName}任务开始, 处理时间 => ${startAtStr}, ${endAtStr}`)
    this.execCommand(commandName,
      [
        startAtStr, // startAtYmdHi:
        endAtStr // endAtYmdHi
      ]
    )
  }

  /**
   * 分发日志Summary命令
   * @param {*} commandName
   * @param {*} summaryAt
   * @param {*} summaryType
   */
  async dispatchSummaryCommand (commandName, countAtStr, summaryType) {
    this.log(`${commandName}任务开始, 处理时间 => ${countAtStr}, 时间类型 => ${summaryType}`)
    this.execCommand(commandName,
      [
        countAtStr, // summaryAtTime:
        summaryType // summaryType
      ]
    )
  }

  async execCommand (commandName, args = []) {
    let argvString = args.map((arg) => { return `'${arg}'` }).join('   ')
    let command = `NODE_ENV=${env} node ${projectBaseUri}/dist/fee.js ${commandName}  ${argvString}`
    this.log(`待执行命令=> ${command}`)
    let commandStartAtFormated = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
    let commandStartAtms = moment().valueOf()
    shell.exec(command, {
      async: true,
      silent: true
    }, () => {
      let commandFinishAtFormated = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
      let commandFinishAtms = moment().valueOf()
      let during = (commandFinishAtms - commandStartAtms) / 1000
      this.log(`${command}命令执行完毕, 共用时${during}秒, 开始执行时间=> ${commandStartAtFormated}, 执行完毕时间=> ${commandFinishAtFormated}`)
    })
  }
}

export default TaskManager
