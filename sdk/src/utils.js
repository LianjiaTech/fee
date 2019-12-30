import rule from './rule'
import Cookies from 'js-cookie'
import { DEFAULT_CONFIG, COOKIE_NAME_DIVICE_ID } from './constant'

/**
 * 不依赖于lodash，webpack配置按需加载lodash会导致sdk中所有lodash方法运行异常
 * @created at 2019-07-08
 */

const toString = Object.prototype.toString
const hasOwnProperty = Object.prototype.hasOwnProperty

/**
 * 返回给定value的类型
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function getTag(value) {
  if (value == null) {
    return value === undefined ? '[object Undefined]' : '[object Null]'
  }
  return toString.call(value)
}

/**
 * 判断给定值是不是一个对象
 * @param {*} value
 * @returns {Boolean} 如果是返回 true，否则返回 false
 */
export function isObject(value) {
  const type = typeof value
  return value != null && (type == 'object' || type == 'function')
}

/**
 * 根据 object对象的path路径获取值。 如果解析 value 是 undefined 会以 defaultValue 取代。
 * @param {Object} object 要检索的对象
 * @param {Array|string} path 要获取属性的路径
 * @param {*} defaultValue 如果解析值是 undefined ，这值会被返回
 * @return {*}: 返回解析的值
 *
 * @example
 *  var obj = {
 *    name: 'Alex',
 *    job: {
 *      business: 'IT'
 *    },
 *    clothes: [
 *      {
 *         color: 'red',
 *         price: 200
 *      }
 *    ]
 *  };
 *  get(obj, ['job', 'business'], ''); // IT
 *  get(obj, 'clothes.0.color', ''); // 'red'
 *  get(obj, 'clothes.0.test', 'no test'); // 'no test'
 */
export const get = (object, path, defaultValue) => {
  let _path =
    getTag(path) === '[object Array]'
      ? path
      : String.prototype.split.call(path, /[,[\].]+?/).filter(Boolean)
  let index = 0
  let length = _path.length
  let result = (() => {
    while (object != null && index < length) {
      object = object[_path[index++]]
    }
    return index && index == length ? object : undefined
  })()
  return result === undefined ? defaultValue : result
}

/**
 * 检查 key 是否是object对象的直接属性
 * @param {Object} object 要检索的对象
 * @param {String} key 要检查的 key
 * @returns {boolean} 如果存在，那么返回 true ，否则返回 false
 */
export const has = function(object, key) {
  return object != null && hasOwnProperty.call(object, key)
}

/**
 * 深度 merge
 * @param {Object} source
 * @param {Object} other
 * @returns {Object} 一个merge后的新对象
 */
export const merge = function(source, other) {
  if (!isObject(source) || !isObject(other)) {
    return other === undefined ? source : other
  }
  if (isFunction(source) || isFunction(other)) {
    return other === undefined ? source : other
  }
  // 合并两个对象的 key，另外要区分数组的初始值为 []
  let keys = Object.keys({ ...source, ...other })
  return keys.reduce(
    (acc, key) => {
      // 递归合并 value
      acc[key] = merge(source[key], other[key])
      return acc
    },
    Array.isArray(source) ? [] : {}
  )
}

/**
 * 判断给定的value是不是一个function类型
 * @param {*} value
 * @returns {Boolean} 如果是返回 true，否则返回 false
 */
export const isFunction = function(value) {
  if (!isObject(value)) return false
  const tag = getTag(value)
  return (
    tag == '[object Function]' ||
    tag == '[object AsyncFunction]' ||
    tag == '[object GeneratorFunction]' ||
    tag == '[object Proxy]'
  )
}

// 将loadsh的方法集中到_中
export const _ = Object.assign({}, { get, has, isFunction, merge })

export const isDom = function(target) {
  return typeof HTMLElement === 'function'
    ? target instanceof HTMLElement
    : target &&
        typeof target === 'object' &&
        target.nodeType === 1 &&
        typeof target.nodeName === 'string'
}

export const noop = function() {}

/**
 * 生成字符串的hash
 * via https://stackoverflow.com/a/7616484/4197333
 * @param {*} content
 */
export function hash(content) {
  content = content + ''
  let hash = 0
  let index = 0
  let charCodeAt = 0
  if (content.length === 0) {
    return hash.toString(36)
  }
  for (index = 0; index < content.length; index++) {
    // 每一位字符的utf-8编码
    charCodeAt = content.charCodeAt(index)
    hash = (hash << 5) - hash + charCodeAt
    hash |= 0 // Convert to 32bit integer
  }
  return hash.toString(36)
}

export function getUUID() {
  let timestampMs = new Date() * 1

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(36)
      .substring(1)
  }

  return (
    hash(timestampMs + '') +
    '-' +
    hash(navigator.userAgent) +
    '-' +
    s4() +
    s4() +
    s4() +
    s4() +
    s4() +
    '-' +
    s4() +
    s4() +
    s4()
  )
}

