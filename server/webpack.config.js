// 该文件本身没用
// 只是利用 webstorm 对 webpack 的支持
// hack 出对 babel-plugin-root-import 的支持
// 参考=> https://www.jetbrains.com/help/webstorm/using-webpack.html

const path = require('path')
module.exports = {
  resolve: {
    alias: {
      '~/src': path.join(__dirname, '/src'),
    }
  }
}
