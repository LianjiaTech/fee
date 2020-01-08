import _ from 'lodash'
import moment from 'moment'
import Client from '~/src/library/elastic_search'

import Base from '~/src/commands/base'
import Template from '~/src/commands/scroll/template'
import { Rules } from '~/src/constants/rules.js'

class Scroll extends Base {
  static get signature () {
    return `
    Scroll:ScrollData
    {type: 可选error/perf/product三种类型}
    {startAt: 处理从startAt时间开始的数据}
    `
  }

  static get description () {
    return '用于迁移索引或重建索引'
  }

  static get prefix () {
    return `dt-raw`
  }

  static get version () {
    return `v1`
  }

  static get version2 () {
    return `v2`
  }

  static get targetClient () {
    return Client
  }

  static get sourceClient () {
    return Client
  }

  /**
   * 迁移数据
   * @param {*} args
   * @param {*} options
   */
  async execute (args) {
    const { type: TYPE, startAt: STARTAT } = args

    if (!['error', 'perf', 'product'].includes(TYPE)) {
      this.warn('参数不正确, 自动退出')
      return false
    }

    let startAt = moment(STARTAT)
    // 按小时迁移，防止进程挂掉需要从头跑数据
    let endAt = startAt.clone().add(1, 'hour')
    // 导入新的映射
    Scroll.targetClient.indices.putTemplate({
      ...Template,
      create: false
    })

    this.scroll(startAt, endAt, TYPE)
  }

  /**
   * 滚动处理数据
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} TYPE
   */
  async scroll (startAt, endAt, TYPE) {
    let {
      _scroll_id,
      total,
      res: responseQueue
    } = await this.getData(startAt, endAt, TYPE).catch(err => {
      this.warn('数据查询失败, 错误详情=>', err.stack)
      return {}
    })

    this.log(`开始处理[${startAt.format('YYYY-MM-DD_HH:mm')}]类型为[${TYPE}]的数据，数据总数：${total}条`)
    if (total == 0) {
      this.log(`=======================================END=============================================`)
    }

    let len = 0
    let count = 0

    while (len = responseQueue.length) {
      await this.insertData(responseQueue, startAt, TYPE).catch(err => {
        this.warn('数据导入失败, 错误详情====>', err.stack)
        return { err }
      })
      count += len
      // 处理一天的所有数据就处理下一天的数据
      if (count === total) {
        this.log(`处理完毕[${startAt.format('YYYY-MM-DD_HH:mm')}]类型为[${TYPE}]的数据，数据总数：${total}条`)
        // 处理完一天的，继续处理下一天的数据
        startAt = endAt
        endAt = startAt.clone().add(1, 'hour')
        return this.scroll(startAt, endAt, TYPE)
      }
      // this.log(`已成功处理${count}条数据`)
      responseQueue.length = 0
      let records = await Scroll.sourceClient.scroll({
        scrollId: _scroll_id,
        scroll: '30s'
      }).catch(err => {
        this.log(`获取数据失败，失败原因====>`, err)
      })
      _scroll_id = _.get(records, ['_scroll_id'], '')
      responseQueue = _.get(records, ['hits', 'hits'], [])
    }
  }

  /**
   * 滚动获取数据
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} type
   */
  async getData (startAt, endAt, type) {
    let sourceIndex = this.getIndexName(startAt)

    let res = await Scroll.sourceClient.search({
      index: sourceIndex,
      size: 5000,
      scroll: '30s', // keep the search results "scrollable" for 30 seconds
      body: {
        query: {
          bool: {
            filter: {
              // 以【天】为单位，根据时间段来跑数据，防止进程挂掉，需要重新跑所有数据
              range: {
                time: {
                  gte: startAt.unix(),
                  lte: endAt.unix()
                }
              }
            },
            must: [
              {
                match: {
                  type: type
                }
              }
            ]
          }
        }
      }
    })
    let { total, hits } = _.get(res, ['hits'], {})
    let _scroll_id = _.get(res, ['_scroll_id'], '')

    return {
      _scroll_id,
      total,
      res: hits
    }
  }

  async insertData (records = [], startAt, type = 'error') {
    let list = []
    let rawRecord = {}
    let timestamp = 0
    let md5 = ''
    let id = ''
    let detail = {}

    let targetIndex = this.getIndexName(startAt, Scroll.version2)
    for (let record of records) {
      rawRecord = _.get(record, ['_source'], {})
      timestamp = _.get(rawRecord, ['time'], 0)
      md5 = _.get(rawRecord, ['md5'], '')
      id = `${timestamp}_${md5}`
      detail = _.get(rawRecord, ['detail'])

      if (type === 'perf') {
        rawRecord.detail = this.computePerfByRules(detail)
      }
      // 去除这两个不需要的字段
      delete rawRecord.md5
      delete rawRecord.common.record

      if (timestamp === 0) continue
      let template = {
        index: {
          _index: targetIndex,
          _type: '_doc',
          _id: id // id规则 : timestamp + md5
        }
      }
      list.push(template)
      list.push(rawRecord)
    }

    return Scroll.targetClient.bulk({
      body: list
    })
  }

  /**
   * 将性能关键指标数据前置计算逻辑，方便后续聚合操作
   * @param {Object} detail
   * @author wagnqiang025
   * */
  computePerfByRules (detail) {
    let keys = Object.keys(Rules)
    for (let key of keys) {
      let end = _.get(Rules, [key, 'end'], 0)
      let start = _.get(Rules, [key, 'start'], 0)

      let value = _.get(detail, [end], 0) - _.get(detail, [start], 0)
      if (value < 0) continue
      detail[key] = this.parseIntWithDefault(value, 0)
    }
    return detail
  }

  /**
   * 根据传入时间戳, 生成index名称
   * @param {Number} startAt
   */
  getIndexName (startAt, version) {
    let formatDate = startAt.format('YYYY-MM-DD')
    return `${Scroll.prefix}-${formatDate}-${version || Scroll.version}`
  }

  /**
   * 安全的parseInt
   * @param {*} string
   * @param {*} defaultValue
   */
  parseIntWithDefault (string, defaultValue = 0) {
    let result = parseInt(string)
    if (_.isNaN(result)) {
      return defaultValue
    }
    return result
  }
}

export default Scroll
