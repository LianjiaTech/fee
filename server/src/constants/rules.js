export let Rules = { 
  // DNS查询耗时
  dns_lookup_ms: {
    name: 'DNS查询耗时',
    start: 'domainLookupStart',
    end: 'domainLookupEnd'
  },
  // TCP链接耗时
  tcp_connect_ms: {
    name: 'TCP链接耗时',
    start: 'connectStart',
    end: 'connectEnd'
  },
  // 请求响应耗时
  response_request_ms: {
    name: '请求响应耗时',
    start: 'requestStart',
    end: 'responseStart'
  },
  // 内容传输耗时
  response_transfer_ms: {
    name: '内容传输耗时',
    start: 'responseStart',
    end: 'responseEnd'
  },
  // DOM解析时间
  dom_parse_ms: {
    name: 'DOM解析耗时',
    start: 'responseEnd',
    end: 'domInteractive'
  },
  // 资源加载耗时
  load_resource_ms: {
    name: '资源加载耗时',
    start: 'domContentLoadedEventEnd',
    end: 'loadEventStart'
  },
  // ssl仅https
  ssl_connect_ms: {
    name: 'SSL连接耗时'
  },
  // 首包时间
  first_tcp_ms: {
    name: '首包时间耗时',
    start: 'domainLookupStart',
    end: 'responseStart'
  },
  // 首次渲染耗时
  first_render_ms: {
    name: '首次渲染耗时',
    start: 'fetchStart',
    end: 'responseEnd'
  },
  // 首次可交互耗时
  first_response_ms: {
    name: '首次可交互耗时',
    start: 'fetchStart',
    end: 'domInteractive'
  },
  // DOM_READY_耗时
  dom_ready_ms: {
    name: 'DOM_READY_耗时',
    start: 'fetchStart',
    end: 'domContentLoadedEventEnd'
  },
  // 页面完全加载耗时
  load_complete_ms: {
    name: '页面完全加载耗时',
    start: 'fetchStart',
    end: 'loadEventStart'
  },
  // 页面首屏加载耗时
  first_screen_ms: {
    name: '页面首屏加载耗时',
    start: 'navigationStart',
    end: 'firstScreenLoadingTime'
  }
}