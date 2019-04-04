import {
  arrayFrom,
  isFunction,
  merge
} from './util'

var tryJS = {}

tryJS.wrap = wrap
tryJS.wrapArgs = tryifyArgs

var config = {
  handleTryCatchError: function () {}
}

export function setting (opts) {
  merge(opts, config)
}

function wrap (func) {
  return isFunction(func) ? tryify(func) : func
}

/**
 * 将函数使用 try..catch 包装
 *
 * @param  {Function} func 需要进行包装的函数
 * @return {Function} 包装后的函数
 */
function tryify (func) {
  // 确保只包装一次
  if (!func._wrapped) {
    func._wrapped = function () {
      try {
        return func.apply(this, arguments)
      } catch (error) {
        config.handleTryCatchError(error)
        window.ignoreError = true

        throw error
      }
    }
  }

  return func._wrapped
}

/**
 * 只对函数参数进行包装
 *
 * @param  {Function} func 需要进行包装的函数
 * @return {Function}
 */
function tryifyArgs (func) {
  return function () {
    var args = arrayFrom(arguments).map(function (arg) {
      return wrap(arg)
    })

    return func.apply(this, args)
  }
}

export default tryJS
