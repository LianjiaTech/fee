import moment from 'moment'
import Base from '~/src/commands/base'
import redis from '~/src/library/redis'
import Alert from '~/src/library/utils/modules/alert'
import MMonitor from '~/src/model/parse/monitor'
import WatchIdList from '~/src/configs/alarm'
import DATE_FORMAT from '~/src/constants/date_format'

const PROJECT_ID_SAAS = 1
const MAX_ALLOW_ERROR_COUNT = 20
const REDIS_KEY = 'plat_fe_fee_sass_watch_dog'
/**
 * 只能监控五分钟前的数据(因为日志只会从5分钟前开始落表)
 */
class WatchDog4SaaS extends Base {
  static get signature () {
    return `
     WatchDog:Saas 
     `
  }

  static get description () {
    return '[按分钟] 检查最近5分钟内错误数是否超出阈值, 自动报警'
  }

  async execute (args, options) {
    let nowAt = moment().unix()
    let startAtYmdHis = moment.unix(nowAt - 60 * 5).format(DATE_FORMAT.DISPLAY_BY_SECOND)
    let finishAtYmdHis = moment.unix(nowAt - 60 * 0).format(DATE_FORMAT.DISPLAY_BY_SECOND)
    let hasAlertIn5Minute = await redis.asyncGet(REDIS_KEY)
    if (hasAlertIn5Minute) {
      this.log('5分钟内报过警, 自动跳过')
    } else {
      // 查找最近5分钟内的报错数
      let errorCount = await MMonitor.getErrorCountInRangeBySameMonth(PROJECT_ID_SAAS, nowAt - 60 * 10, nowAt - 60 * 5)
      this.log(`${startAtYmdHis}~${finishAtYmdHis}5分钟内错误数 => ${errorCount}`)
      if (errorCount >= MAX_ALLOW_ERROR_COUNT) {
        // 5分钟内报错数大于20, 则报警
        this.log(`${startAtYmdHis}~${finishAtYmdHis}错误数超出阈值=> ${MAX_ALLOW_ERROR_COUNT}, 触发报警`)
        await this.sendAlert(WatchIdList.WATCH_UCID_LIST_SAAS, `sass系统${startAtYmdHis}~${finishAtYmdHis}五分钟内错误数${errorCount}, 超过阈值${MAX_ALLOW_ERROR_COUNT},请注意.`)
        await redis.asyncSetex(REDIS_KEY, 5 * 60, 1)
      }
    }
    this.log(`检查完毕, 自动退出`)
  }

  /**
   * 发送警报
   *
   * @param {Array} ucidList
   * @param {string} message
   */
  async sendAlert (ucidList, message) {
    Alert.sendMessage(ucidList, message)
  }
}

export default WatchDog4SaaS
