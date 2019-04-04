import fs from 'fs'
import Base from '~/src/commands/base'
import { readLine } from 'lei-stream'
import moment from 'moment'
import LKafka from '~/src/library/kafka'
import DATE_FORMAT from '~/src/constants/date_format'

import Alert from '~/src/library/utils/modules/alert'
import AlarmConfig from '~/src/configs/alarm'

/**
 * 提供框架方法, 方便编写处理函数
 */
class ParseBase extends Base {
  constructor() {
    super()

    // 初始化属性(目前只能在constructor里注册属性)

    // 统一按项目进行统计
    this.projectMap = new Map()
    this.startAtMoment = null
    this.endAtMoment = null

    this.DATE_FORMAT_ARGUMENTS = DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE
    this.DATE_FORMAT_DISPLAY = DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE
  }

  async execute (args, options) {
    let { startAtYmdHi, endAtYmdHi } = args
    if (this.isArgumentsLegal(args, options) === false) {
      this.warn('参数不正确, 自动退出')
      Alert.sendMessage(AlarmConfig.WATCH_UCID_LIST_DEFAULT, `${this.constructor.name}参数不正确, 自动退出`)
      return false
    }
    this.startAtMoment = moment(startAtYmdHi, this.DATE_FORMAT_ARGUMENTS)
    this.endAtMoment = moment(endAtYmdHi, this.DATE_FORMAT_ARGUMENTS)
    this.log(`开始分析${this.startAtMoment.format(this.DATE_FORMAT_DISPLAY) + ':00'}~${this.endAtMoment.format(this.DATE_FORMAT_DISPLAY) + ':59'}范围内的记录`)
    let startAt = this.startAtMoment.unix()
    let endAt = this.endAtMoment.unix()
    await this.parseLog(startAt, endAt)
    this.log('全部数据处理完毕, 存入数据库中')
    let { totalRecordCount, processRecordCount, successSaveCount } = await this.save2DB()
    this.log(`${this.startAtMoment.format(this.DATE_FORMAT_DISPLAY) + ':00'}~${this.endAtMoment.format(this.DATE_FORMAT_DISPLAY) + ':59'}范围内日志录入完毕, 共记录数据${processRecordCount}/${totalRecordCount}条, 入库成功${successSaveCount}条`)
  }

  /**
   * [可覆盖]检查请求参数, 默认检查传入的时间范围是否正确, 如果有自定义需求可以在子类中进行覆盖
   * @param {*} args
   * @param {*} options
   * @return {Boolean}
   */
  isArgumentsLegal (args, options) {
    let { startAtYmdHi, endAtYmdHi } = args

    let startAtMoment = moment(startAtYmdHi, DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)
    let endAtMoment = moment(endAtYmdHi, DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE)
    if (moment.isMoment(startAtMoment) === false || startAtMoment.isValid() === false) {
      let message = `startAtYmdHi参数不正确 => ${startAtYmdHi}`
      this.warn(message)
      Alert.sendMessage(AlarmConfig.WATCH_UCID_LIST_DEFAULT, message)
      return false
    }
    if (moment.isMoment(endAtMoment) === false || endAtMoment.isValid() === false) {
      let message = `endAtYmdHi参数不正确 =>${endAtYmdHi}`
      this.warn(message)
      Alert.sendMessage(AlarmConfig.WATCH_UCID_LIST_DEFAULT, message)
      return false
    }
    if (startAtMoment.unix() > endAtMoment.unix()) {
      let message = `结束时间小于开始时间 :  ${startAtYmdHi} => ${startAtMoment.unix()} endAtYmdHi =>  ${endAtMoment.unix()}`
      this.warn(message)
      Alert.sendMessage(AlarmConfig.WATCH_UCID_LIST_DEFAULT, message)
      return false
    }
    return true
  }

