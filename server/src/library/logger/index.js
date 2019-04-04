import path from 'path'
import log4js from 'log4js'
import config from '~/src/configs/app'
import moment from 'moment'
import DATE_FORMAT from '~/src/constants/date_format'
import _ from 'lodash'

let baseLoggerConfig = {
  appenders: {
    // command: {
    //   type: 'dateFile',
    //   filename: `${config.absoluteLogPath}/command/${commandName}`,
    //   pattern: '-yyyy-MM-dd.log',
    //   alwaysIncludePattern: true
    // },
    express: {
      type: 'dateFile',
      filename: `${config.absoluteLogPath}/express/runtime`,
      pattern: '-yyyy-MM-dd.log',
      alwaysIncludePattern: true
    }
  },
  categories: {
    default: { appenders: ['express'], level: 'info' },
    // command: { appenders: ['command'], level: 'info' },
    express: { appenders: ['express'], level: 'info' }
  }
}

/**
 * getLogger会重新打开一个文件, 导致文件句柄打开过多, 系统报错退出, 因此需要人工做一层缓存
 */
let loggerCacheMap = new Map()
function getLogger (loggerType = 'express', loggerConfig = baseLoggerConfig) {
  let loggerConfigJSON = JSON.stringify({ loggerType, loggerConfig })
  if (loggerCacheMap.has(loggerConfigJSON)) {
    return loggerCacheMap.get(loggerConfigJSON)
  } else {
    log4js.configure(loggerConfig)
    let logger = log4js.getLogger(loggerType)
    loggerCacheMap.set(loggerConfigJSON, logger)
    return logger
  }
}

/**
 * 为Commande类提供Logger
 * @param {*} commandName
 */
function getLogger4Command (commandName = 'unsetCommandName') {
  let loggerConfig = {
    appenders: {
      command: {
        type: 'dateFile',
        filename: `${config.absoluteLogPath}/command/${commandName}`,
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true
      },
      express: {
        type: 'dateFile',
        filename: `${config.absoluteLogPath}/express/runtime`,
        pattern: '-yyyy-MM-dd.log',
        alwaysIncludePattern: true
      }
    },
    categories: {
      default: { appenders: ['express'], level: 'info' },
      command: { appenders: ['command'], level: 'info' },
      express: { appenders: ['express'], level: 'info' }
    }
  }

  return getLogger(`command`, loggerConfig)
}
let logger4Express = getLogger(`express`, baseLoggerConfig)
/**
 * 追踪日志输出文件名,方法名,行号等信息
 * @returns Object
 */
function getStackInfoString () {
  let stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i
  let stackReg2 = /at\s+()(.*):(\d*):(\d*)/i
  let stacklist = (new Error()).stack.split('\n').slice(3)
  let s = stacklist[0]
  let sp = stackReg.exec(s) || stackReg2.exec(s)
  let data = {}
  if (sp && sp.length === 5) {
    data.method = sp[1]
    data.path = sp[2]
    data.line = sp[3]
    data.pos = sp[4]
    data.file = path.basename(data.path)
  }
  return JSON.stringify(data)
}

/**
* 简易logger
* @returns  null
*/
function log () {
  let message = ''
  for (let rawMessage of arguments) {
    if (_.isString(rawMessage) === false) {
      message = message + JSON.stringify(rawMessage)
    } else {
      message = message + rawMessage
    }
  }
  let triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
  console.log(`[${triggerAt}]-[runtime] ` + message)
  logger4Express.info(message)
}
let info = log // 别名

/**
* 简易logger
* @returns  null
*/
function warn () {
  let message = ''
  for (let rawMessage of arguments) {
    if (_.isString(rawMessage) === false) {
      message = message + JSON.stringify(rawMessage)
    } else {
      message = message + rawMessage
    }
  }
  let triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
  console.warn(`[${triggerAt}]-[runtime] ` + message + ` => ${getStackInfoString()}`)
  logger4Express.warn(message + ` => ${getStackInfoString()}`)
}

/**
* 简易logger
* @returns  null
*/
function error () {
  let message = ''
  for (let rawMessage of arguments) {
    if (_.isString(rawMessage) === false) {
      message = message + JSON.stringify(rawMessage)
    } else {
      message = message + rawMessage
    }
  }
  let triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND)
  console.error(`[${triggerAt}]-[runtime] ` + message + ` => ${getStackInfoString()}`)
  logger4Express.error(message + ` => ${getStackInfoString()}`)
}

export default {
  getLogger4Command,
  log,
  info,
  warn,
  error
}
