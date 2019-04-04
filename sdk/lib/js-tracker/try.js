"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setting = setting;
exports.default = void 0;

var _util = require("./util");

var tryJS = {};
tryJS.wrap = wrap;
tryJS.wrapArgs = tryifyArgs;
var config = {
  handleTryCatchError: function handleTryCatchError() {}
};

function setting(opts) {
  (0, _util.merge)(opts, config);
}

function wrap(func) {
  return (0, _util.isFunction)(func) ? tryify(func) : func;
}
/**
 * 将函数使用 try..catch 包装
 *
 * @param  {Function} func 需要进行包装的函数
 * @return {Function} 包装后的函数
 */


function tryify(func) {
  // 确保只包装一次
  if (!func._wrapped) {
    func._wrapped = function () {
      try {
        return func.apply(this, arguments);
      } catch (error) {
        config.handleTryCatchError(error);
        window.ignoreError = true;
        throw error;
      }
    };
  }

  return func._wrapped;
}
/**
 * 只对函数参数进行包装
 *
 * @param  {Function} func 需要进行包装的函数
 * @return {Function}
 */


function tryifyArgs(func) {
  return function () {
    var args = (0, _util.arrayFrom)(arguments).map(function (arg) {
      return wrap(arg);
    });
    return func.apply(this, args);
  };
}

var _default = tryJS;
exports.default = _default;