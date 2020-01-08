import _Object$defineProperty from "@babel/runtime-corejs3/core-js/object/define-property";
import _Object$defineProperties from "@babel/runtime-corejs3/core-js/object/define-properties";
import _Object$getOwnPropertyDescriptors from "@babel/runtime-corejs3/core-js/object/get-own-property-descriptors";
import _forEachInstanceProperty from "@babel/runtime-corejs3/core-js/instance/for-each";
import _Object$getOwnPropertyDescriptor from "@babel/runtime-corejs3/core-js/object/get-own-property-descriptor";
import _filterInstanceProperty from "@babel/runtime-corejs3/core-js/instance/filter";
import _Object$getOwnPropertySymbols from "@babel/runtime-corejs3/core-js/object/get-own-property-symbols";
import _Object$keys from "@babel/runtime-corejs3/core-js/object/keys";
import _concatInstanceProperty from "@babel/runtime-corejs3/core-js/instance/concat";
import _defineProperty from "@babel/runtime-corejs3/helpers/esm/defineProperty";

function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); if (enumerableOnly) symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context3; _forEachInstanceProperty(_context3 = ownKeys(Object(source), true)).call(_context3, function (key) { _defineProperty(target, key, source[key]); }); } else if (_Object$getOwnPropertyDescriptors) { _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)); } else { var _context4; _forEachInstanceProperty(_context4 = ownKeys(Object(source))).call(_context4, function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } } return target; }

import initRenderingTime from '../first-screen-loading-time/watch_render';
export default {
  init: function init(cb) {
    var me = this;
    var times = null;
    var firstScreenLoadingTime = null;

    function reportPerf() {
      var _context, _context2;

      if (!times || !firstScreenLoadingTime) {
        return;
      }

      times.firstScreenLoadingTime = firstScreenLoadingTime;
      me.debugLogger('发送页面性能指标数据, 上报内容 => ', _objectSpread({}, times, {
        url: _concatInstanceProperty(_context = "".concat(window.location.host)).call(_context, window.location.pathname)
      })); // 需要等待首屏数据加载完成

      cb && cb.call(me, 'perf', 20001, _objectSpread({}, times, {
        url: _concatInstanceProperty(_context2 = "".concat(window.location.host)).call(_context2, window.location.pathname)
      }));
    }

    initRenderingTime(function (loadingTime) {
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