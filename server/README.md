# 生成建表语句
创建platform数据库, 然后执行`npm run fee Utils:GenerateSQL 1,2,3,4,5,6,7,8,9,10 '2018-01' '2020-10' > init.sql` 生成数据库SQL, 执行`mysql -u root -h 127.0.0.1  platform -p < init.sql`, 执行建表语句
# 启动server
1.  启动项目 => `npm run watch` 启动babel监控, `npm run dev` 启动项目.
2.  访问 http://localhost:3000/ 查看效果
3.  构建完成后, 目录结构如下 
    ```text
    -   主目录(~)
        -   www
            -   plat-fe             
                -   fee-rd          =>  项目路径
            -   docker              =>  [辅助]docker所在路径
            -   ha_develope_env     =>  [辅助]ha_develope_env所在路径
            -   htdocs_in_docker    =>  [辅助]php相关代码目录(指向~/www/docker/base/data0/www/htdocs的快捷方式)
    
    ```
# 读取Nginx日志规范，及打点规范
1. Nginx需要打点的日志格式
    ```text
    2019-04-18T16:00:00+08:00       -       -       111.160.30.22   111.160.30.22   200     0.000   3058    43      15d04347-be16-b9ab-0029-24e4b6645950    -       -       9689c3ea-5155-2df7-a719-e90d2dedeb2c 937ba755-116a-18e6-0735-312cba23b00c    GET HTTP/1.1    http://feedemo.lianjia.com/demo.gif?d=%7B%22type%22%3A%22error%22%2C%22code%22%3A7%2C%22detail%22%3A%7B%22error_no%22%3A%22%E9%A1%B5%E9%9D%A2%E6%8A%A5%E9%94%99_JS_RUNTIME_ERROR%22%2C%22url%22%3A%22demo.lianjia.com%2Findex.html%22%7D%2C%22extra%22%3A%7B%22desc%22%3A%22Uncaught%20INVALID_STATE_ERR%20%3A%20Pausing%20to%20reconnect%20websocket%20at%20http%3A%2F%2Fdemo.lianjia.com%2Fasset%2Fmodule%2Fsoftphone%2Freconnecting-websocket.js%3A1%3A2820%22%2C%22stack%22%3A%22no%20stack%22%7D%2C%22common%22%3A%7B%22pid%22%3A%22hello_fe%22%2C%22uuid%22%3A%220s2jsaq1qk2cqmr-rit6ithbu-0s2jsaq1qk2cqmr-rit6ithbu%22%2C%22ucid%22%3A99999%2C%22is_test%22%3Afalse%2C%22record%22%3A%7B%22time_on_page%22%3Atrue%2C%22performance%22%3Atrue%2C%22js_error%22%3Atrue%2C%22js_error_report_config%22%3A%7B%22ERROR_RUNTIME%22%3Atrue%2C%22ERROR_SCRIPT%22%3Atrue%2C%22ERROR_STYLE%22%3Atrue%2C%22ERROR_IMAGE%22%3Atrue%2C%22ERROR_AUDIO%22%3Atrue%2C%22ERROR_VIDEO%22%3Atrue%2C%22ERROR_CONSOLE%22%3Afalse%2C%22ERROR_TRY_CATCH%22%3Atrue%7D%7D%2C%22version%22%3A%221.0.0%22%2C%22timestamp%22%3A1555574400507%2C%22runtime_version%22%3A%221.0.0%22%2C%22sdk_version%22%3A%221.1.2%22%2C%22page_type%22%3A%22demo.lianjia.com%2Findex.html%22%7D%7D  -       Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 SE 2.X MetaSr 1.0     -       sample=-&_UC_agent=-&lianjia_device_id=-&-      -       -       -
    ```
2. 日志对应ngnix日志格式(仅供参考,不能直接使用)
   ```text
   $time_local                      -       -       $http_x_real_ip $http_host  $status $request_time $request_length $body_bytes_sent      15d04347-be16-b9ab-0029-24e4b6645950    -       -       9689c3ea-5155-2df7-a719-e90d2dedeb2c 937ba755-116a-18e6-0735-312cba23b00c    $request  -       $http_user_agent     -       sample=-&_UC_agent=-&lianjia_device_id=-&-      -       -       -
   
   ```
3. Nginx日志存储格式
```text
首先在/server/src/configs/common.js 里配置Nginx公共路径nginxLogFilePath
此路径下的日志文件格式需为：
nginxLogFilePath/YYYYMM/DD/HH/mm.log
例子：/root/nginx/log/201904/18/20/28.log
任务会每分钟读取对应路径下的日志文件，然后分析入库。

如果可以使用kafka工具，则可以在/server/src/configs/kafka.js 里配置kafka
然后在 /server/src/configs/common.js 里设置use.kafka为true

自此，跑批任务Task:Manager会根据用户配置完成数据的接受，分析，存储
```

