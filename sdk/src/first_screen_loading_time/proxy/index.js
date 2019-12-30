import proxyFetch from './fetch'
import proxyXhr from './xhr'

export default function (beforeAction, afterAction) {
  proxyFetch(beforeAction, afterAction)
  proxyXhr(beforeAction, afterAction)
}
