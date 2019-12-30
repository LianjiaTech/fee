import hookAnyThing from './hook_any_thing'

const orgXMLHttpRequest = window.XMLHttpRequest

/**
 * 创建 proxyXMLHttpRequest
 * @param orXMLHttpRequestƒƒ
 */
export default function createProxyXMLHttpRequest (requestAction, responseAction) {
  return function () {
    const xhr = new orgXMLHttpRequest()
    function onload (args, oriFunc) {
      if (this.readyState === 4) {
        responseAction()
      }
      // 在等于4得时候发送消息到存储中去
      oriFunc(args)
    }
    return hookAnyThing.call(this, xhr, {
      open (args, oriFunc) {
        // 这里计入请求发送队列，对并发得请求数做限制，最大不超过5个请求同时发送
        const [method, url] = args
        requestAction(url, method)
        oriFunc(args)
      },
      onreadystatechange: onload,
      onload
    })
  }
}