import moment from 'moment'
import _ from 'lodash'
import Base from '~/src/model/elastic_search/base'
import DATE_FORMAT from '~/src/constants/date_format'
import DatabaseUtil from '~/src/library/utils/modules/database'

const MAX_ITEM_COUNT = 1000

/**
 * 用户行为
 */
class Behavior extends Base {
  /**
   * 获取时间范围内菜单点击分布
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   */
  static async asyncGetMenuClickDistribution (projectId, startAt, endAt) {
    let indexNameList = this.getIndexNameList(startAt, endAt)

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [ ]
              }
            }
          }
        },
        'aggregations': {

        }
      }
    }
    let filterCondition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt
          }
        }
      },
      {
        match: {
          'project_id': projectId
        }
      },
      {
        match: {
          'type': 'product'
        }
      },
      {
        match: {
          'code': 10002
        }
      }
    ]

    let aggregationCondition = {
      'result_summary': {
        'terms': {
          'field': 'detail.code.keyword',
          // 限制总数, 不填默认显示前10个
          'size': MAX_ITEM_COUNT
        },
        aggregations: {
          name: {
            'terms': {
              'size': MAX_ITEM_COUNT,
              'field': 'detail.name.keyword'
            },
            // 先使用嵌套查询, 后续再优化代码
            aggregations: {
              url: {
                'terms': {
                  'size': MAX_ITEM_COUNT,
                  'field': 'detail.url'
                }
              }
            }
          }
        }
      }
    }

    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], filterCondition)
    _.set(queryCondition, ['body', 'aggregations'], aggregationCondition)

    let response = await this.client.search(queryCondition)
    let distribution = {}
    let codeBucketList = _.get(response, ['aggregations', 'result_summary', 'buckets'], [])
    for (let codeBucket of codeBucketList) {
      let menuCode = _.get(codeBucket, ['key'], '')
      let menuCodeAppearCount = _.get(codeBucket, ['doc_count'], 0)

      let nameBucketList = _.get(codeBucket, ['name', 'buckets'], [])
      let nameDistribution = {}
      let maxAppearName = ''
      let maxAppearNameCount = 0
      for (let nameBucket of nameBucketList) {
        let menuName = _.get(nameBucket, ['key'], '')
        let menuNameAppearCount = _.get(nameBucket, ['doc_count'], 0)
        let urlBucketList = _.get(nameBucket, ['url', 'buckets'], [])
        let urlDistribution = {}
        let maxAppearUrl = ''
        let maxAppearUrlCount = 0
        for (let urlBucket of urlBucketList) {
          let menuUrl = _.get(urlBucket, ['key'], '')
          let totalCount = _.get(urlBucket, ['doc_count'], 0)
          if (totalCount >= maxAppearUrlCount) {
            maxAppearUrlCount = totalCount
            maxAppearUrl = menuUrl
          }
          urlDistribution[menuUrl] = totalCount
        }

        if (menuNameAppearCount >= maxAppearNameCount) {
          maxAppearNameCount = menuNameAppearCount
          maxAppearName = menuName
        }
        nameDistribution[menuName] = {
          urlDistribution,
          count: menuNameAppearCount,
          maxAppearUrl,
          maxAppearUrlCount
        }
      }
      distribution[menuCode] = {
        nameDistribution,
        count: menuCodeAppearCount,
        maxAppearName,
        maxAppearNameCount
      }
    }
    return distribution
  }

  /**
   * 获取时间范围内菜单点击分布
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   */
  static async asyncGetOnlineDistribution (projectId, startAt, endAt, countType = DATE_FORMAT.UNIT.HOUR) {
    let indexNameList = this.getIndexNameList(startAt, endAt)

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            'filter': {
              'bool': {
                'must': [ ]
              }
            }
          }
        },
        'aggregations': {

        }
      }
    }
    let filterCondition = [
      {
        range: {
          'time': {
            'gt': startAt,
            'lt': endAt
          }
        }
      },
      {
        match: {
          'project_id': projectId
        }
      },
      {
        match: {
          'type': 'product'
        }
      },
      {
        match: {
          'code': 10001
        }
      }
    ]

    let aggregationCondition = {
      'result_summary': {
        'terms': {
          // 默认全部显示(不填默认展示10条)
          size: MAX_ITEM_COUNT,
          // 手工写grovvy
          'script': `return new SimpleDateFormat('${DATE_FORMAT.ELASTIC_SEARCH_BY_UNIT[countType]}').format(new Date(doc['time'].value * 1000))`
        },
        aggregations: {
          'duration_ms_sum': {
            'sum': {
              'field': 'detail.duration_ms'
            }
          },
          'uv_count': {
            'cardinality': {
              'field': 'common.uuid'
            }
          }
        }
      }
    }

    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], filterCondition)
    _.set(queryCondition, ['body', 'aggregations'], aggregationCondition)

    let response = await this.client.search(queryCondition)
    let rawResultList = []
    let onlineSumBucketList = _.get(response, ['aggregations', 'result_summary', 'buckets'], [])
    for (let onlineSumBucket of onlineSumBucketList) {
      let countAtTime = _.get(onlineSumBucket, ['key'], '')
      let pvCount = _.get(onlineSumBucket, ['doc_count'], 0)
      let uvCount = _.get(onlineSumBucket, ['uv_count', 'value'], 0)
      let durationSum = _.get(onlineSumBucket, ['duration_ms_sum', 'value'], 0)
      let index = moment(countAtTime, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType]).unix()
      rawResultList.push({
        pv_count: pvCount,
        uv_count: uvCount,
        average_ms: DatabaseUtil.computePercent(durationSum, uvCount, false),
        duration_sum: durationSum,
        index
      })
    }
    let resultList = DatabaseUtil.paddingTimeList(rawResultList, startAt, endAt, countType, {
      pv_count: 0,
      uv_count: 0,
      average_ms: 0,
      duration_sum: 0
    })

    return resultList
  }
}

export default Behavior
