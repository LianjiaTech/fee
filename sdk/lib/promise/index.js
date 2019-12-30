"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/json/stringify"));

var _utils = require("../utils");

var _default = {
  init: function init(cb) {
    var me = this;
    window.addEventListener('unhandledrejection', function (event) {
      // reason可能是正常的字符串, 也可能会有message和stack信息
      // 如果有的话, 就抓一下
      var promiseErrorInfo = '';
      var reason = '';

      try {
        promiseErrorInfo = (0, _stringify.default)(_utils._.get(event, ['promise'], ''));
        reason = (0, _stringify.default)(_utils._.get(event, ['reason'], ''));
      } catch (e) {
        console.log('promise stringify出错===>' + e);
        promiseErrorInfo = _utils._.get(event, ['promise'], '') + ''; // 稳稳的 [object Promise]

        reason = _utils._.get(event, ['reason'], '') + '';
      }

      var message = _utils._.get(event, ['reason', 'message'], '');

      var stack = _utils._.get(event, ['reason', 'stack'], '');

      var desc = "Unhandled_Rejection:" + promiseErrorInfo; // 这里也去调用

      if (desc && stack) {
        var isNeedReport = (0, _utils.customerErrorCheck)(me.config, desc, stack, me.debugLogger.bind(me));

        if (!!isNeedReport === false) {
          me.debugLogger("config.record.js_error_report_config.checkErrorNeedReport\u8FD4\u56DE\u503C\u4E3Afalse, \u8DF3\u8FC7\u6B64\u7C7B\u9519\u8BEF, \u9875\u9762\u62A5\u9519\u4FE1\u606F\u4E3A=>", {
            desc: desc,
            stack: stack
          });
          return;
        }
      }

      var url = location.href;
      cb && cb.call(me, "JS\u9519\u8BEF_Unhandled_Rejection", url, {
        desc: desc,
        reason: reason,
        message: message,
        stack: stack
      });
    }, true);
  }
};
exports.default = _default;