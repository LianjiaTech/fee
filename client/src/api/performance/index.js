/** @format */

import axios from 'src/libs/api.request'
import { getProjectId } from 'src/libs/util'

class Performance {
  /**
   * 获取url列表
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} groupBy
   */
  static async asyncGetUrlDictributionList(startAt, endAt, groupBy, urlList = []) {
    return axios.request({
      url: `project/${getProjectId()}/api/performance/url/distribution_list`,
      method: 'get',
      params: {
        q: JSON.stringify({
          startAt,
          endAt,
          groupBy,
          urlList
        })
      }
    })
  }

  /**
   * 获取总体指标数据
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} urlList
   * @param {*} groupBy
   */
  static async asyncGetOverview(startAt, endAt, urlList, groupBy) {
    return axios.request({
      url: `project/${getProjectId()}/api/performance/url/overview`,
      method: 'get',
      params: {
        q: JSON.stringify({
          startAt,
          endAt,
          groupBy,
          urlList
        })
      }
    })
  }

  /**
   * 获取指标分布数据
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} urlList
   * @param {*} groupBy
   */
  static async asyncGetIndicatorDictribution(startAt, endAt, urlList, groupBy) {
    return axios.request({
      url: `project/${getProjectId()}/api/performance/url/indicator_distribution_list`,
      method: 'get',
      params: {
        q: JSON.stringify({
          startAt,
          endAt,
          urlList,
          groupBy
        })
      }
    })
  }

  /**
   * 获取指标分布数据
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} urlList
   * @param {*} groupBy
   */
  static async asyncGetPercentLineByEnv(startAt, endAt, urlList, groupBy, envBy) {
    return axios.request({
      url: `project/${getProjectId()}/api/performance/url/percent_line_by_env`,
      method: 'get',
      params: {
        q: JSON.stringify({
          startAt,
          endAt,
          urlList,
          groupBy,
          envBy
        })
      }
    })
  }

  /**
   * 获取折线图数据
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} urlList
   * @param {*} groupBy
   * @param {*} countBy
   */
  static async asyncGetLineChartDataList(startAt, endAt, urlList, groupBy, countBy) {
    return axios.request({
      url: `project/${getProjectId()}/api/performance/url/line_chart`,
      method: 'get',
      params: {
        q: JSON.stringify({
          startAt,
          endAt,
          urlList,
          groupBy,
          countBy
        })
      }
    })
  }

  /** **************@todo(yaozeyuan) 以下为为了适配旧接口添加的接口, 待性能页迁移完毕后需要从前后端移除 *****************/
  /**
   * 获取折线图数据
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} urlList
   * @param {*} groupBy
   * @param {*} countBy
   */
  static async fetchUrlList(startAt, endAt, size) {
    return axios.request({
      url: `project/${getProjectId()}/api/performance/url_list`,
      method: 'get',
      params: {
        st: startAt,
        et: endAt,
        size
      }
    })
  }
}

export default Performance
