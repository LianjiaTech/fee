import fs from 'fs'
import { readLine } from 'lei-stream'
import moment from 'moment'
import _ from 'lodash'
import commonConfig from '~/src/configs/common'
import SaveLogBase from '~/src/commands/save_log/base'
import LKafka from '~/src/library/kafka'

let jsonWriteStreamPool = new Map()
let rawLogWriteStreamPool = new Map()

class NginxParseLog extends SaveLogBase {
  static get signature () {
    return `
     SaveLog:Nginx 
     `
  }

  static get description () {
    return '每十分钟读取Nginx日志文件，并解析'
  }

  async execute (args, options) {
    let that = this
    // 获取项目列表
    let projectMap = await this.getProjectMap()

    let logCounter = 0
    let legalLogCounter = 0
    let nginxLogFilePath = commonConfig.nginxLogFilePath
    let timeAt = moment().unix() - 60
    let timeMoment = moment.unix(timeAt)
    let formatStr = timeMoment.format('/YYYYMM/DD/HH/mm')
    let logAbsolutePath = `${nginxLogFilePath}${formatStr}.log`
    if (fs.existsSync(logAbsolutePath) === false) {
      that.log(`log文件不存在, 自动跳过 => ${logAbsolutePath}`)
      return
    }
    let onDataIn = async (data, next) => {
      logCounter++
      let content = data.toString()

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
      next()
    }
    readLine(fs.createReadStream(logAbsolutePath), {
      // 换行符，默认\n
      newline: '\n',
      // 是否自动读取下一行，默认false
      autoNext: false,
      // 编码器，可以为函数或字符串（内置编码器：json，base64），默认null
      encoding: null
    }).go(onDataIn, function () { })
  }
}

export default NginxParseLog
