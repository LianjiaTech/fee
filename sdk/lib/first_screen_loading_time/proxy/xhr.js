"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.default = createProxyXMLHttpRequest;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/slicedToArray"));

var _hook_any_thing = _interopRequireDefault(require("./hook_any_thing"));

var orgXMLHttpRequest = window.XMLHttpRequest;
/**
 * 创建 proxyXMLHttpRequest
 * @param orXMLHttpRequestƒƒ
 */

function createProxyXMLHttpRequest(requestAction, responseAction) {
  return function () {
    var xhr = new orgXMLHttpRequest();

    function onload(args, oriFunc) {
      if (this.readyState === 4) {
        responseAction();
      } // 在等于4得时候发送消息到存储中去


      oriFunc(args);
    }

    return _hook_any_thing.default.call(this, xhr, {
      open: function open(args, oriFunc) {
        // 这里计入请求发送队列，对并发得请求数做限制，最大不超过5个请求同时发送
        var _args = (0, _slicedToArray2.default)(args, 2),
            method = _args[0],
            url = _args[1];

        requestAction(url, method);
        oriFunc(args);
      },
      onreadystatechange: onload,
      onload: onload
    });
  };
}