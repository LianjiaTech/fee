"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.debounce = debounce;
exports.merge = merge;
exports.isFunction = isFunction;
exports.arrayFrom = arrayFrom;

/**
 * debounce
 *
 * @param {Function} func 实际要执行的函数
 * @param {Number} delay 延迟时间，单位是 ms
 * @param {Function} callback 在 func 执行后的回调
 *
 * @return {Function}
 */
function debounce(func, delay, callback) {
  var timer;
  return function () {
    var context = this;
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      func.apply(context, args);
      !callback || callback();
    }, delay);
  };
}
/**
 * merge
 *
 * @param  {Object} src
 * @param  {Object} dest
 * @return {Object}
 */


function merge(src, dest) {
  for (var item in src) {
    dest[item] = src[item];
  }

  return dest;
}
/**
 * 是否是函数
 *
 * @param  {Any} func 判断对象
 * @return {Boolean}
 */


function isFunction(func) {
  return Object.prototype.toString.call(func) === '[object Function]';
}
/**
 * 将类数组转化成数组
 *
 * @param  {Object} arrayLike 类数组对象
 * @return {Array} 转化后的数组
 */


function arrayFrom(arrayLike) {
  return [].slice.call(arrayLike);
}