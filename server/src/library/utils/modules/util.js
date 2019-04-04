import LIpip from '~/src/library/ipip'
/**
 * URL 参数解析
 * @param {String} url
 */
const urlParse = (url) => {
  var obj = {}
  var reg = /[?&][^?&]+=[^?&]+/g
  var arr = url.match(reg)

  if (arr) {
    arr.forEach(function (item) {
      var tempArr = item.substring(1).split('=')
      var key = decodeURIComponent(tempArr[0])
      var val = decodeURIComponent(tempArr[1])
      obj[key] = val
    })
  }
  return obj
}

/**
 * 处理空对象
 * @example {a: 1, b: undefined} => {a:1}
 * @param {Object} obj
 */
const handleEmptyData = (obj = {}) => {
  var newObj = {}
  if (typeof (obj) === 'object') {
    Object.keys(obj).map(key => {
      if (obj[key]) {
        newObj[key] = obj[key]
      }
    })
  }
  return newObj
}

/**
 * 延迟执行函数, 返回一个 Promise
 * @param {number} ms
 */
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 对象转化为键值对
 * @param {object} obj
 */
const objectToArray = obj => Object.keys(obj).map(key => {
  return {
    key: key,
    value: obj[key]
  }
})

/**
 * 对比对象中指定参数
 * @param {object} obj
 */
const compare = property => {
  return function (obj1, obj2) {
    var value1 = obj1[property]
    var value2 = obj2[property]
    return value2 - value1 // 降序
  }
}

const { ip2Locate } = LIpip
export default {
  sleep,
  urlParse,
  ip2Locate,
  objectToArray,
  handleEmptyData,
  compare
}
