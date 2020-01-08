import _ from 'lodash'
import Base from '~/src/model/elastic_search/base'

/**
 * 客户端分布
 */
class ClientDistribution extends Base {
  static get TYPE_BROWSER () {
    return 'browser'
  }
  static get TYPE_OS () {
    return 'os'
  }

  static get TYPE_DEVICE () {
    return 'device'
  }

  static get TYPE_RUNTIME_VERSION () {
    return 'runtime_version'
  }

  /**
   * 获取时间范围内客户端分布
   * 返回值示例 =>
   * [{"name":"Chrome WebView","total_count":35801,"detail_list":[{"name":"68","total_count":10290},{"name":"62","total_count":6409},{"name":"55","total_count":4297},{"name":"56","total_count":2950},{"name":"46","total_count":1591},{"name":"69","total_count":2537},{"name":"66","total_count":1289},{"name":"51","total_count":957},{"name":"64","total_count":890},{"name":"71","total_count":712},{"name":"43","total_count":709},{"name":"57","total_count":543},{"name":"59","total_count":337},{"name":"44","total_count":237},{"name":"49","total_count":218},{"name":"61","total_count":171},{"name":"70","total_count":242},{"name":"52","total_count":193},{"name":"65","total_count":173},{"name":"58","total_count":162},{"name":"42","total_count":155},{"name":"67","total_count":130},{"name":"50","total_count":115},{"name":"53","total_count":102},{"name":"48","total_count":107},{"name":"63","total_count":102},{"name":"60","total_count":56},{"name":"45","total_count":56},{"name":"47","total_count":74},{"name":"54","total_count":8},{"name":"72","total_count":2}]},{"name":"WeChat","total_count":33315,"detail_list":[{"name":"7","total_count":26254},{"name":"6","total_count":6822},{"name":"2","total_count":12}]},{"name":"baidu","total_count":15358,"detail_list":[{"name":"","total_count":14881},{"name":"7","total_count":217},{"name":"6","total_count":162},{"name":"4","total_count":37},{"name":"5","total_count":2}]},{"name":"WebKit","total_count":17276,"detail_list":[{"name":"605","total_count":12911},{"name":"604","total_count":1662},{"name":"602","total_count":1038},{"name":"603","total_count":949},{"name":"601","total_count":555},{"name":"600","total_count":44},{"name":"537","total_count":85},{"name":"606","total_count":23}]},{"name":"Android Browser","total_count":12730,"detail_list":[{"name":"4","total_count":12430},{"name":"6","total_count":57},{"name":"5","total_count":36},{"name":"1","total_count":6},{"name":"2","total_count":2},{"name":"7","total_count":1}]},{"name":"Mobile Safari","total_count":6768,"detail_list":[{"name":"12","total_count":3635},{"name":"11","total_count":1651},{"name":"10","total_count":700},{"name":"7","total_count":36},{"name":"9","total_count":665},{"name":"6","total_count":5},{"name":"8","total_count":31},{"name":"5","total_count":17}]},{"name":"MIUI Browser","total_count":7715,"detail_list":[{"name":"10","total_count":6266},{"name":"9","total_count":833},{"name":"2","total_count":406},{"name":"8","total_count":167},{"name":"1","total_count":37},{"name":"100","total_count":2}]},{"name":"QQBrowser","total_count":9173,"detail_list":[{"name":"8","total_count":5501},{"name":"9","total_count":2242},{"name":"7","total_count":679},{"name":"6","total_count":599},{"name":"5","total_count":154},{"name":"10","total_count":13},{"name":"4","total_count":4}]},{"name":"UCBrowser","total_count":4704,"detail_list":[{"name":"12","total_count":3792},{"name":"11","total_count":620},{"name":"3","total_count":67},{"name":"10","total_count":229},{"name":"9","total_count":9},{"name":"2","total_count":3},{"name":"6","total_count":4},{"name":"4","total_count":1},{"name":"8","total_count":1}]},{"name":"Chrome","total_count":2492,"detail_list":[{"name":"40","total_count":589},{"name":"63","total_count":442},{"name":"71","total_count":292},{"name":"62","total_count":112},{"name":"49","total_count":206},{"name":"37","total_count":152},{"name":"47","total_count":217},{"name":"70","total_count":79},{"name":"45","total_count":56},{"name":"11","total_count":96},{"name":"68","total_count":26},{"name":"17","total_count":36},{"name":"57","total_count":26},{"name":"53","total_count":21},{"name":"67","total_count":14},{"name":"38","total_count":13},{"name":"59","total_count":23},{"name":"69","total_count":16},{"name":"55","total_count":13},{"name":"66","total_count":7},{"name":"42","total_count":3},{"name":"65","total_count":12},{"name":"39","total_count":2},{"name":"60","total_count":3},{"name":"64","total_count":6},{"name":"46","total_count":5},{"name":"61","total_count":4},{"name":"44","total_count":4},{"name":"56","total_count":3},{"name":"34","total_count":2},{"name":"43","total_count":2},{"name":"50","total_count":1},{"name":"51","total_count":2},{"name":"54","total_count":2},{"name":"72","total_count":2},{"name":"73","total_count":2},{"name":"18","total_count":1},{"name":"30","total_count":1},{"name":"31","total_count":1},{"name":"52","total_count":1},{"name":"58","total_count":1}]},{"name":"Samsung Browser","total_count":1116,"detail_list":[{"name":"8","total_count":583},{"name":"7","total_count":162},{"name":"4","total_count":202},{"name":"3","total_count":128},{"name":"5","total_count":31},{"name":"6","total_count":15}]},{"name":"QQ","total_count":696,"detail_list":[{"name":"6","total_count":587},{"name":"7","total_count":107},{"name":"5","total_count":2}]},{"name":"Quark","total_count":185,"detail_list":[{"name":"3","total_count":128},{"name":"2","total_count":57},{"name":"1","total_count":1}]},{"name":"Baidu","total_count":120,"detail_list":[{"name":"","total_count":99}]},{"name":"Edge","total_count":16,"detail_list":[{"name":"15","total_count":2},{"name":"17","total_count":6},{"name":"42","total_count":5},{"name":"14","total_count":1},{"name":"16","total_count":1},{"name":"18","total_count":1}]},{"name":"Firefox","total_count":42,"detail_list":[{"name":"64","total_count":24},{"name":"14","total_count":7},{"name":"63","total_count":2},{"name":"52","total_count":2},{"name":"57","total_count":1},{"name":"45","total_count":1},{"name":"54","total_count":1},{"name":"55","total_count":1},{"name":"56","total_count":1},{"name":"6","total_count":1},{"name":"62","total_count":1}]},{"name":"Safari","total_count":46,"detail_list":[{"name":"12","total_count":18},{"name":"11","total_count":1},{"name":"9","total_count":1},{"name":"10","total_count":4},{"name":"5","total_count":2},{"name":"7","total_count":1}]},{"name":"Opera","total_count":23,"detail_list":[{"name":"12","total_count":14},{"name":"37","total_count":2},{"name":"11","total_count":3},{"name":"57","total_count":2},{"name":"56","total_count":2},{"name":"10","total_count":1},{"name":"49","total_count":1}]},{"name":"IE","total_count":33,"detail_list":[{"name":"11","total_count":25},{"name":"8","total_count":4},{"name":"6","total_count":3},{"name":"7","total_count":1}]},{"name":"MetaSr","total_count":17,"detail_list":[]},{"name":"Yandex","total_count":2,"detail_list":[{"name":"18","total_count":1},{"name":"16","total_count":1}]},{"name":"2345Explorer","total_count":5,"detail_list":[{"name":"9","total_count":4},{"name":"8","total_count":1}]},{"name":"GSA","total_count":11,"detail_list":[{"name":"65","total_count":6},{"name":"23","total_count":1},{"name":"22","total_count":1},{"name":"61","total_count":1},{"name":"62","total_count":1},{"name":"63","total_count":1}]},{"name":"Maxthon","total_count":8,"detail_list":[{"name":"5","total_count":3},{"name":"4","total_count":3},{"name":"3240","total_count":2}]},{"name":"IEMobile","total_count":6,"detail_list":[{"name":"11","total_count":6}]},{"name":"Silk","total_count":5,"detail_list":[{"name":"71","total_count":2},{"name":"3","total_count":1},{"name":"50","total_count":1},{"name":"70","total_count":1}]},{"name":"BIDUBrowser","total_count":2,"detail_list":[{"name":"7","total_count":1},{"name":"8","total_count":1}]},{"name":"LBBROWSER","total_count":2,"detail_list":[]},{"name":"Mozilla","total_count":2,"detail_list":[{"name":"5","total_count":2}]},{"name":"Facebook","total_count":1,"detail_list":[{"name":"202","total_count":1}]},{"name":"Line","total_count":1,"detail_list":[{"name":"7","total_count":1}]},{"name":"Vivaldi","total_count":1,"detail_list":[{"name":"1","total_count":1}]}]
   * @param {*} projectId
   * @param {*} startAt
   * @param {*} endAt
   * @param {*} type
   * @param {*} max
   */
  static async asyncGetClientDistribution (projectId, startAt, endAt, type = ClientDistribution.TYPE_OS, max = 100) {
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
      }
    ]
    let aggregationCondition = {}
    switch (type) {
      case ClientDistribution.TYPE_BROWSER:
        aggregationCondition = {
          'result_summary': {
            'terms': {
              'field': 'ua.browser.name',
              // 限制总数, 不填默认显示前10个
              'size': max,
              // 'order': {
              //   // 按照doc_count从高到低排序
              //   '_count': 'desc'
              // }
            },
            'aggregations': {
              'device_count': {
                'cardinality': {
                  'field': 'common.uuid'
                }
              },
              'version_summary': {
                'terms': {
                  // 浏览器版本号太多, 只使用主版本
                  'field': 'ua.browser.major',
                  // 限制总数, 不填默认显示前10个
                  'size': max,
                  // 'order': {
                  //   // 按照doc_count从高到低排序
                  //   '_count': 'desc'
                  // }
                },
                'aggregations': {
                  // 统计设备数
                  'device_count': {
                    'cardinality': {
                      'field': 'common.uuid'
                    }
                  }
                }
              }
            }
          }
        }
        break
      case ClientDistribution.TYPE_OS:
        aggregationCondition = {
          'result_summary': {
            'terms': {
              'field': 'ua.os.name',
              // 限制总数, 不填默认显示前10个
              'size': max,
              // 'order': {
              // // 按照doc_count从高到低排序
              //   '_count': 'desc'
              // }
            },
            'aggregations': {
              // 统计设备数
              'device_count': {
                'cardinality': {
                  'field': 'common.uuid'
                }
              },
              'version_summary': {
                'terms': {
                  'field': 'ua.os.version',
                  // 限制总数, 不填默认显示前10个
                  'size': max,
                  // 'order': {
                  // // 按照doc_count从高到低排序
                  //   '_count': 'desc'
                  // }
                },
                'aggregations': {
                  // 统计设备数
                  'device_count': {
                    'cardinality': {
                      'field': 'common.uuid'
                    }
                  }
                }
              }
            }
          }
        }
        break
      case ClientDistribution.TYPE_DEVICE:
        aggregationCondition = {
          'result_summary': {
            'terms': {
              'field': 'ua.device.vendor',
              // 限制总数, 不填默认显示前10个
              'size': max,
              // 'order': {
              // // 按照doc_count从高到低排序
              //   '_count': 'desc'
              // }
            },
            'aggregations': {
              // 统计设备数
              'device_count': {
                'cardinality': {
                  'field': 'common.uuid'
                }
              },
              'version_summary': {
                'terms': {
                  'field': 'ua.device.model',
                  // 限制总数, 不填默认显示前10个
                  'size': max,
                  // 'order': {
                  // // 按照doc_count从高到低排序
                  //   '_count': 'desc'
                  // }
                },
                'aggregations': {
                  // 统计设备数
                  'device_count': {
                    'cardinality': {
                      'field': 'common.uuid'
                    }
                  }
                }
              }
            }
          }
        }
        break
      case ClientDistribution.TYPE_RUNTIME_VERSION:
        aggregationCondition = {
          'result_summary': {
            'terms': {
              'field': 'common.runtime_version',
              // 限制总数, 不填默认显示前10个
              'size': max,
              // 'order': {
              //   // 按照doc_count从高到低排序
              //   '_count': 'desc'
              // }
            },
            'aggregations': {
              'device_count': {
                'cardinality': {
                  'field': 'common.uuid'
                }
              },
              'version_summary': {
                'terms': {
                  'field': 'common.sdk_version',
                  // 限制总数, 不填默认显示前10个
                  'size': max,
                  // 'order': {
                  //   // 按照doc_count从高到低排序
                  //   '_count': 'desc'
                  // }
                },
                'aggregations': {
                  // 统计设备数
                  'device_count': {
                    'cardinality': {
                      'field': 'common.uuid'
                    }
                  }
                }
              }
            }
          }
        }
        break
      default:
        return []
    }
    _.set(queryCondition, ['body', 'query', 'bool', 'filter', 'bool', 'must'], filterCondition)
    _.set(queryCondition, ['body', 'aggregations'], aggregationCondition)

    let response = await this.client.search(queryCondition)
    let summaryBucketList = _.get(response, ['aggregations', 'result_summary', 'buckets'], [])
    
    let distributionList = []
    for (let summaryBucket of summaryBucketList) {
      let summaryDeviceCount = _.get(summaryBucket, ['device_count', 'value'], 0)
      let summaryName = _.get(summaryBucket, ['key'], '')
      let detailBucketList = _.get(summaryBucket, ['version_summary', 'buckets'], [])
      let detailList = []
      for (let detailBucket of detailBucketList) {
        let detailDeviceCount = _.get(detailBucket, ['device_count', 'value'], 0)
        let detailName = _.get(detailBucket, ['key'], '')
        detailList.push({
          name: detailName,
          total_count: detailDeviceCount
        })
      }
      distributionList.push({
        name: summaryName,
        total_count: summaryDeviceCount,
        detail_list: detailList
      })
    }

    return distributionList
  }
}

export default ClientDistribution
