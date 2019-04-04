import Base from '~/src/commands/base'
import moment from 'moment'
import DATE_FORMAT from '~/src/constants/date_format'
import MPerformance from '~/src/model/parse/performance'
import Knex from '~/src/library/mysql'

const SQL_DATE_FORMAT_YM = 'YYYYMM'

// 不需要分表
const SINGLE_T_O_PROJECT = 't_o_project' //  项目表
const SINGLE_T_R_BEHAVIOR_DISTRIBUTION = 't_r_behavior_distribution' //  用户点击记录表
const SINGLE_T_R_DURATION_DISTRIBUTION = 't_r_duration_distribution' // 用户停留时长分布表
const SINGLE_T_R_HTTP_ERROR_DISTRIBUTION = 't_r_http_error_distribution' // 错误分布表
const SINGLE_T_R_PAGE_VIEW = 't_r_page_view' //  pv 表
const SINGLE_T_R_SYSTEM_BROWSER = 't_r_system_browser' //  浏览器分布表
const SINGLE_T_R_SYSTEM_DEVICE = 't_r_system_device' // 设备分布表
const SINGLE_T_R_SYSTEM_OS = 't_r_system_os' //  操作系统分布表
const SINGLE_T_R_SYSTEM_RUNTIME_VERSION = 't_r_system_runtime_version' // 项目版本表
const SINGLE_T_R_UNIQUE_VIEW = 't_r_unique_view' //  uv表
const SINGLE_T_O_ALARM_CONFIG = 't_o_alarm_config' // 项目配置表
const SINGLE_T_O_USER = 't_o_user' // 用户表
const SINGLE_T_O_PROJECT_MEMBER = 't_o_project_member' // 项目成员表
const SINGLE_T_O_NEW_USER_SUMMARY = 't_r_new_user_summary' // 新用户统计表
const SINGLE_T_R_ALARM_LOG = 't_r_alarm_log' // 报警记录表

// 需要分表
const MUILT_T_O_MONITOR = 't_o_monitor' //  异常数据表, 按项目按月分表, 只有最基础的错误信息, ext字段需要到详情表中单独获取, 命名规则: t_o_monitor_项目id_YYYYMM
const MUILT_T_O_MONITOR_EXT = 't_o_monitor_ext' // 异常数据的ext信息, 按项目按月分表, 命名规则: t_o_monitor_ext_项目id_YYYYMM
const MUILT_T_O_UV_RECORD = 't_o_uv_record' // uv记录表, 按项目&月分表,最小统计粒度为小时 命名规则: t_o_uv_record_项目id_YYYYMM
const MUILT_T_R_CITY_DISTRIBUTION = 't_r_city_distribution' // 城市数据的扩展信息, 按项目按月分表, 命名规则: t_r_city_distribution_项目id_YYYYMM, 获取数据时, 以记录创建时间和记录所属项目id, 决定distribute记录所在表
const MUILT_T_R_PERFORMANCE = 't_r_performance' // 性能指标表, 按项目按月分表, 命名规则: t_r_performance_项目id_YYYYMM, 获取数据时, 以记录创建时间和记录所属项目id, 决定distribute记录所在表
const MUILT_T_O_SYSTEM_COLLECTION = 't_o_system_collection' // 设备记录表, 按项目分表, 最小统计粒度为月, 命名规则: t_o_device_info_项目id
const MUILT_T_O_USER_FIRST_LOGIN_AT = 't_o_user_first_login_at' // 用户首次登陆表, 用于统计新课, 按项目分表, 命名规则: t_o_customer_first_login_at_项目id
const MUILT_T_R_ERROR_SUMMARY = 't_r_error_summary' // 错误统计表,用于统计错误类型，错误名字

let urlList = ['http://127.0.0.1:3000/template1', 'http://127.0.0.1:3000/template2', 'http://127.0.0.1:3000/template3']
let errorNameList = ['代理异常_Response Code', '代理异常_Response Timeout', 'JS异常_IMAGE_LOAD_ERROR', '加载页面异常_ERR_ABORTED']

