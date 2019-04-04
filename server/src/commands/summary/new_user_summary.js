import Base from '~/src/commands/base'
import moment from 'moment'
import _ from 'lodash'
import MProject from '~/src/model/project/project'
import MNewUserSummary from '~/src/model/summary/new_user_summary'
import MUserFirstLoginAt from '~/src/model/parse/user_first_login_at'
import DATE_FORMAT from '~/src/constants/date_format'

class NewUserSummary extends Base {
  static get signature () {
    return `
     Summary:NewUser 

     {countAtTime:所统计时间, ${DATE_FORMAT.UNIT.HOUR} 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_HOUR}, ${DATE_FORMAT.UNIT.DAY} 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_DAY}, ${DATE_FORMAT.UNIT.MONTH} 为 ${DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH}}
     {countType:统计类型${DATE_FORMAT.UNIT.HOUR}/${DATE_FORMAT.UNIT.DAY}/${DATE_FORMAT.UNIT.MONTH}}
     `
  }

  static get description () {
    return '[按小时/按天/按月] 根据历史数据, 汇总分析记录指定时间范围内的新增用户数'
  }

  async execute (args, options) {
    let { countAtTime, countType } = args
    if (this.isArgumentsLegal(args, options) === false) {
      this.warn('参数不正确, 自动退出')
      return false
    }
    let countAtMoment = moment(countAtTime, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType])
    let startAt = countAtMoment.unix()
    let endAt = 0
    switch (countType) {
      case DATE_FORMAT.UNIT.HOUR:
        endAt = countAtMoment.clone().add(1, 'hours').unix() - 1
        break
      case DATE_FORMAT.UNIT.DAY:
        endAt = countAtMoment.clone().add(1, 'days').unix() - 1
        break
      case DATE_FORMAT.UNIT.MONTH:
        endAt = countAtMoment.clone().add(1, 'months').unix() - 1
        break
      default:
        endAt = startAt + 86400 - 1
    }
    let startAtMoment = moment.unix(startAt)
    let endAtMoment = moment.unix(endAt)

    let rawProjectList = await MProject.getList()
    this.log('项目列表获取完毕, =>', rawProjectList)
    for (let rawProject of rawProjectList) {
      let projectId = _.get(rawProject, 'id', '')
      let projectName = _.get(rawProject, 'project_name', '')
      if (projectId === 0 || projectId === '') {
        continue
      }
      this.log(`开始处理项目${projectId}(${projectName})的数据`)
      this.log(`[${projectId}(${projectName})] 时间范围:${startAtMoment.format(DATE_FORMAT.DIAPLAY_BY_MINUTE) + ':00'}~${endAtMoment.format(DATE_FORMAT.DIAPLAY_BY_MINUTE) + ':59'}`)

      let cityDistribution = {}
      let sumTotalCount = 0
      let recordList = await MUserFirstLoginAt.getList(projectId, startAt, endAt)
      for (let record of recordList) {
        let { country, province, city } = record
        sumTotalCount = sumTotalCount + 1
        let oldTotalCount = _.get(cityDistribution, [country, province, city], 0)
        let mergedTotalCount = oldTotalCount + 1
        _.set(cityDistribution, [country, province, city], mergedTotalCount)
      }

      MNewUserSummary.replaceInto(
        projectId,
        sumTotalCount,
        countAtMoment.format(DATE_FORMAT.DATABASE_BY_UNIT[countType]),
        countType,
        cityDistribution
      )
      this.log(`项目${projectId}(${projectName})处理完毕, sumTotalCount => ${sumTotalCount}`)
    }
  }

  /**
   * [可覆盖]检查请求参数, 默认检查传入的时间范围是否正确, 如果有自定义需求可以在子类中进行覆盖
   * @param {*} args
   * @param {*} options
   * @return {Boolean}
   */
  isArgumentsLegal (args, options) {
    let { countAtTime, countType } = args

    if (countType !== DATE_FORMAT.UNIT.MONTH && countType !== DATE_FORMAT.UNIT.DAY && countType !== DATE_FORMAT.UNIT.HOUR) {
      this.warn(`统计类别不为 ${DATE_FORMAT.UNIT.MONTH}/${DATE_FORMAT.UNIT.DAY}/${DATE_FORMAT.UNIT.HOUR} `, 'countType => ', countType)
      return false
    }
    let countAtMoment = moment(countAtTime, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType])
    if (moment.isMoment(countAtMoment) === false || countAtMoment.isValid() === false) {
      this.warn(`countAtTime解析失败`, ' => ', countAtTime)
      return false
    }
    return true
  }
}

export default NewUserSummary