  /**
   * 解析指定时间范围内的日志记录, 并录入到数据库中
   * @param {*} startAt
   * @param {*} endAt
   * @return null
   */
  async parseLog (startAt, endAt) {
    let that = this
    for (let currentAt = startAt; currentAt <= endAt; currentAt = currentAt + 60) {
      let currentAtMoment = moment.unix(currentAt)
      let absoluteLogUri = LKafka.getAbsoluteLogUriByType(currentAt, LKafka.LOG_TYPE_JSON)
      that.log(`开始处理${currentAtMoment.format(that.DATE_FORMAT_DISPLAY)}的记录, log文件地址 => ${absoluteLogUri}`)
      let logUri = LKafka.getAbsoluteLogUriByType(currentAt, LKafka.LOG_TYPE_JSON)
      if (fs.existsSync(logUri) === false) {
        that.log(`log文件不存在, 自动跳过 => ${absoluteLogUri}`)
        continue
      }
      // 确保按文件顺序逐行读写日志
      await new Promise(function (resolve, reject) {
        let onDataReceive = async (data, next) => {
          let record = JSON.parse(data)
          if (that.isLegalRecord(record)) {
            that.processRecordAndCacheInProjectMap(record)
          }
          next()
        }
        let onReadFinish = () => {
          resolve()
        }
        readLine(fs.createReadStream(logUri), {
          // 换行符，默认\n
          newline: '\n',
          // 是否自动读取下一行，默认false
          autoNext: false,
          // 编码器，可以为函数或字符串（内置编码器：json，base64），默认null
          encoding: null
        }).go(onDataReceive, onReadFinish)
      })
      that.log('处理完毕')
    }
  }

  /**
   * [必须覆盖]判断该条记录是不是需要解析的记录
   * 标准结构 => {"type":"product","code":10001,"detail":{"duration_ms":35544},"extra":{},"common":{"pid":"platfe_saas","uuid":"59b979cb-4e2a-4a34-aabf-5240a6794194","ssid":"c6a39184-0689-498b-b973-a5c0c9496494","ucid":1000000026017035,"timestamp":1537426981231},"msg":"","project_id":1,"time":1537426981,"ua":{"ua":"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/537.36 (@33cd7097eede00b9c4ce59f5cf7d0e7f1eee86d8) Safari/537.36 nw(0.30.5) dtsaas(2.0.11)","browser":{"name":"Chrome","version":"537.36","major":"537"},"engine":{"name":"WebKit","version":"537.36"},"os":{"name":"Windows","version":"7"},"device":{},"cpu":{}},"ip":"60.169.167.181","country":"中国","province":"北京","city":"北京"}
   * @param {Object} record
   * @return {Boolean}
   */
  isLegalRecord (record) {
    this.mustBeOverride()
    // let recordType = get(record, ['type'], '')
    // let code = get(record, ['code'], '')
    // let projectId = get(record, ['project_id'], '')
    // let durationMs = get(record, ['detail', 'duration_ms'], '')
    // code = parseInt(code)
    // durationMs = parseInt(durationMs)
    // projectId = parseInt(projectId)
    // if (recordType !== LegalRecordType) {
    //   return false
    // }
    // if (isNumber(code) === false) {
    //   return false
    // }
    // if (code !== LegalRecordCode) {
    //   return false
    // }
    // if (isNumber(projectId) === false) {
    //   return false
    // }
    // if (projectId < 0) {
    //   return false
    // }
    // if (isNumber(durationMs) === false) {
    //   return false
    // }
    // if (durationMs > MaxAllowRecordDuringMs) {
    //   return false
    // }
    // if (durationMs < MinAllowRecordDuringMs) {
    //   return false
    // }
    return true
  }

