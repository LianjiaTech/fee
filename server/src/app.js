/*
Copyright(c)  2017  Lianjia, Inc. All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
import '@babel/polyfill'

import path from 'path'
import express from 'express'
import _ from 'lodash'
import router from '~/src/routes/index'
import appConfig from '~/src/configs/app'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors from 'cors'
import Logger from '~/src/library/logger'

import Alert from '~/src/library/utils/modules/alert'
import WatchIdList from '~/src/configs/alarm'
import PrivilegeChecker from '~/src/middlewares/privilege'
import ejs from 'ejs'

const startup = () => {
  const app = express()
  // 设置存放模板引擎目录
  app.set('views', path.join(__dirname, '../public'))
  // 设置模板引擎为ejs
  // app.set('view engine', 'ejs')
  app.engine('html', ejs.renderFile)
  app.set('view engine', 'html')

  // 设置body-parser
  app.use(bodyParser.urlencoded({ extended: false }))
  // 解析json请求
  app.use(bodyParser.json({ extended: false }))

  // 设置cookie-parse
  app.use(cookieParser())

  // 支持跨域
  app.use(cors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true
  }))

  // 将用户信息&项目信息补充到req中(在router内进行权限检测)
  app.use(PrivilegeChecker.appendUserInfo)
  app.use(PrivilegeChecker.appendProjectInfo)

  /* 添加静态路径 */
  app.use(express.static(path.join(__dirname, '../public')))

  // 添加接口路径
  app.use('/', async (req, res, next) => {
    let path = req.path
    // 只对以 /api & /project/${projectId}/api 路径开头的接口进行响应
    let projectApiReg = /^\/project\/\d+\/api/i
    if (_.startsWith(path, '/api') || path.search(projectApiReg) === 0) {
      return router(req, res, next)
    } else {
      next()
    }
  })

  // 支持前端History模式 => https://router.vuejs.org/zh/guide/essentials/history-mode.html#后端配置例子
  // 将所有404页面均返回index.html
  app.use('*', (req, res) => {
    res.render('index')
  })

  app.listen(appConfig.port, function () {
    Logger.log(`${appConfig.name} listening on port ${appConfig.port}`)
  })
}
startup()

process.on('uncaughtException', function (err) {
  Logger.error(err + ':服务器重新启动，启动时间：' + (new Date()).toString())
  Alert.sendMessage(WatchIdList.WATCH_UCID_LIST_DEFAULT, `[fee-rd]服务器重新启动, 原因: ${err}, 启动时间：${(new Date()).toString()}`)
  startup()
})
