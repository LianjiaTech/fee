import jstracker from './js-tracker'
import rule from './rule'
import config from '../config'
import { get, has, clone, isFunction, merge } from 'lodash-es'

// 将loadsh的方法集中到_中
let _ = {}
_.get = get
_.has = has
_.clone = clone
_.isFunction = isFunction
_.merge = merge

const feeTarget = 'https://xxx.com/dig' // 打点服务器，或Nginx地址

// pid string 工程id:platfe_saas
// uuid string 用户信息
// ucid string 用户信息
// ssid string 用户信息
// mac string mac地址

// 测试标记符
const TEST_FLAG = 'b47ca710747e96f1c523ebab8022c19e9abaa56b'

const LOG_TYPE_ERROR = 'error' // 错误日志
const LOG_TYPE_PRODUCT = 'product' // 产品指标
const LOG_TYPE_INFO = 'info' // 尚未使用
const LOG_TYPE_PERFORMANCE = 'perf' // 性能指标

// 定义JS_TRACKER错误类型码
const JS_TRACKER_ERROR_CONSTANT_MAP = {
  1: 'ERROR_RUNTIME',
  2: 'ERROR_SCRIPT',
  3: 'ERROR_STYLE',
  4: 'ERROR_IMAGE',
  5: 'ERROR_AUDIO',
  6: 'ERROR_VIDEO',
  7: 'ERROR_CONSOLE',
  8: 'ERROR_TRY_CATCH'
}

const JS_TRACKER_ERROR_DISPLAY_MAP = {
  1: 'JS_RUNTIME_ERROR',
  2: 'SCRIPT_LOAD_ERROR',
  3: 'CSS_LOAD_ERROR',
  4: 'IMAGE_LOAD_ERROR',
  5: 'AUDIO_LOAD_ERROR',
  6: 'VIDEO_LOAD_ERROR',
  7: 'CONSOLE_ERROR',
  8: 'TRY_CATCH_ERROR'
}

// 默认配置
const DEFAULT_CONFIG = {
  pid: '', // [必填]项目id, 由灯塔项目组统一分配
  uuid: '', // [可选]设备唯一id, 用于计算uv数&设备分布. 一般在cookie中可以取到, 没有uuid可用设备mac/idfa/imei替代. 或者在storage的key中存入随机数字, 模拟设备唯一id.
  ucid: '', // [可选]用户ucid, 用于发生异常时追踪用户信息, 一般在cookie中可以取到, 没有可传空字符串

  is_test: false, // 是否为测试数据, 默认为false(测试模式下打点数据仅供浏览, 不会展示在系统中)
  record: {
    time_on_page: true, // 是否监控用户在线时长数据, 默认为true
    performance: true, // 是否监控页面载入性能, 默认为true
    js_error: true, //  是否监控页面报错信息, 默认为true
    // 配置需要监控的页面报错类别, 仅在js_error为true时生效, 默认均为true(可以将配置改为false, 以屏蔽不需要上报的错误类别)
    js_error_report_config: {
      ERROR_RUNTIME: true, // js运行时报错
      ERROR_SCRIPT: true, // js资源加载失败
      ERROR_STYLE: true, // css资源加载失败
      ERROR_IMAGE: true, // 图片资源加载失败
      ERROR_AUDIO: true, // 音频资源加载失败
      ERROR_VIDEO: true, // 视频资源加载失败
      ERROR_CONSOLE: true, // vue运行时报错
      ERROR_TRY_CATCH: true, // 未catch错误
      // 自定义检测函数, 判断是否需要报告该错误
      checkErrrorNeedReport: (desc = '', stack = '') => {
        return true
      }
    }
  },

  // 业务方的js版本号, 会随着打点数据一起上传, 方便区分数据来源
  // 可以不填, 默认为1.0.0
  version: '1.0.0',

  // 对于如同
  // xxx.com/detail/1.html
  // xxx.com/detail/2.html
  // xxx.com/detail/3.html
  // ...
  // 这种页面来说, 虽然url不同, 但他们本质上是同一个页面
  // 因此需要业务方传入一个处理函数, 根据当前url解析出真实的页面类型(例如: 二手房列表/经纪人详情页), 以便灯塔系统对错误来源进行分类
  // getPageType函数执行时会被传入一个location对象, 业务方需要完成该函数, 返回对应的的页面类型(50字以内, 建议返回汉字, 方便查看), 默认是返回当前页面的url
  getPageType: (location = window.location) => { return `${location.host}${location.pathname}` }
}

