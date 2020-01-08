import _slicedToArray from "@babel/runtime-corejs3/helpers/esm/slicedToArray";
import hookAnyThing from './hook_any_thing';
var orgXMLHttpRequest = window.XMLHttpRequest;
/**
 * 创建 proxyXMLHttpRequest
 * @param orXMLHttpRequestƒƒ
 */

export default function createProxyXMLHttpRequest(requestAction, responseAction) {
  return function () {
    var xhr = new orgXMLHttpRequest();

    function onload(args, oriFunc) {
      if (this.readyState === 4) {
        responseAction();
      } // 在等于4得时候发送消息到存储中去


      oriFunc(args);
    }

    return hookAnyThing.call(this, xhr, {
      open: function open(args, oriFunc) {
        // 这里计入请求发送队列，对并发得请求数做限制，最大不超过5个请求同时发送
        var _args = _slicedToArray(args, 2),
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