import moment from 'moment'
import _ from 'lodash'
import Base from '~/src/model/elastic_search/base'
import DATE_FORMAT from '~/src/constants/date_format'
import DatabaseUtil from '~/src/library/utils/modules/database'

const MAX_ITEM_COUNT = 1000

class Error extends Base {
  static async asyncGetErrorNameDistribution (projectId, startAt, endAt) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    
    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            must: [
              {
                range: {
                  'time': {
                    'gt': startAt,
                    'lt': endAt,
                  },
                },
              },
              {
                match: {
                  'project_id': projectId,
                },
              },
            ],
          },
        },
        'aggregations': {
          'result_summary': {
            'terms': {
              'field': 'detail.error_no.keyword',
              // 限制总数, 不填默认显示前10个
              'size': MAX_ITEM_COUNT,
              'order': {
                // 按照doc_count从高到低排序
                '_count': 'desc',
              },
            },
            // aggregations: {
            //   error_name_count: {
            //     // avg 平均数
            //     // sum 求和
            //     // max 最大
            //     // min 最小
            //     // stats => 各种状态计数 count/min/max/avg/sum
            //     //
            //     // top_hits => 前n(考虑到性能问题, 不建议使用)
            //     //
            //     // cardinality 去重数
            //     // value_count 总数
            //     // 统计总数(而不是distinct)
            //     'value_count': {
            //       'field': 'detail.error_no.keyword'
            //     }
            //   }
            // }
          },
        },
      },
    }
    let response = await this.client.search(queryCondition)

    let bucketList = _.get(response,
      ['aggregations', 'result_summary', 'buckets'], [])
    let resultList = []
    // 只需要error_name & error_count
    for (let record of bucketList) {
      let errorName = _.get(record, ['key'], '')
      let errorCount = _.get(record, ['doc_count'], 0)
      resultList.push(
        {
          error_name: errorName,
          error_count: errorCount,
        },
      )
    }

    return resultList
  }

  /**
   * 获取错误总数
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} offset
   * @param {*} max
   * @param {*} errorNameList
   * @param {*} urlList
   */
  static async asyncGetTotalCount (projectId, startAt, endAt, errorNameList = [], urlList = [],
                                   detailList = [], errorDetailText, errorUuid, errorUcid) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [],
              },
            },
          },
        },
      },
    }
    let condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt,
          },
        },
      },
      {
        match: {
          'project_id': projectId,
        },
      },
      {
        match: {
          'type': 'error',
        },
      },
    ]
    if (errorUuid) {
      condition.push({
        term: {
          'common.uuid': errorUuid,
        },
      })
    }
    if (errorUcid) {
      condition.push({
        term: {
          'common.ucid.keyword': errorUcid,
        },
      })
    }
    if (errorNameList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.error_no.keyword': errorNameList,
          },
        },
      )
    }
    if (urlList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.url': urlList,
          },
        },
      )
    } else if (detailList.length > 0) {
      condition.push(
        {
          terms: {
            'extra.keyword': detailList,
          },
        },
      )
    }
    if (errorDetailText) {
      condition.push(getQueryErrorDetailText(errorDetailText))
    }
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)
    const {data, error} = await this.client.search(queryCondition).then(data => ({data})).catch(error => ({error}))
    if (error) {
      return 0
    }
    let total = _.get(data, ['hits', 'total'], 0)
    return total
  }

  /**
   * 获取分页数据
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} offset
   * @param {*} max
   * @param {*} errorNameList
   * @param {*} urlList
   */
  static async asyncGetList (projectId, startAt, endAt, offset = 0, max = 10, errorNameList = [],
                             urlList = [], detailList = [], errorDetailText, errorUuid, errorUcid) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    let queryCondition = {
      index: indexNameList,
      body: {
        size: max ? max : 300,
        from: offset, // 分页
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [],
              },
            },
          },
        },
        'sort': {
          // 按时间倒序排列
          'time': {'order': 'desc'},
        },
      },
    }
    let condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt,
          },
        },
      },
      {
        match: {
          'project_id': projectId,
        },
      },
      {
        match: {
          'type': 'error',
        },
      },
    ]
    if (errorUuid) {
      condition.push({
        term: {
          'common.uuid': errorUuid,
        },
      })
    }
    if (errorUcid) {
      condition.push({
        term: {
          'common.ucid.keyword': errorUcid,
        },
      })
    }
    if (urlList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.url': urlList,
          },
        },
      )
    }
    if (detailList.length > 0) {
      condition.push(
        {
          terms: {
            'extra.keyword': detailList,
          },
        },
      )
    } else if (errorNameList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.error_no.keyword': errorNameList,
          },
        },
      )
    }
    if (errorDetailText) {
      condition.push(getQueryErrorDetailText(errorDetailText))
    }
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)

    let response
    try {
      response = await this.client.search(queryCondition)
    } catch (error) {
      await this.errorHandling(error, queryCondition)
      response = await this.client.search(queryCondition).catch(error => null)
    }
    if (response === null) {
      return []
    }
    let hitResultList = _.get(response, ['hits', 'hits'], [])
    let recordList = []
    for (let hitResult of hitResultList) {
      let _id = _.get(hitResult, '_id', '')
      let _index = _.get(hitResult, '_index', '')
      let record = _.get(hitResult, ['_source'], {})
      let rawExtra = _.get(record, ['extra'], '{}')
      // console.log(rawExtra)
      let extra = {}
      try {
        extra = JSON.parse(rawExtra)
      } catch (e) { }
      record.id = _id
      record.index = _index
      record.extra = extra
      recordList.push(record)
    }
    return recordList
  }

  /**
   * 获取指定errorDetail中的错误分布数
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} errorDetailList
   */
  static async asyncGetErrorDetailDistributionList (projectId, startAt, endAt, errorNameList = [], errorDetailList = [],
                                                    errorDetailText, errorUuid, errorUcid, size) {
    const indexNameList = this.getIndexNameList(startAt, endAt)
    const queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [],
              },
            },
          },
        },
        'aggregations': {
          'detail_distribution_list': {
            'terms': {
              'field': 'extra.keyword',
              // 限制总数, 不填默认显示前10个
              'size': size || MAX_ITEM_COUNT,
              'order': {
                // 按照doc_count从高到低排序
                '_count': 'desc',
              },
            },
          },
        },
      },
    }
    const condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt,
          },
        },
      },
      {
        match: {
          'project_id': projectId,
        },
      },
      {
        match: {
          'type': 'error',
        },
      },
      {
        regexp: {
          'extra': 'desc',
        },
      },
      {
        regexp: {
          'extra': 'stack',
        },
      },
    ]
    if (errorUuid) {
      condition.push({
        term: {
          'common.uuid': errorUuid,
        },
      })
    }
    if (errorUcid) {
      condition.push({
        term: {
          'common.ucid.keyword': errorUcid,
        },
      })
    }
    if (errorNameList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.error_no.keyword': errorNameList,
          },
        },
      )
    }
    if (errorDetailList.length > 0) {
      condition.push(
        {
          terms: {
            'extra.keyword': errorDetailList,
          },
        },
      )
    }
    if (errorDetailText) {
      condition.push(getQueryErrorDetailText(errorDetailText))
    }
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)
    let response = await this.client.search(queryCondition)

    let rawResultList = _.get(response,
      ['aggregations', 'detail_distribution_list', 'buckets'], [])
    let resultList = []
    for (let rawResult of rawResultList) {
      const {key, doc_count} = rawResult
      resultList.push({key, doc_count})
    }
    return resultList
  }

  /**
   * 根据errorNameList获取url分布
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} errorNameList
   */
  // 标记 错误url统计
  static async asyncGetUrlDistributionListByErrorNameList (projectId, startAt, endAt, errorNameList, errorDetailText, errorUuid,
                                                           errorUcid, size) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [],
              },
            },
          },
        },
        'aggregations': {
          'url_distribution_list': {
            'terms': {
              'field': 'detail.url',
              // 限制总数, 不填默认显示前10个
              'size': size || MAX_ITEM_COUNT,
              'order': {
                // 按照doc_count从高到低排序
                '_count': 'desc',
              },
            },
          },
        },
      },
    }
    let condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt,
          },
        },
      },
      {
        match: {
          'project_id': projectId,
        },
      },
      {
        match: {
          'type': 'error',
        },
      },
    ]
    if (errorUuid) {
      condition.push({
        term: {
          'common.uuid': errorUuid,
        },
      })
    }
    if (errorUcid) {
      condition.push({
        term: {
          'common.ucid.keyword': errorUcid,
        },
      })
    }
    if (errorNameList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.error_no.keyword': errorNameList,
          },
        },
      )
    }
    if (errorDetailText) {
      condition.push(getQueryErrorDetailText(errorDetailText))
    }

    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)

    let response = await this.client.search(queryCondition)
    let rawResultList = _.get(response,
      ['aggregations', 'url_distribution_list', 'buckets'], [])
    let resultList = []
    for (let rawResult of rawResultList) {
      let record = {}
      record['url'] = rawResult['key']
      record['error_count'] = rawResult['doc_count']
      resultList.push(record)
    }
    return resultList
  }

  /**
   * 获取指定error_name中的错误分布数, 或指定url下, 指定errorNameList下的错误分布数
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} countType
   * @param {*} errorNameList
   * @param {*} urlList
   */
  // 标记  错误name统计
  static async getErrorNameDistributionList (projectId, startAt, endAt, errorNameList = [], urlList = [],
                                             detailList = [], errorDetailText, errorUuid, errorUcid) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [],
              },
            },
          },
        },
        'aggregations': {
          'result_summary': {
            'terms': {
              'field': 'detail.error_no.keyword',
              // 默认全部显示
              'size': MAX_ITEM_COUNT,
              'order': {
                // 按照doc_count从高到低排序
                '_count': 'desc',
              },
            },
          },
        },
      },
    }
    let condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt,
          },
        },
      },
      {
        match: {
          'project_id': projectId,
        },
      },
      {
        match: {
          'type': 'error',
        },
      },
      {
        terms: {
          'detail.error_no.keyword': errorNameList,
        },
      },
    ]
    if (errorUuid) {
      condition.push({
        term: {
          'common.uuid': errorUuid,
        },
      })
    }
    if (errorUcid) {
      condition.push({
        term: {
          'common.ucid.keyword': errorUcid,
        },
      })
    }
    if (urlList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.url': urlList,
          },
        },
      )
    } else if (detailList.length > 0) {
      condition.push(
        {
          terms: {
            'extra.keyword': detailList,
          },
        },
      )
    }
    if (errorDetailText) {
      condition.push(getQueryErrorDetailText(errorDetailText))
    }
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)

    let response = await this.client.search(queryCondition)

    let rawResultList = _.get(response,
      ['aggregations', 'result_summary', 'buckets'], [])
    let resultList = []
    for (let rawResult of rawResultList) {
      let record = {}
      record['error_name'] = rawResult['key']
      record['error_count'] = rawResult['doc_count']
      resultList.push(record)
    }
    return resultList
  }

  static async asyncGetProvinceDistributionList (projectId, startAt, endAt, errorNameList, urlList = [], detailList = [],
                                                 errorDetailText, errorUuid, errorUcid) {
    let indexNameList = this.getIndexNameList(startAt, endAt)

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [],
              },
            },
          },
        },
        'aggregations': {
          'result_summary': {
            'terms': {
              'field': 'province',
              // 默认全部显示
              'size': MAX_ITEM_COUNT,
              'order': {
                // 按照doc_count从高到低排序
                '_count': 'desc',
              },
            },
          },
        },
      },
    }
    let condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt,
          },
        },
      },
      {
        match: {
          'project_id': projectId,
        },
      },
      {
        match: {
          'type': 'error',
        },
      },
      {
        match: {
          'country': '中国',
        },
      },
    ]
    if (errorNameList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.error_no.keyword': errorNameList,
          },
        },
      )
    }
    if (errorUuid) {
      condition.push({
        term: {
          'common.uuid': errorUuid,
        },
      })
    }
    if (errorUcid) {
      condition.push({
        term: {
          'common.ucid.keyword': errorUcid,
        },
      })
    }
    if (urlList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.url': urlList,
          },
        },
      )
    } else if (detailList.length > 0) {
      condition.push(
        {
          terms: {
            'extra.keyword': detailList,
          },
        },
      )
    }
    if (errorDetailText) {
      condition.push(getQueryErrorDetailText(errorDetailText))
    }
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)

    let response = await this.client.search(queryCondition)
    let rawResultList = _.get(response,
      ['aggregations', 'result_summary', 'buckets'], [])
    let resultList = []
    for (let rawResult of rawResultList) {
      let record = {}
      record['province'] = rawResult['key']
      record['error_count'] = rawResult['doc_count']
      resultList.push(record)
    }

    return resultList
  }

  /**
   * 获取错误堆叠图分布
   * @param {*} projectId
   * @param {*} countType
   * @param {*} errorType
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} extendCondition
   */
  static async asyncGetStackAreaDistribution (projectId, startAt, endAt, countType, errorNameList = [], urlList = [],
                                              detailList = [], errorDetailText, errorUuid, errorUcid) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [],
              },
            },
          },
        },
        'aggregations': {
          'result_summary': {
            'terms': {
              'field': 'detail.error_no.keyword',
              // 默认全部显示(不填默认展示10条)
              'size': MAX_ITEM_COUNT,
              'order': {
                // 按照doc_count从高到低排序
                '_count': 'desc',
              },
            },
            aggregations: {
              group_by: {
                'terms': {
                  // 默认全部显示(不填默认展示10条)
                  size: MAX_ITEM_COUNT,
                  // 手工写grovvy
                  'script': `return new SimpleDateFormat('${DATE_FORMAT.ELASTIC_SEARCH_BY_UNIT[countType]}').format(new Date(doc['time'].value * 1000))`,
                  'order': {'_term': 'desc'},
                },
              },
            },
          },

        },

      },
    }
    let condition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt,
          },
        },
      },
      {
        match: {
          'project_id': projectId,
        },
      },
      {
        match: {
          'type': 'error',
        },
      },
    ]
    if (errorUuid) {
      condition.push({
        term: {
          'common.uuid': errorUuid,
        },
      })
    }
    if (errorUcid) {
      condition.push({
        term: {
          'common.ucid.keyword': errorUcid,
        },
      })
    }
    if (urlList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.url': urlList,
          },
        },
      )
    }
    if (detailList.length > 0) {
      condition.push(
        {
          terms: {
            'extra.keyword': detailList,
          },
        },
      )
    } else if (errorNameList.length > 0) {
      condition.push(
        {
          terms: {
            'detail.error_no.keyword': errorNameList,
          },
        },
      )
    }
    if (errorDetailText) {
      condition.push(getQueryErrorDetailText(errorDetailText))
    }
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)

    let response = await this.client.search(queryCondition)
    let rawResultList = _.get(response,
      ['aggregations', 'result_summary', 'buckets'], [])
    let summaryDict = {}

    for (let rawResult of rawResultList) {
      let errorName = _.get(rawResult, ['key'], '')
      let rawGroupByList = _.get(rawResult, ['group_by', 'buckets'], [])
      let formatGroupByList = []
      // 不存在的数据要补全为0
      let defaultPaddingItem = {
        index: 0,
        error_count: 0,
        error_name: errorName,
      }
      for (let rawGroupBy of rawGroupByList) {
        let dateTimeString = _.get(rawGroupBy, ['key'], '')
        let errorCount = _.get(rawGroupBy, ['doc_count'], 0)
        // 将格式化后的字符串再转为时间戳
        // ES日期格式比COMMAND日期格式后方会多几个0, 不影响解析
        let index = moment(dateTimeString,
          DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType]).unix()
        formatGroupByList.push({
          index,
          error_count: errorCount,
          error_name: errorName,
        })
      }
      let paddingGroupByList = DatabaseUtil.paddingTimeList(formatGroupByList,
        startAt, endAt, countType, defaultPaddingItem)
      // 存进字典中
      summaryDict[errorName] = paddingGroupByList
    }

    // 将结果整合进一个数组里
    let resultList = []
    for (let errorName of Object.keys(summaryDict)) {
      let paddingGroupByList = _.get(summaryDict, [errorName], [])
      for (let item of paddingGroupByList) {
        item['count_at_time'] = moment.unix(item['index']).format(DATE_FORMAT.DISPLAY_BY_UNIT[countType])
        resultList.push(item)
      }
    }
    return resultList
  }

  /**
   * 根据错误ID获取错误详情数据
   * @param {*} projectId
   * @param {Array} errorIds 错误IDs
   * @param {*} _index 索引名称
   * @param {*} offset
   * @param {*} max
   */
  static async asyncGetErrorDetailList (projectId, errorIds, _index, offset = 0, size = 10) {
    let queryCondition = {
      index: _index,
      body: {
        size: size,
        from: offset, // 分页
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [],
              },
            },
          },
        },
        'sort': {
          // 按时间倒序排列
          'time': {'order': 'desc'},
        },
      },
    }
    let condition = [
      {
        match: {
          'project_id': projectId,
        },
      },
      {
        match: {
          'type': 'error',
        },
      },
      {
        terms: {
          '_id': errorIds
        }
      }
    ]
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], condition)

    let response
    try {
      response = await this.client.search(queryCondition)
    } catch (error) {
      await this.errorHandling(error, queryCondition)
      response = await this.client.search(queryCondition).catch(error => null)

    }
    if (response === null) {
      return []
    }
    let hitResultList = _.get(response, ['hits', 'hits'], [])
    let recordList = []
    for (let hitResult of hitResultList) {
      let record = _.get(hitResult, ['_source'], {})
      let rawExtra = _.get(record, ['extra'], '{}')
      let extra = {}
      try {
        extra = JSON.parse(rawExtra)
      } catch (e) { }
      record.extra = extra
      recordList.push(record)
    }
    return recordList
  }
}

// 把字符串中非字母数字的部分替换成一个空格框，方便match匹配查找
function exchangeMatch (matchString) {
  let queryString = matchString.replace(/[^a-zA-Z\d\u4e00-\u9fa5]/g, ' ').replace(/\s+/g, ' ').split(' ')
  if (queryString.length > 5) {
    // 如果 匹配得关键词数量大于5 那么剔除长度最短的几个词到只剩下5个
    const numStringQuery = [...queryString].sort(
      (strA, strB) => strB.length - strA.length)
    let endLength = numStringQuery.length - 1
    if (endLength > 3) {
      endLength = 3
    }
    const maxStrLength = numStringQuery[endLength].length
    return queryString.filter(str => str.length >= maxStrLength).join(' ')
  }
  return queryString.join(' ')
}

function getQueryErrorDetailText (errorDetailText) {
  return {
    match: {
      extra: {
        query: exchangeMatch(errorDetailText),
        // operator: 'and',
        // analyzer: 'english',
      },
    },
  }
}

export default Error
