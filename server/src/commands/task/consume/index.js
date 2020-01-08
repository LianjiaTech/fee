import _ from 'lodash'
import moment from 'moment'

import Base from '~/src/commands/base'
import LKafka from '~/src/library/kafka'
import MProject from '~/src/model/project/project'
import MDot from '~/src/model/project/dot/index'
import BaseClientConfig from '~/src/configs/kafka'
import DATE_FORMAT from '~/src/constants/date_format'
import WashData from '~/src/commands/task/consume/base'

import watchServer from '~/src/configs/watch_server'
import Alert from '~/src/library/utils/modules/alert'
import sendMail from '~/src/library/utils/modules/mailer'

const ONE_TIME_MAX_MESSAGE_LENGTH = 10000

class Consume extends Base { 
  constructor() { 
    super()
    this.total = 0
    this.start = false
    this.lastAlertTime = null
    this.onReadyList = []
    this.consumer = this.getKafkaClient()
    this.consumer.on('ready', () => { 
      this.start = true
      this.log('kafka链接成功，准备录入数据！')
      for (const onReady of this.onReadyList) {
        onReady()
      }
      this.onReadyList = []
    })
    this.consumer.on('disconnected', () => this.start = false)
  }

  static get signature () {
    return `
     Consume:Kafka
     `
  }

  static get description () {
    return '消费kafka日志'
  }

  // 打开链接池
  connectOpen () {
    return new Promise(
      resolve => {
        this.consumer.connect(error => resolve({ error }))
        this.onReadyList.push(() => resolve({}))
      }
    )
  }

  // 获取消息
  async getMessage() { 
    // 先检查连接池是否是开启状态
    const { consumer, start } = this
    if (!start) {
      // 连接中断了，重新打开链接池
      const { error } = await this.connectOpen()
      if (error) {
        // 连接池打开失败了返回,记录日志返回空数组
        return []
      }
      // 设置订阅消息组
      consumer.subscribe(['fee-dig-www-log'])
    }
    // 可以去取数据了
    // 去拉去指定数量的数据
    return new Promise(resolve => {
      consumer.consume(ONE_TIME_MAX_MESSAGE_LENGTH,
        (error, message) => {
          if (error) {
            // 记录错误返回空数组
            return resolve([])
          }
          return resolve(message)
        })
    })
  }

  /**
   * 在最外层进行一次封装, 方便获得报错信息
   * @param args
   * @param options
   */
  async handle() { 
    let completed = false
    let washData = new WashData(this.log.bind(this))
    let startAt = Date.now()
    let now = Date.now()
    this.projectMap = await this.getProjectMap()
    this.projectDotMap = await this.getAllProjectDotEvent()
    
    do { 
      let data = await this.getMessage()
      if (data.length > 0) {
        now = Date.now()
        // 每5分钟获取一次
        if (now - startAt > 5 * 60 * 1000) { 
          startAt = now
          this.projectMap = await this.getProjectMap()
          this.projectDotMap = await this.getAllProjectDotEvent()
        }
        
        washData.init(this.projectMap, this.projectDotMap)
        completed = await washData.save2Disk(data).catch(err => {
          let msg = `kafka消费任务执行报错：\r\n\t报警时间${moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)}\r\n\t错误详情 => ${err.stack || err.message}\r\n\t请相关人员立即处理！`
          this.sendAlert(msg)
          // 若出现报错，10s之后再resolve
          return new Promise(resolve => { 
            setTimeout(() => { 
              resolve(true)
            }, 10 * 1000)
          })
        })
      } else { 
        completed = true
      }
    } while (completed) 
  }

  getKafkaClient () {
    let kafka = LKafka.Kafka
    return new kafka.KafkaConsumer(BaseClientConfig, {})
  }

  /**
   * 报警
   */
  async sendAlert(message) {
    const nowAt = Date.now()
    const kafkaWatchList = _.get(watchServer, ['kafkaWatchList'], [])
    // 避免第一次没有报
    if (!this.lastAlertTime) { 
      this.lastAlertTime = nowAt
    }
    for (let conf of kafkaWatchList) { 
      let { title, mails, ucids, alarmWaitTime, from } = conf
      let mailDetail = {
        to: mails,
        title: `"${title}" 服务出错`,
        text: `
错误详情：${message}，
"${title}" 发现故障时间：${moment(nowAt).format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)}，
服务器最后响应时间:${moment(this.lastAlertTime).format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)}，
${from}`
      }
      if (this.lastAlertTime + alarmWaitTime <= nowAt) { 
        this.lastAlertTime = nowAt
        Alert.sendMessage(ucids, message)
        sendMail(mailDetail)
      }
    }
  }

  /**
   * 获取项目列表
   * @returns {object}
   */
  async getProjectMap () {
    let projectList = await MProject.getList()
    let projectMap = {}
    for (let project of projectList) {
      projectMap[project.project_name] = {
        id: project.id,
        rate: project.rate,
      }
    }
    this.log('项目列表获取成功！')
    return projectMap
  }

  /**
   * 获取所有项目的打点配置
   * @returns {Map}
   */ 
  async getAllProjectDotEvent() { 
    const events = await MDot.query()
    let item = Object.create(null)
    let res = events.reduce((pre, cur) => { 
      _.set(item, [cur.project_id, cur.event_name, cur.props_name], cur.props_data_type)
      for (let key of Object.keys(item)) pre.set(key, item[key])
      return pre
    }, new Map())
    return res
  }
}

export default Consume