  /**
   * [必须覆盖]处理记录, 并将结果缓存在this.ProjectMap中
   * {"type":"product","code":10001,"detail":{"duration_ms":30807},"extra":{},"common":{"pid":"platfe_saas","uuid":"d0511ce2-2482-4f7b-8f11-09ed75004963","ssid":"0c11d4b5-b970-419c-b1ac-f1b7922398fc","ucid":null,"timestamp":1537365073569},"msg":""}
   * @param {Object} record
   */
  async processRecordAndCacheInProjectMap (record) {
    this.mustBeOverride()
    // let projectId = get(record, ['project_id'], 0)
    // let durationMs = get(record, ['detail', 'duration_ms'], 0)
    // let country = get(record, ['country'], '')
    // let province = get(record, ['province'], '')
    // let city = get(record, ['city'], '')
    // let recordAt = get(record, ['time'], 0)

    // let countAtTime = moment.unix(recordAt).format(COUNT_BY_HOUR_DATE_FORMAT)
    // let distributionPath = [country, province, city]

    // let countAtMap = new Map()
    // let distribution = {}
    // if (this.projectMap.has(projectId)) {
    //   countAtMap = this.projectMap.get(projectId)
    //   if (countAtMap.has(countAtTime)) {
    //     distribution = countAtMap.get(countAtTime)
    //     if (has(distribution, distributionPath)) {
    //       let oldDurationMs = get(distribution, distribution, 0)
    //       durationMs = durationMs + oldDurationMs
    //     }
    //   }
    // }
    // set(distribution, distributionPath, durationMs)
    // countAtMap.set(countAtTime, distribution)
    // this.projectMap.set(projectId, countAtMap)
    return true
  }

  /**
   * [必须覆盖]将数据同步到数据库中
   */
  async save2DB () {
    this.mustBeOverride()
    let processRecordCount = 0
    let successSaveCount = 0
    let totalRecordCount = this.getRecordCountInProjectMap()

    // 处理的时候调一下这个方法, 专业打印处理进度
    this.reportProcess(processRecordCount, successSaveCount, totalRecordCount)

    // for (let [projectId, countAtMap] of projectMap) {
    //   for (let [countAtTime, distribution] of countAtMap) {
    //     let recordList = MCityDistribution.getFlattenCityRecordListInDistribution(distribution)
    //     let totalStayMs = 0
    //     for (let record of recordList) {
    //       totalStayMs = totalStayMs + record
    //     }

    //     let totalUv = await MUniqueView.getTotalUv(projectId, countAtTime, COUNT_TYPE_HOUR)

    //     let isSuccess = await replaceAndAutoIncreaseTotalStayMsInUvRecord(projectId, totalStayMs, totalUv, countAtTime, COUNT_TYPE_HOUR, distribution)
    //     processRecordCount = processRecordCount + 1
    //     if (isSuccess) {
    //       successSaveCount = successSaveCount + 1
    //     }
    //     if (processRecordCount % 100 === 0) {
    //       this.log(`当前已处理${processRecordCount}/${totalRecordCount}条记录, 其中, 入库成功${successSaveCount}条`)
    //     }
    //   }
    // }
    return { totalRecordCount, processRecordCount, successSaveCount }
  }

  /**
   * 汇报进度
   * @param {*} processRecordCount
   * @param {*} successSaveCount
   * @param {*} totalRecordCount
   */
  reportProcess (processRecordCount, successSaveCount, totalRecordCount, tableName = '') {
    let insertTable = ''
    if (tableName) {
      insertTable = `, 入库${tableName}`
    }
    if (processRecordCount % 100 === 0) {
      this.log(`当前已处理${processRecordCount}/${totalRecordCount}条记录${insertTable}, 已成功${successSaveCount}条`)
    }
  }

  /**
   * [必须覆盖]统计 projectUvMap 中的记录总数
   */
  getRecordCountInProjectMap () {
    this.mustBeOverride()
    let totalCount = 0
    // for (let [projectId, countAtMap] of projectMap) {
    //   for (let [countAtTime, distribution] of countAtMap) {
    //     totalCount = totalCount + 1
    //   }
    // }
    return totalCount
  }

  mustBeOverride () {
    this.warn('注意, 这里有个方法没有覆盖')
    this.warn('当场退出←_←')
    process.exit(0)
  }
}

export default ParseBase
