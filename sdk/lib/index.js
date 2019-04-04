"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Ilog = exports.Plog = exports.Elog = void 0;

var _jsTracker = _interopRequireDefault(require("./js-tracker"));

var _rule = _interopRequireDefault(require("./rule"));

var _config = _interopRequireDefault(require("../config"));

var _lodashEs = require("lodash-es");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// 将loadsh的方法集中到_中
var _ = {};
_.get = _lodashEs.get;
_.has = _lodashEs.has;
_.clone = _lodashEs.clone;
_.isFunction = _lodashEs.isFunction;
_.merge = _lodashEs.merge;
var feeTarget = 'https://xxx.com/dig'; // 打点服务器，或Nginx地址
// pid string 工程id:platfe_saas
// uuid string 用户信息
// ucid string 用户信息
// ssid string 用户信息
// mac string mac地址
// 测试标记符

var TEST_FLAG = 'b47ca710747e96f1c523ebab8022c19e9abaa56b';
var LOG_TYPE_ERROR = 'error'; // 错误日志

var LOG_TYPE_PRODUCT = 'product'; // 产品指标

var LOG_TYPE_INFO = 'info'; // 尚未使用

var LOG_TYPE_PERFORMANCE = 'perf'; // 性能指标
// 定义JS_TRACKER错误类型码

var JS_TRACKER_ERROR_CONSTANT_MAP = {
  1: 'ERROR_RUNTIME',
  2: 'ERROR_SCRIPT',
  3: 'ERROR_STYLE',
  4: 'ERROR_IMAGE',
  5: 'ERROR_AUDIO',
  6: 'ERROR_VIDEO',
  7: 'ERROR_CONSOLE',
  8: 'ERROR_TRY_CATCH'
};
var JS_TRACKER_ERROR_DISPLAY_MAP = {
  1: 'JS_RUNTIME_ERROR',
  2: 'SCRIPT_LOAD_ERROR',
  3: 'CSS_LOAD_ERROR',
  4: 'IMAGE_LOAD_ERROR',
  5: 'AUDIO_LOAD_ERROR',
  6: 'VIDEO_LOAD_ERROR',
  7: 'CONSOLE_ERROR',
  8: 'TRY_CATCH_ERROR' // 默认配置

};
var DEFAULT_CONFIG = {
  pid: '',
  // [必填]项目id, 由灯塔项目组统一分配
  uuid: '',
  // [可选]设备唯一id, 用于计算uv数&设备分布. 一般在cookie中可以取到, 没有uuid可用设备mac/idfa/imei替代. 或者在storage的key中存入随机数字, 模拟设备唯一id.
  ucid: '',
  // [可选]用户ucid, 用于发生异常时追踪用户信息, 一般在cookie中可以取到, 没有可传空字符串
  is_test: false,
  // 是否为测试数据, 默认为false(测试模式下打点数据仅供浏览, 不会展示在系统中)
  record: {
    time_on_page: true,
    // 是否监控用户在线时长数据, 默认为true
    performance: true,
    // 是否监控页面载入性能, 默认为true
    js_error: true,
    //  是否监控页面报错信息, 默认为true
    // 配置需要监控的页面报错类别, 仅在js_error为true时生效, 默认均为true(可以将配置改为false, 以屏蔽不需要上报的错误类别)
    js_error_report_config: {
      ERROR_RUNTIME: true,
      // js运行时报错
      ERROR_SCRIPT: true,
      // js资源加载失败
      ERROR_STYLE: true,
      // css资源加载失败
      ERROR_IMAGE: true,
      // 图片资源加载失败
      ERROR_AUDIO: true,
      // 音频资源加载失败
      ERROR_VIDEO: true,
      // 视频资源加载失败
      ERROR_CONSOLE: true,
      // vue运行时报错
      ERROR_TRY_CATCH: true,
      // 未catch错误
      // 自定义检测函数, 判断是否需要报告该错误
      checkErrrorNeedReport: function checkErrrorNeedReport() {
        var desc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
        var stack = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
        return true;
      }
    }
  },
  // 业务方的js版本号, 会随着打点数据一起上传, 方便区分数据来源
  // 可以不填, 默认为1.0.0
  version: '1.0.0',
  // 对于如同
  // xxx.com/detail/1.html
  // xxx.com/detail/2.html
  // xxx.com/detail/3.html
  // ...
  // 这种页面来说, 虽然url不同, 但他们本质上是同一个页面
  // 因此需要业务方传入一个处理函数, 根据当前url解析出真实的页面类型(例如: 二手房列表/经纪人详情页), 以便灯塔系统对错误来源进行分类
  // getPageType函数执行时会被传入一个location对象, 业务方需要完成该函数, 返回对应的的页面类型(50字以内, 建议返回汉字, 方便查看), 默认是返回当前页面的url
  getPageType: function getPageType() {
    var location = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.location;
    return "".concat(location.host).concat(location.pathname);
  }
};