async function getSQL () {
  let sql = ''
  let sqlList = []
  sqlList[0] = getAlarmLog()
  sqlList[1] = getUserSQL()
  sqlList[2] = getBehaviorDistribution()
  sqlList[3] = getErrorSummarySQL()
  sqlList[4] = getOriginMonitorSQL()
  sqlList[5] = getIndicatorSQl()
  sqlList[6] = getOSDistribution()
  sqlList[7] = getBrowserDistribution()
  sqlList[8] = getDuration()
  sqlList[9] = getNewUser()
  for (let sql of sqlList) {
    await Knex.schema.raw(sql)
  }
  sql = sqlList.join('')
  return sql
}
function getUserSQL () {
  let sql = `
    REPLACE INTO t_o_user VALUES (1, '9897985048102565651984810257495248', 'test@qq.com', 'test@qq.com', '2e5c42ba59653a8501b37df58c75defc', '你好', 'dev', 'site', 'http://ww1.sinaimg.cn/large/00749HCsly1fwofq2t1kaj30qn0qnaai.jpg', '', '0', 0, 0);
  `
  return sql
}
function getAlarmLog () {
  let id = 1
  let sql = `REPLACE INTO \`t_r_alarm_log\` (\`id\`, \`project_id\`, \`config_id\`, \`send_at\`, \`error_type\`, \`error_name\`, \`message\`, \`create_time\`, \`update_time\`) VALUES`
  let timeAt = moment().startOf('day').unix()
  for (let count = 1; count <= 20; count++) {
    let index = 1
    for (let errorName of errorNameList) {
      sql += `
      (${id++}, 1, ${index++}, ${timeAt}, '8', '${errorName}', 'alarm message', ${timeAt}, ${timeAt}),`
      timeAt += 500
    }
  }
  return sql.slice(0, sql.length - 1) + ';'
}
function getNewUser () {
  let id = 1
  let count = [50, 6, 3, 10, 100]
  let sql = `REPLACE INTO \`t_r_new_user_summary\` (\`id\`, \`project_id\`, \`total_count\`, \`count_at_time\`, \`count_type\`, \`city_distribute_id\`, \`create_time\`, \`update_time\`) VALUES`
  for (let hour = moment().startOf('day').unix(); hour <= moment().endOf('day').unix(); hour += 3600) {
    sql += `
    (${id++}, 1, ${count[id % count.length]}, '${moment.unix(hour).format('YYYY-MM-DD_HH')}', 'hour', ${id}, ${hour}, ${hour}),`
  }
  return sql.slice(0, sql.length - 1) + ';'
}
function getDuration () {
  let id = 1
  let stay = [24175534, 2417553, 2418553]
  let sql = `REPLACE INTO \`t_r_duration_distribution\` (\`id\`, \`project_id\`, \`total_stay_ms\`, \`total_uv\`, \`count_at_time\`, \`count_type\`, \`city_distribute_id\`, \`create_time\`, \`update_time\`) VALUES`
  for (let hour = moment().startOf('day').unix(); hour <= moment().endOf('day').unix(); hour += 3600) {
    sql += `
    (${id++}, 1, ${stay[id % stay.length]}, ${id % 5}, '${moment.unix(hour).format('YYYY-MM-DD_HH')}', 'hour', ${id}, ${hour}, ${hour}),`
  }
  return sql.slice(0, sql.length - 1) + ';'
}
function getBrowserDistribution () {
  let id = 1
  let browserList = ['chrome', '搜狗', 'uc', '百度']
  let versions = ['10', '12', '14', '15', '16', '17', '18', '19']
  let month = moment().format('YYYY-MM')
  let sql = `
  REPLACE INTO \`t_r_system_browser\` (\`id\`, \`project_id\`, \`browser\`, \`browser_version\`, \`total_count\`, \`count_at_month\`, \`city_distribute_id\`, \`create_time\`, \`update_time\`) VALUES`
  for (let browser of browserList) {
    for (let version of versions) {
      sql += `
      (${id++}, 1, '${browser}', '${version}', ${id * 2 % 10 + 5}, '${month}', ${id}, ${moment().unix()}, ${moment().unix()}),`
    }
  }
  return sql.slice(0, sql.length - 1) + ';'
}
function getOSDistribution () {
  let id = 1
  let systemList = ['Max OS', 'Windows', 'iOS']
  let versions = ['10.2.1', '10.2.2', '10.2.3', '10.2.4', '10.2.5', '10.2.6', '10.2.11', '10.2.2']
  let month = moment().format('YYYY-MM')
  let sql = `
  REPLACE INTO \`t_r_system_os\` (\`id\`, \`project_id\`, \`os\`, \`os_version\`, \`total_count\`, \`count_at_month\`, \`city_distribute_id\`, \`create_time\`, \`update_time\`) VALUES`
  for (let system of systemList) {
    for (let version of versions) {
      sql += `
      (${id++}, 1, '${system}', '${version}', ${id * 2 % 10 + 5}, '${month}', ${id}, ${moment().unix()}, ${moment().unix()}),`
    }
  }
  return sql.slice(0, sql.length - 1) + ';'
}
function getIndicatorSQl () {
  let id = 1
  let indicatorList = MPerformance.INDICATOR_TYPE_LIST
  let nowMoment = moment()
  let tableName = 't_r_performance_1_' + nowMoment.format('YYYYMM')
  let sql = `
  REPLACE INTO \`${tableName}\` (\`id\`, \`sum_indicator_value\`, \`pv\`, \`indicator\`, \`url\`, \`city_distribute_id\`, \`count_at_time\`, \`count_type\`, \`create_time\`, \`update_time\`) VALUES`
  for (let timeAt = nowMoment.clone().subtract(3, 'hour').unix(); timeAt <= nowMoment.unix(); timeAt += 60) {
    sql += `
    (${id++}, ${id % 10}, ${id % 5}, '${indicatorList[id % indicatorList.length]}', '${urlList[id % urlList.length]}', ${id}, '${moment.unix(timeAt).format('YYYY-MM-DD_HH:mm')}', 'minute', ${timeAt}, ${timeAt}),`
  }
  for (let timeAt = nowMoment.clone().subtract(48, 'hour').unix(); timeAt <= nowMoment.unix(); timeAt += 3600) {
    sql += `
    (${id++}, ${id % 10}, ${id % 5}, '${indicatorList[id % indicatorList.length]}', '${urlList[id % urlList.length]}', ${id}, '${moment.unix(timeAt).format('YYYY-MM-DD_HH')}', 'hour', ${timeAt}, ${timeAt}),`
  }
  return sql.slice(0, sql.length - 1) + ';'
}
function getOriginMonitorSQL () {
  let nowMoment = moment()
  let startDayMoment = moment().startOf('day')
  let tableName = 't_o_monitor_1_' + nowMoment.format('YYYYMM')
  let id = 1
  let sql = `
  REPLACE INTO \`${tableName}\` (\`id\`, \`error_type\`, \`error_name\`, \`http_code\`, \`monitor_ext_id\`, \`during_ms\`, \`request_size_b\`, \`response_size_b\`, \`url\`, \`country\`, \`province\`, \`city\`, \`log_at\`, \`md5\`, \`create_time\`, \`update_time\`) VALUES`
  for (let logAt = startDayMoment.unix(), count = 1; logAt <= nowMoment.unix() && count <= 100; logAt += 120, count++) {
    sql += `
    (${id++}, '8', '${errorNameList[id % errorNameList.length]}', '400', ${id}, '10', '10', '10', '${urlList[id % urlList.length]}', '中国', '河南', '安阳', '${logAt}', 'md5', ${logAt}, ${logAt}),`
  }
  return sql.slice(0, sql.length - 1) + ';'
}
function getBehaviorDistribution () {
  let nowMoment = moment()
  let nowDay = nowMoment.date()
  let threeDayAgo = nowDay - 3
  let code = ['SIDE_A01B02', 'SIDE_A01B0', 'SIDE_A01B', 'SIDE_A01']
  let name = ['用户', '产品', 'url', '错误页面']
  let id = 101
  let sql = `
  REPLACE INTO \`t_r_behavior_distribution\` (\`id\`, \`project_id\`, \`code\`, \`name\`, \`url\`, \`total_count\`, \`count_at_time\`, \`count_type\`, \`city_distribute_id\`, \`create_time\`, \`update_time\`) VALUES `
  if (threeDayAgo < 0) threeDayAgo = 0
  for (let day = threeDayAgo; day <= nowDay; day++) {
    for (let hour = 0; hour <= 23; hour++) {
      sql += `
      (${id++},1, '${code[id % code.length]}', '${name[id % name.length]}', '${urlList[id % urlList.length]}', ${id % 30}, '${nowMoment.format('YYYY-MM-') + day.toString().padStart(2, '0') + '_' + hour.toString().padStart(2, '0')}', 'day', ${id}, ${moment().unix()}, ${moment().unix()}),
      `
    }
    sql += `
    (${id++},1, '${code[id % code.length]}', '${name[id % name.length]}', '${urlList[id % urlList.length]}', ${id % 30}, '${nowMoment.format('YYYY-MM-') + day.toString().padStart(2, '0')}', 'day', ${id}, ${moment().unix()}, ${moment().unix()}),`
  }
  return sql.slice(0, sql.length - 1) + ';'
}
function getErrorSummarySQL () {
  let id = 1
  let nowMoment = moment()
  let tableName = 't_r_error_summary_1_' + nowMoment.format('YYYYMM')
  let monthPrefix = nowMoment.format('YYYY-MM')
  let timeStrPrefix = nowMoment.format('YYYY-MM-DD')
  let sql = `
  REPLACE INTO \`${tableName}\` (\`id\`, \`error_type\`, \`error_name\`, \`url_path\`, \`city_distribution_id\`, \`count_at_time\`, \`count_type\`, \`error_count\`, \`create_time\`, \`update_time\`) VALUES `
  let nowHour = nowMoment.hour()
  let endHour = nowHour - 3
  if (endHour < 0) endHour = 0
  for (let hour = endHour; hour <= nowHour; hour++) {
    let hourStr = (hour + '').padStart(2, '0')
    for (let minute = 0; minute < 60; minute++) {
      let minuteStr = (minute + '').padStart(2, '0')
      sql += `(${id++}, '8', '${errorNameList[id % errorNameList.length]}', '${urlList[id % urlList.length]}', ${id}, '${timeStrPrefix + '_' + hourStr + ':' + minuteStr}', 'minute', ${id % 10}, ${moment().unix()}, ${moment().unix()}),
      `
    }
    sql += `(${id++}, '8', '${errorNameList[id % errorNameList.length]}', '${urlList[id % urlList.length]}', ${id}, '${timeStrPrefix + '_' + hourStr}', 'hour', ${id % 100}, ${moment().unix()}, ${moment().unix()}),`
  }
  for (let day = nowMoment.date(), count = 1; count <= 30; count++) {
    sql += `
    (${id++}, '8', '${errorNameList[id % errorNameList.length]}', '${urlList[id % urlList.length]}', ${id}, '${monthPrefix + '-' + day.toString().padStart(2, '0')}', 'day', ${id % 100}, ${moment().unix()}, ${moment().unix()}),`
  }
  return sql.slice(0, sql.length - 1) + ';'
}
let TABLE_TEMPLATE = {}
TABLE_TEMPLATE[SINGLE_T_O_PROJECT] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '项目id',
  \`display_name\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目名称',
  \`project_name\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目代号(替代项目id, 方便debug)',
  \`c_desc\` varchar(100) NOT NULL DEFAULT '' COMMENT '备注信息',
  \`rate\` int(10) NOT NULL DEFAULT '10000' COMMENT '数据抽样比率',
  \`is_delete\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已删除(1 => 是, 0 => 否)',
  \`create_ucid\` varchar(20) NOT NULL DEFAULT '' COMMENT '创建人ucid',
  \`update_ucid\` varchar(20) NOT NULL DEFAULT '' COMMENT '更新人ucid',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_project_name\` (\`project_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';`

