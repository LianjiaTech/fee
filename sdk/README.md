# 发版Check List
- [ ] 目前有两处修改版本号的地方, config/index.js & package.json, 两处版本号是否统一

# 安装与使用
使用项目中自带的SDK包，引入进行打点
```js
import dt from 'sdk';

// 初始化配置
dt.set({
  pid: 'project_id', // [必填]项目id, 由灯塔项目组统一分配
  uuid: '', // [可选]设备唯一id, 用于计算uv数&设备分布. 一般在cookie中可以取到, 没有uuid可用设备mac/idfa/imei替代. 或者在storage的key中存入随机数字, 模拟设备唯一id.
  ucid: '', // [可选]用户ucid, 用于发生异常时追踪用户信息, 一般在cookie中可以取到, 没有可传空字符串

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
      // 自定义检测函数, 上报前最后判断是否需要报告该错误
      // 回调函数说明
      // 传入参数 => 
      //            desc:  字符串, 错误描述
      //            stack: 字符串, 错误堆栈信息
      // 返回值 =>  
      //            true  : 上报打点请求
      //            false : 不需要上报
      checkErrrorNeedReport: function(desc, stack){
        return true
      }
    }
  },

  // 业务方的js版本号, 会随着打点数据一起上传, 方便区分数据来源
  // 可以不填, 默认为1.0.0
  version: '1.0.0',

  // 对于如同
  // test.com/detail/1.html
  // test.com/detail/2.html
  // test.com/detail/3.html
  // ...
  // 这种页面来说, 虽然url不同, 但他们本质上是同一个页面
  // 因此需要业务方传入一个处理函数, 根据当前url解析出真实的页面类型(例如: 二手房列表/经纪人详情页), 以便灯塔系统对错误来源进行分类
  // 回调函数说明
  // 传入参数 => window.location
  // 返回值 => 对应的的页面类型(50字以内, 建议返回汉字, 方便查看), 默认是返回当前页面的url
  getPageType: function(location){ return `${location.host}${location.pathname}` }
})

```

script标签引入 =>
```html
<script>
  window.dt && dt.set({
    pid: 'project_id', // [必填]项目id, 由灯塔项目组统一分配
    uuid: '', // [可选]设备唯一id, 用于计算uv数&设备分布. 一般在cookie中可以取到, 没有uuid可用设备mac/idfa/imei替代. 或者在storage的key中存入随机数字, 模拟设备唯一id.
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
        // 自定义检测函数, 上报前最后判断是否需要报告该错误
        // 回调函数说明
        // 传入参数 => 
        //            desc:  字符串, 错误描述
        //            stack: 字符串, 错误堆栈信息
        // 返回值 =>  
        //            true  : 上报打点请求
        //            false : 不需要上报
        checkErrrorNeedReport: function(desc, stack){
          return true
        }
      }
    },

    // 业务方的js版本号, 会随着打点数据一起上传, 方便区分数据来源
    // 可以不填, 默认为1.0.0
    version: '1.0.0',

    // 对于如同
    // test.com/detail/1.html
    // test.com/detail/2.html
    // test.com/detail/3.html
    // ...
    // 这种页面来说, 虽然url不同, 但他们本质上是同一个页面
    // 因此需要业务方传入一个处理函数, 根据当前url解析出真实的页面类型(例如: 二手房列表/经纪人详情页), 以便灯塔系统对错误来源进行分类
    // 回调函数说明
    // 传入参数 => window.location
    // 返回值 => 对应的的页面类型(50字以内, 建议返回汉字, 方便查看), 默认是返回当前页面的url
    getPageType: function(location){ return `${location.host}${location.pathname}` }
  })
</script>

```

# 自动错误监控使用说明

浏览器中对脚本报错信息有跨域限制, 通过标签引入js时, 需要在所有要监控的script标签中添加 `crossorigin="anonymous"` 属性后, 才能获取到错误堆栈数据, 否则只能看到`Script error`的提示

