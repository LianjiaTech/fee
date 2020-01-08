import client from '~/src/library/elastic_search'
import moment from 'moment'
import Logger from '~/src/library/logger'
import DATE_FORMAT from '~/src/constants/date_format'

class Base {
  static get INDEX_PREFIX () {
    return 'dt'
  }

  static get INDEX_TYPE () {
    return 'raw'
  }

  static get INDEX_DATE_FORMAT () {
    return 'YYYY-MM-DD'
  }

  static get INDEX_SUFFIX () {
    return 'v1'
  }


  static get Logger () {
    return Logger
  }

  /**
   * 根据传入时间戳, 生成index名称
   * @param {Number} logAt
   */
  static getIndexName(logAt) {
    let formatDate = moment.unix(logAt).format(this.INDEX_DATE_FORMAT)
    return `${this.INDEX_PREFIX}-${this.INDEX_TYPE}-${formatDate}-${this.INDEX_SUFFIX}`
  }

  /**
   * 生成时间范围内的index名称列表
   * @param {Number} startAt
   * @param {Number} finishAt
   */
  static getIndexNameList(startAt, finishAt) {
    // 如果结束时间大于当前时间
    if (finishAt > moment().unix()) { 
      finishAt = moment().unix()
    }
    let indexNameList = []
      let startAtMoment = moment.unix(startAt).startOf(DATE_FORMAT.UNIT.DAY)
      for (let logAtMoment = startAtMoment.clone(); logAtMoment.unix() <
      finishAt; logAtMoment = logAtMoment.clone().add(1, DATE_FORMAT.UNIT.DAY)) {
        let indexName = this.getIndexName(logAtMoment.unix())
        indexNameList.push(indexName)
      }
    return indexNameList
  }

  static termsNumber (value) {
    if (isNaN(parseInt(value))) {
      return [value]
    } else {
      return [value, Number(value)]
    }

  }

  static async errorHandling (error, queryCondition) {
    const {message} = error
    if (message.indexOf(
        'This limit can be set by changing the [index.max_result_window] index level setting') >
      -1) {
      const {index} = queryCondition
      await this.client.indices.putSettings({
        index,
        body: {'index': {'max_result_window': 100000000}},
      })
    }
  }

  /**
   * 生成基础查询请求
   * @param {*} startAt
   * @param {*} endAt
   */
  static getBaseQuery (startAt, endAt) {
    let indexNameList = this.getIndexNameList(startAt, endAt)

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {},
        aggregations: {},
      },
    }
    return queryCondition
  }

  /**
   * 获取ES客户端
   */
  static get client () {
    return client
  }
}

export default Base