TABLE_TEMPLATE[SINGLE_T_R_BEHAVIOR_DISTRIBUTION] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`code\` varchar(50) NOT NULL DEFAULT '' COMMENT '用户行为标识',
  \`name\` varchar(50) NOT NULL DEFAULT '' COMMENT '用户点击名称',
  \`url\` varchar(200) NOT NULL DEFAULT '' COMMENT '用户点击页面',
  \`total_count\` int(10) NOT NULL DEFAULT '0' COMMENT '点击总量',
  \`count_at_time\` varchar(30) NOT NULL DEFAULT '' COMMENT '统计日期,格式根据统计尺度不同有三种可能,  hour => YYYY-MM-DD_HH, day => YYYY-MM-DD, month => YYYY-MM',
  \`count_type\` varchar(20) NOT NULL DEFAULT 'day' COMMENT '统计尺度(hour/day/month)',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布详情记录id',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_project_id_count_type_count_at_time\` (\`project_id\`, \`count_type\`, \`count_at_time\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户点击记录表, 最小统计粒度为天';`

TABLE_TEMPLATE[SINGLE_T_R_DURATION_DISTRIBUTION] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`total_stay_ms\` bigint(20) NOT NULL DEFAULT '0' COMMENT '总停留毫秒数',
  \`total_uv\` int(10) NOT NULL DEFAULT '0' COMMENT '总uv数(从uv表中获取)',
  \`count_at_time\` varchar(30) NOT NULL DEFAULT '' COMMENT '统计日期,格式根据统计尺度不同有两种可能, day => YYYY-MM-DD, month => YYYY-MM',
  \`count_type\` varchar(20) NOT NULL DEFAULT 'day' COMMENT '统计尺度(day/month)',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布详情记录id',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  PRIMARY KEY (\`id\`),
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  KEY \`idx_project_id_count_type_count_at_time\` (\`project_id\`, \`count_type\`, \`count_at_time\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户停留时长分布, 不分表，按天和按月进行统计';`