#   任务执行周期
    1.  每分钟一次(准实时)
        1.  原始数据入库
            1.  错误数据入库(延迟2分钟)
        2.  按分钟统计
            1.  错误数据统计(延迟2分钟)
    2.  每10分钟一次
        1.  原始数据入库
            1.  uv
            2.  页面性能指标
            3.  用户停留时长
        2.  按小时统计
            1.  uv
            2.  新用户数
            3.  页面性能指标
            4.  错误数据统计
    3.  每小时一次
        1.  原始数据入库
            1.  设备数据
            2.  用户点击
            3.  首次登陆用户
        2.  按天统计(当天)
            1.  uv
            2.  新用户数
            3.  页面性能指标
            4.  错误数据统计
            5.  用户停留时长
    4.  每六小时一次
        1.  按天统计(昨日)
            1.  uv
            2.  新用户数
            3.  页面性能指标
            4.  错误数据统计
            5.  用户停留时长
        2.  按月统计
            1.  uv
            2.  新用户数
            3.  页面性能指标
            4.  错误数据统计
            5.  用户停留时长
            
            6.  操作系统分布
            7.  设备分布
            8.  浏览器分布

#   上线CheckList
-   [ ] 线上环境是否可以正常链接kafka? (op是否已安装librdkafka)
-   [ ] log文件是否可以正常写入?
-   [ ] 是否有不必要的log? 是否有可能会引起磁盘打满的log?(一条日志一个log, 会导致磁盘直接打满)
-   [ ] kafka autoCommit默认是打开的，是否关闭，自己控制什么时候提交。

#   API编写CheckList
-   [ ] list接口无数据时是否返回空列表(而不是空对象)
-   [ ] 必要的增删改查(add/udate/detail/list/delete)是否齐备
-   [ ] 添加修改接口是否进行了权限校验

# 项目层级结构

```
.
├── bin                             //  项目启动文件, node项目上线后, 通过 bash bin/run.sh 直接启动
│   └── run.sh
├── document                        //  文档目录
│   └── api.md
├── log                             //  本地日志, 线上日志位于 /data0/www/logs/项目网址/  下. 运行时通过配置文件, 根据环境变量获取日志路径
│
├── sql                             //  项目SQL, 字符集编码使用utf8mb4, 以便支持可能的emoji表情
│   └── init.sql
├── public                          //  express的静态资源目录
│   ├── assets
│   ├── libs
│   └── static
├── dist                            //  babel的编译结果目录. 原生node项目存在两个问题: 1.根据node环境不同, 不一定支持最新ES6特性(例如import) 2. 导入模块时, 需要手工计算'..'的深度
│                                   //  因此需要引入babel转义js, 引入babel-plugin-root-import, 支持从根目录导入模块(例如 import * from `~/src/model/base`)
├── jsconfig.json                   //  引入babel-plugin-root-import之后会带来一个新问题: 编辑器无法识别导入路径, 因此需要引入jsconfig.json辅助VSCode识别
├── webpack.config.js               //  引入webpack.config.js辅助WebStrom识别
│  
├── src                             //  源代码
│   │  
│   ├── app.js                      //  web框架入口
│   │  
│   ├── fee.js                      //  命令入口, 命令框架基于 @adnoishJS/ace, 使用fee.js统一管理所有命令, 提供了标准代码结构, 参数解析&日志打印功能
│   │  
│   ├── commands                    //  命令目录
│   │   ├── base.js                 //  基础命令
│   │   ├── demo.js                 //  demo命令, 按照规范编写的demo, 包含了所有的命令用法
│   │   ├── parse
│   │   │   ├── base.js             //  子类命令也可以在基类之上再次派生基类
│   │   │   ├── pv.js
│   │   │   └── uv.js
│   │   └── utils
│   │       └── generateSql.js
│   ├── configs                     //  配置文件夹
│   │   ├── env.js                  //  所有配置均依赖env配置, 最后通过export config[env]的方式来按环境导出配置项
│   │   ├── app.js
│   │   └── redis.js
│   ├── library                     //  外部库, 引入时使用 import * as LXXXX 的方式进行引入,在as前加上L前缀, 避免函数重名
│   │   ├── ipip                    //  ipip.net 当前中国准确度最高的ip => 地址转换库, 有各种语言的客户端, 免费版本可以精确到城市
│   │   │   ├── index.js            //  转换ip
│   │   │   └── ipip.net_20180910.datx  //  文件名中带上更新时间, 方便后续替换
│   │   ├── auth                    //  验证用户身份 parseToken & generateToken
│   │   ├── http                    //  发送网络请求
│   │   ├── kafka                   //  获取kafka日志文件路径
│   │   ├── logger                  //  打印并记录日志
│   │   ├── mysql                   //  连接并操作数据库
│   │   ├── redis                   //  redis客户端
│   │   └── utils                   //  通用工具库
│   │       └── modules
│   │           ├── alart.js        //  公司内部即时消息系统，通知到个人
│   │           ├── database.js     //  数据库有关工具函数
│   │           ├── network.js      //  网络有关工具 & getLocalIpList
│   │           ├── router_config_builder.js //  封装了路由格式
│   │           └── util.js         //  其他工具函数 
│   │               ├── sleep       //  睡眠函数
│   │               ├── urlParse    //  解析URL
│   │               ├── ip2Locate   //  解析IP地址对应的国家省份城市
│   │               ├── objectToArray    //  对象转换为数组
│   │               ├── handleEmptyData  //  处理空对象（舍弃对象的空属性）
│   │               └── compare     //  对比对象中指定参数
│   ├── middlewares                 //  express中间件, 可以执行检查登录等通用操作
│   │   └── privilege.js
│   ├── model                       //  M部分, 可以直接操作数据库 按功能/API路径区分文件夹, 按表名命名js文件
│   │   ├── parse                   //  解析指令对应的数据库操作
│   │   │   ├── behavior_distribution.js
│   │   │   ├── city_distribution.js
│   │   │   ├── common.js
│   │   │   ├── duration_distribution.js
│   │   │   ├── monitor.js
│   │   │   ├── monitor_ext.js
│   │   │   ├── project.js
│   │   │   └── uv_record.js
│   │   ├── project                  // 项目相关操作，包括报警，成员，项目添加，用户 
│   │   │   ├── alarm
│   │   │   │   └──alarm_config.js
│   │   │   ├── project_member.js
│   │   │   ├── project.js
│   │   │   └── user.js
│   │   └── summary                  // 统计指令对应的数据库操作
│   │       ├── page_view.js
│   │       └── unique_view.js
│   ├── routes                      //  路由/接口
│   │   ├── api                     //  根据接口路径, 创建文件
│   │   │   ├── behavior            
│   │   │   │   └── online
│   │   │   │       └── index.js
│   │   │   └── monitor
│   │   │       └── index.js
│   │   └── index.js
│   └── views                       //  express模板, 因为fee已经实现了前后端完全分离, 因此意义不大
│       └── index.ejs
├── README.md                       //  项目说明
├── online.sh                       //  jinkins编译脚本
├── package.json                    //  项目依赖列表
├── .gitattributes                  //  配置换行符, 用于解决Windows(换行为CRLF), Mac/Unix(换行为LF)平台下换行符不一致的问题, 参考 https://github.com/alexkaratarakis/gitattributes
├── .gitignore                      //  项目忽略文件, 参考 https://www.gitignore.io/
└── .babelrc                        //  babel配置

```