let commonConfig = _.clone(DEFAULT_CONFIG)

function debugLogger () {
  // 只有在测试时才打印log
  if (commonConfig.is_test) {
    console.info(...arguments)
  }
}

const clog = (text) => {
  console.log(`%c ${text}`, 'color:red')
}

const validLog = (type = '', code, detail = {}, extra = {}) => {
  const pid = _.get(commonConfig, ['pid'], '')
  if (!pid) {
    return '请设置工程ID[pid]'
  }

  if (type === 'error') {
    if (code < 0 || code > 9999) {
      return 'type:error的log code 应该在1～9999之间'
    }
  } else if (type === 'product') {
    if (code < 10000 || code > 19999) {
      return 'type:product的log code 应该在10000～19999之间'
    }
  } else if (type === 'info') {
    if (code < 20000 || code > 29999) {
      return 'type:info的log code 应该在20000～29999之间'
    }
  }

  // 字端段类型校验
  if (typeof detail !== 'object') {
    return 'second argument detail required object'
  }
  // 字端段类型校验
  if (typeof extra !== 'object') {
    return 'third argument extra required object'
  }

  // 字段校验
  const ruleItem = rule[code]
  if (ruleItem) {
    // 消费字段必填
    const requireFields = [...ruleItem.df]
    const realFields = Object.keys(detail)
    const needFields = []
    requireFields.forEach(field => {
      // 缺字端
      if (realFields.indexOf(field) === -1) {
        needFields.push(field)
      }
    })
    if (needFields.length) {
      return `code: ${code} 要求 ${needFields.join(',')}字段必填`
    }
  }
  return ''
}

const detailAdapter = (code, detail = {}) => {
  const dbDetail = {
    error_no: '',
    http_code: '',
    during_ms: '',
    url: '',
    request_size_b: '',
    response_size_b: ''
  }
  // 查找rule
  const ruleItem = rule[code]
  if (ruleItem) {
    const d = { ...dbDetail }
    const fields = Object.keys(detail)
    fields.forEach(field => {
      const transferField = ruleItem.dft[field]
      // 需要字段转换
      if (transferField) {
        // 需要字段转换
        d[transferField] = detail[field]
        delete detail[field]
      } else {
        d[field] = detail[field]
      }
    })
    return d
  } else {
    return detail
  }
}

/**
 *
 * @param {类型} type
 * @param {code码} code
 * @param {消费数据} detail
 * @param {展示数据} extra
 */
const log = (type = '', code, detail = {}, extra = {}) => {
  const errorMsg = validLog(type, code, detail, extra)
  if (errorMsg) {
    clog(errorMsg)
    return errorMsg
  }

  // 调用自定义函数, 计算pageType
  let getPageTypeFunc = _.get(
    commonConfig,
    ['getPageType'],
    _.get(DEFAULT_CONFIG, ['getPageType'])
  )
  let location = window.location
  let pageType = location.href
  try {
    pageType = '' + getPageTypeFunc(location)
  } catch (e) {
    debugLogger(`config.getPageType执行时发生异常, 请注意, 错误信息=>`, { e, location })
    pageType = `${location.host}${location.pathname}`
  }

  const logInfo = {
    type,
    code,
    detail: detailAdapter(code, detail),
    extra: extra,
    common: {
      ...commonConfig,
      timestamp: Date.now(),
      runtime_version: commonConfig.version,
      sdk_version: config.version,
      page_type: pageType
    }
  }
  // 图片打点
  const img = new window.Image()
  img.src = `${feeTarget}?d=${encodeURIComponent(JSON.stringify(logInfo))}`
}