TABLE_TEMPLATE[SINGLE_T_R_HTTP_ERROR_DISTRIBUTION] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`total_count\` int(10) NOT NULL DEFAULT '0' COMMENT 'http响应码总数',
  \`http_code_2xx_count\` int(10) NOT NULL DEFAULT '0' COMMENT 'http响应码2xx总数',
  \`http_code_3xx_count\` int(10) NOT NULL DEFAULT '0' COMMENT 'http响应码3xx总数',
  \`http_code_4xx_count\` int(10) NOT NULL DEFAULT '0' COMMENT 'http响应码4xx总数',
  \`http_code_5xx_count\` int(10) NOT NULL DEFAULT '0' COMMENT 'http响应码5xx总数',
  \`http_code_other_count\` int(10) NOT NULL DEFAULT '0' COMMENT '其他http响应码总数',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布详情记录id',
  \`count_at_time\` varchar(30) NOT NULL DEFAULT '' COMMENT '统计日期,格式根据统计尺度不同有三种可能,  hour => YYYY-MM-DD_HH, day => YYYY-MM-DD, month => YYYY-MM',
  \`count_type\` varchar(20) NOT NULL DEFAULT 'hour' COMMENT '统计尺度(hour/day/month)',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_project_id_count_type_count_at_time\` (\`project_id\`, \`count_type\`, \`count_at_time\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错误分布, 不分表，按天和按月进行统计';`

TABLE_TEMPLATE[SINGLE_T_R_PAGE_VIEW] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`total_count\` int(10) NOT NULL DEFAULT '0' COMMENT 'pv数',
  \`count_at_time\` varchar(30) NOT NULL DEFAULT '' COMMENT '统计日期,格式根据统计尺度不同有三种可能,  hour => YYYY-MM-DD_HH, day => YYYY-MM-DD, month => YYYY-MM',
  \`count_type\` varchar(20) NOT NULL DEFAULT 'hour' COMMENT '统计尺度(hour/day/month)',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布记录id',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_project_id_count_type_count_at_time\` (\`project_id\`,\`count_type\`,\`count_at_time\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='pv记录表, 不分表';`

TABLE_TEMPLATE[SINGLE_T_R_SYSTEM_BROWSER] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`browser\` varchar(20) NOT NULL DEFAULT '' COMMENT '浏览器品牌',
  \`browser_version\` varchar(50) NOT NULL DEFAULT '' COMMENT '浏览器详情',
  \`total_count\` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '数量总和',
  \`count_at_month\` varchar(15) NOT NULL DEFAULT '' COMMENT '统计时间段, YYYY-MM格式 => 2018-09',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布记录id',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_project_id_count_at_month\` (\`project_id\`, \`count_at_month\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='浏览器分布数据表, 不分表, 按月统计';`

TABLE_TEMPLATE[SINGLE_T_R_SYSTEM_RUNTIME_VERSION] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`runtime_version\` varchar(50) NOT NULL DEFAULT '' COMMENT '应用版本号',
  \`total_count\` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '数量总和',
  \`count_at_month\` varchar(15) NOT NULL DEFAULT '' COMMENT '统计时间段, YYYY-MM格式 => 2018-09',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布记录id',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_project_id_count_at_month\` (\`project_id\`, \`count_at_month\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='版本分布数据表, 不分表, 按月统计';`

