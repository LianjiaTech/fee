"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = _default;

var _fetch = _interopRequireDefault(require("./fetch"));

var _xhr = _interopRequireDefault(require("./xhr"));

function _default(beforeAction, afterAction) {
  (0, _fetch.default)(beforeAction, afterAction);
  (0, _xhr.default)(beforeAction, afterAction);
}