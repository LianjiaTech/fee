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

  // 解析日志
  './commands/parse/uv', //  解析uv
  './commands/parse/time_on_site', // 解析用户停留时长
  './commands/parse/device', //  解析device
  './commands/parse/monitor', //  解析错误报警
  './commands/parse/menu_click', //  解析菜单点击记录
  './commands/parse/performance', //  解析性能统计指标数据
  './commands/parse/user_first_login_at', //  录入新增用户

  './commands/save_log/parseKafkaLog', //  将kafka日志落在文件中
  './commands/save_log/parseNginxLog', // 将ngnix日志落在文件中
  // 从数据库中, 按时间段统计
  './commands/summary/uv', //  统计uv数据
  './commands/summary/time_on_site', //  统计用户停留时长
  './commands/summary/system_os.js', // 按月统计系统分布, 每天跑
  './commands/summary/system_browser.js', // 按月统计浏览器分布, 每天跑
  './commands/summary/system_device.js', // 按月统计设备分布, 每天跑
  './commands/summary/system_runtime_version.js', // 按月统计版本分布，每天跑
  './commands/summary/http_error.js', // 按天统计http error分布, 每天跑
  './commands/summary/performance', //  按小时/天/月统计性能指标
  './commands/summary/new_user_summary', //  统计新增用户数
  './commands/summary/error_summary', // 统计某一错误的数量
  // 监控
  './commands/watch_dog/saas', //  saas监控
  './commands/watch_dog/alarm',

  './commands/create_cache/update_per_ten_minute', // 更新缓存

  // 任务调度
  './commands/task/manage', //  任务调度

  // 工具类命令
  './commands/utils/template_sql', // 生成模板数据
  './commands/utils/generate_sql', //  生成SQL
  './commands/utils/clean_old_log', //  自动删除旧日志
  './commands/utils/test', //  专业粘贴调试代码

  // 测试uc
  './commands/utils/testUC'
]

// register commands
for (let command of registedCommandList) {
  ace.addCommand(require(command)['default'])
}

// Boot ace to execute commands
ace.wireUpWithCommander()
ace.invoke()