参考: [FunDebug: Script error.解决方法](https://blog.fundebug.com/2017/04/07/solve-script-error/)

# 主动打点方法说明

##  产品指标
```js
/**
 * 用户点击行为上报，用于统计菜单点击量
 * @param {String}  clickBehavior [必填]用户行为标识符, 用于统计菜单点击量 , 最多50字符( menu/click/button/...)
 * @param {String} name [必填]用户行为名称, 和clickBehavior对应, 用于展示, 建议传中文, 最多50字符
 * @param {String} url  [可选]用户点击页面url, 可以作为辅助信息, 最多200字符
 */
dt.behavior(clickBehaviorType, name, url)

//demo:
dt.behavior(
'/abnormal_monitor/error_dashboard',
'灯塔-页面性能',
window.location.href
)


/**
 * JS错误主动上报接口
 * @param {String} errorName 错误类型, 推荐格式 => "错误类型(中文)_${具体错误名}", 最长200字
 * @param {String} url       错误对应的url,  location.host + location.pathname, 不包括get参数(get参数可以转成json后放在detail中), 最长200个字
 * @param {Object} extraInfo 附属信息, 默认为空对象
 *                 => extraInfo 中以下字段填写后可以在后台错误日志列表中直接展示
 *                 =>        trace_url         // [String]请求对应的trace系统查看地址, 例如: trace系统url + trace_id
 *                 =>        http_code         // [Number]接口响应的Http状态码，
 *                 =>        during_ms         // [Number]接口响应时长(毫秒)
 *                 =>        request_size_b    // [Number]post参数体积, 单位b
 *                 =>        response_size_b   // [Number]响应值体积, 单位b
 *                 => 其余字段会作为补充信息进行展示
 */
function notify (errorName = '', url = '', extraInfo = {}) 

// demo：
dt.notify(
  'response code',         // 错误名, 不能超过200个字符
  'a.b.com',               // url地址, 不能超过200个字符
  {
   // 下列字段填写后会被统一展示 
   'trace_url':'trace.test.com/123456',
   'http_code':200,        
   'during_ms':10,         
   'request_size_b':1024,  
   'response_size_b':1024, 
   
   // 以下字段作为补充说明进行展示
   ... // 任意 key => value
  })
```


# 如何确认埋点成功？
通过Chrome或Charles等工具拦截URL为`https://dig.xtest.com/fee.gif`开头的网络请求,查看请求参数是否携带埋点信息

例如这个URL:
[点我](https://dig.xxtest.com/fee.gif?d=%7B%22type%22%3A%22error%22%2C%22code%22%3A3%2C%22detail%22%3A%7B%22error_no%22%3A122%2C%22http_code%22%3A%22%22%2C%22during_ms%22%3A%22%22%2C%22url%22%3A%22a.b.c%22%2C%22request_size_b%22%3A%22%22%2C%22response_size_b%22%3A%22%22%2C%22reason%22%3A%22ERR_BLOCKED_BY_CLIENT%22%7D%2C%22extra%22%3A%7B%7D%2C%22common%22%3A%7B%22pid%22%3A%22platfe_saas%22%2C%22uuid%22%3A%22f770330d-b2c7-4bfa-94fb-b31338f65a85%22%2C%22ssid%22%3A%22df9c0245-005d-479c-81e0-7daa94c0681d%22%2C%22ucid%22%3A1000000023100106%2C%22timestamp%22%3A1537431733127%7D%2C%22msg%22%3A%22%22%7D)

对应打点信息为
```json
d: {
  "type": "error",
  "code": 3,
  "detail": {
    "error_no": 122,
    "http_code": "",
    "during_ms": "",
    "url": "a.b.c",
    "request_size_b": "",
    "response_size_b": "",
    "reason": "ERR_BLOCKED_BY_CLIENT"
  },
  "extra": {},
  "common": {
    "pid": "platfe",
    "uuid": "f770330d-b2c7-4bfa-94fb-b31338f65a85",
    "ssid": "df9c0245-005d-479c-81e0-7daa94c0681d",
    "ucid": 1000000023100106,
    "timestamp": 1537431733127
  },
  "msg": ""
}
```
# 数据更新周期

<table>
<thead>
<th>数据项</th>
<th>更新周期</th>
</thead>
<tbody>
<tr>
  <td>页面异常</td>
  <td>5分钟</td>
</tr>
<tr>
  <td>页面性能指标</td>
  <td>15分钟</td>
</tr>
<tr>
  <td>用户停留时长</td>
  <td>15分钟</td>
</tr>
<tr>
  <td>新用户数</td>
  <td>1小时</td>
</tr>
<tr>
  <td>设备数据</td>
  <td>1小时</td>
</tr>
<tr>
  <td>新用户数</td>
  <td>1小时</td>
</tr>
<tr>
  <td>终端:操作系统分布</td>
  <td>6小时</td>
</tr>
<tr>
  <td>终端:设备分布</td>
  <td>6小时</td>
</tr>
<tr>
  <td>终端:浏览器分布</td>
  <td>6小时</td>
</tr>
</tbody>
</table>