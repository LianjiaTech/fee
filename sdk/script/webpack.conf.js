'use strict'
const path = require('path')
const config = require('../config')
const webpack = require('webpack')

let projectRoot = path.resolve(__dirname, '../')

let webpackConfig = {
  mode: 'production',
  cache: true, // 开启webpack的默认缓存
  devtool: false, // 不生成source-map
  entry: { index: './src/index.js' },
  resolve: {
    extensions: ['.js'],
    alias: {
      'src': path.resolve(__dirname, '../src')
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: ['babel-loader?cacheDirectory=true'],
        include: path.join(projectRoot, 'src'),
        exclude: path.join(projectRoot, 'node_modules')
      }
    ]
  },
  output: {
    path: path.resolve(`./dist/js/${config.version}/[hash:7]`),
    filename: '[name].js', // 让生成的js按文件名分开，方便查找
    chunkFilename: path.join('.', 'dist', 'js', '[id].[hash:7].js'),
    publicPath: '/'
  },
  // 混淆，压缩代码
  optimization: {
    minimize: true
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.build.env
    })
  ]
}

if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
