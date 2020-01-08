import _bindInstanceProperty from "@babel/runtime-corejs3/core-js/instance/bind";
import _JSON$stringify from "@babel/runtime-corejs3/core-js/json/stringify";
import { customerErrorCheck, _ } from '../utils';
export default {
  init: function init(cb) {
    var me = this;
    window.addEventListener('unhandledrejection', function (event) {
      // reason可能是正常的字符串, 也可能会有message和stack信息
      // 如果有的话, 就抓一下
      var promiseErrorInfo = '';
      var reason = '';

      try {
        promiseErrorInfo = _JSON$stringify(_.get(event, ['promise'], ''));
        reason = _JSON$stringify(_.get(event, ['reason'], ''));
      } catch (e) {
        console.log('promise stringify出错===>' + e);
        promiseErrorInfo = _.get(event, ['promise'], '') + ''; // 稳稳的 [object Promise]

        reason = _.get(event, ['reason'], '') + '';
      }

      var message = _.get(event, ['reason', 'message'], '');

      var stack = _.get(event, ['reason', 'stack'], '');

      var desc = "Unhandled_Rejection:" + promiseErrorInfo; // 这里也去调用

      if (desc && stack) {
        var _context;

        var isNeedReport = customerErrorCheck(me.config, desc, stack, _bindInstanceProperty(_context = me.debugLogger).call(_context, me));

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