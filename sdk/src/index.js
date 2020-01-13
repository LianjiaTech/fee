/** @format */

import pkg from '../package.json'
import jstracker from './js-tracker'
import promiseTracker from './promise'
import timeonpageTracker from './timeonpage'
import performanceTracker from './performance'
import {
  detailAdapter,
  getDeviceId,
  customerErrorCheck,
  validLog,
  clog,
  isDom,
  noop,
  _
} from './utils'
import {
  DEFAULT_CONFIG,
  TEST_FLAG,
  TARGET,
  JS_TRACKER_ERROR_CONSTANT_MAP,
  JS_TRACKER_ERROR_DISPLAY_MAP
} from './constant'

let commonConfig = Object.assign({}, DEFAULT_CONFIG)

class Base {
  constructor() {
    // 是否为测试模式
    this.isTest = true
    // 是否为覆盖模式
    this.isOverwrite = false
    // 是否监控JS错误
    this.needRecordJsError = true
    // 是否监控用户在线时长
    this.needRecordTimeOnPage = true
    // 是否监控性能指标
    this.needRecordPerformance = true
    // 初始化配置
    this.config = Object.create(null)
  }
  // 组织config
  computeConfig(config = {}) {
    let _conf = this.isOverwrite ? { ...config } : _.merge(commonConfig, config)
    // 检测配置项
    let uuid = _.get(_conf, ['uuid'], '')
    if (uuid === '') {
      // 没有设置uuid时, 自动设置一个
      uuid = getDeviceId()
      _conf['uuid'] = uuid
    }
    const ucid = _.get(_conf, ['ucid'], '')
    if (ucid === '') {
      this.debugLogger('警告: 未设置ucid(用户唯一标识), 无法统计新增用户数')
    }

    let checkErrorNeedReportFunc = _.get(_conf, [
      'record',
      'js_error_report_config',
      'checkErrorNeedReport'
    ])
    if (_.isFunction(checkErrorNeedReportFunc) === false) {
      // 如果新配置key中取不到回调函数不对, 则尝试一下旧配置
      checkErrorNeedReportFunc = _.get(_conf, [
        'record',
        'js_error_report_config',
        'checkErrorNeedReport'
      ])
    }
    //  还不对就没办法了
    if (_.isFunction(checkErrorNeedReportFunc) === false) {
      this.debugLogger(
        '警告: config.record.js_error_report_config.checkErrorNeedReport 不是可执行函数, 将导致错误打点数据异常'
      )
    }

    const getPageTypeFunc = _.get(_conf, ['getPageType'])
    if (_.isFunction(getPageTypeFunc) === false) {
      this.debugLogger(
        '警告: config.getPageType 不是可执行函数, 将导致打点数据异常!'
      )
    }
    window.__dt_conf = _conf
    const isTest =
      _.get(_conf, ['is_test'], _.get(DEFAULT_CONFIG, ['is_test'])) ||
      _.get(_conf, ['test'], false) // 兼容旧配置项
    if (isTest) {
      _conf.test = TEST_FLAG
      this.debugLogger('配置更新完毕')
      this.debugLogger('当前为测试模式')
      this.debugLogger('Tip: 测试模式下打点数据仅供浏览, 不会展示在系统中')
      this.debugLogger('更新后配置为:', _conf)
    }
    return _conf
  }