export function parseDomain(hostname) {
  // 首先用比较严肃的方法:
  // 先尝试匹配常见后缀
  let checkReg = new RegExp(
    /(.*?)\.?([^.]*?)\.(gl|com|net|org|biz|ws|in|me|co\.uk|co|org\.uk|ltd\.uk|plc\.uk|me\.uk|edu|mil|br\.com|cn\.com|eu\.com|hu\.com|no\.com|qc\.com|sa\.com|se\.com|se\.net|us\.com|uy\.com|ac|co\.ac|gv\.ac|or\.ac|ac\.ac|af|am|as|at|ac\.at|co\.at|gv\.at|or\.at|asn\.au|com\.au|edu\.au|org\.au|net\.au|id\.au|be|ac\.be|adm\.br|adv\.br|am\.br|arq\.br|art\.br|bio\.br|cng\.br|cnt\.br|com\.br|ecn\.br|eng\.br|esp\.br|etc\.br|eti\.br|fm\.br|fot\.br|fst\.br|g12\.br|gov\.br|ind\.br|inf\.br|jor\.br|lel\.br|med\.br|mil\.br|net\.br|nom\.br|ntr\.br|odo\.br|org\.br|ppg\.br|pro\.br|psc\.br|psi\.br|rec\.br|slg\.br|tmp\.br|tur\.br|tv\.br|vet\.br|zlg\.br|br|ab\.ca|bc\.ca|mb\.ca|nb\.ca|nf\.ca|ns\.ca|nt\.ca|on\.ca|pe\.ca|qc\.ca|sk\.ca|yk\.ca|ca|cc|ac\.cn|com\.cn|edu\.cn|gov\.cn|org\.cn|bj\.cn|sh\.cn|tj\.cn|cq\.cn|he\.cn|nm\.cn|ln\.cn|jl\.cn|hl\.cn|js\.cn|zj\.cn|ah\.cn|gd\.cn|gx\.cn|hi\.cn|sc\.cn|gz\.cn|yn\.cn|xz\.cn|sn\.cn|gs\.cn|qh\.cn|nx\.cn|xj\.cn|tw\.cn|hk\.cn|mo\.cn|cn|cx|cz|de|dk|fo|com\.ec|tm\.fr|com\.fr|asso\.fr|presse\.fr|fr|gf|gs|co\.il|net\.il|ac\.il|k12\.il|gov\.il|muni\.il|ac\.in|co\.in|org\.in|ernet\.in|gov\.in|net\.in|res\.in|is|it|ac\.jp|co\.jp|go\.jp|or\.jp|ne\.jp|ac\.kr|co\.kr|go\.kr|ne\.kr|nm\.kr|or\.kr|li|lt|lu|asso\.mc|tm\.mc|com\.mm|org\.mm|net\.mm|edu\.mm|gov\.mm|ms|nl|no|nu|pl|ro|org\.ro|store\.ro|tm\.ro|firm\.ro|www\.ro|arts\.ro|rec\.ro|info\.ro|nom\.ro|nt\.ro|se|si|com\.sg|org\.sg|net\.sg|gov\.sg|sk|st|tf|ac\.th|co\.th|go\.th|mi\.th|net\.th|or\.th|tm|to|com\.tr|edu\.tr|gov\.tr|k12\.tr|net\.tr|org\.tr|com\.tw|org\.tw|net\.tw|ac\.uk|uk\.com|uk\.net|gb\.com|gb\.net|vg|sh|kz|ch|info|ua|gov|name|pro|ie|hk|com\.hk|org\.hk|net\.hk|edu\.hk|us|tk|cd|by|ad|lv|eu\.lv|bz|es|jp|cl|ag|mobi|eu|co\.nz|org\.nz|net\.nz|maori\.nz|iwi\.nz|io|la|md|sc|sg|vc|tw|travel|my|se|tv|pt|com\.pt|edu\.pt|asia|fi|com\.ve|net\.ve|fi|org\.ve|web\.ve|info\.ve|co\.ve|tel|im|gr|ru|net\.ru|org\.ru|hr|com\.hr|ly|xyz)$/
  )
  let parseResult = hostname.match(checkReg)
  let domain
  if (parseResult) {
    domain = parseResult[2] ? parseResult[2] + '.' + parseResult[3] : undefined
  }

  if (domain === undefined) {
    // 没有匹配到常见后缀, 则使用最后两段被.分隔的字符, 作为主域名
    let urlSplitList = hostname.split('.')
    domain = urlSplitList
      .slice(urlSplitList.length - 2, urlSplitList.length)
      .join('.')
  }
  // 强制转为字符串
  domain = domain + ''
  return domain
}

export function getDeviceId() {
  // 尝试在cookie中获取
  let deviceId = Cookies.get(COOKIE_NAME_DIVICE_ID)
  if (deviceId === undefined) {
    // cookie中也没有, 手工设置上
    deviceId = getUUID()
    let hostname = location.hostname
    let domain = parseDomain(hostname)
    // cookie需要种在主域名上, 否则像bj.ke.com/sh.ke.com下的设备数就炸了
    Cookies.set(COOKIE_NAME_DIVICE_ID, deviceId, {
      expires: 1000,
      domain: domain
    })
    // Cookie有可能种失败, 如果接种失败, 则还是返回空字符串
    deviceId = Cookies.get(COOKIE_NAME_DIVICE_ID) || ''
  }
  return deviceId
}

export function customerErrorCheck(
  commonConfig,
  desc,
  stack,
  debugLogger = console.log
) {
  // 调用自定义函数, 检测是否需要上报错误
  let customerErrorCheckFunc = _.get(
    commonConfig,
    ['record', 'js_error_report_config', 'checkErrorNeedReport'],
    _.get(DEFAULT_CONFIG, [
      'record',
      'js_error_report_config',
      'checkErrorNeedReport'
    ])
  )
  let isNeedReport = false

  try {
    isNeedReport = customerErrorCheckFunc(desc, stack)
  } catch (e) {
    debugLogger(
      `config.record.js_error_report_config.checkErrorNeedReport执行时发生异常, 请注意, 页面报错信息为=>`,
      { e, desc, stack }
    )
    isNeedReport = true
  }
  // 这里绝大多数的框架都支持的是返回undefined认为是false
  return !!isNeedReport
}

export const clog = text => {
  console.log(`%c ${text}`, 'color:red')
}

export const validLog = (
  commonConfig,
  type = '',
  code,
  detail = {},
  extra = {}
) => {
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

export const detailAdapter = (code, detail = {}) => {
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
