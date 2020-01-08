import moment from 'moment'
import md5 from 'md5'
import Base from '~/src/commands/base'
import redis from '~/src/library/redis'
import Alert from '~/src/library/utils/modules/alert'
import MAlarmConfig from '~/src/model/project/alarm/alarm_config'
import MProject from '~/src/model/project/project'
import MUser from '~/src/model/project/user'
import MProjectMember from '~/src/model/project/project_member'
import MAlarmLog from '~/src/model/project/alarm/alarm_log'
import MAlarmEsId from '~/src/model/project/alarm/alarm_error'
import MPerformance from '~/src/model/parse/performance'
import MErrorES from '~/src/model/elastic_search/summary/error'
import MPvES from '~/src/model/elastic_search/summary/pv'
import MPerformanceES from '~/src/model/elastic_search/summary/performance'
import NetworkUtil from '~/src/library/utils/modules/network'
import Logger from '~/src/library/logger'
import appConfig from '~/src/configs/app'
import env from '~/src/configs/env'
import _ from 'lodash'
import axios from '~/src/library/http'
import {
  BASE_REDIS_LAST_WATCH_TIME, // 上一次监控时间
  BASE_REDIS_LAST_WATCH_ERROR_COUNT, // 上一次监控范围内错误数量
  BASE_REDIS_LAST_ERROR_ALARM_TIME, // 上一次错误报警时间
  BASE_REDIS_LAST_PERF_ALARM_TIME // 上一次性能报警时间
} from '~/src/constants/redisKey'
import alarmConf from '~/src/configs/alarm'

const isProduction = env === 'production'
const { host: HOST } = appConfig

const getRedisKeyByPrefix = (prefix, id) => prefix + id
const localIpList = NetworkUtil.getLocalIpList()
const localIpStr = localIpList.join(',')
class WatchAlarm extends Base {
  constructor () {
    super()
    this.currentQueryCounter = 0
  }

  static get signature () {
    return `
        WatchDog:Alarm
    `
  }

  static get description () {
    return '[根据报警配置] 监测每一条报警配置对应的项目错误'
  }

  async execute (args, options) {
    const alarmConfigList = await MAlarmConfig.getAllEnabled()

    for (let alarmConfig of alarmConfigList) {
      const {
        id,
        project_id: projectId,
        error_name: errorName,
        time_range_s: timeRange
      } = alarmConfig
      const nowAt = moment().unix() - 60 * 3 // 回溯3分钟以前的数据避免saveToLog没有把错误log下来
      // 上一次监控的时间
      const redisKey = getRedisKeyByPrefix(BASE_REDIS_LAST_WATCH_TIME, id)
      let lastWatchTime = await redis.asyncGetValue(redisKey) || (nowAt - timeRange)
      lastWatchTime = parseInt(lastWatchTime)
      // 如果在同一个监控时间范围内，则不重复报警
      if (nowAt < parseInt(lastWatchTime) + timeRange) {
        this.log(`项目${projectId}监听的${errorName}错误在${nowAt - lastWatchTime}秒内报过警，自动跳过`)
        continue
      }
      await this.autoAlarm(alarmConfig, nowAt, lastWatchTime)
      await redis.asynSetValue(redisKey, nowAt)
    }
  }

  /**
   * 报警
   * @param {*} alarmConfig
   * @param {*} nowAt
   * @param {*} lastWatchTime
   */
  async autoAlarm (alarmConfig, nowAt, lastWatchTime) {
    let { type } = alarmConfig

    if (type === MAlarmConfig.ALARM_TYPE_ERROR) {
      await this.handleError(lastWatchTime, nowAt, alarmConfig)
    }
    if (type === MAlarmConfig.ALARM_TYPE_PERFORMANCE) {
      await this.handlePerf(lastWatchTime, nowAt, alarmConfig)
    }
  }

  /**
   * 过滤报警信息
   * @param {*} errorList
   * @param {*} errorFilterList
   * @param {*} url 页面url，可能为正则表达式
   */
  filterError (errorList = [], errorFilterList, url = '') {
    if (!_.isArray(errorList)) {
      return []
    }
    if (!errorFilterList && url === '') {
      return errorList
    }
    let filterList = errorFilterList.split(',')
    let result = []
    let pageUrl = ''
    let isMatch = false
    let urlReg = ''

    try {
      urlReg = new RegExp(url)
    } catch (e) {
      this.log(`url不是合法正则==>${url}`)
    }

    for (let item of errorList) {
      pageUrl = _.get(item, ['detail', 'url'], '') || _.get(item, ['common', 'page_type'], '') || _.get(item, ['extra'], '')
      try {
        isMatch = urlReg.test(pageUrl)
      } catch (e) {
        isMatch = url === pageUrl
      }
      if (!isMatch) continue
      result.push(item)
    }
    return result.filter(item => {
      for (const errorMark of filterList) {
        if (!errorMark) continue
        let extra = _.get(item, ['extra'], {})
        extra = extra.toString()
        if (extra.indexOf(errorMark) > -1) return false
      }
      return true
    })
  }

