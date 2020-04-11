
# 介绍
fee(灯塔)是前端监控系统，贝壳找房主要前端监控系统，服务公司上百条产品线。
特点：架构简单、轻量、支持私有化部署。可收集前端设备、系统、环境信息，
可以对前端页面js报错、资源错误、性能指标进行配置报警等，
并且可以通过上报错误信息引导用户快速定位解决问题。
## 系统功能
### 1、用户行为/用户在线时长
<!-- <img src="https://ws1.sinaimg.cn/large/006ct7Lcly1g1qn2emr3nj32260r8gqz.jpg" width="800" height="300"/> -->

### 2、异常监控/页面性能
<!-- <img src="https://ws1.sinaimg.cn/large/006ct7Lcly1g1qn4hm2g5j328417q7ag.jpg"  width="800" height="400"/> -->

### 3、异常监控/错误看板
<!-- <img src="https://ws1.sinaimg.cn/large/006ct7Lcly1g1qn6t0odrj328a12sjyo.jpg"  width="800" height="400"/> -->

### 4、报警/报警日志
<!-- <img src="https://ws1.sinaimg.cn/large/006ct7Lcly1g1qn8o98y0j32700vyq83.jpg"  width="800" height="400"/> -->

# 环境搭建
1. [mysql](https://www.mysql.com/)
2. [Node.js](http://nodejs.cn/)
3. [redis](https://redis.io/)
4. 克隆项目 在克隆项目之前确保你的nodejs、mysql和redis环境是可用的。
   ```bash
    mkdir -p ~/www/ \
    &&  cd ~/www/ \
    &&  git clone git@github.com:LianjiaTech/fee.git \
    &&  cd fee
    ```
    在~/www/openfee找到我们clone的项目

5. 配置数据库(在**server/src/configs/mysql.js**中修改主机地址/数据库端口/数据库用户名/数据库密码/数据库库名)，在数据库中创建一个空的名字叫做**『platform』**的数据库。
    ```javascript
    const development = {
    host: '127.0.0.1', // 主机地址
    port: '3306', // 数据库端口
    user: 'root', // 数据库用户名
    password: '00000000', // 数据库密码
    database: 'platform'  // 数据库库名
    }
                                                        
    ```
6. 配置redis(在**server/src/configs/redis.js**中修改主机地址/redis端口)。
    ```javascript
    // 开发环境配置
    const development = {
    host: '127.0.0.1', // 主机地址
    port: '6379' // redis端口
    }
                                                        
    ```

 

7. 安装依赖
   在项目 **server** 目录下
   ```javascript
   npm install
   ```
8. 启动编译dist服务
   打开一个新的**窗口**在项目 **server** 目录下
   ```javascript
   npm run watch
   ```
9.  生成数据库表
   在项目 **server** 目录下
   ```javascript
   npm run fee Utils:TemplateSQL 
   ```
11. 启动server服务
   在项目 **server** 目录下
   ```javascript
   npm run dev
   ```
12. 安装UI服务依赖
   在项目 **client** 目录下
   ```javascript
   npm install
   ```
11. 安装UI服务依赖
   在项目 **client** 目录下
   ```javascript
   npm run dev
   ```

12. 访问本地地址:**127.0.0.1:8080**，
   进行**注册**，**登录**之后，就能看到模板项目数据了。

1.  npm依赖插件说明

```javascript
dependencies =>

mysql           =>  mysql客户端
ioredis         =>  redis客户端
knex            =>  SQL Query Builder
@adonisjs/ace   =>  命令注册/管理工具
node-schedule   =>  node版crontab, 用于进程调度
log4js          =>  日志记录
lei-stream      =>  流式读取/写入文件. 对node的ReadStream/WriteStream的简单封装
query-string    =>  解析url
ua-parser-js    =>  解析ua
axios           =>  发起http请求
shelljs         =>  执行常见shell命令, 例如, mkdir -p
date-fns@next   =>  替代moment进行日期操作, 目前2.0版本还处于alpha状态, 待正式发布后即可取消@next标记
ini             =>  读取线上环境的ini配置文件
ipip-datx       =>  将ip转换为对应坐标, ipip.net出品

devDependencies =>

node-rdkafka                =>  获取kafka数据, 如果node-kafka无法运行, 考虑本机中是否有librdkafka库 => `sudo apt-get install librdkafka-dev` & 本机是否安装了Python2.7
                            =>  说明: node-rdkafka需要使用gcc进行编译, 但Jinkins上没有相应的编译脚本, 为了能从Jinkins上编译通过, 将`node-rdkfka`放在了dev依赖中.
                            =>  线上发布时, 直接把预编译好的tar文件解压到node_module文件夹里, 跳过gcc编译流程(开发机环境和线上环境一致, 因此使用开发机进行预编译)
                            =>  预编译时需要使用和线上node一致的版本
                            =>  打包命令demo => `tar cfv  pre_package.tar.gz node-rdkafka nan bindings`
                            =>  打包完成后使用 `sz node-rdkafka.tar.gz` 即可将文件下载到本机

@babel/*                    =>  7.0系列, 方便脱离对node环境的依赖, 使用js的最新特性
babel-plugin-root-import    =>  解除对相对路径的依赖(项目中通过webpack.config.js(WebStrom) & jsconfig.json(VSCode)辅助编辑器识别路径)
nodemon                     =>  动态启动/载入项目
standard                    =>  JS Standard代码规范
```

# 加入群来和开发人员讨论问题
<img src="./client/src/assets/github/qq.jpeg" width="180" height="250"/>


# 项目搭建背景，以及前端监控平台搭建原理，设计思路，一步一步教你做。

<img src="./client/src/assets/github/book.jpg" width="400" height="450"/>

<a href="https://item.jd.com/12639273.html" target="_blank" style="font-size:14px">购书链接</a>


## License

[MIT](http://opensource.org/licenses/MIT)

Copyright(c) 2017 Lianjia, Inc. All Rights Reserved
