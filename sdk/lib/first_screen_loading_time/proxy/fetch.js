"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = createFetchProxy;

var _promise = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/promise"));

var orgFetch = window.fetch;
/**
 * 创建fetch的proxy
 * @param requestAction
 * @param responseAction
 */

function createFetchProxy(requestAction, responseAction) {
  if (!orgFetch) {
    return;
  }

  window.fetch = function (url, params) {
    requestAction(url, params);
    return new _promise.default(function (resolve, reject) {
      orgFetch(url, params).then(function (res) {
        responseAction();
        return resolve(res);
      }).catch(function (e) {
        responseAction();
        return reject(e);
      });
    });
  };
}