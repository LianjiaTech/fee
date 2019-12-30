"use strict";

var _interopRequireWildcard = require("@babel/runtime-corejs2/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _getOwnPropertyNames = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-names"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/json/stringify"));

var _try = _interopRequireWildcard(require("./try"));

var _util = require("./util");

var _utils = require("../utils");

var monitor = {};
monitor.tryJS = _try.default;
(0, _try.setting)({
  handleTryCatchError: handleTryCatchError
});

monitor.init = function (opts) {
  __config(opts);

  __init();
}; // 忽略错误监听


window.ignoreError = false; // 错误日志列表

var errorList = []; // 错误处理回调

var report = function report() {};

var config = {
  concat: true,
  delay: 2000,
  // 错误处理间隔时间
  maxError: 16,
  // 异常报错数量限制
  sampling: 1 // 采样率

}; // 定义的错误类型码

var ERROR_RUNTIME = 1;
var ERROR_SCRIPT = 2;
var ERROR_STYLE = 3;
var ERROR_IMAGE = 4;
var ERROR_AUDIO = 5;
var ERROR_VIDEO = 6;
var ERROR_CONSOLE = 7;
var ERROR_TRY_CATHC = 8;
var LOAD_ERROR_TYPE = {
  SCRIPT: ERROR_SCRIPT,
  LINK: ERROR_STYLE,
  IMG: ERROR_IMAGE,
  AUDIO: ERROR_AUDIO,
  VIDEO: ERROR_VIDEO
};

function __config(opts) {
  (0, _util.merge)(opts, config);
  report = (0, _util.debounce)(config.report, config.delay, function () {
    errorList = [];
  });
}

function __init() {
  // 监听 JavaScript 报错异常(JavaScript runtime error)
  // window.onerror = function () {
  //   if (window.ignoreError) {
  //     window.ignoreError = false
  //     return
  //   }
  //   handleError(formatRuntimerError.apply(null, arguments))
  // }
  // 监听资源加载错误(JavaScript Scource failed to load)
  window.addEventListener('error', function (event) {
    // 过滤 target 为 window 的异常，避免与上面的 onerror 重复
    var errorTarget = event.target;

    if (errorTarget !== window && errorTarget.nodeName && LOAD_ERROR_TYPE[errorTarget.nodeName.toUpperCase()]) {
      handleError(formatLoadError(errorTarget));
    } else {
      // onerror会被覆盖, 因此转为使用Listener进行监控
      var message = event.message,
          filename = event.filename,
          lineno = event.lineno,
          colno = event.colno,
          error = event.error;
      var formatedError = formatRuntimerError(message, filename, lineno, colno, error);
      handleError(formatedError);
    }
  }, true); // 针对 vue 报错重写 console.error
  // TODO

  console.error = function (origin) {
    var logErr = origin.error;
    return function (info) {
      info = (0, _utils.isObject)(info) ? (0, _stringify.default)(info, (0, _getOwnPropertyNames.default)(info)) : info;
      var errorLog = {
        type: ERROR_CONSOLE,
        desc: info
      };

      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      logErr.call.apply(logErr, [origin, info].concat(args));
      handleError(errorLog);
    };
  }(console);
} // 处理 try..catch 错误


function handleTryCatchError(error) {
  handleError(formatTryCatchError(error));
}
/**
 * 生成 runtime 错误日志
 *
 * @param  {String} message 错误信息
 * @param  {String} source  发生错误的脚本 URL
 * @param  {Number} lineno  发生错误的行号
 * @param  {Number} colno   发生错误的列号
 * @param  {Object} error   error 对象
 * @return {Object}
 */


function formatRuntimerError(message, source, lineno, colno, error) {
  return {
    type: ERROR_RUNTIME,
    desc: message + ' at ' + source + ':' + lineno + ':' + colno,
    stack: error && error.stack ? error.stack : 'no stack' // IE <9, has no error stack

  };
}
/**
 * 生成 laod 错误日志
 *
 * @param  {Object} errorTarget
 * @return {Object}
 */


function formatLoadError(errorTarget) {
  return {
    type: LOAD_ERROR_TYPE[errorTarget.nodeName.toUpperCase()],
    desc: errorTarget.baseURI + '@' + (errorTarget.src || errorTarget.href),
    stack: 'no stack'
  };
}
/**
 * 生成 try..catch 错误日志
 *
 * @param  {Object} error error 对象
 * @return {Object} 格式化后的对象
 */


function formatTryCatchError(error) {
  return {
    type: ERROR_TRY_CATHC,
    desc: error.message,
    stack: error.stack
  };
}
/**
 * 错误数据预处理
 *
 * @param  {Object} errorLog    错误日志
 */


function handleError(errorLog) {
  // 是否延时处理
  if (!config.concat) {
    !needReport(config.sampling) || config.report([errorLog]);
  } else {
    pushError(errorLog);
    report(errorList);
  }
}
/**
 * 往异常信息数组里面添加一条记录
 *
 * @param  {Object} errorLog 错误日志
 */


function pushError(errorLog) {
  if (needReport(config.sampling) && errorList.length < config.maxError) {
    errorList.push(errorLog);
  }
}
/**
 * 设置一个采样率，决定是否上报
 *
 * @param  {Number} sampling 0 - 1
 * @return {Boolean}
 */


function needReport(sampling) {
  return Math.random() < (sampling || 1);
}

var _default = monitor;
exports.default = _default;