TABLE_TEMPLATE[SINGLE_T_R_SYSTEM_DEVICE] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`device_vendor\` varchar(50) NOT NULL DEFAULT '' COMMENT '设备制造商',
  \`device_model\` varchar(50) NOT NULL DEFAULT '' COMMENT '设备详情',
  \`total_count\` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '数量总和',
  \`count_at_month\` varchar(15) NOT NULL DEFAULT '' COMMENT '统计时间段, YYYY-MM格式 => 2018-09',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布记录id',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_project_id_count_at_month\` (\`project_id\`, \`count_at_month\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备分布数据表, 不分表, 按月统计';`

TABLE_TEMPLATE[SINGLE_T_R_SYSTEM_OS] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`os\` varchar(50) NOT NULL DEFAULT '' COMMENT '操作系统名',
  \`os_version\` varchar(50) NOT NULL DEFAULT '' COMMENT '操作系统版本',
  \`total_count\` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '数量总和',
  \`count_at_month\` varchar(15) NOT NULL DEFAULT '' COMMENT '统计时间段, YYYY-MM格式 => 2018-09',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布记录id',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_project_id_count_at_month\` (\`project_id\`, \`count_at_month\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作系统分布数据表, 不分表, 按月统计';`

TABLE_TEMPLATE[SINGLE_T_R_UNIQUE_VIEW] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`total_count\` int(10) NOT NULL DEFAULT '0' COMMENT 'uv数',
  \`count_at_time\` varchar(30) NOT NULL DEFAULT '' COMMENT '统计日期,格式根据统计尺度不同有三种可能,  hour => YYYY-MM-DD_HH, day => YYYY-MM-DD, month => YYYY-MM',
  \`count_type\` varchar(20) NOT NULL DEFAULT 'hour' COMMENT '统计尺度(hour/day/month)',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布记录id',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_project_id_count_type_count_at_time\` (\`project_id\`,\`count_type\`,\`count_at_time\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='uv记录表, 不分表';`

TABLE_TEMPLATE[MUILT_T_O_MONITOR] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`error_type\` varchar(20) NOT NULL DEFAULT '' COMMENT '异常类型(目前是四种,分别对应前端的四种报错类型: api_data =>前端数据结构报警, start_process => 启动过程异常, load_wv => Url加载空服务报警, api_code => 请求接口异常报警)',
  \`error_name\` varchar(255) NOT NULL DEFAULT '' COMMENT '错误名/错误代码,用于细分错误类别',
  \`http_code\` int(10) NOT NULL DEFAULT '0' COMMENT 'http状态码, 没有则为0',
  \`monitor_ext_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '详情id',
  \`during_ms\` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '接口请求时长, 单位毫秒',
  \`request_size_b\` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '接口请求体积, 单位b',
  \`response_size_b\` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '接口响应体积, 单位b',
  \`url\` varchar(255) NOT NULL DEFAULT '' COMMENT '发生异常的url',
  \`country\` varchar(10) NOT NULL DEFAULT '' COMMENT '所属国家',
  \`province\` varchar(15) NOT NULL DEFAULT '' COMMENT '所属省份',
  \`city\` varchar(15) NOT NULL DEFAULT '' COMMENT '所属城市',
  \`log_at\` bigint(20) NOT NULL DEFAULT '0' COMMENT '日志记录时间',
  \`md5\` char(32) NOT NULL DEFAULT '' COMMENT '记录生成MD5',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_log_at_md5\` (\`log_at\`,\`md5\`),
  KEY \`idx_log_at_error_type_error_name_url\` (\`log_at\`,\`error_type\`,\`error_name\`,\`url\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常数据表, 按项目按月分表, 只有最基础的错误信息, ext字段需要到详情表中单独获取, 命名规则: t_o_monitor_项目id_YYYYMM';
`
TABLE_TEMPLATE[MUILT_T_O_MONITOR_EXT] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`ext_json\` text COMMENT '异常记录扩展信息',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常数据的ext信息, 按项目按月分表, 命名规则: t_o_monitor_ext_项目id_YYYYMM';
`

TABLE_TEMPLATE[MUILT_T_O_UV_RECORD] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '项目id',
  \`uuid\` varchar(50) NOT NULL DEFAULT '' COMMENT '设备唯一标识',
  \`country\` varchar(10) NOT NULL DEFAULT '' COMMENT '所属国家',
  \`province\` varchar(15) NOT NULL DEFAULT '' COMMENT '所属省份',
  \`city\` varchar(15) NOT NULL DEFAULT '' COMMENT '所属城市',
  \`visit_at_hour\` varchar(20) NOT NULL DEFAULT '' COMMENT '访问日期, 数据格式为 YYYY-MM-DD_HH demo => 2018-08-02_23',
  \`pv_count\` int(10) NOT NULL DEFAULT '0' COMMENT '时间段内同一uuid访问次数, 用于计算总pv',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_visit_at_hour_uuid\` (\`visit_at_hour\`,\`uuid\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='uv记录表, 按项目&月分表,最小统计粒度为小时 命名规则: t_o_uv_record_项目id_YYYYMM';
        `
