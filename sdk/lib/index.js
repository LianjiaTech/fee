import _setTimeout from "@babel/runtime-corejs3/core-js/set-timeout";
import _parseInt from "@babel/runtime-corejs3/core-js/parse-int";
import _sliceInstanceProperty from "@babel/runtime-corejs3/core-js/instance/slice";
import _possibleConstructorReturn from "@babel/runtime-corejs3/helpers/esm/possibleConstructorReturn";
import _getPrototypeOf from "@babel/runtime-corejs3/helpers/esm/getPrototypeOf";
import _get from "@babel/runtime-corejs3/helpers/esm/get";
import _inherits from "@babel/runtime-corejs3/helpers/esm/inherits";
import _Object$defineProperty from "@babel/runtime-corejs3/core-js/object/define-property";
import _Object$defineProperties from "@babel/runtime-corejs3/core-js/object/define-properties";
import _Object$getOwnPropertyDescriptors from "@babel/runtime-corejs3/core-js/object/get-own-property-descriptors";
import _forEachInstanceProperty from "@babel/runtime-corejs3/core-js/instance/for-each";
import _Object$getOwnPropertyDescriptor from "@babel/runtime-corejs3/core-js/object/get-own-property-descriptor";
import _filterInstanceProperty from "@babel/runtime-corejs3/core-js/instance/filter";
import _Object$getOwnPropertySymbols from "@babel/runtime-corejs3/core-js/object/get-own-property-symbols";
import _Object$keys from "@babel/runtime-corejs3/core-js/object/keys";
import _JSON$stringify from "@babel/runtime-corejs3/core-js/json/stringify";
import _Date$now from "@babel/runtime-corejs3/core-js/date/now";
import _bindInstanceProperty from "@babel/runtime-corejs3/core-js/instance/bind";
import _concatInstanceProperty from "@babel/runtime-corejs3/core-js/instance/concat";
import _getIterator from "@babel/runtime-corejs3/core-js/get-iterator";
import _defineProperty from "@babel/runtime-corejs3/helpers/esm/defineProperty";
import _Object$create from "@babel/runtime-corejs3/core-js/object/create";
import _classCallCheck from "@babel/runtime-corejs3/helpers/esm/classCallCheck";
import _createClass from "@babel/runtime-corejs3/helpers/esm/createClass";
import _Object$assign from "@babel/runtime-corejs3/core-js/object/assign";

var _context15, _context16, _context17;