var commonConfig = _.clone(DEFAULT_CONFIG);

function debugLogger() {
  // 只有在测试时才打印log
  if (commonConfig.is_test) {
    var _console;

    (_console = console).info.apply(_console, arguments);
  }
}

var clog = function clog(text) {
  console.log("%c ".concat(text), 'color:red');
};

var validLog = function validLog() {
  var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var code = arguments.length > 1 ? arguments[1] : undefined;
  var detail = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var extra = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

  var pid = _.get(commonConfig, ['pid'], '');

  if (!pid) {
    return '请设置工程ID[pid]';
  }

  if (type === 'error') {
    if (code < 0 || code > 9999) {
      return 'type:error的log code 应该在1～9999之间';
    }
  } else if (type === 'product') {
    if (code < 10000 || code > 19999) {
      return 'type:product的log code 应该在10000～19999之间';
    }
  } else if (type === 'info') {
    if (code < 20000 || code > 29999) {
      return 'type:info的log code 应该在20000～29999之间';
    }
  } // 字端段类型校验


  if (_typeof(detail) !== 'object') {
    return 'second argument detail required object';
  } // 字端段类型校验


  if (_typeof(extra) !== 'object') {
    return 'third argument extra required object';
  } // 字段校验


  var ruleItem = _rule.default[code];

  if (ruleItem) {
    // 消费字段必填
    var requireFields = _toConsumableArray(ruleItem.df);

    var realFields = Object.keys(detail);
    var needFields = [];
    requireFields.forEach(function (field) {
      // 缺字端
      if (realFields.indexOf(field) === -1) {
        needFields.push(field);
      }
    });

    if (needFields.length) {
      return "code: ".concat(code, " \u8981\u6C42 ").concat(needFields.join(','), "\u5B57\u6BB5\u5FC5\u586B");
    }
  }

  return '';
};

var detailAdapter = function detailAdapter(code) {
  var detail = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var dbDetail = {
    error_no: '',
    http_code: '',
    during_ms: '',
    url: '',
    request_size_b: '',
    response_size_b: '' // 查找rule

  };
  var ruleItem = _rule.default[code];

  if (ruleItem) {
    var d = _objectSpread({}, dbDetail);

    var fields = Object.keys(detail);
    fields.forEach(function (field) {
      var transferField = ruleItem.dft[field]; // 需要字段转换

      if (transferField) {
        // 需要字段转换
        d[transferField] = detail[field];
        delete detail[field];
      } else {
        d[field] = detail[field];
      }
    });
    return d;
  } else {
    return detail;
  }
};
/**
 *
 * @param {类型} type
 * @param {code码} code
 * @param {消费数据} detail
 * @param {展示数据} extra
 */


var log = function log() {
  var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var code = arguments.length > 1 ? arguments[1] : undefined;
  var detail = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var extra = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  var errorMsg = validLog(type, code, detail, extra);

  if (errorMsg) {
    clog(errorMsg);
    return errorMsg;
  } // 调用自定义函数, 计算pageType


  var getPageTypeFunc = _.get(commonConfig, ['getPageType'], _.get(DEFAULT_CONFIG, ['getPageType']));

  var location = window.location;
  var pageType = location.href;

  try {
    pageType = '' + getPageTypeFunc(location);
  } catch (e) {
    debugLogger("config.getPageType\u6267\u884C\u65F6\u53D1\u751F\u5F02\u5E38, \u8BF7\u6CE8\u610F, \u9519\u8BEF\u4FE1\u606F=>", {
      e: e,
      location: location
    });
    pageType = "".concat(location.host).concat(location.pathname);
  }

  var logInfo = {
    type: type,
    code: code,
    detail: detailAdapter(code, detail),
    extra: extra,
    common: _objectSpread({}, commonConfig, {
      timestamp: Date.now(),
      runtime_version: commonConfig.version,
      sdk_version: _config.default.version,
      page_type: pageType
    }) // 图片打点

  };
  var img = new window.Image();
  img.src = "".concat(feeTarget, "?d=").concat(encodeURIComponent(JSON.stringify(logInfo)));
};