TABLE_TEMPLATE[MUILT_T_R_CITY_DISTRIBUTION] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`city_distribute_json\` text COMMENT '扩展字段',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='城市数据的扩展信息, 按项目按月分表, 命名规则: t_r_city_distribution_项目id_YYYYMM, 获取数据时, 以记录创建时间和记录所属项目id, 决定distribute记录所在表';
`

TABLE_TEMPLATE[MUILT_T_R_PERFORMANCE] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`sum_indicator_value\` bigInt(10) NOT NULL DEFAULT '0' COMMENT '性能指标求和',
  \`pv\` bigInt(10) NOT NULL DEFAULT '0' COMMENT '性能指标pv数,用于计算平均时长',
  \`indicator\` varchar(50) NOT NULL DEFAULT '' COMMENT '性能指标:DNS响应时间/TCP时间/404数量/etc',
  \`url\` varchar(255) NOT NULL DEFAULT '' COMMENT '页面url',
  \`city_distribute_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '城市分布详情记录id',
  \`count_at_time\` varchar(20) NOT NULL DEFAULT '' COMMENT '统计日期,格式根据统计尺度不同有四种可能,  minute => YYYY-MM-DD_HH:mm, hour => YYYY-MM-DD_HH, day => YYYY-MM-DD, month => YYYY-MM',
  \`count_type\` varchar(10) NOT NULL DEFAULT 'minute' COMMENT '统计尺度(minute/hour/day/month)',

  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_count_at_time_count_type_url_indicator\` (\`count_at_time\`, \`count_type\`, \`url\`, \`indicator\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='性能指标表, 按项目按月分表, 索引应为唯一索引, 但是长度超限, 因此只能使用index';
  `

TABLE_TEMPLATE[MUILT_T_O_SYSTEM_COLLECTION] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`uuid\` varchar(50) NOT NULL DEFAULT '' COMMENT '设备唯一标识',
  \`browser\` varchar(50) NOT NULL DEFAULT '' COMMENT '浏览器品牌',
  \`browser_version\` varchar(100) NOT NULL DEFAULT '' COMMENT '浏览器版本详情',
  \`engine\` varchar(100) NOT NULL DEFAULT '' COMMENT '内核名称',
  \`engine_version\` varchar(100) NOT NULL DEFAULT '' COMMENT '内核版本详情',
  \`device_vendor\` varchar(100) NOT NULL DEFAULT '' COMMENT '手机品牌',
  \`device_model\` varchar(100) NOT NULL DEFAULT '' COMMENT '手机型号',
  \`os\` varchar(50) NOT NULL DEFAULT '' COMMENT '操作系统',
  \`os_version\` varchar(50) NOT NULL DEFAULT '' COMMENT '操作系统详情',
  \`country\` varchar(10) NOT NULL DEFAULT '' COMMENT '所属国家',
  \`province\` varchar(15) NOT NULL DEFAULT '' COMMENT '所属省份',
  \`city\` varchar(15) NOT NULL DEFAULT '' COMMENT '所属城市',
  \`runtime_version\` varchar(50) NOT NULL DEFAULT '' COMMENT '应用版本',
  \`visit_at_month\` varchar(20) NOT NULL DEFAULT '' COMMENT '访问日期, 数据格式为 YYYY-MM demo => 2018-09',
  \`log_at\` bigint(20) NOT NULL DEFAULT '0' COMMENT '日志记录时间',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_visit_at_month_uuid\` (\`visit_at_month\`,\`uuid\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备记录表, 按项目分表, 最小统计粒度为月, 命名规则: t_o_device_info_项目id';
`
TABLE_TEMPLATE[MUILT_T_O_USER_FIRST_LOGIN_AT] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`ucid\` varchar(20) NOT NULL DEFAULT '' COMMENT '用户id',
  \`first_visit_at\` bigint(20) NOT NULL DEFAULT '0' COMMENT '用户首次访问时间',

  \`country\` varchar(10) NOT NULL DEFAULT '' COMMENT '所属国家',
  \`province\` varchar(15) NOT NULL DEFAULT '' COMMENT '所属省份',
  \`city\` varchar(15) NOT NULL DEFAULT '' COMMENT '所属城市',

  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_ucid\` (\`ucid\`),
  INDEX \`idx_first_visit_at\` (\`first_visit_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='新用户记录表, 按项目分表, 命名规则: t_o_customer_first_login_at_项目id';
`
TABLE_TEMPLATE[MUILT_T_R_ERROR_SUMMARY] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`error_type\` varchar(20) NOT NULL DEFAULT '' COMMENT '错误类型',
  \`error_name\` varchar(255) NOT NULL DEFAULT '' COMMENT '错误名字',
  \`url_path\` varchar(255) NOT NULL DEFAULT '' COMMENT '错误URL_PATH',
  \`city_distribution_id\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '城市分布详情id',
  \`count_at_time\` varchar(20) NOT NULL DEFAULT '' COMMENT '统计时间(按类型不同,day:YYYY-MM-DD;hour:YYYY-MM-DD_HH;minute:YYYY-MM-DD_HH:mm)',
  \`count_type\` varchar(10) NOT NULL DEFAULT 'day' COMMENT '统计类型(day天,hour小时,minute分)',
  \`error_count\` int(10) NOT NULL DEFAULT '0' COMMENT '数量总和',
  \`create_time\` int(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  \`update_time\` int(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_count_at_time_count_type_error_type_error_name\` (\`count_at_time\`,\`count_type\`,\`error_type\`,\`error_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='按项目,按月统计error错误';
`
TABLE_TEMPLATE[SINGLE_T_R_ALARM_LOG] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '要报警项目id',
  \`config_id\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '报警配置id',
  \`send_at\` bigint(20) NOT NULL DEFAULT '0' COMMENT '报警时间戳',
  \`error_type\` varchar(20) NOT NULL DEFAULT '' COMMENT '错误类型',
  \`error_name\` varchar(255) NOT NULL DEFAULT '' COMMENT '错误名字',
  \`message\` varchar(500) NOT NULL DEFAULT '' COMMENT '报警信息',
  \`create_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间',
  \`update_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_send_at_project_id\` (\`send_at\`,\`project_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`