  /**
   * 聚合errorList
   * @param {*} [errorList=[]]
   * @memberof WatchAlarm
   */
  gatherErrorList (errorList = [], minTriggerValue) {
    let errorUrlMap = errorList.reduce((map, cur) => {
      let url = _.get(cur, ['detail', 'url'], '')
      let key = url.split('?')[0]
      if (key) {
        map.has(key) ? map.set(key, [...map.get(key), cur]) : map.set(key, [cur])
      }
      return map
    }, new Map())
    let result = []
    for (let [key, value] of errorUrlMap.entries()) {
      if (value.length >= minTriggerValue && minTriggerValue !== 0) {
        this.log(`汇总URL报错 ====> ${key}, 错误总量 ===> ${value.length}, 阈值 =====> ${minTriggerValue}`)
        result = result.concat(value)
      }
    }
    return result
  }

  /**
   * 处理错误报警
   * @param {*} timeAgoAt 上一次监控的时间点
   * @param {*} nowAt
   */
  async handleError (timeAgoAt, nowAt, alarmConfig) {
    let {
      id: configId,
      project_id: projectId,
      error_name: errorName,
      time_range_s: timeRange,
      max_error_count: maxErrorCount,
      error_filter_list: errorFilterList,
      alarm_interval_s: alarmInterval,
      note,
      url = '',
      callback = '', // 错误报警业务回调地址
      wave_motion: waveMotion = 0,
      is_summary: isSummary,
      webhook // 企微机器人webhook地址
    } = alarmConfig
    note = note || '无'
    // 获取上个周期内的报错数量
    const lastMinuteErrorCount = await redis.asyncGetValue(getRedisKeyByPrefix(BASE_REDIS_LAST_WATCH_ERROR_COUNT, configId)) || 0
    // 获取上一次的报警时间
    const lastAlarmTime = await redis.asyncGetValue(getRedisKeyByPrefix(BASE_REDIS_LAST_ERROR_ALARM_TIME, configId)) || timeAgoAt

    const errorNameList = errorName && errorName !== '*' ? [errorName] : []
    const intervalTime = nowAt - timeAgoAt
    const times = intervalTime / timeRange
    const minTriggerValue = Math.ceil(maxErrorCount * times) // 能够触发报警的最小值
    const errorQuery = `projectId:${projectId} timeAgoAt:${timeAgoAt} nowAt:${nowAt} 0, minTriggerValue:${minTriggerValue}  errorNameList:${errorNameList}`
    // 统计Pv
    const pvTotalCount = await MPvES.asyncGetTotalCount(projectId, timeAgoAt, nowAt)
    // 统计错误总数
    const totalCount = await MErrorES.asyncGetTotalCount(projectId, timeAgoAt, nowAt, errorNameList).catch(err => {
      throw new Error(`查询【错误】报警LIST【asyncGetTotalCount】失败,查询条件失败原因：${err.stack}`)
    })
    // 获取错误列表
    const errorList = await MErrorES.asyncGetList(projectId, timeAgoAt, nowAt, 0, totalCount, errorNameList).catch(err => {
      throw new Error(`查询【错误】报警LIST【asyncGetList】失败，查询条件errorQuery:${errorQuery},查询条件失败原因：${err.stack}`)
    })
    // 过滤错误
    let filterErrorList = this.filterError(errorList, errorFilterList, url)

    !isSummary && (filterErrorList = this.gatherErrorList(filterErrorList, minTriggerValue))

    const errorCount = filterErrorList.length
    let errorRate = (errorCount / pvTotalCount).toFixed(2) * 100

    if (!_.inRange(errorRate, 0, 100)) errorRate = 0

    // 存储这个周期的错误数量
    const avgCount = Math.ceil(errorCount / times)
    await redis.asynSetValue(getRedisKeyByPrefix(BASE_REDIS_LAST_WATCH_ERROR_COUNT, configId), avgCount)
    // 沉默时间内不报警，这一步必须放到这里，不能前移
    if (lastAlarmTime + alarmInterval > nowAt) {
      this.log(`【错误】沉默：项目${projectId}监听的${errorName}在${alarmInterval}秒内报过警，自动跳过`)
      return
    }

    this.log(`${moment.unix(timeAgoAt).format('HH:mm:ss')}-${moment.unix(nowAt).format('HH:mm:ss')}项目${projectId}监控的errorName:"${errorName}"错误最近${intervalTime}秒错误数 => ${errorCount}，PV数 => ${pvTotalCount}`)
    let waveRate = parseInt((avgCount - lastMinuteErrorCount) / lastMinuteErrorCount * 100) || 0

    let causedByErrorWave = () => {
      return waveRate > waveMotion && waveMotion !== 0
    }
    let causedByErrorCount = () => {
      return errorCount >= minTriggerValue && minTriggerValue !== 0
    }
    if (causedByErrorWave() || causedByErrorCount()) {
      const project = await MProject.get(projectId)
      const projectName = _.get(project, ['display_name'], projectId)
      const projectRate = _.get(project, ['rate'], 0) / 10000 * 100
      const alarmUcidList = await MProjectMember.getAlarmUcidList(projectId)
      const usersList = await MUser.getUserListByUcid(alarmUcidList)

      const now = moment().unix()
      if (errorName === '*') errorName = '所有'
      let alarmMsg = `项目【${projectName}】监控的【${errorName}】错误，抽样比例【${projectRate}%】，页面URL规则【${url || '所有页面'}】，`
      if (causedByErrorCount()) {
        alarmMsg += `\n最近【${timeRange}】秒内错误数【${errorCount}】，错误率【${errorRate}%】，达到阈值【${maxErrorCount}】，阈值规则【${isSummary ? '汇总值' : '非汇总值'}】`
      }
      if (causedByErrorWave()) {
        alarmMsg += `\n抖动【${waveRate}%】，错误率【${errorRate}%】，达到阈值【${waveMotion}%】`
      }
      alarmMsg += `\n触发报警，报警备注【${note}】。`
      this.log(alarmMsg)
      const isSuccess = await MAlarmLog.insert(projectId, configId, now, errorName, alarmMsg)
      if (isSuccess === false) return Logger.error('添加报警日志失败')
      let failedList = []
      // 将错误ID list存到表中
      for (let error of filterErrorList) {
        let _id = _.get(error, 'id', false)
        let _index = _.get(error, 'index', false)
        let _logId = _.get(isSuccess, 0, false)

        if (_id && _index && _logId) {
          let isSuccess = await MAlarmEsId.insert(_id, _logId, projectId, _index)
          if (!isSuccess) {
            failedList.push({id: _id, logId: _logId})
            continue
          }
        }
      }
      this.log(`=======>>> 共【${errorCount}】条数据，插入失败【${failedList.length}】条，失败记录为【${JSON.stringify(failedList)}】<<<=======`)
      alarmMsg += `点击此处查看错误详情 => ${HOST}/error/detail?lid=${_.get(isSuccess, 0)}&pid=${projectId}`

      // 如果配置了webhook地址就不再发送报警了
      !webhook && await this.sendAlert(alarmUcidList, alarmMsg)
      // 更新报警时间
      await redis.asynSetValue(getRedisKeyByPrefix(BASE_REDIS_LAST_ERROR_ALARM_TIME, configId), nowAt)
      // 执行业务回调
      if (callback) {
        let res = await this.executeCallback(callback, {
          msg_id: md5(alarmMsg).substring(0, 10),
          server_ip: localIpStr,
          lid: _.get(isSuccess, 0),
          project_id: projectId,
          project_name: projectName,
          error_name: errorName,
          url: `${HOST}/error/detail?lid=${_.get(isSuccess, 0)}&pid=${projectId}`,
          alarmConfig,
          detail: filterErrorList
        }, alarmUcidList)
        this.log(`项目【${projectName}】监控的【${errorName}】错误的业务回调执行结果====>${JSON.stringify(res)}，回调地址===>${callback}`)
      }
      // 企微机器人报警
      if (webhook) {
        await this.callWebhook(webhook, {
          // 项目名称
          pname: projectName,
          // 错误类型
          ename: errorName,
          // 错误率
          errorRate: errorRate,
          // 报警配置
          config: alarmConfig,
          // 详情链接
          url: `${HOST}/error/detail?lid=${_.get(isSuccess, 0)}&pid=${projectId}`,
          // 错误数量
          count: _.get(filterErrorList, ['length'], 0)
        }, usersList)
      }
    }
  }

