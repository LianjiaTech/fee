import _ from 'lodash'
import path from 'path'
import fs from 'fs'
import moment from 'moment'
import shell from 'shelljs'
import Base from '~/src/commands/base'
import appConfig from '~/src/configs/app'
import LKafka from '~/src/library/kafka'
import DATE_FORMAT from '~/src/constants/date_format'

class CleanOldLog extends Base {
  static get signature() {
    return `
       Utils:CleanOldLog
       `
  }

  static get description() {
    return '只保留当前月内数据, 每月20号之后自动删除上个月数据'
  }

  async execute(args, options) {
    // 只保留当前月内数据, 每月20号之后自动删除上个月数据
    this.log("清理kafka日志")
    await this.clearOldKafkaLog()
    this.log("清理command日志")
    await this.clearOldCommandLog()
    this.log(`执行完毕`)
  }

  async clearOldKafkaLog() {
    let currentAtMoment = moment()
    let currentAt = currentAtMoment.clone().unix()
    let oneMonthAgoAt = currentAtMoment.clone().subtract(1, DATE_FORMAT.UNIT.MONTH).unix()

    // 每月20号后删除上一个月的数据
    let needRemainLastMonthLog = this.isNeedToCleanLog()

    let reaminLogAtList = [currentAt]
    if (needRemainLastMonthLog) {
      reaminLogAtList.push(oneMonthAgoAt)
    }

    let testBasePath = LKafka.getAbsoluteBasePathByType(LKafka.LOG_TYPE_TEST)
    let rawBasePath = LKafka.getAbsoluteBasePathByType(LKafka.LOG_TYPE_RAW)
    let jsonBasePath = LKafka.getAbsoluteBasePathByType(LKafka.LOG_TYPE_JSON)
    let remainLogPathMap = {}
    for (let logAt of reaminLogAtList) {
      for (let baseLogPath of [testBasePath, rawBasePath, jsonBasePath]) {
        let logName = LKafka.getMonthDirName(logAt)
        let logPath = path.resolve(baseLogPath, logName)
        remainLogPathMap[logPath] = true
      }
    }

    let needRemoveDirList = []
    for (let baseLogPath of [testBasePath, rawBasePath, jsonBasePath]) {
      let fileList = shell.ls(baseLogPath)
      this.log(`${baseLogPath}下文件列表为`, fileList)
      for (let dirname of fileList) {
        let dirPath = path.resolve(baseLogPath, dirname)
        if (_.has(remainLogPathMap, dirPath) === false) {
          this.log(`需要删除 => ${dirPath}`)
          needRemoveDirList.push(dirPath)
        }
      }
    }

    this.log('需要保留的文件夹列表:', Object.keys(remainLogPathMap))
    this.log('需要删除的文件夹列表:', needRemoveDirList)

    for (let needRemoveDirPath of needRemoveDirList) {
      this.log(`准备删除${needRemoveDirPath}`)
      if (fs.existsSync(needRemoveDirPath) === false) {
        this.log('路径', needRemoveDirPath, '不存在, 自动跳过')
        continue
      }
      if (_.isString(needRemoveDirPath) === true && needRemoveDirPath.length > 'log/kafka'.length) {
        this.execCommand(`rm -rf ${needRemoveDirPath}`)
        this.log('删除完毕')
      } else {
        this.log(`${needRemoveDirPath}不是字符串或长度过短, 自动跳过`)
      }
    }
  }

  /**
   * 自动清除一个月之前的命令日志
   */
  async clearOldCommandLog() {
    let dirFormat = 'YYYY_MM'
    let logFormat = 'YYYY-MM'
    let absoluteCommandLogUri = await this.getAbsoluteCommandLogPath()

    let dirLastMonthFormat = moment().subtract(1, DATE_FORMAT.UNIT.MONTH).format(dirFormat)
    let logLastMonthFormat = moment().subtract(1, DATE_FORMAT.UNIT.MONTH).format(logFormat)
    let lastMonthLogDirUri = path.resolve(absoluteCommandLogUri, dirLastMonthFormat)
    let oldCommandLogFormat = path.resolve(absoluteCommandLogUri, `*-${logLastMonthFormat}-*`)
    this.execCommand(`mkdir -p ${lastMonthLogDirUri}`)
    this.execCommand(`mv ${oldCommandLogFormat} ${lastMonthLogDirUri}`)

    let currentAtMoment = moment()
    // 每月20号后删除上一个月的数据
    let needRemainLastMonthLog = this.isNeedToCleanLog()
    if (needRemainLastMonthLog && lastMonthLogDirUri.length > '/log/command'.length) {
      this.log("每月20号后自动删除上一个月的command日志")
      this.execCommand(`rm -rf ${lastMonthLogDirUri}`)
    }
  }

  async getAbsoluteCommandLogPath() {
    let logPath = appConfig.absoluteLogPath
    let commandLogPath = path.resolve(logPath, 'command')
    return commandLogPath
  }

  execCommand(command) {
    this.log('执行命令=> ', command)
    shell.exec(command)
  }

  isNeedToCleanLog() {
    return moment().date() > 20
  }

}

export default CleanOldLog