/** ************************** MULTI & SINGLE ******************************************/
TABLE_TEMPLATE[SINGLE_T_O_ALARM_CONFIG] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  \`project_id\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '要报警项目id',
  \`owner_ucid\` varchar(20) NOT NULL DEFAULT '' COMMENT '项目所有人id',
  \`error_type\` varchar(20) NOT NULL DEFAULT '' COMMENT '报警错误类型',
  \`error_name\` varchar(255) NOT NULL DEFAULT '' COMMENT '要报警错误名字',
  \`time_range_s\` int(20) unsigned NOT NULL DEFAULT '0' COMMENT '报警时间范围_秒',
  \`max_error_count\` int(20) unsigned NOT NULL DEFAULT '0' COMMENT '报警错误数阈值',
  \`alarm_interval_s\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '报警时间间隔_秒',
  \`is_enable\` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否开启本条报警配置1：是0：否',
  \`note\` varchar(255) NOT NULL DEFAULT '' COMMENT '配置说明',
  \`is_delete\` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除(1 => 是, 0 => 否)',
  \`create_ucid\` varchar(20) NOT NULL DEFAULT '' COMMENT '创建此记录的人',
  \`update_ucid\` varchar(20) NOT NULL DEFAULT '' COMMENT '更新此记录的人',
  \`create_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '创建此记录的时间',
  \`update_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '更新此记录的时间',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目报警配置表';
`
TABLE_TEMPLATE[SINGLE_T_O_USER] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '贝壳ucid',
  \`account\` varchar(50) NOT NULL DEFAULT '' COMMENT '账户名,不能重复',
  \`email\` varchar(50) NOT NULL DEFAULT '' COMMENT '邮箱',
  \`password_md5\` varchar(32) NOT NULL DEFAULT '' COMMENT 'md5后的password',
  \`nickname\` varchar(20) NOT NULL DEFAULT '' COMMENT '昵称',
  \`role\` varchar(50) NOT NULL DEFAULT 'dev' COMMENT '角色(dev => 开发者,admin => 管理员)',
  \`register_type\` varchar(20) NOT NULL DEFAULT 'site' COMMENT '注册类型(site => 网站注册, third => 第三方登录)',
  \`avatar_url\` varchar(200) NOT NULL DEFAULT 'http://ww1.sinaimg.cn/large/00749HCsly1fwofq2t1kaj30qn0qnaai.jpg' COMMENT '头像地址, 默认使用贝壳logo',
  \`mobile\` varchar(20) NOT NULL DEFAULT '' COMMENT '手机号',
  \`is_delete\` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除(1 => 是, 0 => 否)',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_ucid\` (\`ucid\`),
  UNIQUE KEY \`uniq_account\` (\`account\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';
`
TABLE_TEMPLATE[SINGLE_T_O_PROJECT_MEMBER] = `(
    \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
    \`project_id\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '项目id',
    \`ucid\` varchar(20) NOT NULL DEFAULT '' COMMENT '项目参与者ucid',
    \`role\` varchar(20) NOT NULL DEFAULT '' COMMENT '参与者角色(owner => 组长, dev => 成员)',
    \`need_alarm\` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否需要报警(0 => 不需要, 1 => 需要)',
    \`is_delete\` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否已删除(0 => 未删除, 1 => 已删除)',
    \`create_ucid\` varchar(20) NOT NULL DEFAULT '' COMMENT '创建者ucid',
    \`update_ucid\` varchar(20) NOT NULL DEFAULT '' COMMENT '更新者ucid',
    \`create_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '创建此记录的时间',
    \`update_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '更新此记录的时间',
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目成员表';
`
TABLE_TEMPLATE[SINGLE_T_O_NEW_USER_SUMMARY] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`total_count\` int(10)    NOT NULL DEFAULT '0' COMMENT '数量总和',
  \`count_at_time\` varchar(20) NOT NULL DEFAULT '' COMMENT '统计日期,格式根据统计尺度不同三两种可能, hour => YYYY-MM-DD_HH, day => YYYY-MM-DD, month => YYYY-MM',
  \`count_type\` varchar(10) NOT NULL DEFAULT 'day' COMMENT '统计尺度(hour/day/month)',
  
  \`city_distribute_id\` bigint(10) NOT NULL DEFAULT 0 COMMENT '城市分布详情记录id',
  
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '更新时间',
  PRIMARY KEY (\`id\`),
  INDEX \`idx_count_at_time_project_id\` (\`count_at_time\`, \`project_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='新用户统计表, 不分表';
`