log.set = (customerConfig = {}, isOverwrite = false) => {
  // 覆盖模式
  if (isOverwrite) {
    commonConfig = { ...customerConfig }
  } else {
    // lodash内置函数, 相当于递归版assign
    commonConfig = _.merge(commonConfig, customerConfig)
  }
  // 检测是否为测试数据
  const isTestFlagOn = _.get(
    commonConfig,
    ['is_test'],
    _.get(DEFAULT_CONFIG, ['is_test'])
  )
  const isOldTestFlagOn = _.get(commonConfig, ['test'], false) // 兼容旧配置项
  const isTest = isTestFlagOn || isOldTestFlagOn

  // 检测配置项
  const uuid = _.get(commonConfig, ['uuid'], '')
  if (uuid === '') {
    debugLogger('警告: 未设置uuid(设备唯一标识), 无法统计设备分布数等信息')
  }
  const ucid = _.get(commonConfig, ['ucid'], '')
  if (ucid === '') {
    debugLogger('警告: 未设置ucid(用户唯一标识), 无法统计新增用户数')
  }

  const checkErrrorNeedReportFunc = _.get(commonConfig, ['record', 'js_error_report_config', 'checkErrrorNeedReport'])
  if (_.isFunction(checkErrrorNeedReportFunc) === false) {
    debugLogger('警告: config.record.js_error_report_config.checkErrrorNeedReport 不是可执行函数, 将导致错误打点数据异常')
  }

  const getPageTypeFunc = _.get(commonConfig, ['getPageType'])
  if (_.isFunction(getPageTypeFunc) === false) {
    debugLogger('警告: config.getPageType 不是可执行函数, 将导致打点数据异常!')
  }

  if (isTest) {
    commonConfig.test = TEST_FLAG
    debugLogger('配置更新完毕')
    debugLogger('当前为测试模式')
    debugLogger('Tip: 测试模式下打点数据仅供浏览, 不会展示在系统中')
    debugLogger('更新后配置为:', commonConfig)
  }
}

jstracker.init({
  concat: false,
  report: function (errorLogList = []) {
    const isJsErrorFlagOn = _.get(
      commonConfig,
      ['record', 'js_error'],
      _.get(DEFAULT_CONFIG, ['record', 'js_error'])
    )
    const isOldJsErrorFlagOn = _.get(commonConfig, ['jserror'], false)
    const needRecordJsError = isJsErrorFlagOn || isOldJsErrorFlagOn
    if (needRecordJsError === false) {
      debugLogger(`config.record.js_error为false, 跳过页面报错打点, 页面报错内容为 =>`, errorLogList)
      return
    }
    for (let errorLog of errorLogList) {
      const { type, desc, stack } = errorLog

      // 检测该errorType是否需要记录
      let strErrorType = _.get(JS_TRACKER_ERROR_CONSTANT_MAP, type, '')
      let isErrorTypeNeedRecord = _.get(
        commonConfig,
        ['record', 'js_error_report_config', strErrorType],
        _.get(DEFAULT_CONFIG, ['record', 'js_error_report_config', strErrorType])
      )
      if (isErrorTypeNeedRecord === false) {
        // 主动配置了忽略该错误, 自动返回
        debugLogger(`config.record.js_error_report_config.${strErrorType}值为false, 跳过类别为${strErrorType}的页面报错打点, 错误信息=>`, errorLog)
        continue
      }

      // 调用自定义函数, 检测是否需要上报错误
      let customerErrorCheckFunc = _.get(
        commonConfig,
        ['record', 'js_error_report_config', 'checkErrrorNeedReport'],
        _.get(DEFAULT_CONFIG, ['record', 'js_error_report_config', 'checkErrrorNeedReport'])
      )
      let isNeedReport = false
      try {
        isNeedReport = customerErrorCheckFunc(desc, stack)
      } catch (e) {
        debugLogger(`config.record.js_error_report_config.checkErrrorNeedReport执行时发生异常, 请注意, 页面报错信息为=>`, { e, desc, stack })
        isNeedReport = true
      }
      if (isNeedReport === false) {
        debugLogger(`config.record.js_error_report_config.checkErrrorNeedReport返回值为false, 跳过此类错误, 页面报错信息为=>`, { desc, stack })
        continue
      }

      let errorName = '页面报错_' + JS_TRACKER_ERROR_DISPLAY_MAP[type]

      let location = window.location
      debugLogger('[自动]捕捉到页面错误, 发送打点数据, 上报内容 => ', {
        error_no: errorName,
        url: `${location.host}${location.pathname}`,
        desc,
        stack
      })

      log('error', 7, {
        error_no: errorName,
        url: `${location.host}${location.pathname}`
      }, {
        desc,
        stack
      })
    }
  }
})

window.onload = () => {
  // 检查是否监控性能指标
  const isPerformanceFlagOn = _.get(
    commonConfig,
    ['record', 'performance'],
    _.get(DEFAULT_CONFIG, ['record', 'performance'])
  )
  const isOldPerformanceFlagOn = _.get(commonConfig, ['performance'], false)
  const needRecordPerformance = isPerformanceFlagOn || isOldPerformanceFlagOn
  if (needRecordPerformance === false) {
    debugLogger(`config.record.performance值为false, 跳过性能指标打点`)
    return
  }

  const performance = window.performance
  if (!performance) {
    // 当前浏览器不支持
    console.log('你的浏览器不支持 performance 接口')
    return
  }
  const times = performance.timing.toJSON()

  debugLogger('发送页面性能指标数据, 上报内容 => ', {
    ...times,
    url: `${window.location.host}${window.location.pathname}`
  })

  log('perf', 20001, {
    ...times,
    url: `${window.location.host}${window.location.pathname}`
  })
}

