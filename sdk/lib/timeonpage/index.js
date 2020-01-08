import _Date$now from "@babel/runtime-corejs3/core-js/date/now";
export default {
  init: function init(cb) {
    var _this = this;

    var OFFLINE_MILL = 15 * 60 * 1000; // 15分钟不操作认为不在线

    var SEND_MILL = 5 * 1000; // 每5s打点一次

    var lastTime = _Date$now();

    window.addEventListener('click', function () {
      if (_this.needRecordTimeOnPage === false) {
        _this.debugLogger("config.record.time_on_page\u503C\u4E3Afalse, \u8DF3\u8FC7\u505C\u7559\u65F6\u957F\u6253\u70B9");

        return;
      }

      var now = _Date$now();

      var duration = now - lastTime;

      if (duration > OFFLINE_MILL) {
        lastTime = _Date$now();
      } else if (duration > SEND_MILL) {
        lastTime = _Date$now();

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