log.set = function () {
  var customerConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var isOverwrite = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  // 覆盖模式
  if (isOverwrite) {
    commonConfig = _objectSpread({}, customerConfig);
  } else {
    // lodash内置函数, 相当于递归版assign
    commonConfig = _.merge(commonConfig, customerConfig);
  } // 检测是否为测试数据


  var isTestFlagOn = _.get(commonConfig, ['is_test'], _.get(DEFAULT_CONFIG, ['is_test']));

  var isOldTestFlagOn = _.get(commonConfig, ['test'], false); // 兼容旧配置项


  var isTest = isTestFlagOn || isOldTestFlagOn; // 检测配置项

  var uuid = _.get(commonConfig, ['uuid'], '');

  if (uuid === '') {
    debugLogger('警告: 未设置uuid(设备唯一标识), 无法统计设备分布数等信息');
  }

  var ucid = _.get(commonConfig, ['ucid'], '');

  if (ucid === '') {
    debugLogger('警告: 未设置ucid(用户唯一标识), 无法统计新增用户数');
  }

  var checkErrrorNeedReportFunc = _.get(commonConfig, ['record', 'js_error_report_config', 'checkErrrorNeedReport']);

  if (_.isFunction(checkErrrorNeedReportFunc) === false) {
    debugLogger('警告: config.record.js_error_report_config.checkErrrorNeedReport 不是可执行函数, 将导致错误打点数据异常');
  }

  var getPageTypeFunc = _.get(commonConfig, ['getPageType']);

  if (_.isFunction(getPageTypeFunc) === false) {
    debugLogger('警告: config.getPageType 不是可执行函数, 将导致打点数据异常!');
  }

  if (isTest) {
    commonConfig.test = TEST_FLAG;
    debugLogger('配置更新完毕');
    debugLogger('当前为测试模式');
    debugLogger('Tip: 测试模式下打点数据仅供浏览, 不会展示在系统中');
    debugLogger('更新后配置为:', commonConfig);
  }
};

