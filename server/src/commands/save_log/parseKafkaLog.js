import moment from 'moment'
import Util from '~/src/library/utils/modules/util'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constants/date_format'

import SaveLogBase from '~/src/commands/save_log/base'
import LKafka from '~/src/library/kafka'
import BaseClientConfig from '~/src/configs/kafka'

let jsonWriteStreamPool = new Map()
let rawLogWriteStreamPool = new Map()
const MAX_RUN_TIME = 29 * 1000 // 29s后自动关闭

/**
 * 将kafka日志落在日志文件中
 */
class Save2Log extends SaveLogBase {
  static get signature () {
    return `
     SaveLog:Kafka
     `
  }

  static get description () {
    return '解析kafka日志, 按日志创建时间将原日志和解析后合法的json日志落在log文件中, 每运行30s自动退出'
  }

  async execute (args, options) {
    // 获取项目列表
    let projectMap = await this.getProjectMap()

    let client = this.getClient()
    this.log('client 获取成功')
    let that = this
    let logCounter = 0
    let legalLogCounter = 0
    let pid = process.pid

    this.log(`[pid:${pid}]本次任务启动于${moment().format(DATE_FORMAT.DISPLAY_BY_SECOND)}, 预计在${MAX_RUN_TIME / 1000}秒后, ${moment().add(MAX_RUN_TIME / 1000, 'seconds').format(DATE_FORMAT.DISPLAY_BY_SECOND)}自动结束`)
    // 开始运行指定时间后, 自动退出
    setTimeout(async () => {
      that.log(`[pid:${pid}]time to disconnect from kafka`)
      client.disconnect(async (err, data) => {
        // 断开链接异常, 强制退出
        that.log(`[pid:${pid}]断开链接失败, error =>`, err, 'data =>', data)
        that.log(`[pid:${pid}]启动强制退出流程`)
        await this.forceExit()
      })
    }, MAX_RUN_TIME)

    // 达到运行指定时间两倍后, 不再等待, 强制退出
    setTimeout(async () => {
      that.log(`[pid:${pid}]运行时间超出限制, 强制退出`)
      await this.forceExit()
    }, MAX_RUN_TIME * 1.5)

    client.on('ready', () => {
      client.subscribe(['fee-dig-www-log'])
      client.consume()
      this.log(`[pid:${pid}]kafka 链接成功, 开始录入数据`)
    }).on('data', async (data) => {
      logCounter = logCounter + 1
      let content = data.value.toString()

      // 获取日志时间, 没有原始日志时间则直接跳过
      let logCreateAt = this.parseLogCreateAt(content)
      if (_.isFinite(logCreateAt) === false || logCreateAt <= 0) {
        this.log('日志时间不合法, 自动跳过')
        return
      }
      // 首先判断是不是测试数据, 如果是测试数据, 直接保存, 跳过后续所有逻辑
      if (this.isTestLog(content)) {
        this.log('收到测试日志, 直接保存, 并跳过后续所有流程')
        let writeLogClient = this.getWriteStreamClientByType(logCreateAt, LKafka.LOG_TYPE_TEST)
        writeLogClient.write(content)
        this.log('测试日志写入完毕')
        return
      }
      // 检查日志格式, 只录入解析后, 符合规则的log
      let parseResult = await that.parseLog(content, projectMap)
      if (_.isEmpty(parseResult)) {
        that.log('日志格式不规范, 自动跳过, 原日志内容为 =>', content)
        return
      }

      let projectName = _.get(parseResult, ['project_name'], 0)
      let projectRate = _.get(projectMap, [projectName, 'rate'], 100)
      let checkFlag = _.floor(logCounter % 10000)
      let skipIt = checkFlag > projectRate
      if (skipIt) {
        // 根据项目抽样比率，过滤打点数据，如果没有命中，直接返回
        this.log(` projectName => ${projectName}, logCounter => ${logCounter}, checkFlag => ${checkFlag}, projectRate => ${projectRate}, 未命中抽样比, 自动跳过`)
        return
      }
      legalLogCounter = legalLogCounter + 1

      // 存原始数据
      let rawLogWriteStreamByLogCreateAt = this.getWriteStreamClientByType(logCreateAt, LKafka.LOG_TYPE_RAW)
      rawLogWriteStreamByLogCreateAt.write(content)

      this.log(`收到数据, 当前共记录${legalLogCounter}/${logCounter}条数据`)
      let jsonWriteStreamByLogCreateAt = this.getWriteStreamClientByType(logCreateAt, LKafka.LOG_TYPE_JSON)
      jsonWriteStreamByLogCreateAt.write(JSON.stringify(parseResult))
      // 定期清一下
      if (jsonWriteStreamPool.size > 100 || rawLogWriteStreamPool.size > 100) {
        // 每当句柄池满100后, 关闭除距离当前时间10分钟之内的所有文件流
        this.autoCloseOldStream()
      }
    }).on('disconnected', async () => {
      this.log(`[pid:${pid}]链接断开`)
      await this.forceExit()
    })
  }

  getClient () {
    let kafka = LKafka.Kafka
    let client = new kafka.KafkaConsumer(BaseClientConfig, {})
    return client.connect()
  }

  async forceExit () {
    let pid = process.pid
    this.log(`[pid:${pid}]关闭所有日志文件句柄`)
    this.autoCloseOldStream(true)
    this.log(`[pid:${pid}]休眠3s`)
    await Util.sleep(3 * 1000)
    this.log(`[pid:${pid}]自动退出`)
    process.kill(process.pid)
    this.log(`[pid:${pid}]程序已退出, 不会打印该log`)
  }
}

export default Save2Log