  /**
   * 处理性能报警
   * @param {*} timeAgoAt
   * @param {*} nowAt
   * @param {*} timeRange
   */
  async handlePerf (timeAgoAt, nowAt, alarmConfig) {
    let {
      id: configId,
      project_id: projectId,
      error_name: errorName,
      url, // error类型的配置有可能是正则表达式
      time_range_s: timeRange,
      max_error_count: maxErrorCount,
      alarm_interval_s: alarmInterval,
      note,
      page_rule: pageRule // 性能报警区分url和pageType
    } = alarmConfig
    note = note || '无'
    let groupBy = 'url'
    switch (pageRule) {
      case 'url':
        break
      case 'page_type':
        groupBy = 'pageType'
        break
      default:
        break
    }
    // 获取上一次的报警时间
    const lastAlarmTime = await redis.asyncGetValue(getRedisKeyByPrefix(BASE_REDIS_LAST_PERF_ALARM_TIME, configId)) || timeAgoAt
    // 沉默时间内不报警
    if (nowAt < (lastAlarmTime + alarmInterval)) {
      this.log(`【性能】沉默：项目${projectId}监听的${errorName}在${alarmInterval}时间内报过警，自动跳过`)
      return
    }

    let overview = await MPerformanceES.asyncGetOverview(projectId, timeAgoAt, nowAt, groupBy, [url]).catch(err => {
      throw new Error('查询【性能】报警概览【asyncGetOverview】失败，失败原因：' + err.stack)
    })

    // 如果平均值大于设定值，则报警
    let average = _.get(overview, [errorName], 0)

    if (average >= maxErrorCount) {
      const project = await MProject.get(projectId)
      const projectName = _.get(project, ['display_name'], projectId)
      const projectRate = _.get(project, ['rate'], 0) / 10000 * 100
      const alarmUcidList = await MProjectMember.getAlarmUcidList(projectId)
      const perfName = MPerformance.INDICATOR_TYPE_MAP[errorName]
      const now = moment().unix()
      let alarmMsg = `项目【${projectName}】(抽样比例:${projectRate}%), 监控的【${groupBy}】为【${url}】的【${perfName}】性能， 最近【${timeRange}】秒内平均值是【${average}】毫秒, 达到阈值【${maxErrorCount}】毫秒,触发报警, 报警备注【${note}】。请在监控平台上查看错误详情 => ${HOST}/project/${projectId}/home`
      this.log(alarmMsg)
      await this.sendAlert(alarmUcidList, alarmMsg)
      // 更新报警时间
      await redis.asynSetValue(getRedisKeyByPrefix(BASE_REDIS_LAST_PERF_ALARM_TIME, configId), nowAt)
      const isSuccess = await MAlarmLog.insert(projectId, configId, now,
        errorName, alarmMsg)
      if (isSuccess === false) {
        Logger.error('添加报警日志失败')
      }
    }
  }

