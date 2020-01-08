import _ from 'lodash'
import Base from '~/src/model/elastic_search/base'
import Mapping from '~/src/model/elastic_search/parse/template'
import client from '~/src/library/elastic_search'

class RawRecord extends Base {
  /**
   * 批量导入原始日志
   * @param {*} rawRecordList
   */
  static async asyncBatchImport (rawRecordList) {
    let recordList = []
    for (let rawRecord of rawRecordList) {
      let timestamp = _.get(rawRecord, ['time'], 0)
      let md5 = _.get(rawRecord, ['md5'], '')
      let id = `${timestamp}_${md5}`
      delete rawRecord.md5
      if (timestamp === 0) {
        // 数据不合法
        continue
      }
      let indexName = this.getIndexName(timestamp)

      let template = {
        index: {
          _index: indexName,
          _type: '_doc',
          _id: id // id规则 : timestamp + md5
        }
      }
      let record = rawRecord
      recordList.push(template)
      recordList.push(record)
    }
    await this.pushTemplate()
    let response = await this.rawClient.bulk({
      body: recordList
    }).catch((e) => {
      this.Logger.error('数据导入失败, 错误详情=>', e)
      return {
        errors: true,
        errMsg: `主机Error: ${e.message || e.stack}`
      }
    })

    let isAllSuccess = _.get(response, ['errors'], false) === false
    let errorRecordList = []
    let itemList = _.get(response, ['items'], [])
    let errMsg = _.get(response, ['errMsg'], '')

    for (let item of itemList) {
      if (_.has(item, ['index', 'error'])) {
        errorRecordList.push(item)
      }
    }
    // cover超时的情况，实际数据没有导入成功，但errorRecordList却为空数组
    if (!isAllSuccess && !errorRecordList.length) {
      errorRecordList = rawRecordList
    }
    return {
      errMsg,
      isAllSuccess,
      totalCount: rawRecordList.length,
      failedCount: errorRecordList.length,
      errorRecordList: errorRecordList
    }
  }

  static async pushTemplate () {
    let exist = await this.rawClient.indices.existsTemplate({
      name: 'dt-raw'
    })
    if (exist) return
    await this.rawClient.indices.putTemplate({
      ...Mapping,
      // 参见文档【https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-templates.html】
      // If true, this request cannot replace or update existing index templates. Defaults to false.
      create: true
    }).catch(e => {
      this.Logger.error(`raw_record pushTemplate 出错，错误原因==> ${e.message || e.stack || e}`)
    })
  }
  /**
   * 获取ES客户端
   */
  static get rawClient () {
    return client
  }
}

export default RawRecord