function ownKeys(object, enumerableOnly) { var keys = _Object$keys(object); if (_Object$getOwnPropertySymbols) { var symbols = _Object$getOwnPropertySymbols(object); if (enumerableOnly) symbols = _filterInstanceProperty(symbols).call(symbols, function (sym) { return _Object$getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { var _context9; _forEachInstanceProperty(_context9 = ownKeys(Object(source), true)).call(_context9, function (key) { _defineProperty(target, key, source[key]); }); } else if (_Object$getOwnPropertyDescriptors) { _Object$defineProperties(target, _Object$getOwnPropertyDescriptors(source)); } else { var _context10; _forEachInstanceProperty(_context10 = ownKeys(Object(source))).call(_context10, function (key) { _Object$defineProperty(target, key, _Object$getOwnPropertyDescriptor(source, key)); }); } } return target; }

/** @format */
import sdkConf from '../config';
import jstracker from './js-tracker';
import promiseTracker from './promise';
import timeonpageTracker from './timeonpage';
import performanceTracker from './performance';
import { detailAdapter, getDeviceId, customerErrorCheck, validLog, clog, isDom, noop, _ } from './utils';
import { DEFAULT_CONFIG, TEST_FLAG, TARGET, JS_TRACKER_ERROR_CONSTANT_MAP, JS_TRACKER_ERROR_DISPLAY_MAP } from './constant';

var commonConfig = _Object$assign({}, DEFAULT_CONFIG);

var Base =
/*#__PURE__*/
function () {
  function Base() {
    _classCallCheck(this, Base);

    // 是否为测试模式
    this.isTest = true; // 是否为覆盖模式

    this.isOverwrite = false; // 是否监控JS错误

    this.needRecordJsError = true; // 是否监控用户在线时长

    this.needRecordTimeOnPage = true; // 是否监控性能指标

    this.needRecordPerformance = true; // 初始化配置

    this.config = _Object$create(null);
  } // 组织config


  _createClass(Base, [{
    key: "computeConfig",
    value: function computeConfig() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _conf = this.isOverwrite ? _objectSpread({}, config) : _.merge(commonConfig, config); // 检测配置项


      var uuid = _.get(_conf, ['uuid'], '');

      if (uuid === '') {
        // 没有设置uuid时, 自动设置一个
        uuid = getDeviceId();
        _conf['uuid'] = uuid;
      }

      var ucid = _.get(_conf, ['ucid'], '');

      if (ucid === '') {
        this.debugLogger('警告: 未设置ucid(用户唯一标识), 无法统计新增用户数');
      }

      var checkErrorNeedReportFunc = _.get(_conf, ['record', 'js_error_report_config', 'checkErrorNeedReport']);

      if (_.isFunction(checkErrorNeedReportFunc) === false) {
        // 如果新配置key中取不到回调函数不对, 则尝试一下旧配置
        checkErrorNeedReportFunc = _.get(_conf, ['record', 'js_error_report_config', 'checkErrorNeedReport']);
      } //  还不对就没办法了


      if (_.isFunction(checkErrorNeedReportFunc) === false) {
        this.debugLogger('警告: config.record.js_error_report_config.checkErrorNeedReport 不是可执行函数, 将导致错误打点数据异常');
      }

      var getPageTypeFunc = _.get(_conf, ['getPageType']);

      if (_.isFunction(getPageTypeFunc) === false) {
        this.debugLogger('警告: config.getPageType 不是可执行函数, 将导致打点数据异常!');
      }

      window.__dt_conf = _conf;

      var isTest = _.get(_conf, ['is_test'], _.get(DEFAULT_CONFIG, ['is_test'])) || _.get(_conf, ['test'], false); // 兼容旧配置项


      if (isTest) {
        _conf.test = TEST_FLAG;
        this.debugLogger('配置更新完毕');
        this.debugLogger('当前为测试模式');
        this.debugLogger('Tip: 测试模式下打点数据仅供浏览, 不会展示在系统中');
        this.debugLogger('更新后配置为:', _conf);
      }

      return _conf;
    } // 各种监控初始化

  }, {
    key: "init",
    value: function init() {
      var _context4, _context5, _context6;

      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_CONFIG;
      var isOverwrite = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      // 是否为覆盖模式
      this.isOverwrite = isOverwrite;
      this.config = commonConfig = this.computeConfig(config);
      this.isTest = !!_.get(commonConfig, 'test', false); // 检查是否监控性能指标

      this.needRecordPerformance = _.get(commonConfig, ['record', 'performance'], _.get(DEFAULT_CONFIG, ['record', 'performance'])) || _.get(commonConfig, ['performance'], false); // 兼容旧配置项
      // 检查是否监控JS错误

      this.needRecordJsError = _.get(commonConfig, ['record', 'js_error'], _.get(DEFAULT_CONFIG, ['record', 'js_error'])) || _.get(commonConfig, ['jserror'], false); // 检查是否监控用户在线时长

      this.needRecordTimeOnPage = _.get(commonConfig, ['record', 'time_on_page'], _.get(DEFAULT_CONFIG, ['record', 'time_on_page'])) || _.get(commonConfig, ['online'], false);
      var me = this; // js错误统计

      jstracker.init({
        concat: false,
        report: function report() {
          var errorLogList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

          if (me.needRecordJsError === false) {
            me.debugLogger("config.record.js_error\u4E3Afalse, \u8DF3\u8FC7\u9875\u9762\u62A5\u9519\u6253\u70B9, \u9875\u9762\u62A5\u9519\u5185\u5BB9\u4E3A =>", errorLogList);
            return;
          }

          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = _getIterator(errorLogList), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var _context2, _context3;

              var errorLog = _step.value;
              var type = errorLog.type,
                  desc = errorLog.desc,
                  stack = errorLog.stack; // 检测该errorType是否需要记录

              var strErrorType = _.get(JS_TRACKER_ERROR_CONSTANT_MAP, type, '');

              var isErrorTypeNeedRecord = _.get(commonConfig, ['record', 'js_error_report_config', strErrorType], _.get(DEFAULT_CONFIG, ['record', 'js_error_report_config', strErrorType]));

              if (isErrorTypeNeedRecord === false) {
                var _context;

                // 主动配置了忽略该错误, 自动返回
                me.debugLogger(_concatInstanceProperty(_context = "config.record.js_error_report_config.".concat(strErrorType, "\u503C\u4E3Afalse, \u8DF3\u8FC7\u7C7B\u522B\u4E3A")).call(_context, strErrorType, "\u7684\u9875\u9762\u62A5\u9519\u6253\u70B9, \u9519\u8BEF\u4FE1\u606F=>"), errorLog);
                continue;
              }

              var isNeedReport = customerErrorCheck(commonConfig, desc, stack, _bindInstanceProperty(_context2 = me.debugLogger).call(_context2, me));

              if (!!isNeedReport === false) {
                me.debugLogger("config.record.js_error_report_config.checkErrorNeedReport\u8FD4\u56DE\u503C\u4E3Afalse, \u8DF3\u8FC7\u6B64\u7C7B\u9519\u8BEF, \u9875\u9762\u62A5\u9519\u4FE1\u606F\u4E3A=>", {
                  desc: desc,
                  stack: stack
                });
                continue;
              }

              var errorName = '页面报错_' + JS_TRACKER_ERROR_DISPLAY_MAP[type];
              var _location = window.location;
              me.debugLogger('[自动]捕捉到页面错误, 发送打点数据, 上报内容 => ', {
                error_no: errorName,
                url: _concatInstanceProperty(_context3 = "".concat(_location.host)).call(_context3, _location.pathname),
                desc: desc,
                stack: stack
              });
              me.log('error', 7, {
                error_no: errorName,
                url: _location.href
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
      }); // 页面性能统计

      _bindInstanceProperty(_context4 = performanceTracker.init).call(_context4, me)(me.log); // promise错误统计


      _bindInstanceProperty(_context5 = promiseTracker.init).call(_context5, me)(me.notify); // 用户在线时长统计


      _bindInstanceProperty(_context6 = timeonpageTracker.init).call(_context6, me)(me.product);
    }
  }, {
    key: "send",
    value: function send() {
      var _context8;

      var info = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var location = window.location;
      var pageType = location.href;

      var getPageTypeFunc = _.get(commonConfig, ['getPageType'], _.get(DEFAULT_CONFIG, ['getPageType']));

      try {
        pageType = '' + getPageTypeFunc(location);
      } catch (e) {
        var _context7;

        this.debugLogger("config.getPageType\u6267\u884C\u65F6\u53D1\u751F\u5F02\u5E38, \u8BF7\u6CE8\u610F, \u9519\u8BEF\u4FE1\u606F=>", {
          e: e,
          location: location
        });
        pageType = _concatInstanceProperty(_context7 = "".concat(location.host)).call(_context7, location.pathname);
      }

      info = _Object$assign({
        type: '',
        common: _objectSpread({}, commonConfig, {
          timestamp: _Date$now(),
          runtime_version: commonConfig.version,
          sdk_version: sdkConf.version,
          page_type: pageType
        })
      }, info); // 图片打点

      var img = new window.Image();
      img.src = _concatInstanceProperty(_context8 = "".concat(TARGET, "?d=")).call(_context8, encodeURIComponent(_JSON$stringify(info)));
    }
    /**
     * 打点数据上报方法
     * @param {类型} type
     * @param {code码} code
     * @param {消费数据} detail
     * @param {展示数据} extra
     */

  }, {
    key: "log",
    value: function log() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var code = arguments.length > 1 ? arguments[1] : undefined;
      var detail = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var extra = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var errorMsg = validLog(commonConfig, type, code, detail, extra);

      if (errorMsg) {
        clog(errorMsg);
        return errorMsg;
      }

      var logInfo = {
        type: type,
        code: code,
        extra: extra,
        detail: detailAdapter(code, detail)
      };
      this.send(logInfo);
    }
  }, {
    key: "error",
    value: function error(code, detail, extra) {
      return this.log('error', code, detail, extra);
    }
  }, {
    key: "product",
    value: function product(code, detail, extra) {
      return this.log('product', code, detail, extra);
    }
  }, {
    key: "info",
    value: function info(code, detail, extra) {
      return this.log('info', code, detail, extra);
    }
  }, {
    key: "debugLogger",
    value: function debugLogger() {
      var _console;

      // 只有在测试时才打印log
      if (this.isTest) (_console = console).log.apply(_console, arguments);
    }
  }]);

  return Base;
}();

var Logger =
/*#__PURE__*/
function (_Base) {
  _inherits(Logger, _Base);

  function Logger() {
    _classCallCheck(this, Logger);

    return _possibleConstructorReturn(this, _getPrototypeOf(Logger).call(this));
  }

  _createClass(Logger, [{
    key: "set",
    value: function set() {
      var _get2, _context11;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      (_get2 = _get(_getPrototypeOf(Logger.prototype), "init", this)).call.apply(_get2, _concatInstanceProperty(_context11 = [this]).call(_context11, args));
    }
    /**
     * 用户行为监控
     * @param {String} code [必填]用户行为标识符, 用于唯一判定用户行为类型, 最多50字符( menu/click/button_1/button_2/etc)
     * @param {String} name [必填]用户行为名称, 和code对应, 用于展示, 最多50字符
     * @param {String} url  [可选]用户点击页面url, 可以作为辅助信息, 最多200字符
     */

  }, {
    key: "behavior",
    value: function behavior() {
      var code = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
      var url = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
      this.debugLogger('发送用户点击行为埋点, 上报内容 => ', {
        code: code,
        name: name,
        url: url
      });
      this.product(10002, {
        code: code,
        name: name,
        url: url
      });
    }
  }, {
    key: "notify",
    value: function notify() {
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
        var _context12;

        detail['error_name'] = _sliceInstanceProperty(_context12 = detail['error_name']).call(_context12, 0, 200);
        this.debugLogger('error_name长度不能超过200字符, 自动截断. 截断后为=>', detail['error_name']);
      }

      if (detail['url'].length > 200) {
        var _context13;

        detail['url'] = _sliceInstanceProperty(_context13 = detail['url']).call(_context13, 0, 200);
        this.debugLogger('url长度不能超过200字符, 自动截断. 截断后为=>', detail['error_name']);
      }

      for (var _i = 0, _arr = ['http_code', 'during_ms', 'request_size_b', 'response_size_b']; _i < _arr.length; _i++) {
        var intKey = _arr[_i];

        if (_.has(extraInfo, [intKey])) {
          var code = _parseInt(extraInfo[intKey]);

          if (isNaN(code) === false) {
            detail[intKey] = code;
          } else {
            detail[intKey] = 0; // 赋上默认值
          }
        }
      } // 将rawDetail中的其余key存到extra中


      for (var _i2 = 0, _Object$keys2 = _Object$keys(extraInfo); _i2 < _Object$keys2.length; _i2++) {
        var extraKey = _Object$keys2[_i2];
        var protectKeyMap = {
          error_no: true,
          error_name: true,
          url: true,
          http_code: true,
          during_ms: true,
          request_size_b: true,
          response_size_b: true
        };

        if (protectKeyMap[extraKey] !== true) {
          extra[extraKey] = extraInfo[extraKey];
        }
      }

      this.debugLogger('发送自定义错误数据, 上报内容 => ', {
        detail: detail,
        extra: extra
      });
      return this.error(8, detail, extra);
    }
    /**
     * 提供通用的埋点方法
     * @param {String} name
     * @param {*} args
     */

  }, {
    key: "logger",
    value: function logger() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var extra = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      if (!name) return this.debugLogger('警告: 未设置【name】(打点事件名)属性, 无法统计该打点数据！');
      if (typeof name !== 'string') return this.debugLogger('【name属性】(打点事件名)仅支持字符串类型！');
      this.debugLogger("\u53D1\u9001\u3010event\u3011\u7C7B\u578B\u57CB\u70B9\uFF0C\u4E8B\u4EF6\u540D\uFF1A\u3010".concat(name, "\u3011. \u4E0A\u62A5\u5185\u5BB9 => "), args);
      this.send({
        type: 'event',
        name: name,
        props: _objectSpread({}, args),
        extra: extra
      });
    }
    /**
     * 白屏检测功能API
     * @param {*} target     需要监测DOM变动的节点
     * @param {*} notify     【必填】错误上报的配置
     * @param {*} config     【可选】监测配置
     * @param {*} cb         【可选】需要执行的业务回调
     *
     * @returns {Instance of MutationObserver} 返回MutationObserver的实例，业务可根据需要调用disconnect方法来关闭监测
     */

  }, {
    key: "detect",
    value: function detect() {
      var _context14,
          _this = this;

      var target = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document.documentElement;
      var notify = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var cb = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : noop;

      if (_.isFunction(config)) {
        cb = config;
        config = {};
      }

      var _notify$errorName = notify.errorName,
          errorName = _notify$errorName === void 0 ? '加载页面异常_WhiteScreen' : _notify$errorName,
          _notify$url = notify.url,
          url = _notify$url === void 0 ? _concatInstanceProperty(_context14 = "".concat(location.host)).call(_context14, location.pathname) : _notify$url,
          _notify$extraInfo = notify.extraInfo,
          extraInfo = _notify$extraInfo === void 0 ? {} : _notify$extraInfo;
      var CONF = {
        subtree: true,
        childList: true,
        attributes: false,
        characterData: false,
        timeout: 5 * 1000
      };
      config = _.merge(CONF, config);
      this.debugLogger("\u767D\u5C4F\u68C0\u6D4B\u914D\u7F6E: ====>", config, cb);

      if (!isDom(target)) {
        clog('param [target] must be a instance of HTMLElement');
        return;
      }

      var _config = config,
          _config$timeout = _config.timeout,
          timeout = _config$timeout === void 0 ? 5 * 1000 : _config$timeout,
          _config$childList = _config.childList,
          childList = _config$childList === void 0 ? true : _config$childList,
          _config$attributes = _config.attributes,
          attributes = _config$attributes === void 0 ? false : _config$attributes,
          _config$characterData = _config.characterData,
          characterData = _config$characterData === void 0 ? false : _config$characterData;

      if (!(attributes || childList || characterData)) {
        clog("attributes childList characterData\u914D\u7F6E\u4E0D\u5408\u6CD5, \u8DF3\u8FC7\u767D\u5C4F\u68C0\u6D4B");
        return;
      }

      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
      if (!MutationObserver) return clog('您的浏览器不支持 MutationObserver API, 跳过白屏检测'); // 超过设置的超时时间后，执行该逻辑，上报白屏错误

      var timer = _setTimeout(function () {
        _this.notify(errorName, url, extraInfo);

        _.isFunction(cb) && cb(mo);
      }, timeout);

      var mo = void 0;

      var callback = function callback(records) {
        clearTimeout(timer);
        _.isFunction(cb) && cb(mo, records);
      };

      mo = new MutationObserver(callback);
      mo.observe(target, config);
      return mo;
    }
  }]);

  return Logger;
}(Base);

var logger = new Logger(); // 注册项目名: dt => downtown

window.dt = logger;
export var Elog = _bindInstanceProperty(_context15 = logger.error).call(_context15, logger);
export var Plog = _bindInstanceProperty(_context16 = logger.product).call(_context16, logger);
export var Ilog = _bindInstanceProperty(_context17 = logger.info).call(_context17, logger);
export default logger;