  /**
   * 发送警报
   *
   * @param {Array} ucidList
   * @param {string} message
   *
   * @todo 回头写到配置里去
   */
  async sendAlert (ucidList, message) {
    // 避免本地调试误报到业务方，加个判断
    isProduction ? void 0 : ucidList = [...alarmConf.WATCH_UCID_LIST_DEFAULT]
    Alert.sendMessage(ucidList, message)
  }

  /**
   * 执行业务回调
   *
   * @param {Array} data
   * @param {string} url
   * @param {Array} alarmUcidList
   */
  async executeCallback (url, data, alarmUcidList) {
    if (!url) return
    await axios.post(url, {
      data
    }, {
      timeout: 1000 * 5
    }).catch(async err => {
      await this.sendAlert(alarmUcidList, `报警id ==>【${data.lid}】，执行业务回调出错，回调地址 ==> 【${url}】，错误原因===> ${err.message || err.stack || err}`)
      this.log(`报警id ==>【${data.lid}】，执行业务回调出错，回调地址[${url}]，错误原因===> ${err.stack}`)
    })
  }

  /**
   * 企微机器人报警
   *
   * @param {Array} data
   * @param {string} url
   * @param {Array} usersList
   */
  async callWebhook (url, data, usersList, alarmUcidList) {
    if (!url) return
    usersList = usersList.map(user => user.nickname)
    let { pname, ename, url: link, count, errorRate, config } = data
    let { time_range_s: ranges, note } = config
    let users = usersList.length ? usersList.join('@') : '无'

    await axios.post(url, {
      msgtype: 'markdown',
      markdown: {
        content: `### **灯塔报警**
最近<font color="warning">${ranges}</font>秒内，共产生<font color="warning">${count}</font>例报错，请相关同事注意。
> <font color="comment">报错项目</font>：<font color="warning">${pname}</font>
> <font color="comment">错误类型</font>：<font color="warning">${ename}</font>
> <font color="comment">错误率</font>：<font color="warning">${errorRate}%</font>
> <font color="comment">报警备注</font>：<font color="warning">${note || '无'}</font>
> <font color="comment">报警详情</font>：[点击查看](${link})
> <font color="comment">相关人员</font>：@${users}`
      }
    }).catch(async err => {
      await this.sendAlert(alarmUcidList, `调用【webhook】出错，webhook地址[${url}]，错误原因===> ${err.message || err.stack || err}`)
      this.log(`调用【webhook】出错，webhook地址[${url}]，错误原因===> ${err.stack}`)
    })
  }
}

export default WatchAlarm
