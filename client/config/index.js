const ENV_DEV = 'development'
const ENV_PRODUCTION = 'production'
let _ = require('lodash')
let path = require('path')
const ChildProcess = require('child_process')

// 获取版本库最新tag值

let version
try {
  let lastGitTagHash = ChildProcess.execSync('git rev-list --tags --max-count=1')
    .toString().trim()
  console.log('last git tag hash => ')
  console.log(lastGitTagHash)
  let lastGitTag = ChildProcess.execSync(`git describe --tags ${lastGitTagHash}`)
    .toString().trim()
  console.log('last git tag => ')
  console.log(lastGitTag)
  version = lastGitTag
} catch (e) {
  version = '1.0.0'
}
// 配置开发者的debug
let debug = {}
if (process.env.IS_DEBUG) {
  try {
    debug = require('./debug.js')
    console.log('成功载入debug文件,debug配置为 => ')
    console.log(debug)
  } catch (e) {
    debug = {}
  }
}

module.exports = {
  project: {
    name: 'fee-fe',
    version: version,
    entry: { index: './src/main.js' }
  },
  build: {
    // 服务器端配置
    env: ENV_PRODUCTION,
    index: path.resolve(__dirname, '../dist/index.html'),
    assetsSubDirectory: './', // 子文件夹前缀
    assetsPublicPath: '/', // 静态地址前缀，根据cdn环境配置改变
    bundleAnalyzerReport: process.env.npm_config_report
  },
  dev: {
    // 本地调试配置
    env: ENV_DEV,
    port: _.get(debug, ['dev', 'port'], '8080'), // 调试地址端口
    assetsSubDirectory: '.', // 子文件夹前缀
    assetsPublicPath: '/'
  },
  localServer: {
    filter: function (pathname, req) {
      // 本地调试vue的时候会有跨域问题，所以这里自定义一个过滤器进行检测，命中规则就自动转发到接口地址上去
      // 检测是否有接口标志关键字，有的话就转发过去
      return pathname.indexOf('/api/') !== -1
    },
    host: {
      target: _.get(debug, ['localServer', 'host', 'target'], 'http://localhost:3000'), // 本地mock服务器地址
      changeOrigin: true, // needed for virtual hosted sites
      ws: true // proxy websockets
    }
  }
}
