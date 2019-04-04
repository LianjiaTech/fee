import axios, { CancelToken } from 'axios'
// import { ToolTip } from 'BizUtil'

// axios.defaults.baseURL = '/api';
axios.defaults.headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json', // application/x-www-form-urlencoded,
  'X-Requested-With': 'XMLHttpRequest'
}
axios.defaults.timeout = 3000

const promiseMap = {}

const getRequestKey = (config) => {
  const {url, method, data, params} = config

  // axios把参数转成了字符串
  const dataStr = method === 'post' ? data : params
  return `${url}-${typeof dataStr === 'object' ? JSON.stringify(dataStr) : dataStr}`
}

const deduplication = (config, cancel) => {
  const flagUrl = getRequestKey(config)
  if (promiseMap[flagUrl]) {
    typeof cancel === 'function' && cancel('取消重复请求')
  } else {
    promiseMap[flagUrl] = true
  }
}

// 请求时的拦截器
axios.interceptors.request.use(config => {
  const {onlyOne, beforeSend} = config
  // 请求去重
  if (onlyOne) {
    config.cancelToken = new CancelToken((c) => {
      deduplication(config, c)
    })
  }

  typeof beforeSend === 'function' && beforeSend(config)

  // 发送请求之前做一些处理,loading...
  return config
}, error => {
  // 当请求异常时做一些处理
  return Promise.reject(error)
})

const statusMsgMap = {
  400: '错误请求',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求错误,未找到该资源',
  405: '请求方法未允许',
  408: '请求超时',
  500: '服务器端出错',
  501: '网络未实现',
  502: '网络错误',
  503: '服务不可用',
  504: '网络超时',
  505: 'http版本不支持该请求'
}

// 请求完成后的拦截器
axios.interceptors.response.use(response => {
  // 返回响应时做一些处理

  // 这里的return response返回的是一个对象, 内容如下:
  // {
  //      config: {}        // axios 的配置
  //      data: { },        // 服务器提供的响应
  //      headers: {},      // 服务器响应头
  //      request: {}       // 服务器请求头
  //      status: 200,      // 服务器响应的HTTP状态代码
  //      statusText: 'OK', // 服务器响应的HTTP状态消息
  // }
  return response
}, (error = {}) => {
  /**
   * 取消请求error信息中只有message
   * 超时或错误请求地址时，response是没有值的
   */
  const {
    code,
    config = {},
    message,
    // request,
    response // 有的时候没有值，如超时或错误请求地址
    //   stack:''
  } = error

  // 只有message(取消请求)
  const keys = Object.keys(error)
  if (keys.length === 1 && keys[0] === 'message') {
    return {
      data: {
        code: 777,
        data: '',
        msg: error.message
      }
    }
  }

  if (response) {
    const {status, statusText} = response
    error.response.data = {
      code: status,
      data: '',
      msg: statusMsgMap[status] || statusText
    }
  } else {
    const {
      retryDelay,
      autoRetry
    } = config

    // 没有response则将错误信息补全
    error.response = {
      data: {
        code: code || 777,
        data: '',
        msg: message
      }
    }

    // 超时信息重试逻辑 code:"ECONNABORTED" // timeout of 10000ms exceeded
    if (code === 'ECONNABORTED' && message.indexOf('timeout') > -1 && autoRetry) {
      // 超时重试不算重复请求
      promiseMap[getRequestKey(config)] = false
      // init retryCount
      config.retryCount = config.retryCount || 0
      // 超出重试次数
      if (config.retryCount < autoRetry) {
        // Increase the retry count
        config.retryCount += 1
        // 指数退避
        const backoff = new Promise((resolve) => {
          setTimeout(() => {
            resolve()
          }, config.retryCoun * retryDelay)
        })
        // 原配置重新请求
        return backoff.then(() => {
          return axios(config)
        })
      }
    }
  }
  return error.response
})

/**
 * 网络请求的工具类
 */
export default class Request {
  static fetch ({data, ...opts}) {
    const defaultOpts = {
      url: '',
      method: 'get',
      [opts.method === 'get' ? 'params' : 'data']: data,
      // 通用错处理
      useGeneralHandle: true,
      // 防止重复请求
      onlyOne: true,
      // 取消token
      cancelToken: this.getSource().token,
      // 自动重试次数
      autoRetry: 0,
      // 自动重试延时
      retryDelay: 1000,
      // headers
      headers: axios.defaults.headers,
      timeout: 10000,
      ...opts
    }

    // 过滤字端
    Object.keys(defaultOpts).forEach(key => {
      if (!opts[key]) {
        delete opts[key]
      }
    })

    return axios(defaultOpts).then(response => {
      // responseData为后端返回数据
      // {
      //   code: 0,
      //   msg: '错误信息',
      //   data: null,
      // }
      const {data: responseData} = response
      // 回收promise
      delete promiseMap[getRequestKey(defaultOpts)]
      if (defaultOpts.useGeneralHandle) {
        if (responseData.code === 0) {
          // 返回业务数据
          return responseData.data
        }
        // 提示后端错误信息
        // ToolTip.show({ text: responseData.msg })
      } else {
        return response
      }
    })
  }

  static get (opts = {}) {
    return this.fetch({
      method: 'get',
      ...opts
    })
  }

  static post (opts = {}) {
    return this.fetch({
      method: 'post',
      ...opts
    })
  }

  static getSource () {
    return CancelToken.source()
  }
}
