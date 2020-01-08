import _ from 'lodash'
import moment from 'moment'
import { Client } from 'elasticsearch'

import Logger from '~/src/library/logger'
import elasticSearchConfig from '~/src/configs/elasticsearch'

const { host, hosts } = elasticSearchConfig
const client = new Client(hosts ? { hosts } : { host })

/**
 * 包装一下原生ES的一些方法，方便收集日志
 * 6.x API 参见文档【https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/6.x/api-reference.html#_nodes_info】
 */
let clientProto = Object.getPrototypeOf(client)
let { search, bulk, close, delete: _delete } = clientProto

function decoratorSearch (fn, name) {
  return async function (...args) {
    let errorMsg = null
    let start = moment()
    let logger = Logger.getLogger4Elastic(name)

    let [ param ] = args
    let result = await fn.apply(this, args).catch(e => {
      errorMsg = e.message || e.stack || e
    })
    // 插入数据的日志量太大，只记录每次插入的数量
    if (name === 'bulk') {
      param = {
        recordsLen: _.get(param, ['body', 'length'], 0)
      }
      result = {
        insertedLen: _.get(result, ['items', 'length'], 0)
      }
    }

    logger.info(`调用方法【${name}】，接口耗时【${moment() - start}ms】，参数如下 ===> ${JSON.stringify(param)}，返回值为 ===> ${JSON.stringify(result)}，异常信息 ===> ${JSON.stringify(errorMsg)}`)
    return result
  }
}

clientProto.search = decoratorSearch(search, 'search')
clientProto.bulk = decoratorSearch(bulk, 'bulk')
clientProto.close = decoratorSearch(close, 'close')
clientProto.delete = decoratorSearch(_delete, 'delete')

export default client