  // 各种监控初始化
  init(config = DEFAULT_CONFIG, isOverwrite = false) {
    // 是否为覆盖模式
    this.isOverwrite = isOverwrite
    this.config = commonConfig = this.computeConfig(config)
    this.isTest = !!_.get(commonConfig, 'test', false)
    // 检查是否监控性能指标
    this.needRecordPerformance =
      _.get(
        commonConfig,
        ['record', 'performance'],
        _.get(DEFAULT_CONFIG, ['record', 'performance'])
      ) || _.get(commonConfig, ['performance'], false) // 兼容旧配置项
    // 检查是否监控JS错误
    this.needRecordJsError =
      _.get(
        commonConfig,
        ['record', 'js_error'],
        _.get(DEFAULT_CONFIG, ['record', 'js_error'])
      ) || _.get(commonConfig, ['jserror'], false)
    // 检查是否监控用户在线时长
    this.needRecordTimeOnPage =
      _.get(
        commonConfig,
        ['record', 'time_on_page'],
        _.get(DEFAULT_CONFIG, ['record', 'time_on_page'])
      ) || _.get(commonConfig, ['online'], false)

    const me = this

    // js错误统计
    jstracker.init({
      concat: false,
      report: function(errorLogList = []) {
        if (me.needRecordJsError === false) {
          me.debugLogger(
            `config.record.js_error为false, 跳过页面报错打点, 页面报错内容为 =>`,
            errorLogList
          )
          return
        }
        for (let errorLog of errorLogList) {
          const { type, desc, stack } = errorLog

          // 检测该errorType是否需要记录
          let strErrorType = _.get(JS_TRACKER_ERROR_CONSTANT_MAP, type, '')
          let isErrorTypeNeedRecord = _.get(
            commonConfig,
            ['record', 'js_error_report_config', strErrorType],
            _.get(DEFAULT_CONFIG, [
              'record',
              'js_error_report_config',
              strErrorType
            ])
          )
          if (isErrorTypeNeedRecord === false) {
            // 主动配置了忽略该错误, 自动返回
            me.debugLogger(
              `config.record.js_error_report_config.${strErrorType}值为false, 跳过类别为${strErrorType}的页面报错打点, 错误信息=>`,
              errorLog
            )
            continue
          }
          const isNeedReport = customerErrorCheck(
            commonConfig,
            desc,
            stack,
            me.debugLogger.bind(me)
          )
          if (!!isNeedReport === false) {
            me.debugLogger(
              `config.record.js_error_report_config.checkErrorNeedReport返回值为false, 跳过此类错误, 页面报错信息为=>`,
              {
                desc,
                stack
              }
            )
            continue
          }
          let errorName = '页面报错_' + JS_TRACKER_ERROR_DISPLAY_MAP[type]
          let location = window.location
          me.debugLogger('[自动]捕捉到页面错误, 发送打点数据, 上报内容 => ', {
            error_no: errorName,
            url: `${location.host}${location.pathname}`,
            desc,
            stack
          })

          me.log(
            'error',
            7,
            {
              error_no: errorName,
              url: location.href
            },
            {
              desc,
              stack
            }
          )
        }
      }
    })
    // 页面性能统计
    performanceTracker.init.bind(me)(me.log)
    // promise错误统计
    promiseTracker.init.bind(me)(me.notify)
    // 用户在线时长统计
    timeonpageTracker.init.bind(me)(me.product)
  }

  send(info = {}) {
    let location = window.location
    let pageType = location.href
    let getPageTypeFunc = _.get(
      commonConfig,
      ['getPageType'],
      _.get(DEFAULT_CONFIG, ['getPageType'])
    )

    try {
      pageType = '' + getPageTypeFunc(location)
    } catch (e) {
      this.debugLogger(`config.getPageType执行时发生异常, 请注意, 错误信息=>`, {
        e,
        location
      })
      pageType = `${location.host}${location.pathname}`
    }

    info = Object.assign(
      {
        type: '',
        common: {
          ...commonConfig,
          timestamp: Date.now(),
          runtime_version: commonConfig.version,
          sdk_version: pkg.version,
          page_type: pageType
        }
      },
      info
    )

    // 图片打点
    const img = new window.Image()
    img.src = `${TARGET}?d=${encodeURIComponent(JSON.stringify(info))}`
  }

  /**
   * 打点数据上报方法
   * @param {类型} type
   * @param {code码} code
   * @param {消费数据} detail
   * @param {展示数据} extra
   */
  log(type = '', code, detail = {}, extra = {}) {
    const errorMsg = validLog(commonConfig, type, code, detail, extra)

    if (errorMsg) {
      clog(errorMsg)
      return errorMsg
    }
    const logInfo = {
      type,
      code,
      extra,
      detail: detailAdapter(code, detail)
    }

    this.send(logInfo)
  }

  error(code, detail, extra) {
    return this.log('error', code, detail, extra)
  }

  product(code, detail, extra) {
    return this.log('product', code, detail, extra)
  }

  info(code, detail, extra) {
    return this.log('info', code, detail, extra)
  }

  debugLogger() {
    // 只有在测试时才打印log
    if (this.isTest) console.log(...arguments)
  }
}

class Logger extends Base {
  constructor() {
    super()
  }
  set(...args) {
    super.init(...args)
  }
  /**
   * 用户行为监控
   * @param {String} code [必填]用户行为标识符, 用于唯一判定用户行为类型, 最多50字符( menu/click/button_1/button_2/etc)
   * @param {String} name [必填]用户行为名称, 和code对应, 用于展示, 最多50字符
   * @param {String} url  [可选]用户点击页面url, 可以作为辅助信息, 最多200字符
   */
  behavior(code = '', name = '', url = '') {
    this.debugLogger('发送用户点击行为埋点, 上报内容 => ', { code, name, url })
    this.product(10002, {
      code,
      name,
      url
    })
  }

