/** @format */

const path = require('path')
const webpack = require('webpack')
const CleanWebpackPlugin = require('clean-webpack-plugin')

const { name, version } = require('./package')
const assetsDir = version || 'static'
// dll文件存放的目录
const dllPath = `./public/${assetsDir}/js/vendor/`
const ENV = process.env.NODE_ENV || 'production'

module.exports = {
  entry: {
    // 需要提取的库文件
    vendor: ['vue', 'vue-router', 'viser-vue', 'vuex', 'axios', 'element-ui', '@antv/g2', '@antv/data-set', 'echarts', 'iview', 'v-charts']
  },
  output: {
    libraryTarget: 'umd',
    jsonpFunction: `webpackJsonp_${name}`,
    path: path.join(__dirname, dllPath),
    filename: ENV === 'development' ? `[name].dll.js` : `[name]-[hash:7].dll.js`,
    // vendor.dll.js中暴露出的全局变量名
    // 保持与 webpack.DllPlugin 中名称一致
    library: '[name]_[hash]'
  },
  plugins: [
    // 清除之前的dll文件
    new CleanWebpackPlugin(['*.*'], {
      root: path.join(__dirname, dllPath)
    }),
    // 设置环境变量
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: ENV
      }
    }),
    // manifest.json 描述动态链接库包含了哪些内容
    new webpack.DllPlugin({
      path: path.join(__dirname, dllPath, '[name]-manifest.json'),
      // 保持与 output.library 中名称一致
      name: '[name]_[hash]',
      context: process.cwd()
    })
  ]
}
