"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty2 = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty2(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/define-property"));

var _defineProperties = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/define-properties"));

var _getOwnPropertyDescriptors = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-descriptors"));

var _getOwnPropertyDescriptor = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-descriptor"));

var _getOwnPropertySymbols = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-symbols"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/keys"));

var _defineProperty3 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _watch_render = _interopRequireDefault(require("../first_screen_loading_time/watch_render"));

function ownKeys(object, enumerableOnly) { var keys = (0, _keys.default)(object); if (_getOwnPropertySymbols.default) { var symbols = (0, _getOwnPropertySymbols.default)(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return (0, _getOwnPropertyDescriptor.default)(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty3.default)(target, key, source[key]); }); } else if (_getOwnPropertyDescriptors.default) { (0, _defineProperties.default)(target, (0, _getOwnPropertyDescriptors.default)(source)); } else { ownKeys(Object(source)).forEach(function (key) { (0, _defineProperty2.default)(target, key, (0, _getOwnPropertyDescriptor.default)(source, key)); }); } } return target; }

var _default = {
  init: function init(cb) {
    var me = this;
    var times = null;
    var firstScreenLoadingTime = null;

    function reportPerf() {
      if (!times || !firstScreenLoadingTime) {
        return;
      }

      times.firstScreenLoadingTime = firstScreenLoadingTime;
      me.debugLogger('发送页面性能指标数据, 上报内容 => ', _objectSpread({}, times, {
        url: "".concat(window.location.host).concat(window.location.pathname)
      })); // 需要等待首屏数据加载完成

      cb && cb.call(me, 'perf', 20001, _objectSpread({}, times, {
        url: "".concat(window.location.host).concat(window.location.pathname)
      }));
    }

    (0, _watch_render.default)(function (loadingTime) {
      firstScreenLoadingTime = loadingTime;
      reportPerf();
    }); // 使用load事件, 替换onload方法

    window.addEventListener('load', function () {
      if (me.needRecordPerformance === false) {
        me.debugLogger("config.record.performance\u503C\u4E3Afalse, \u8DF3\u8FC7\u6027\u80FD\u6307\u6807\u6253\u70B9");
        return;
      }

      var performance = window.performance;

      if (!performance) {
        // 当前浏览器不支持
        me.debugLogger('你的浏览器不支持 performance 接口');
        return;
      }

      times = {};

      for (var key in performance.timing) {
        if (!isNaN(performance.timing[key])) {
          times[key] = performance.timing[key];
        }
      }

      reportPerf();
    });
  }
};
exports.default = _default;