import _Promise from "@babel/runtime-corejs3/core-js/promise";
var orgFetch = window.fetch;
/**
 * 创建fetch的proxy
 * @param requestAction
 * @param responseAction
 */

export default function createFetchProxy(requestAction, responseAction) {
  if (!orgFetch) {
    return;
  }

  window.fetch = function (url, params) {
    requestAction(url, params);
    return new _Promise(function (resolve, reject) {
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