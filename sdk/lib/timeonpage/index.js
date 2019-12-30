"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = void 0;

var _now = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/date/now"));

var _default = {
  init: function init(cb) {
    var _this = this;

    var OFFLINE_MILL = 15 * 60 * 1000; // 15分钟不操作认为不在线

    var SEND_MILL = 5 * 1000; // 每5s打点一次

    var lastTime = (0, _now.default)();
    window.addEventListener('click', function () {
      if (_this.needRecordTimeOnPage === false) {
        _this.debugLogger("config.record.time_on_page\u503C\u4E3Afalse, \u8DF3\u8FC7\u505C\u7559\u65F6\u957F\u6253\u70B9");

        return;
      }

      var now = (0, _now.default)();
      var duration = now - lastTime;

      if (duration > OFFLINE_MILL) {
        lastTime = (0, _now.default)();
      } else if (duration > SEND_MILL) {
        lastTime = (0, _now.default)();

        _this.debugLogger('发送用户留存时间埋点, 埋点内容 => ', {
          duration_ms: duration
        }); // 用户在线时长


        cb && cb.call(_this, 10001, {
          duration_ms: duration
        });
      }
    }, false);
  }
};
exports.default = _default;