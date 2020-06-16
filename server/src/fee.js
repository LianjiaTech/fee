import '@babel/polyfill'

/*
|--------------------------------------------------------------------------
| Ace Setup
|--------------------------------------------------------------------------
|
| Ace is the command line utility to create and run terminal commands.
| Here we setup the environment and register ace commands.
|
*/
import ace from '@adonisjs/ace'

const registedCommandList = [
  './commands/demo', //  命令demo

  './commands/scroll/scroll', //  用于迁移或重建ES中的索引

  // 从数据库中, 按时间段统计
  './commands/summary/daily_report_subscription', // 根据订阅配置发送邮件，每小时跑
  './commands/summary/daily_report_all_projects', // 发送所有项目汇总数据，每天发一次
  './commands/summary/daily_report_summary', // 统计每日的报错和性能发邮件，每天跑
  './commands/summary/daily_file_report_summary', // 统计每日的报错和性能发邮件，每天跑
  './commands/summary/daily_count_summary', // 统计每日得错误，pv，uv 主要用于补日报没跑得数据
  './commands/summary/per_hour_performance_url_list_summary', // 统计最近10天性能url到redis，避免查询慢的问题
  // 监控
  './commands/watch_dog/alarm',

  // 清除日志
  './commands/clear_log/clear_error_log',

  // 任务调度
  './commands/task/manage', //  任务调度
  './commands/task/consume/', //  消费kafka消息

  // 工具类命令
  './commands/utils/generate_sql', //  生成SQL
  './commands/utils/clean_old_log', //  自动删除旧日志

  // 测试uc
  './commands/utils/testUC',
  // 心跳
  './commands/utils/heart_beat'
]

// register commands
for (let command of registedCommandList) {
  ace.addCommand(require(command)['default'])
}

// Boot ace to execute commands
ace.wireUpWithCommander()
ace.invoke()
