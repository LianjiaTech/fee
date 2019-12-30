"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty2 = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty2(exports, "__esModule", {
  value: true
});

exports.default = hookAnyThing;

var _defineProperty = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/define-property"));

/**
 * hooks any thing
 * @param ori
 * @param hooks :{
 *   key:function 或者是 { set:function  ，get:function }
 */
function hookAnyThing(ori, hooks) {
  for (var key in ori) {
    var hook = hooks[key];

    if (typeof ori[key] === 'function') {
      hookFunction.call(this, key, ori, hook);
      continue;
    } // 不是方法的话肯定就是普通的值了


    hookOther.call(this, key, ori, hook);
  }

  return this;
}
/**
 * hook function
 * @param key
 * @param ori
 * @param hookFunc
 */


function hookFunction(key, ori, hookFunc) {
  this[key] = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (typeof hookFunc !== 'function') {
      return ori[key].apply(ori, args);
    }

    return hookFunc.call(this, args, function (args) {
      return ori[key].apply(ori, args);
    });
  };
}
/**
 * hook 非特殊值得
 * @param key
 * @param ori
 * @param hookFunc
 */


function hookOther(key, ori) {
  var hookFunc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var enumerable = ori.propertyIsEnumerable(key);
  var set, get;

  if (typeof hookFunc === 'function') {
    set = function set(val) {
      ori[key] = function () {
        var _this = this;

        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        hookFunc.call(this, args, function (args) {
          return val.apply(_this, args);
        });
      };
    };

    get = function get() {
      return ori[key];
    };
  } else {
    var setFunc = hookFunc.set,
        getFunc = hookFunc.get;

    set = function set(val) {
      if (setFunc) {
        setFunc.call(this, val, function (val) {
          return ori[key] = val;
        });
      } else {
        ori[key] = val;
      }
    };

    get = function get() {
      if (getFunc) {
        return getFunc.call(this, function () {
          return ori[key];
        });
      } else {
        return ori[key];
      }
    };
  }

  (0, _defineProperty.default)(this, key, {
    enumerable: enumerable,
    set: set,
    get: get
  });
}