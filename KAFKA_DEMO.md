# **前提：若对kafka以及docker不熟悉，请先花一些时间了解相关知识！**

# 说明：此配置仅用于开发环境测试使用，不能用于生产！

# 运行环境说明

* Linux VM_15_49_centos 3.10.0-862.3.2.el7.x86_64 
  * 通过Docker启动kafka相关服务
  * Nginx配置
* MacOS Catalina 10.15.2 
  * 发送打点请求
  * Kafka Manager
# 整体流程

![图片](https://uploader.shimo.im/f/yQwjdVt5u8dSGR7G.png!thumbnail)
# Nginx相关

## log_format配置

* 使用  `\t` 间隔
```shell
   log_format main '$time_local        -       -       $http_x_real_ip $http_host      $status $request_time   $request_length $body_bytes_sent        15d04347-be16-b9ab-0029-24e4b6645950    -       -       9689c3ea-5155-2df7-a719-e90d2dedeb2c    937ba755-116a-18e6-0735-312cba23b00c    $request_method $server_protocol        $request_uri    -       $http_user_agent        -       sample=-&_UC_agent=-&test_device_id=-&-      -       -       -';
```
## server配置

* 用于接受来自SDK的打点请求
```shell
location = /test.gif {
    empty_gif;
}
```
## 测试ng

### 1、浏览器访问NG服务：

将这里的 `http://10.26.15.49` 替换成你的 `nginx` 服务地址 

```plain
http://10.26.15.49/test.gif?d=%7B%22type%22%3A%22product%22%2C%22common%22%3A%7B%22pid%22%3A%22infra_test%22%2C%22uuid%22%3A%22-lxoodk-9l8r2t-xefoh5rsuqo6cod-o977azz12%22%2C%22ucid%22%3A1000000000000000%2C%22is_test%22%3Afalse%2C%22record%22%3A%7B%22spa%22%3Atrue%2C%22time_on_page%22%3Atrue%2C%22performance%22%3Atrue%2C%22js_error%22%3Atrue%2C%22js_error_report_config%22%3A%7B%22ERROR_RUNTIME%22%3Atrue%2C%22ERROR_SCRIPT%22%3Atrue%2C%22ERROR_STYLE%22%3Atrue%2C%22ERROR_IMAGE%22%3Atrue%2C%22ERROR_AUDIO%22%3Atrue%2C%22ERROR_VIDEO%22%3Atrue%2C%22ERROR_CONSOLE%22%3Atrue%2C%22ERROR_TRY_CATCH%22%3Atrue%7D%2C%22api_report_config%22%3A%7B%22enable%22%3Atrue%2C%22withBody%22%3Atrue%2C%22withResp%22%3Atrue%2C%22sampleRate%22%3A1%7D%7D%2C%22version%22%3A%221.0.0%22%2C%22timestamp%22%3A1594016338232%2C%22runtime_version%22%3A%221.0.0%22%2C%22sdk_version%22%3A%221.3.1-11%22%2C%22page_type%22%3A%22test.demo.com%2Fservice%2F565%2Fedit%22%7D%2C%22code%22%3A10001%2C%22extra%22%3A%7B%7D%2C%22detail%22%3A%7B%22error_no%22%3A%22%22%2C%22http_code%22%3A%22%22%2C%22during_ms%22%3A%22%22%2C%22url%22%3A%22%22%2C%22request_size_b%22%3A%22%22%2C%22response_size_b%22%3A%22%22%2C%22duration_ms%22%3A742801%7D%7D
```
### 2、检查access.log，没有问题的话，应该会有如下格式的日志被写入

```plain
06/Jul/2020:17:11:46 +0800	-	-	-	10.26.15.49	304	0.000	1704	0	15d04347-be16-b9ab-0029-24e4b6645950	-	-9689c3ea-5155-2df7-a719-e90d2dedeb2c	937ba755-116a-18e6-0735-312cba23b00c	GET	HTTP/1.1	/test.gif?d=%7B%22type%22%3A%22product%22%2C%22common%22%3A%7B%22pid%22%3A%22infra_test%22%2C%22uuid%22%3A%22-lxoodk-9l8r2t-xefoh5rsuqo6cod-o977azz12%22%2C%22ucid%22%3A1000000000000000%2C%22is_test%22%3Afalse%2C%22record%22%3A%7B%22spa%22%3Atrue%2C%22time_on_page%22%3Atrue%2C%22performance%22%3Atrue%2C%22js_error%22%3Atrue%2C%22js_error_report_config%22%3A%7B%22ERROR_RUNTIME%22%3Atrue%2C%22ERROR_SCRIPT%22%3Atrue%2C%22ERROR_STYLE%22%3Atrue%2C%22ERROR_IMAGE%22%3Atrue%2C%22ERROR_AUDIO%22%3Atrue%2C%22ERROR_VIDEO%22%3Atrue%2C%22ERROR_CONSOLE%22%3Atrue%2C%22ERROR_TRY_CATCH%22%3Atrue%7D%2C%22api_report_config%22%3A%7B%22enable%22%3Atrue%2C%22withBody%22%3Atrue%2C%22withResp%22%3Atrue%2C%22sampleRate%22%3A1%7D%7D%2C%22version%22%3A%221.0.0%22%2C%22timestamp%22%3A1594016338232%2C%22runtime_version%22%3A%221.0.0%22%2C%22sdk_version%22%3A%221.3.1-11%22%2C%22page_type%22%3A%22test.demo.com%2Fservice%2F565%2Fedit%22%7D%2C%22code%22%3A10001%2C%22extra%22%3A%7B%7D%2C%22detail%22%3A%7B%22error_no%22%3A%22%22%2C%22http_code%22%3A%22%22%2C%22during_ms%22%3A%22%22%2C%22url%22%3A%22%22%2C%22request_size_b%22%3A%22%22%2C%22response_size_b%22%3A%22%22%2C%22duration_ms%22%3A742801%7D%7D	-	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36	-	sample=-&_UC_agent=-&test_device_id=-&---	-
```
## 参考文档：

* [nginx documentation](https://nginx.org/en/docs/)
* [ngx_http_](https://nginx.org/en/docs/http/ngx_http_empty_gif_module.html)[em](https://nginx.org/en/docs/http/ngx_http_empty_gif_module.html)[p](https://nginx.org/en/docs/http/ngx_http_empty_gif_module.html)[ty](https://nginx.org/en/docs/http/ngx_http_empty_gif_module.html)[_](https://nginx.org/en/docs/http/ngx_http_empty_gif_module.html)[gif](https://nginx.org/en/docs/http/ngx_http_empty_gif_module.html)[_module](https://nginx.org/en/docs/http/ngx_http_empty_gif_module.html)
* [nginx location配置](https://blog.csdn.net/tjcyjd/article/details/50897959)
# rsyslog相关

> rsyslog对 kafka的支持是v8.7.0版本后才提供的支持
## **安装rsyslog & rsyslog-kafka**

## 通过yum安装

运行下列命令:

```powershell
yum install rsyslog
yum install rsyslog-kafka.x86_64
```
安装完成后查看  `/lib64/rysylog/)` 中是否存在 `omkafka.so` ,验证 `rsyslog-kafka` 是否安装成功
## rsyslog配置

编辑配置文件（路径 `/etc/rsyslog.conf`  ），在配置文件 `#### MODULES ####` 的下面添加如下配置（或者在 `/etc/rsyslogd/` 目录下添加 `XXX.conf` 配置文件）

```plain
# 加载omkafka和imfile模块
module(load="omkafka")
module(load="imfile")
 
# nginx template
template(name="nginxAccessTemplate" type="string" string="%hostname%<-+>%syslogtag%<-+>%msg%\n")
 
# ruleset
ruleset(name="nginx-kafka") {
    #日志转发kafka
    action (
        type="omkafka"
	    template="nginxAccessTemplate"
        topic="fee-test"
        broker="localhost:9092"
    )
}
 
# 定义消息来源及设置相关的action
input(type="imfile" Tag="nginx-accesslog" File="/var/log/access.log" Ruleset="nginx-kafka")
```
配置简单说明：
*  `localhost:9092` 需要修改为你自己的kafka地址（如果为集群多个地址逗号分隔）
*  `/var/log/access.log` 是监控的nginx日志文件
*  `topic: fee-test`后续通过 `kafka-manager` 创建

修改完配置后运行： `rsyslogd -N 1`  或者  `rsyslogd -dn`  查看配置是否报错

然后重启 `rsyslog` --`service rsyslog restart` 重启后查看  `/var/log/message` 中日志是否报错。

## 参考文档：

* [rsyslog v8-stable](https://www.rsyslog.com/doc/v8-stable/index.html)
* [日志收集之rsyslog kafka配置](https://blog.csdn.net/flyfelu/article/details/83150259)
* [日志收集之rsyslog to kafka](https://www.jianshu.com/p/1b7fdb1cff3c)
# Kafka配置相关

* Docker以及Docker Compose的安装请参照[官网文档](https://docs.docker.com/get-docker/)
* 通过docker-compose的方式部署（若对kafka以及docker不熟悉，请先了解相关知识）。相关配置参见：[Docker compose Kafka, Zookeeper and Kafka manager](https://gist.github.com/alphawq/1c2dc14cbc303e32ec45c64e2d764284#docker-compose-kafka-zookeeper-and-kafka-manager)
## 启动

命令： `docker-compose -f docker-compose.yml up -d` 

![图片](https://uploader.shimo.im/f/1yyuwKDqu6BPDOmx.png!thumbnail)

如图，我们就在单机环境下，启动了一个单节点的kafka服务。启动成功后，可以通过访问kafka-manager服务来对kafka节点进行管理。

## kafka-manager

### 创建集群

创建名为 `fee-test` 的单节点集群

![图片](https://uploader.shimo.im/f/EwE6AwAOUNKDQl8c.png!thumbnail)

### 创建Topic

创建一个名为  `fee-test`  的 `topic` 

* 这里的 `topic` 名称需要跟上面配置的 `rsyslog` 的 `topic` 名称一致
* 分区和副本填  `1`  即可

![图片](https://uploader.shimo.im/f/uiisFa5yEfX6r6OP.png!thumbnail)

ok，到了这里，所有的一切准备工作都已完成！

# 测试打点服务

## 第一步，通过浏览器发送打点请求

将这里的 `http://10.26.15.49` 替换成你的 `nginx` 服务地址

```plain
http://10.26.15.49/test.gif?d=%7B%22type%22%3A%22product%22%2C%22common%22%3A%7B%22pid%22%3A%22infra_test%22%2C%22uuid%22%3A%22-lxoodk-9l8r2t-xefoh5rsuqo6cod-o977azz12%22%2C%22ucid%22%3A1000000000000000%2C%22is_test%22%3Afalse%2C%22record%22%3A%7B%22spa%22%3Atrue%2C%22time_on_page%22%3Atrue%2C%22performance%22%3Atrue%2C%22js_error%22%3Atrue%2C%22js_error_report_config%22%3A%7B%22ERROR_RUNTIME%22%3Atrue%2C%22ERROR_SCRIPT%22%3Atrue%2C%22ERROR_STYLE%22%3Atrue%2C%22ERROR_IMAGE%22%3Atrue%2C%22ERROR_AUDIO%22%3Atrue%2C%22ERROR_VIDEO%22%3Atrue%2C%22ERROR_CONSOLE%22%3Atrue%2C%22ERROR_TRY_CATCH%22%3Atrue%7D%2C%22api_report_config%22%3A%7B%22enable%22%3Atrue%2C%22withBody%22%3Atrue%2C%22withResp%22%3Atrue%2C%22sampleRate%22%3A1%7D%7D%2C%22version%22%3A%221.0.0%22%2C%22timestamp%22%3A1594016338232%2C%22runtime_version%22%3A%221.0.0%22%2C%22sdk_version%22%3A%221.3.1-11%22%2C%22page_type%22%3A%22test.demo.com%2Fservice%2F565%2Fedit%22%7D%2C%22code%22%3A10001%2C%22extra%22%3A%7B%7D%2C%22detail%22%3A%7B%22error_no%22%3A%22%22%2C%22http_code%22%3A%22%22%2C%22during_ms%22%3A%22%22%2C%22url%22%3A%22%22%2C%22request_size_b%22%3A%22%22%2C%22response_size_b%22%3A%22%22%2C%22duration_ms%22%3A742801%7D%7D
```
## 第二步，观察nginx的access日志

```plain
tail -f /var/log/access.log
```
会发现有新的日志写入：

![图片](https://uploader.shimo.im/f/0Mrw9wlwhlaFF0sv.png!thumbnail)

## 第三步，查看日志是否写入kafka

*  `offsets` 初始值为 `0` ，每当有一条日志写入，就会增  `1` 
* 若日志成功写入，这里会发生变化

![图片](https://uploader.shimo.im/f/8G8YA0mTGZg0FMi2.png!thumbnail)

## 第四步，消费日志

* 修改kafka配置如下：`src/configs/kafka.js` 

![图片](https://uploader.shimo.im/f/wuvR7Ly9BuEJnCEA.png!thumbnail)

* 订阅topic， `src/command/save_log/parseKafkaLog.js` 

![图片](https://uploader.shimo.im/f/eCpWrvL0HUmWM4Jg.png!thumbnail)

* 开启消费任务 `npm run fee  SaveLog:Kafka` 

![图片](https://uploader.shimo.im/f/c0IkUTnIZE9LsLQL.png!thumbnail)

大功告成！