#   数据库建表CheckList
1.  在极端情况下, 数据库单表容量是否绝不会超过一千万条数据
2.  是否有以下字段
    1.  create_time, 记录创建时间, bigint
    2.  update_time, 记录更新时间, bigint
    3.  create_ucid, 记录创建人ucid, varchar(20) , 可选, 只有当会有人编辑记录时才需要该字段
    4.  update_ucid, 记录更新人ucid, varchar(20) , 可选, 只有当会有人编辑记录时才需要该字段
3.  


#   创建命令CheckList
1.  类名是否和signature保持一致(类名会被作为日志文件名)

#   提交代码CheckList
1.  检查是否已经删除了用于测试的console

#   添加接口CheckList

1.  是否已添加mock
    1.  标准mock配置 =>
    ```json
    {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
        "code": {
        "type": "number",
        "enum": [
            0
        ]
        },
        "data": {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
            "url": {
                "type": "string",
                "format": "url"
            },
            "count": {
                "type": "number",
                "minimum": 0,
                "maximum": 100,
                "exclusiveMinimum": true,
                "exclusiveMaximum": true,
                "default": "0",
                "enum": [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9
                ]
            }
            },
            "required": []
        }
        },
        "msg": {
        "type": "string",
        "enum": [
            "",
            ""
        ]
        },
        "action": {
        "type": "string",
        "enum": [
            "success"
        ]
        },
        "url": {
        "type": "string",
        "enum": [
            ""
        ]
        }
    },
    "required": []
    }
    
    ```

#   系统接入流程
1.  接收邮件, 确认项目日pv, 项目名, pid, 负责人信息. 对于日pv大于10w的系统, 需要进行抽样打点, 保证每日入库日志数不高于10w/日
2.  更新generateSQL命令, 依次是id, 抽样比率, 项目名(展示), 项目id, 负责人信息, 其他数据和之前SQL保持一致即可 
    demo =>
    ```SQL
    REPLACE INTO \`t_o_project\` (\`id\`, \`rate\`, \`display_name\`, \`project_name\`, \`c_desc\`, \`is_delete\`, \`create_ucid\`, \`update_ucid\`, \`create_time\`, \`update_time\`) VALUES (13, 100, '社区生活管理平台', 'life_manage', '负责人:**', 0, '', '', 0, 0);

    ```
3.  生成SQL命令, 例如 
    
    模板 =>
    ```bash
    npm run build; node dist/fee Utils:GenerateSQL ${项目id, 多个id逗号分隔} ${开始时间, YYYY-MM格式}  ${结束时间, YYYY-MM格式} > init.sql; echo "SQL生成完毕"
    ```

    实际命令 =>
    ```bash
    npm run build ; node dist/fee Utils:GenerateSQL 13,14,15 '2018-10' '2019-12' > init.sql ; echo "SQL生成完毕"
    ```
4.  在dev数据库执行生成的SQL
5.  dev数据执行完毕, 确认无误后, 在线上数据库执行生成的SQL
6.  对接完成``