function generate (baseTableName, projectId = '', tableTime = '') {
  // 获取模板
  let content = TABLE_TEMPLATE[baseTableName]

  // 生成表名
  let fininalTableName = `${baseTableName}`
  switch (baseTableName) {
    case MUILT_T_O_MONITOR:
      fininalTableName = `${fininalTableName}_${projectId}_${tableTime}`
      break
    case MUILT_T_O_MONITOR_EXT:
      fininalTableName = `${fininalTableName}_${projectId}_${tableTime}`
      break
    case MUILT_T_O_UV_RECORD:
      fininalTableName = `${fininalTableName}_${projectId}_${tableTime}`
      break
    case MUILT_T_R_CITY_DISTRIBUTION:
      fininalTableName = `${fininalTableName}_${projectId}_${tableTime}`
      break
    case MUILT_T_R_PERFORMANCE:
      fininalTableName = `${fininalTableName}_${projectId}_${tableTime}`
      break
    case MUILT_T_O_SYSTEM_COLLECTION:
      fininalTableName = `${fininalTableName}_${projectId}`
      break
    case MUILT_T_O_USER_FIRST_LOGIN_AT:
      fininalTableName = `${fininalTableName}_${projectId}`
      break
    case MUILT_T_R_ERROR_SUMMARY:
      fininalTableName = `${fininalTableName}_${projectId}_${tableTime}`
      break
    default:
  }

  return `CREATE TABLE  IF NOT EXISTS  \`${fininalTableName}\` ${content}
`
}

class GenerateSQL extends Base {
  static get signature () {
    return `
       Utils:TemplateSQL
       `
  }

  static get description () {
    return '生成项目在指定日期范围内的建表SQL'
  }

  async execute (args, options) {
    let projectIdList = ['1']
    let startAtYm = moment().format('YYYYMM')
    let finishAtYm = moment().format('YYYYMM')
    //     let commonSqlContent = `
    // SET NAMES utf8mb4;
    // SET foreign_key_checks = 0;
    // `
    let commonSqlContent = ''
    for (let tableName of [
      SINGLE_T_O_PROJECT,
      SINGLE_T_R_BEHAVIOR_DISTRIBUTION,
      SINGLE_T_R_DURATION_DISTRIBUTION,
      SINGLE_T_R_HTTP_ERROR_DISTRIBUTION,
      SINGLE_T_R_PAGE_VIEW,
      SINGLE_T_R_SYSTEM_BROWSER,
      SINGLE_T_R_SYSTEM_RUNTIME_VERSION,
      SINGLE_T_R_SYSTEM_DEVICE,
      SINGLE_T_R_SYSTEM_OS,
      SINGLE_T_R_UNIQUE_VIEW,
      SINGLE_T_O_ALARM_CONFIG,
      SINGLE_T_O_USER,
      SINGLE_T_O_PROJECT_MEMBER,
      SINGLE_T_O_NEW_USER_SUMMARY,
      SINGLE_T_R_ALARM_LOG
    ]) {
      let content = generate(tableName)
      await Knex.schema.raw(content)
      commonSqlContent = `${commonSqlContent}\n${content}`
    }
    let finishAtMoment = moment(finishAtYm, DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH)
    let sqlContent = '-- --------分表部分---------'
    for (let projectId of projectIdList) {
      for (let currentAtMoment = moment(startAtYm, DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH);
        // 生成时间范围之内的数据表
        currentAtMoment.isBefore(finishAtMoment.clone().add(1, 'months'));
        currentAtMoment = currentAtMoment.clone().add(1, 'months')) {
        let curremtAtYM = currentAtMoment.format(SQL_DATE_FORMAT_YM)
        sqlContent = `${sqlContent}\n-- SQL for ${curremtAtYM} => \n`
        for (let tableName of [
          MUILT_T_O_MONITOR,
          MUILT_T_O_MONITOR_EXT,
          MUILT_T_O_UV_RECORD,
          MUILT_T_R_CITY_DISTRIBUTION,
          MUILT_T_R_PERFORMANCE,
          MUILT_T_O_SYSTEM_COLLECTION,
          MUILT_T_O_USER_FIRST_LOGIN_AT,
          MUILT_T_R_ERROR_SUMMARY
        ]) {
          let content = generate(tableName, projectId, curremtAtYM)
          await Knex.schema.raw(content)
          sqlContent = `${sqlContent}\n${content}`
        }
      }
    }

    let insertProjectInfo = `
REPLACE INTO \`t_o_project\` (\`id\`, \`rate\`, \`display_name\`, \`project_name\`, \`c_desc\`, \`is_delete\`, \`create_ucid\`, \`update_ucid\`, \`create_time\`, \`update_time\`) VALUES (1, 10000, '模板项目', 'template', '负责人:你好', 0, '', '', 0, 0);
`
    await Knex.schema.raw(insertProjectInfo)
    insertProjectInfo += await getSQL()
    let sql = `${commonSqlContent}\n${sqlContent}\n${insertProjectInfo}\n`
  }

  /**
     * 覆盖父类方法, 避免再手工删除冗余日志记录
     * @param {*} args
     * @param {*} options
     */
  async handle (args, options) {
    await this.execute(args, options).catch(e => {
      this.log('catch error')
      this.log(e.stack)
    })
  }

  /**
     * 覆盖父类方法, 避免再手工删除冗余日志记录
     * @param {*} args
     * @param {*} options
     */
  async log (message) {
    console.log(message)
  }
}
export default GenerateSQL
