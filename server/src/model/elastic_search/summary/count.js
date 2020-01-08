import _ from 'lodash'
import Base from '~/src/model/elastic_search/base'

const MAX_PROJECT_COUNT = 10000

class Count extends Base {

  /**
   * 获取PV总数
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} offset
   * @param {*} max
   * @param {*} errorNameList
   * @param {*} urlList
   */
  static async asyncGetTotalCount (
    startAt, endAt) {
    let indexNameList = this.getIndexNameList(startAt, endAt)

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': []
              }
            }
          }
        },
        aggs: {
          project_name: {
            terms: {
              field: "project_name",
              size: MAX_PROJECT_COUNT
            }
          }
        }
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
      }
    ]
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'],
      condition)
    const { data, error } = await this.client.search(queryCondition).
      then(data => ({ data })).
      catch(error => ({ error }))
    if (error) {
      return 0
    }

    let total = _.get(data, ['hits', 'total'], 0)
    let aggs = _.get(data, ['aggregations', 'project_name', 'buckets'], [])

    return {
      total,
      aggs
    }
  }
}

export default Count
