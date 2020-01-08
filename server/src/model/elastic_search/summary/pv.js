import _ from 'lodash'
import Base from '~/src/model/elastic_search/base'

class Pv extends Base {
  /**
   * 获取PV总数
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} offset
   * @param {*} max
   * @param {*} errorNameList
   * @param {*} urlList
   */
  static async asyncGetTotalCount (
    projectId, startAt, endAt, errorNameList = [], urlList = [],
    detailList = []) {
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
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)
    const { data, error } = await this.client.search(queryCondition).
      then(data => ({ data })).
      catch(error => ({ error }))
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
  static async asyncGetList (
    projectId, startAt, endAt, offset = 0, max = 10, errorNameList = [],
    urlList = [], detailList = []) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    let queryCondition = {
      index: indexNameList,
      body: {
        size: max,
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
          'time': { 'order': 'desc' },
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
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)

    let response
    try {
      response = await this.client.search(queryCondition)
    } catch (error) {
      await this.errorHandling(error, queryCondition)
      response = await this.client.search(queryCondition)
    }
    let hitResultList = _.get(response, ['hits', 'hits'], [])
    let recordList = []
    for (let hitResult of hitResultList) {
      let record = _.get(hitResult, ['_source'], {})
      let rawExtra = _.get(record, ['extra'], '{}')
      // console.log(rawExtra)
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

export default Pv
