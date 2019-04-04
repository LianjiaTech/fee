import Base from '~/src/commands/base'
import moment from 'moment'
import MHttpError from '~/src/model/summary/http_error'
import DATE_FORMAT from '~/src/constants/date_format'

const DATE_FORMAT_ARGUMENTS = DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT

class HttpErrorSummary extends Base {
  static get signature () {
    return `
     Summary:HttpError
     {sumaryAtTime:按月/按天统计错误情况${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}/${DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH}格式}
     {countType:日志统计格式, ${DATE_FORMAT.UNIT.DAY}/${DATE_FORMAT.UNIT.MONTH}}
     `
  }

  static get description () {
    return '[按天/按月] 基于数据表做统计, 统计http error分布情况'
  }

  /**
   * 每天跑一次, 获取项目列表, 遍历t_o_system_collection_1表
   * @param {*} args
   * @param {*} options
   */
  async execute (args, options) {
    // 每个月跑一次
    let { sumaryAtTime, countType } = args
    if (this.isArgumentsLegal(args, options) === false) {
      this.warn('参数不正确, 自动退出')
      return false
    }
    let countAtMoment = moment(sumaryAtTime, DATE_FORMAT_ARGUMENTS[countType])
    let startAt = countAtMoment.unix()
    let endAt = 0
    switch (countType) {
      case DATE_FORMAT.UNIT.DAY:
        endAt = countAtMoment.clone().add(1, 'days').unix() - 1
        break
      case DATE_FORMAT.UNIT.MONTH:
        endAt = countAtMoment.clone().add(1, 'months').unix() - 1
        break
      default:
        endAt = startAt + 86400 - 1
    }
    await MHttpError.summaryHttpError(startAt, countType, startAt, endAt)
    this.log(`处理完毕`)
  }

  /**
   * [可覆盖]检查请求参数, 默认检查传入的时间范围是否正确, 如果有自定义需求可以在子类中进行覆盖
   * @param {*} args
   * @param {*} options
   * @return {Boolean}
   */
  isArgumentsLegal (args, options) {
    let { sumaryAtTime, countType } = args
    let sumaryAtTimeMoment = moment(sumaryAtTime, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType])
    if (moment.isMoment(sumaryAtTimeMoment) === false || sumaryAtTimeMoment.isValid() === false) {
      this.warn('sumaryAtTime参数不正确 =>', sumaryAtTime)
      return false
    }
    if (countType !== DATE_FORMAT.UNIT.MONTH && countType !== DATE_FORMAT.UNIT.DAY) {
      this.warn('countType参数不正确 =>', countType)
      return false
    }
    return true
  }
}

export default HttpErrorSummary
