/** @format */

export const COOKIE_NAME_DIVICE_ID = 'crosSdkDT2019DeviceId'

export const TARGET = 'https://test.com/dig' // 打点服务器，或Nginx地址

// pid string 工程id:platfe_saas
// uuid string 用户信息
// ucid string 用户信息
// ssid string 用户信息
// mac string mac地址

// 测试标记符
export const TEST_FLAG = 'b47ca710747e96f1c523ebab8022c19e9abaa56b'

export const LOG_TYPE_ERROR = 'error' // 错误日志
export const LOG_TYPE_PRODUCT = 'product' // 产品指标
export const LOG_TYPE_INFO = 'info' // 尚未使用
export const LOG_TYPE_PERFORMANCE = 'perf' // 性能指标

// 定义JS_TRACKER错误类型码
export const JS_TRACKER_ERROR_CONSTANT_MAP = {
  1: 'ERROR_RUNTIME',
  2: 'ERROR_SCRIPT',
  3: 'ERROR_STYLE',
  4: 'ERROR_IMAGE',
  5: 'ERROR_AUDIO',
  6: 'ERROR_VIDEO',
  7: 'ERROR_CONSOLE',
  8: 'ERROR_TRY_CATCH'
}

export const JS_TRACKER_ERROR_DISPLAY_MAP = {
  1: 'JS_RUNTIME_ERROR',
  2: 'SCRIPT_LOAD_ERROR',
  3: 'CSS_LOAD_ERROR',
  4: 'IMAGE_LOAD_ERROR',
  5: 'AUDIO_LOAD_ERROR',
  6: 'VIDEO_LOAD_ERROR',
  7: 'CONSOLE_ERROR',
  8: 'TRY_CATCH_ERROR'
}

// 默认配置
export const DEFAULT_CONFIG = {
  pid: '', // [必填]项目id, 由灯塔项目组统一分配
  uuid: '', // [可选]设备唯一id, 默认由sdk自动生成. 用于计算uv数&设备分布.
  ucid: '', // [可选]用户ucid, 用于发生异常时追踪用户信息, 一般在cookie中可以取到, 没有可传空字符串

  is_test: false, // 是否为测试数据, 默认为false(测试模式下打点数据仅供浏览, 不会展示在系统中)
  record: {
    time_on_page: true, // 是否监控用户在线时长数据, 默认为true
    performance: true, // 是否监控页面载入性能, 默认为true
    js_error: true, //  是否监控页面报错信息, 默认为true
    // 配置需要监控的页面报错类别, 仅在js_error为true时生效, 默认均为true(可以将配置改为false, 以屏蔽不需要上报的错误类别)
    js_error_report_config: {
      ERROR_RUNTIME: true, // js运行时报错
      ERROR_SCRIPT: true, // js资源加载失败
      ERROR_STYLE: true, // css资源加载失败
      ERROR_IMAGE: true, // 图片资源加载失败
      ERROR_AUDIO: true, // 音频资源加载失败
      ERROR_VIDEO: true, // 视频资源加载失败
      ERROR_CONSOLE: true, // vue运行时报错
      ERROR_TRY_CATCH: true, // 未catch错误
      // 自定义检测函数, 判断是否需要报告该错误
      checkErrorNeedReport: (desc = '', stack = '') => desc + stack
    }
  },

  // 业务方的js版本号, 会随着打点数据一起上传, 方便区分数据来源
  // 可以不填, 默认为1.0.0
  version: '1.0.0',

  // 对于如同
  // xxx.com/detail/1.html
  // xxx.com/detail/2.html
  // xxx.com/detail/3.html
  // ...
  // 这种页面来说, 虽然url不同, 但他们本质上是同一个页面
  // 因此需要业务方传入一个处理函数, 根据当前url解析出真实的页面类型(例如: 二手房列表/经纪人详情页), 以便灯塔系统对错误来源进行分类
  // getPageType函数执行时会被传入一个location对象, 业务方需要完成该函数, 返回对应的的页面类型(50字以内, 建议返回汉字, 方便查看), 默认是返回当前页面的url
  getPageType: (location = window.location) => {
    return `${location.host}${location.pathname}`
  }
}
