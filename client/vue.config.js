/** @format */

const path = require('path')
const webpack = require('webpack')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')

const { name, version } = require('./package')

function resolve(dir) {
  return path.join(__dirname, dir)
}

const assetsDir = version || 'static'
const ENV = process.env.NODE_ENV || 'production'
const publicPath = ENV === 'production' ? '/' : '/'

module.exports = {
  /**
   * You will need to set publicPath if you plan to deploy your site under a sub path,
   * for example GitHub Pages. If you plan to deploy your site to https://foo.github.io/bar/,
   * then publicPath should be set to "/bar/".
   * In most cases please use '/' !!!
   * Detail: https://cli.vuejs.org/config/#publicpath
   */
  outputDir: 'dist',
  assetsDir: assetsDir,
  publicPath: publicPath,
  filenameHashing: true,
  productionSourceMap: false,
  // 此配置勿动，否则会导致浮屠系统微前端嵌入方案加载静态资源失败
  crossorigin: 'anonymous',
  // tweak internal webpack configuration.
  // see https://github.com/vuejs/vue-cli/blob/dev/docs/webpack.md
  devServer: {
    hot: true,
    disableHostCheck: true,
    overlay: {
      warnings: false,
      errors: true
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  // 自定义webpack配置
  configureWebpack: {
    resolve: {
      alias: {
        vue$: 'vue/dist/vue.esm.js',
        src: resolve('src'),
        style: resolve('src/assets/styles'),
        '@': resolve('src'),
        _c: resolve('src/components'),
        _conf: resolve('config')
      }
    },
    output: {
      // 把子应用打包成 umd 库格式
      library: `${name}-[name]`,
      libraryTarget: 'umd',
      jsonpFunction: `webpackJsonp_${name}`,
      filename: ENV === 'development' ? `${assetsDir}/js/[name].js` : `${assetsDir}/js/[chunkhash:7]/[name].js`, // 让生成的js按文件名分开，方便查找
      chunkFilename: ENV === 'development' ? `${assetsDir}/js/[name].js` : `${assetsDir}/js/[name].[chunkhash:7].js`
    },
    plugins: [
      // new BundleAnalyzerPlugin(),
      new webpack.DllReferencePlugin({
        context: process.cwd(),
        manifest: require(`./public/${assetsDir}/js/vendor/vendor-manifest.json`)
      }),
      // 将 dll 注入到 生成的 html 模板中
      new AddAssetHtmlPlugin({
        // dll文件位置
        filepath: resolve(`./public/${assetsDir}/js/vendor/*.js`),
        // // dll 引用路径
        publicPath: `${publicPath}${assetsDir}/js/vendor/`,
        // // dll最终输出的目录
        outputPath: `./${assetsDir}/js/vendor/`
      })
    ]
  },
  chainWebpack: (config) => {
    // 移除 prefetch 插件
    config.plugins.delete('prefetch')
    // 移除 preload 插件
    config.plugins.delete('preload')

    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap((options) => {
        // 修改它的选项...
        return {
          transformToRequire: {
            video: 'src',
            source: 'src',
            img: 'src',
            image: 'xlink:href'
          }
        }
      })
    config.module
      .rule('babel-loader')
      .test(/\.js$/)
      .use('babel-loader')
      .loader('babel-loader')
      .end()
    config.module
      .rule('fonts')
      .use('url-loader')
      .loader('url-loader')
      .tap((options) => Object.assign(options, { limit: 102400 }))
  }
}
