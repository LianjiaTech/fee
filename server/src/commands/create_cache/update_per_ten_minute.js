import Base from '~/src/commands/base'
import _ from 'lodash'
import MProject from '~/src/model/project/project'
import MErrorSummary from '~/src/model/summary/error_summary'
import moment from 'moment'
import DATE_FORMAT from '~/src/constants/date_format'

class CreateCacheUpdatePerTenMinute extends Base {
  static get signature () {
    return `
      CreateCache:UpdatePerOneMinute
     `
  }

  static get description () {
    return '[每10分钟执行一次] 主动调用方法, 更新Redis缓存, 每10分钟更新一次'
  }

  async execute (args, options) {
    await this.updateErrorNameDistributionCache()
  }

  async updateErrorNameDistributionCache () {
    this.log('更新错误分布数据缓存')
    let projectList = await MProject.getList()
    for (let project of projectList) {
      let projectId = _.get(project, ['id'], 0)
      let startAt = moment().subtract(7, DATE_FORMAT.UNIT.DAY).startOf(DATE_FORMAT.UNIT.DAY).unix()
      let endAt = moment().endOf(DATE_FORMAT.UNIT.DAY).unix()
      let result = await MErrorSummary.getErrorNameDistributionByTimeWithCache(projectId, startAt, endAt, true)
      this.log(`projectId => ${projectId} , startAt => ${startAt}, endAt => ${endAt}, result =>`, result)
    }
    this.log('错误分布缓存更新完毕')
  }
}

export default CreateCacheUpdatePerTenMinute