// 用户在线时长统计
const OFFLINE_MILL = 15 * 60 * 1000 // 15分钟不操作认为不在线
const SEND_MILL = 5 * 1000 // 每5s打点一次

let lastTime = Date.now()
window.addEventListener('click', () => {
  // 检查是否监控用户在线时长
  const isTimeOnPageFlagOn = _.get(
    commonConfig,
    ['record', 'time_on_page'],
    _.get(DEFAULT_CONFIG, ['record', 'time_on_page'])
  )
  const isOldTimeOnPageFlagOn = _.get(commonConfig, ['online'], false)
  const needRecordTimeOnPage = isTimeOnPageFlagOn || isOldTimeOnPageFlagOn
  if (needRecordTimeOnPage === false) {
    debugLogger(`config.record.time_on_page值为false, 跳过停留时长打点`)
    return
  }

  const now = Date.now()
  const duration = now - lastTime
  if (duration > OFFLINE_MILL) {
    lastTime = Date.now()
  } else if (duration > SEND_MILL) {
    lastTime = Date.now()
    debugLogger('发送用户留存时间埋点, 埋点内容 => ', { duration_ms: duration })
    // 用户在线时长
    log.product(10001, { duration_ms: duration })
  }
}, false)

/**
 * JS错误主动上报接口
 * @param {String} errorName 错误类型, 推荐格式 => "错误类型(中文)_${具体错误名}", 最长200字
 * @param {String} url       错误对应的url,  location.host + location.pathname, 不包括get参数(get参数可以转成json后放在detail中), 最长200个字
 * @param {Object} extraInfo 附属信息, 默认为空对象
 *                 => extraInfo 中以下字段填写后可以在后台错误日志列表中直接展示
 *                 =>        trace_url         // [String]请求对应的trace系统查看地址, 例如: trace系统url + trace_id
 *                 =>        http_code         // [Number]接口响应的Http状态码，
 *                 =>        during_ms         // [Number]接口响应时长(毫秒)
 *                 =>        request_size_b    // [Number]post参数体积, 单位b
 *                 =>        response_size_b   // [Number]响应值体积, 单位b
 *                 => 其余字段会作为补充信息进行展示
 */
function notify (errorName = '', url = '', extraInfo = {}) {
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
    debugLogger('error_name长度不能超过200字符, 自动截断. 截断后为=>', detail['error_name'])
  }
  if (detail['url'].length > 200) {
    detail['url'] = detail['url'].slice(0, 200)
    debugLogger('url长度不能超过200字符, 自动截断. 截断后为=>', detail['error_name'])
  }

  for (let intKey of [
    'http_code',
    'during_ms',
    'request_size_b',
    'response_size_b'
  ]) {
    if (extraInfo[intKey] !== undefined) {
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
      'error_no': true,
      'error_name': true,
      'url': true,
      'http_code': true,
      'during_ms': true,
      'request_size_b': true,
      'response_size_b': true
    }
    if (protectKeyMap[extraKey] !== true) {
      extra[extraKey] = extraInfo[extraKey]
    }
  }

  debugLogger('发送自定义错误数据, 上报内容 => ', { detail, extra })
  return log('error', 8, detail, extra)
}
log.notify = notify

/**
 * 用户行为监控
 * @param {String} code [必填]用户行为标识符, 用于唯一判定用户行为类型, 最多50字符( menu/click/button_1/button_2/etc)
 * @param {String} name [必填]用户行为名称, 和code对应, 用于展示, 最多50字符
 * @param {String} url  [可选]用户点击页面url, 可以作为辅助信息, 最多200字符
 */
function behavior (code = '', name = '', url = '') {
  debugLogger('发送用户点击行为埋点, 上报内容 => ', { code, name, url })
  log.product(10002, {
    code,
    name,
    url
  })
}
log.behavior = behavior

// 注册项目名: dt => downtown
window.dt = log

export const Elog = log.error = (code, detail, extra) => {
  return log('error', code, detail, extra)
}
export const Plog = log.product = (code, detail, extra) => {
  return log('product', code, detail, extra)
}
export const Ilog = log.info = (code, detail, extra) => {
  return log('info', code, detail, extra)
}

export default log