_jsTracker.default.init({
  concat: false,
  report: function report() {
    var errorLogList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

    var isJsErrorFlagOn = _.get(commonConfig, ['record', 'js_error'], _.get(DEFAULT_CONFIG, ['record', 'js_error']));

    var isOldJsErrorFlagOn = _.get(commonConfig, ['jserror'], false);

    var needRecordJsError = isJsErrorFlagOn || isOldJsErrorFlagOn;

    if (needRecordJsError === false) {
      debugLogger("config.record.js_error\u4E3Afalse, \u8DF3\u8FC7\u9875\u9762\u62A5\u9519\u6253\u70B9, \u9875\u9762\u62A5\u9519\u5185\u5BB9\u4E3A =>", errorLogList);
      return;
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = errorLogList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var errorLog = _step.value;
        var type = errorLog.type,
            desc = errorLog.desc,
            stack = errorLog.stack; // 检测该errorType是否需要记录

        var strErrorType = _.get(JS_TRACKER_ERROR_CONSTANT_MAP, type, '');

        var isErrorTypeNeedRecord = _.get(commonConfig, ['record', 'js_error_report_config', strErrorType], _.get(DEFAULT_CONFIG, ['record', 'js_error_report_config', strErrorType]));

        if (isErrorTypeNeedRecord === false) {
          // 主动配置了忽略该错误, 自动返回
          debugLogger("config.record.js_error_report_config.".concat(strErrorType, "\u503C\u4E3Afalse, \u8DF3\u8FC7\u7C7B\u522B\u4E3A").concat(strErrorType, "\u7684\u9875\u9762\u62A5\u9519\u6253\u70B9, \u9519\u8BEF\u4FE1\u606F=>"), errorLog);
          continue;
        } // 调用自定义函数, 检测是否需要上报错误


        var customerErrorCheckFunc = _.get(commonConfig, ['record', 'js_error_report_config', 'checkErrrorNeedReport'], _.get(DEFAULT_CONFIG, ['record', 'js_error_report_config', 'checkErrrorNeedReport']));

        var isNeedReport = false;

        try {
          isNeedReport = customerErrorCheckFunc(desc, stack);
        } catch (e) {
          debugLogger("config.record.js_error_report_config.checkErrrorNeedReport\u6267\u884C\u65F6\u53D1\u751F\u5F02\u5E38, \u8BF7\u6CE8\u610F, \u9875\u9762\u62A5\u9519\u4FE1\u606F\u4E3A=>", {
            e: e,
            desc: desc,
            stack: stack
          });
          isNeedReport = true;
        }

        if (isNeedReport === false) {
          debugLogger("config.record.js_error_report_config.checkErrrorNeedReport\u8FD4\u56DE\u503C\u4E3Afalse, \u8DF3\u8FC7\u6B64\u7C7B\u9519\u8BEF, \u9875\u9762\u62A5\u9519\u4FE1\u606F\u4E3A=>", {
            desc: desc,
            stack: stack
          });
          continue;
        }

        var errorName = '页面报错_' + JS_TRACKER_ERROR_DISPLAY_MAP[type];
        var location = window.location;
        debugLogger('[自动]捕捉到页面错误, 发送打点数据, 上报内容 => ', {
          error_no: errorName,
          url: "".concat(location.host).concat(location.pathname),
          desc: desc,
          stack: stack
        });
        log('error', 7, {
          error_no: errorName,
          url: "".concat(location.host).concat(location.pathname)
        }, {
          desc: desc,
          stack: stack
        });
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }
});

window.onload = function () {
  // 检查是否监控性能指标
  var isPerformanceFlagOn = _.get(commonConfig, ['record', 'performance'], _.get(DEFAULT_CONFIG, ['record', 'performance']));

  var isOldPerformanceFlagOn = _.get(commonConfig, ['performance'], false);

  var needRecordPerformance = isPerformanceFlagOn || isOldPerformanceFlagOn;

  if (needRecordPerformance === false) {
    debugLogger("config.record.performance\u503C\u4E3Afalse, \u8DF3\u8FC7\u6027\u80FD\u6307\u6807\u6253\u70B9");
    return;
  }

  var performance = window.performance;

  if (!performance) {
    // 当前浏览器不支持
    console.log('你的浏览器不支持 performance 接口');
    return;
  }

  var times = performance.timing.toJSON();
  debugLogger('发送页面性能指标数据, 上报内容 => ', _objectSpread({}, times, {
    url: "".concat(window.location.host).concat(window.location.pathname)
  }));
  log('perf', 20001, _objectSpread({}, times, {
    url: "".concat(window.location.host).concat(window.location.pathname)
  }));
}; // 用户在线时长统计


var OFFLINE_MILL = 15 * 60 * 1000; // 15分钟不操作认为不在线

var SEND_MILL = 5 * 1000; // 每5s打点一次

var lastTime = Date.now();
window.addEventListener('click', function () {
  // 检查是否监控用户在线时长
  var isTimeOnPageFlagOn = _.get(commonConfig, ['record', 'time_on_page'], _.get(DEFAULT_CONFIG, ['record', 'time_on_page']));

  var isOldTimeOnPageFlagOn = _.get(commonConfig, ['online'], false);

  var needRecordTimeOnPage = isTimeOnPageFlagOn || isOldTimeOnPageFlagOn;

  if (needRecordTimeOnPage === false) {
    debugLogger("config.record.time_on_page\u503C\u4E3Afalse, \u8DF3\u8FC7\u505C\u7559\u65F6\u957F\u6253\u70B9");
    return;
  }

  var now = Date.now();
  var duration = now - lastTime;

  if (duration > OFFLINE_MILL) {
    lastTime = Date.now();
  } else if (duration > SEND_MILL) {
    lastTime = Date.now();
    debugLogger('发送用户留存时间埋点, 埋点内容 => ', {
      duration_ms: duration
    }); // 用户在线时长

    log.product(10001, {
      duration_ms: duration
    });
  }
}, false);
/**
 * JS错误主动上报接口
 * @param {String} errorName 错误类型, 推荐格式 => "错误类型(中文)_${具体错误名}", 最长200字
 * @param {String} url       错误对应的url,  location.host + location.pathname, 不包括get参数(get参数可以转成json后放在detail中), 最长200个字
 * @param {Object} extraInfo 附属信息, 默认为空对象
 *                 => extraInfo 中以下字段填写后可以在后台错误日志列表中直接展示
 *                 =>        trace_url         // [String]请求对应的trace系统查看地址, 例如: trace系统url + trace_id
 *                 =>        http_code         // [Number]接口响应的Http状态码，
 *                 =>        during_ms         // [Number]接口响应时长(毫秒)
 *                 =>        request_size_b    // [Number]post参数体积, 单位b
 *                 =>        response_size_b   // [Number]响应值体积, 单位b
 *                 => 其余字段会作为补充信息进行展示
 */

function notify() {
  var errorName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var extraInfo = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  // 规范请求参数
  var detail = {};
  var extra = {};

  if (!errorName) {
    console.log('dt.notify 的 errorName 不能为空');
    return;
  }

  detail['error_name'] = '' + errorName;
  detail['url'] = '' + url; // 最大不能超过200字

  if (detail['error_name'].length > 200) {
    detail['error_name'] = detail['error_name'].slice(0, 200);
    debugLogger('error_name长度不能超过200字符, 自动截断. 截断后为=>', detail['error_name']);
  }

  if (detail['url'].length > 200) {
    detail['url'] = detail['url'].slice(0, 200);
    debugLogger('url长度不能超过200字符, 自动截断. 截断后为=>', detail['error_name']);
  }

  for (var _i = 0, _arr = ['http_code', 'during_ms', 'request_size_b', 'response_size_b']; _i < _arr.length; _i++) {
    var intKey = _arr[_i];

    if (extraInfo[intKey] !== undefined) {
      var code = parseInt(extraInfo[intKey]);

      if (isNaN(code) === false) {
        detail[intKey] = code;
      } else {
        detail[intKey] = 0; // 赋上默认值
      }
    }
  } // 将rawDetail中的其余key存到extra中


  for (var _i2 = 0, _Object$keys = Object.keys(extraInfo); _i2 < _Object$keys.length; _i2++) {
    var extraKey = _Object$keys[_i2];
    var protectKeyMap = {
      'error_no': true,
      'error_name': true,
      'url': true,
      'http_code': true,
      'during_ms': true,
      'request_size_b': true,
      'response_size_b': true
    };

    if (protectKeyMap[extraKey] !== true) {
      extra[extraKey] = extraInfo[extraKey];
    }
  }

  debugLogger('发送自定义错误数据, 上报内容 => ', {
    detail: detail,
    extra: extra
  });
  return log('error', 8, detail, extra);
}

log.notify = notify;
/**
 * 用户行为监控
 * @param {String} code [必填]用户行为标识符, 用于唯一判定用户行为类型, 最多50字符( menu/click/button_1/button_2/etc)
 * @param {String} name [必填]用户行为名称, 和code对应, 用于展示, 最多50字符
 * @param {String} url  [可选]用户点击页面url, 可以作为辅助信息, 最多200字符
 */

function behavior() {
  var code = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var url = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  debugLogger('发送用户点击行为埋点, 上报内容 => ', {
    code: code,
    name: name,
    url: url
  });
  log.product(10002, {
    code: code,
    name: name,
    url: url
  });
}

log.behavior = behavior; // 注册项目名: dt => downtown

window.dt = log;

var Elog = log.error = function (code, detail, extra) {
  return log('error', code, detail, extra);
};

exports.Elog = Elog;

var Plog = log.product = function (code, detail, extra) {
  return log('product', code, detail, extra);
};

exports.Plog = Plog;

var Ilog = log.info = function (code, detail, extra) {
  return log('info', code, detail, extra);
};

exports.Ilog = Ilog;
var _default = log;
exports.default = _default;