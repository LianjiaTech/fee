import _ from 'lodash'
import Base from '~/src/model/elastic_search/base'

class Extra extends Base {
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
    {
      projectId,
      startAt,
      endAt,
      offset = 0,
      size = 10,
      type,
      ua,
      url,
      uuid,
      ucid,
      name,
      fuzzy,
      errorName,
    }) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    const searchType = fuzzy ? 'fuzzy' : 'term'
    let queryCondition = {
      index: indexNameList,
      body: {
        size,
        from: offset, // 分页
        query: {
          bool: {
            must: [],
          },
        },
        sort: {
          // 按时间倒序排列
          time: { 'order': 'desc' },
        },
      },
    }
    let condition = [
      {
        range: {
          time: {
            gt: startAt,
            lt: endAt,
          },
        },
      },
      {
        match: {
          project_id: projectId,
        },
      },
    ]
    if (type !== undefined) {
      condition.push({
        match: {
          type,
        },
      })
    }
    if (url !== undefined) {
      condition.push(
        {
          [searchType]: {
            'detail.url': url,
          },
        },
      )
    }
    if (errorName !== undefined) {
      condition.push(
        {
          [searchType]: {
            'detail.error_no.keyword': errorName,
          },
        },
      )
    }
    if (ua !== undefined) {
      condition.push(
        {
          [searchType]: {
            'ua.ua': ua,
          },
        },
      )
    }
    if (name !== undefined) {
      condition.push(
        {
          [searchType]: {
            'detail.name.keyword': name,
          },
        },
      )
    }
    if (uuid !== undefined) {
      condition.push(
        {
          [searchType]: {
            'common.uuid': uuid,
          },
        },
      )
    }
    if (ucid !== undefined) {
      condition.push(
        {
          [searchType]: {
            'common.ucid.keyword': ucid,
          },
        },
      )
    }

    _.set(queryCondition, ['body', 'query', 'bool', 'must'],
      condition)


    const { data, error } = await this.client.search(queryCondition).
      catch(async error => {
        await this.errorHandling(error, queryCondition)
        return this.client.search(queryCondition)
      }).
      then(data => ({ data })).
      catch(error => ({ error }))
    if (error) {
      return { error }
    }
    let hitResultList = _.get(data, ['hits', 'hits'], [])
    let total = _.get(data, ['hits', 'total'], 0)
    let list = []
    for (let hitResult of hitResultList) {
      let record = _.get(hitResult, ['_source'], {})
      let rawExtra = _.get(record, ['extra'], '{}')
      let extra = {}
      try {
        extra = JSON.parse(rawExtra)
      } catch (e) {

      }
      record.extra = extra
      list.push(record)
    }
    return { data: { list, total } }
  }

}

export default Extra
