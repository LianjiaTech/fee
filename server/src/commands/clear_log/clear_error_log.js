import Base from '~/src/commands/base'
import MAlarmError from '~/src/model/project/alarm/alarm_error'

class DailyClearLog extends Base {
  static get signature () {
    return `
    Clear:ClearErrorAlarmLog
    {daysAgo:按天清除log，基于当前时间的[daysAgo]前的天数，默认值【7】}
    `
  }

  static get description () {
    return '[按天]清除[X]天以前（基于当前时间）存储在mysql\`t_o_alarm_es_id\`表中的log'
  }

  /**
   * 每天跑一次, 获取项目列表
   * @param {*} args
   * @param {*} options
   */
  async execute(args, options) {
    if (this.isArgumentsLegal(args, options) === false) {
      this.warn('参数不正确, 自动退出')
      return false
    }
    const { daysAgo } = args
    
    this.log(`开始清除${daysAgo}天前的数据...`)
    const isSuccess = await MAlarmError.clear(daysAgo)
    if (isSuccess !== false) { 
      this.log(`数据清理成功。本次共清理了${isSuccess}条数据！`)
    }
  }

  /**
   * 校验参数格式是否正确
   * @param {*} args 
   */ 
  isArgumentsLegal(args) { 
    const { daysAgo } = args
    if (!isNaN(parseInt(daysAgo)) && daysAgo >= 0) { 
      return true
    }
    this.warn(`参数不正确 daysAgo => ${daysAgo}`)
    return false
  }
}

export default DailyClearLog
