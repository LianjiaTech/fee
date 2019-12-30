const orgFetch = window.fetch

/**
 * 创建fetch的proxy
 * @param requestAction
 * @param responseAction
 */
export default function createFetchProxy (requestAction, responseAction) {
  if (!orgFetch) {
    return
  }
  window.fetch = function (url, params) {
    requestAction(url, params)
    return new Promise((resolve, reject) => {
      orgFetch(url, params).then((res) => {
        responseAction()
        return resolve(res)
      }).catch(e => {
        responseAction()
        return reject(e)
      })
    })
  }
}
