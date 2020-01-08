import Base from '~/src/commands/base'
import MPerformanceES from '~/src/model/elastic_search/summary/performance'
import redis from '~/src/library/redis'
import MProject from '~/src/model/project/project'
import moment from 'moment'
import MPerformance from '~/src/model/parse/performance'
import Logger from '~/src/library/logger'

const BASE_PAGE_TYPE_KEY = 'redis_performance_url_list_page_type_id_'
const BASE_URL_KEY = 'redis_performance_url_lis_url_id_'

class PerHourPerformanceURLSummary extends Base {
  static get signature () {
    return `
     Summary:PerformaceUrlList
     `
  }

  static get description () {
    return '[每小时]基于ES数据库统计每个项目的性能URL LIST'
  }

  static get BASE_KEY () {
    return {
      BASE_PAGE_TYPE_KEY,
      BASE_URL_KEY
    }
  }

  static getKey (type, id) {
    if (type === MPerformanceES.GROUP_BY_URL) {
      return BASE_URL_KEY + id
    }
    if (type === MPerformanceES.GROUP_BY_PAGE_TYPE) {
      return BASE_PAGE_TYPE_KEY + id
    }
  }

  static setValue (key, value) {
    return redis.asyncSetex(key, 86400, value.toString())
  }

  static async asyncGetUrlDictributionList (projectId, indicator, groupBy, maxLen, urlList, startAt = moment().subtract(10, 'day').unix(), endAt = moment().unix()) {
    return MPerformanceES.asyncGetUrlDictributionList(projectId, startAt, endAt, indicator, groupBy, maxLen, urlList)
      .catch(error => {
        throw new Error(`MPerformanceES.asyncGetUrlDictributionList查询asyncGetUrlDictributionList时出错:${error.stack}`)
      })
  }

  /**
   * 每6个小时跑一次, 获取项目列表
   * @param {*} args
   * @param {*} options
   */
  async execute (args, options) {
    // 每1个小时，统计性能URL并存到redis
    let startDate = new Date()
    Logger.info('指令 => Summary:PerformaceUrlList 开始执行！')
    let rawProjectList = await MProject.getList()
    let startAt = moment().subtract(1, 'day').startOf('day').unix()
    let endAt = moment().unix()
    for (let project of rawProjectList) {
      let {id} = project
      let pageTypeResult = await MPerformanceES.asyncGetUrlDictributionList(id, startAt, endAt, MPerformance.INDICATOR_TYPE_页面完全加载耗时, MPerformanceES.GROUP_BY_PAGE_TYPE)
        .catch(error => {
          throw new Error(`MPerformanceES.asyncGetUrlDictributionList 查询pageTypeResult时报错:${error.stack}`)
        })
      let urlResult = await MPerformanceES.asyncGetUrlDictributionList(id, startAt, endAt, MPerformance.INDICATOR_TYPE_页面完全加载耗时, MPerformanceES.GROUP_BY_URL)
        .catch(error => {
          throw new Error(`MPerformanceES.asyncGetUrlDictributionList 查询urlResult时报错:${error.stack}`)
        })
      let pageTypeKey = BASE_PAGE_TYPE_KEY + id
      let urlKey = BASE_URL_KEY + id
      await redis.asyncSetex(pageTypeKey, 86400, JSON.stringify(pageTypeResult))
      await redis.asyncSetex(urlKey, 86400, JSON.stringify(urlResult))
    }
    Logger.info('指令 => Summary:PerformaceUrlList 执行结束！用时 ' + (new Date() - startDate) / 1000 + 's')
  }

  /**
   * [可覆盖]检查请求参数, 默认检查传入的时间范围是否正确, 如果有自定义需求可以在子类中进行覆盖
   * @param {*} args
   * @param {*} options
   * @return {Boolean}
   */
  isArgumentsLegal (args, options) {
  }
}

export default PerHourPerformanceURLSummary