  notify(errorName = '', url = '', extraInfo = {}) {
    // 规范请求参数
    let detail = {}
    let extra = {}
    if (!errorName) {
      console.log('dt.notify 的 errorName 不能为空')
      return
    }

    detail['error_name'] = '' + errorName
    detail['url'] = '' + url

    // 最大不能超过200字
    if (detail['error_name'].length > 200) {
      detail['error_name'] = detail['error_name'].slice(0, 200)
      this.debugLogger(
        'error_name长度不能超过200字符, 自动截断. 截断后为=>',
        detail['error_name']
      )
    }
    if (detail['url'].length > 200) {
      detail['url'] = detail['url'].slice(0, 200)
      this.debugLogger(
        'url长度不能超过200字符, 自动截断. 截断后为=>',
        detail['error_name']
      )
    }

    for (let intKey of [
      'http_code',
      'during_ms',
      'request_size_b',
      'response_size_b'
    ]) {
      if (_.has(extraInfo, [intKey])) {
        let code = parseInt(extraInfo[intKey])
        if (isNaN(code) === false) {
          detail[intKey] = code
        } else {
          detail[intKey] = 0 // 赋上默认值
        }
      }
    }

    // 将rawDetail中的其余key存到extra中
    for (let extraKey of Object.keys(extraInfo)) {
      let protectKeyMap = {
        error_no: true,
        error_name: true,
        url: true,
        http_code: true,
        during_ms: true,
        request_size_b: true,
        response_size_b: true
      }
      if (protectKeyMap[extraKey] !== true) {
        extra[extraKey] = extraInfo[extraKey]
      }
    }

    this.debugLogger('发送自定义错误数据, 上报内容 => ', { detail, extra })
    return this.error(8, detail, extra)
  }

  /**
   * 提供通用的埋点方法
   * @param {String} name
   * @param {*} args
   */
  logger(name = '', args = {}, extra = {}) {
    if (!name)
      return this.debugLogger(
        '警告: 未设置【name】(打点事件名)属性, 无法统计该打点数据！'
      )
    if (typeof name !== 'string')
      return this.debugLogger('【name属性】(打点事件名)仅支持字符串类型！')

    this.debugLogger(
      `发送【event】类型埋点，事件名：【${name}】. 上报内容 => `,
      args
    )
    this.send({
      type: 'event',
      name,
      props: {
        ...args
      },
      extra
    })
  }

  /**
   * 白屏检测功能API
   * @param {*} target     需要监测DOM变动的节点
   * @param {*} notify     【必填】错误上报的配置
   * @param {*} config     【可选】监测配置
   * @param {*} cb         【可选】需要执行的业务回调
   *
   * @returns {Instance of MutationObserver} 返回MutationObserver的实例，业务可根据需要调用disconnect方法来关闭监测
   */
  detect(
    target = document.documentElement,
    notify = {},
    config = {},
    cb = noop
  ) {
    if (_.isFunction(config)) {
      cb = config
      config = {}
    }
    const {
      errorName = '加载页面异常_WhiteScreen',
      url = `${location.host}${location.pathname}`,
      extraInfo = {}
    } = notify

    const CONF = {
      subtree: true,
      childList: true,
      attributes: false,
      characterData: false,
      timeout: 5 * 1000
    }
    config = _.merge(CONF, config)

    this.debugLogger(`白屏检测配置: ====>`, config, cb)

    if (!isDom(target)) {
      clog('param [target] must be a instance of HTMLElement')
      return
    }
    const {
      timeout = 5 * 1000,
      childList = true,
      attributes = false,
      characterData = false
    } = config

    if (!(attributes || childList || characterData)) {
      clog(`attributes childList characterData配置不合法, 跳过白屏检测`)
      return
    }
    let MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver
    if (!MutationObserver)
      return clog('您的浏览器不支持 MutationObserver API, 跳过白屏检测')
    // 超过设置的超时时间后，执行该逻辑，上报白屏错误
    let timer = setTimeout(() => {
      this.notify(errorName, url, extraInfo)
      _.isFunction(cb) && cb(mo)
    }, timeout)
    let mo = void 0
    let callback = records => {
      clearTimeout(timer)
      _.isFunction(cb) && cb(mo, records)
    }
    mo = new MutationObserver(callback)
    mo.observe(target, config)
    return mo
  }
}

const logger = new Logger()

// 注册项目名: dt => downtown
window.dt = logger

export const Elog = logger.error.bind(logger)
export const Plog = logger.product.bind(logger)
export const Ilog = logger.info.bind(logger)

export default logger
