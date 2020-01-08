import _ from 'lodash'
import Base from '~/src/model/elastic_search/base'

const MAX_PROJECT_COUNT = 1000

class ProjectLogCount extends Base {

  /**
   * 获取日志排行数据
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} max
   */
  static async asyncGetLog(startAt, endAt, projectId, projectList) {
    let indexNameList = this.getIndexNameList(startAt, endAt)
    let max = _.get(projectList, 'length', MAX_PROJECT_COUNT)

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            filter: {
              bool: {
                must: [
                  {
                    match_all: {}
                    // match: {
                    //   type: "error"
                    // }
                  }
                ]
              }
            }
          }
        },
        aggs: {
          project: {
            terms: {
              field: "project_id",
              size: max
            },
            aggs: {
              logType: {
                terms: {
                  field: "type",
                  size: max
                },
              }
            }
          },
          logType: {
            terms: {
              field: "type"
            }
          }
        }
      },
    }
    
    const { data, error } = await this.client.search(queryCondition).then(data => ({
      data
    })).catch(error => ({
      error
    }))
    if (error) return 0

    let total = _.get(data, ['hits', 'total'], 0)
    let logType = _.get(data, ['aggregations', 'logType', 'buckets'], [])
    let projectRecords = _.get(data, ['aggregations', 'project', 'buckets'], [])

    let perfLog = _.find(logType, p => p.key == 'perf')
    let errorLog = _.find(logType, p => p.key == 'error')
    let productLog = _.find(logType, p => p.key == 'product')

    let recordList = []
    let totalCount = 0
    let errCount = 0
    let perfCount = 0
    let prodCount = 0
    let current = {}

    for (let project of projectRecords) { 
      totalCount = _.get(project, ['doc_count'], 0)
      errCount = _.get(_.find(project.logType.buckets, p => p.key === 'error'), ['doc_count'])
      prodCount = _.get(_.find(project.logType.buckets, p => p.key === 'product'), ['doc_count'])
      perfCount = _.get(_.find(project.logType.buckets, p => p.key === 'perf'), ['doc_count']) 
      let item = {
        id: project.key,
        name: _.get(_.find(projectList, p => p.id == project.key), 'display_name', ''),
        total: totalCount,
        error: errCount,
        product: prodCount,
        perf: perfCount,
        errorRatio: errCount / totalCount
      }
      if (project.key == projectId) { 
        current = item
      }
      recordList.push(item)
    }

    return {
      list: recordList,
      project: projectList.length,
      count: {
        total,
        product: _.get(productLog, ['doc_count'], 0),
        perf: _.get(perfLog, ['doc_count'], 0),
        error: _.get(errorLog, ['doc_count'], 0)
      },
      current
    }
  }
  /**
   * 获取性能数据
   * 
   * @param {*} startAt 
   * @param {*} endAt 
   * @param {*} projectId 
   * @param {*} projectList 
   */ 
  static async asyncGetPerLog(startAt, endAt, projectId, projectList) { 
    let indexNameList = this.getIndexNameList(startAt, endAt)
    let max = _.get(projectList, 'length', MAX_PROJECT_COUNT)

    let queryCondition = {
      index: indexNameList,
      body: {
        size: 0,
        query: {
          bool: {
            filter: {
              bool: {
                must: [
                  {
                    "match": {
                      "type": "perf"
                    }
                  }
                ]
              }
            }
          }
        },
        aggs: {
          "perf": {
            "terms": {
              "field": "project_id",
              "size": max
            },
            "aggs": {
              "tti": {
                "avg": {
                  "field": "detail.first_response_ms"
                }
              },
              "fpt": {
                "avg": {
                  "field": "detail.first_render_ms"
                }
              },
              "ftcp": {
                "avg": {
                  "field": "detail.first_tcp_ms"
                }
              }
            }
          }
        }
      }
    }
    
    const { data, error } = await this.client.search(queryCondition).then(data => ({ data })).catch(error => ({ error }))
    if (error) return []
    let records = _.get(data, ['aggregations', 'perf', 'buckets'], [])
    let result = []
    let current = {}

    for (let record of records) { 
      let item = {
        id: record.key,
        name: _.get(_.find(projectList, p => p.id == record.key), 'display_name', ''),
        count: _.get(record, 'doc_count'),
        tti: _.get(record, ['tti', 'value'], 0),
        fpt: _.get(record, ['fpt', 'value'], 0),
        ftcp: _.get(record, ['ftcp', 'value'], 0),
      }
      if (projectId === record.key) current = item
      result.push(item)
    }
    return {
      list: result,
      current
    }
  }
}

export default ProjectLogCount
