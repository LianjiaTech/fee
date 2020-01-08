import md5 from 'md5'
import _ from 'lodash'
import moment from 'moment'
import DATE_FORMAT from '~/src/constants/date_format'
import DatabaseUtil from '~/src/library/utils/modules/database'
import Base from '~/src/model/elastic_search/base'

const MAX_ITEM_COUNT = 1000

class DotRecord extends Base {
  static get INDEX_PREFIX () {
    return 'dt'
  }

  static get INDEX_TYPE () {
    return 'dot'
  }

  static get INDEX_DATE_FORMAT () {
    return 'YYYY-MM'
  }

  // 这里只做了几个简单的映射关系，感觉很low。。。
  static get METHODS_MAP() {
    return {
      // 精准匹配
      equal: 'term',
      notEqual: {
        'must_not': {
          'term': ''
        }
      },
      contain: 'match',
      notContain: {
        'must_not': {
          'match': ''
        }
      },
      less: 'lt',
      greater: 'gt'
    }
  }
  /**
   * 批量导入原始日志
   * @param {Array} rawRecordList
   */
  static async asyncBatchImport (rawRecordList) {
    let recordList = []
    for (let rawRecord of rawRecordList) {
      let timestamp = _.get(rawRecord, ['time'], 0)
      let project_id = _.get(rawRecord, 'project_id', 0)
      let md5 = _.get(rawRecord, ['md5'], '')
      let id = `${timestamp}_${md5}`
      if (timestamp === 0) {
        // 数据不合法
        continue
      }

      let indexName = this.getIndexName(project_id, timestamp)
      let template = {
        index: {
          _index: indexName,
          _type: 'doc',
          _id: id // id规则 : timestamp + md5
        }
      }
      let record = rawRecord
      recordList.push(template)
      recordList.push(record)
    }

    let response = await this.client.bulk({
      body: recordList
    }).catch((e) => {
      this.Logger.error('数据导入失败, 错误详情=>', e)
      return { 'errors': true }
    })

    let isAllSuccess = _.get(response, ['errors'], false) === false
    let errorRecordList = []
    let itemList = _.get(response, ['items'], [])

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
      isAllSuccess,
      totalCount: rawRecordList.length,
      failedCount: errorRecordList.length,
      errorRecordList: errorRecordList
    }
  }

  /**
   * 根据筛选条件，筛选出打点数据
   *
   * @param {String} by_fields 用于聚合的字段
   * @param {Long} startTime 开始时间戳
   * @param {Long} endTime 结束时间戳
   * @param {Number} projectId 项目id
   * @param {String} eventName 事件名
   * @param {String} aggregator 聚合方式
   * @param {Array} conditions 筛选条件集合
   * @param {String} relation 筛选条件之间的关系
   * @param {Object} propsConf 当前事件的属性配置
   *
   * @returns {Array}
   */
  static async asyncGetDotDataByFilter(byFields, startAt, endAt, projectId, eventName, field, aggregator = 'Count', conditions = [], relation = 'and', propsConf = {}, countType = 'day') {

    const indexName = this.getIndexNameList(startAt, endAt, projectId)
    /**
     * @todo 预置属性相关功能开发
     * */
    // const aggsSchema = this.getAggsSchema(propsConf)

    let queryCondition = {
      index: indexName,
      body: {
        size: 10,
        query: {
          bool: {
            'must': [
              {
                'range': {
                  'time': {
                    'gt': startAt,
                    'lt': endAt,
                  }
                }
              }, {
                'match': {
                  'name': `${eventName}`
                }
              }
            ],
            'filter': {
              'bool': {
              },
            },
          },
        },
        aggs: {
        }
      }
    }
    // 处理筛选条件
    let condition = this.getCondition(relation, conditions, eventName)
    // 处理聚合字段
    let aggs = this.getAggsField(propsConf, byFields, field, aggregator, countType, eventName)
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool'], condition)
    _.set(queryCondition, ['body', 'aggs'], aggs)

    let response = null
    try {
      response = await this.client.search(queryCondition)
    } catch (error) {
      await this.errorHandling(error, queryCondition)
      response = await this.client.search(queryCondition).catch(error => null)
    }

    if (response === null) {
      return []
    }

    let hits = _.get(response, ['hits', 'hits'], [])
    let rawResultList = byFields === 'total' ? _.get(response, ['aggregations', 'group_by', 'buckets'], []) : _.get(response, ['aggregations', 'propsField', 'buckets'], [])
    let hitResultList = hits.map(item => ({
      record: _.get(item, ['_source'], {})
    }))

    let summaryDict = {}
    // 将结果整合进一个数组里
    let aggsList = []

    if (byFields === 'total') {
      let formatGroupByList = []
      // 不存在的数据要补全为0
      let defaultPaddingItem = {
        index: 0,
        count: 0,
        name: ''
      }
      for (let rawGroupBy of rawResultList) {
        let dateTimeString = _.get(rawGroupBy, ['key'], '')
        let name = _.get(rawGroupBy, ['key'], '')
        // 区分总数 & 去重数
        let count = aggregator === 'Count' ? _.get(rawGroupBy, ['doc_count'], 0) : _.get(rawGroupBy, ['x_number', 'value'], 0)
        // 将格式化后的字符串再转为时间戳
        // ES日期格式比COMMAND日期格式后方会多几个0, 不影响解析
        let index = moment(dateTimeString, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType]).unix()
        formatGroupByList.push({
          index,
          count,
          name
        })
      }
      
      aggsList = DatabaseUtil.paddingTimeList(formatGroupByList,
        startAt, endAt, countType, defaultPaddingItem)
    } else { 
      for (let rawResult of rawResultList) {
        let name = _.get(rawResult, ['key_as_string'], _.get(rawResult, ['key'], ''))
        let rawGroupByList = _.get(rawResult, ['group_by', 'buckets'], [])
        let formatGroupByList = []
        // 不存在的数据要补全为0
        let defaultPaddingItem = {
          index: 0,
          count: 0,
          name
        }
        for (let rawGroupBy of rawGroupByList) {
          let dateTimeString = _.get(rawGroupBy, ['key'], '')
          // 区分总数 & 去重数
          let count = aggregator === 'Count' ? _.get(rawGroupBy, ['doc_count'], 0) : _.get(rawGroupBy, ['x_number', 'value'], 0)
          // 将格式化后的字符串再转为时间戳
          // ES日期格式比COMMAND日期格式后方会多几个0, 不影响解析
          let index = moment(dateTimeString, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType]).unix()
          formatGroupByList.push({
            index,
            count,
            name
          })
        }
  
        let paddingGroupByList = DatabaseUtil.paddingTimeList(formatGroupByList,
          startAt, endAt, countType, defaultPaddingItem)
        // 存进字典中
        summaryDict[name] = paddingGroupByList
      }
      for (let name of Object.keys(summaryDict)) {
        let paddingGroupByList = _.get(summaryDict, [name], [])
        for (let item of paddingGroupByList) {
          item['count_at_time'] = moment.unix(item['index']).format(DATE_FORMAT.DISPLAY_BY_UNIT[countType])
          aggsList.push(item)
        }
      }
    }

    return {
      hitResultList,
      aggsList
    }
  }

  /**
   * 删除某一索引下的，同一type下的所有数据
   * @param {*} projectId
   * @param {*} eventName
   */
  static async delDotConfigByIndexName(projectId, eventName) {
    const indexName = this.getIndexName(projectId)
    let response = null
    try {
      response = await this.client.deleteByQuery({
        index: indexName,
        type: eventName,
        body: {
          query: {
            match_all: {}
          }
        }
      })
    } catch (e) {
      response = await this.client.deleteByQuery({
        index: indexName,
        type: eventName,
        body: {
          query: {
            match_all: {}
          }
        }
      }).catch(error => null)
    }
    return response ? true : false
  }

  static getField(type, key, eventName) {
    let field = ''
    switch (type) {
      case 'string':
        field = `props.${eventName}.${key}.keyword`
        break
      default:
        field = `props.${eventName}.${key}`
    }
    return field
  }

  static getAggsField(props, byFields, field, aggregator, countType, eventName) {

    let byFieldType = _.get(props, [byFields], '')
    let fieldType = _.get(props, [field], '')
    let _byFields = this.getField(byFieldType, byFields, eventName)
    let _fields = this.getField(fieldType, field, eventName)

    let aggs = {}

    // 处理数值类型的平均值
    switch (aggregator) {
      case 'Count':
        break
      case 'Unique':
        aggs = {
          'aggs': {
            'x_number': {
              'cardinality': {
                'field': _fields
              }
            }
          }
        }
        break
      case 'AVG':
        aggs = {
          'aggs': {
            'x_number': {
              'avg': {
                'field': _fields
              }
            }
          }
        }
        break
      case 'MAX':
        aggs = {
          'aggs': {
            'x_number': {
              'max': {
                'field': _fields
              }
            }
          }
        }
        break
      case 'MIN':
        aggs = {
          'aggs': {
            'x_number': {
              'min': {
                'field': _fields
              }
            }
          }
        }
        break
    }

    return byFields === 'total' ? {
      'group_by': {
        'terms': {
          // 默认全部显示(不填默认展示10条)
          'size': MAX_ITEM_COUNT,
          // 手工写grovvy
          'script': `return new SimpleDateFormat('${DATE_FORMAT.ELASTIC_SEARCH_BY_UNIT[countType]}').format(new Date(doc['time'].value * 1000))`,
          'order': {'_term': 'desc'},
        },
        ...aggs
      }
    } : {
      'propsField': {
        'terms': {
          'field': _byFields
        },
        'aggs': {
          'group_by': {
            'terms': {
              // 默认全部显示(不填默认展示10条)
              'size': MAX_ITEM_COUNT,
              // 手工写grovvy
              'script': `return new SimpleDateFormat('${DATE_FORMAT.ELASTIC_SEARCH_BY_UNIT[countType]}').format(new Date(doc['time'].value * 1000))`,
              'order': {'_term': 'desc'},
            },
            ...aggs
          }
        }
      }
    }
  }

  static getCondition(relation = 'and', conditions = [], eventName) {
    let cdts = conditions.map(cdt => {
      switch (cdt.function) {
        case 'equal':
          return {
            'term': {
              [cdt.type === 'string' ? `props.${eventName}.${cdt.field}.keyword` : `props.${eventName}.${cdt.field}`]: cdt.params
            }
          }
        case 'notEqual':
          return {
            'bool': {
              'must_not': {
                'term': {
                  [`props.${eventName}.${cdt.field}`]: cdt.params
                }
              }
            }
          }
        case 'contain':
          return {
            'match': {
              [`props.${eventName}.${cdt.field}`]: cdt.params
            }
          }
        case 'notContain':
          return {
            'bool': {
              'must_not': {
                'match': {
                  [`props.${eventName}.${cdt.field}`]: cdt.params
                }
              }
            }
          }
        case 'less':
          return {
            'range': {
              [`props.${eventName}.${cdt.field}`]: {
                'lt': cdt.params
              }
            }
          }
        case 'greater':
          return {
            'range': {
              [`props.${eventName}.${cdt.field}`]: {
                'gt': cdt.params
              }
            }
          }
      }
    })
    return relation === 'and' ? { must: cdts } : { should: cdts }
  }

  // 这些都是可以用来聚合的字段
  static getAggsSchema(propsConf = {}) {
    return {
      '$ip': 'string',
      '$country': 'string',
      '$province': 'string',
      '$city': 'string',
      '$common': {
        '$ucid': 'number'
      },
      '$ua': {
        '$os': {
          '$name': 'string',
          '$version': 'string'
        },
        '$browser': {
          '$name': 'string',
          '$major': 'string'
        }
      },
      ...propsConf
    }
  }

  static getIndexName(project_id, logAt) {
    let formatDate = moment.unix(logAt).format(this.INDEX_DATE_FORMAT)
    return `${this.INDEX_PREFIX}-${this.INDEX_TYPE}-${project_id}_${formatDate}`
  }

  /**
   * 生成时间范围内的index名称列表
   * @param {Number} startAt
   * @param {Number} finishAt
   */
  static getIndexNameList (startAt, finishAt, project_id) {
    let startAtMoment = moment.unix(startAt).startOf(DATE_FORMAT.UNIT.MONTH)
    let indexNameList = []
    for (let logAtMoment = startAtMoment.clone(); logAtMoment.unix() <
    finishAt; logAtMoment = logAtMoment.clone().add(1, DATE_FORMAT.UNIT.MONTH)) {
      let indexName = this.getIndexName(project_id, logAtMoment.unix())
      indexNameList.push(indexName)
    }
    return indexNameList
  }
}

export default DotRecord
