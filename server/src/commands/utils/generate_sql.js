import Base from '~/src/commands/base'
import moment from 'moment'
import _ from 'lodash'
import DATE_FORMAT from '~/src/constants/date_format'

const SQL_DATE_FORMAT_YM = 'YYYYMM'

// 不需要分表
const SINGLE_T_O_USER = 't_o_user' // 用户表
const SINGLE_T_O_PROJECT = 't_o_project' //  项目表
const SINGLE_T_O_PROJECT_APPLY = 't_o_project_apply' // 接入项目审核表
const SINGLE_T_O_PROJECT_MEMBER = 't_o_project_member' // 项目成员表

const SINGLE_T_O_DIARY = 't_o_count_diary'  // 报错数据日报统计表
const SINGLE_T_R_ALARM_LOG = 't_r_alarm_log' // 报警记录表
const SINGLE_T_O_ALARM_CONFIG = 't_o_alarm_config' // 报警配置表

const SINGLE_T_R_COUNT_DAILY = 't_r_count_daily' //  性能数据日报统计表
const SINGLE_T_O_ALARM_ES_ID = 't_o_alarm_es_id'  // 错误报警es id记录表
const SINGLE_T_O_SOURCEMAP = 't_o_sourcemap'  // sourceMap表

const SINGLE_T_O_DOT_EVENT_INFO = 't_o_dot_event_info'  // 打点事件配置表
const SINGLE_T_O_DOT_EVENT_PROPS = 't_o_dot_event_props'  // 打点事件属性配置表
const SINGLE_T_O_DOT_EVENT_TAGS = 't_o_dot_event_tags'  // 打点事件tag配置表
const SINGLE_T_O_DAILY_SUBSCRIBE = 't_o_daily_subscribe'  // 日报订阅表


let TABLE_TEMPLATE = {}
TABLE_TEMPLATE[SINGLE_T_O_PROJECT] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '项目id',
  \`display_name\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目名称',
  \`project_name\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目代号(替代项目id, 方便debug)',
  \`c_desc\` varchar(100) NOT NULL DEFAULT '' COMMENT '备注信息',
  \`mail\` varchar(100) NOT NULL DEFAULT '' COMMENT '负责人邮箱',
  \`rate\` int(10) NOT NULL DEFAULT '10000' COMMENT '数据抽样比率',
  \`home_page\` varchar(100) NOT NULL DEFAULT '' COMMENT '项目首页地址',
  \`is_delete\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否已删除(1 => 是, 0 => 否)',
  \`create_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '创建人ucid',
  \`update_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '更新人ucid',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_project_name\` (\`project_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';`

TABLE_TEMPLATE[SINGLE_T_O_PROJECT_APPLY] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '项目id',
  \`display_name\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目名称',
  \`project_name\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目代号(替代项目id, 方便debug)',
  \`c_desc\` varchar(100) NOT NULL DEFAULT '' COMMENT '备注信息',
  \`mail\` varchar(100) NOT NULL DEFAULT '' COMMENT '负责人邮箱',
  \`rate\` int(10) NOT NULL DEFAULT '10000' COMMENT '数据抽样比率',
  \`pv\` int(10) NOT NULL DEFAULT '10000' COMMENT '每日pv数量',
  \`home_page\` varchar(100) NOT NULL DEFAULT '' COMMENT '项目首页地址',
  \`owner_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目所有人id',
  \`apply_desc\` varchar(255) NOT NULL DEFAULT '' COMMENT '申请备注',
  \`review_desc\` varchar(255) NOT NULL DEFAULT '' COMMENT '审核备注',
  \`apply_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '申请人ucid',
  \`apply_nick_name\` varchar(20) NOT NULL DEFAULT '' COMMENT '申请人名字',
  \`apply_mail\` varchar(20) NOT NULL DEFAULT '' COMMENT '申请人的邮箱',
  \`review_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '审核人ucid',
  \`review_nick_name\` varchar(20) NOT NULL DEFAULT '' COMMENT '申请人名字',
  \`status\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '审核状态(0 pending 待审核，1 pass 通过 2 refused 拒绝)',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_project_name\` (\`project_name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';`

TABLE_TEMPLATE[SINGLE_T_R_COUNT_DAILY] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`project_name\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目名称',
  \`error_total_count\` bigint(20) NOT NULL DEFAULT '0' COMMENT '当日错误总数',
  \`first_render_ms\` bigint(20) NOT NULL DEFAULT '0' COMMENT '首次渲染耗时',
  \`first_response_ms\` bigint(20) NOT NULL DEFAULT '0' COMMENT '首次可交互耗时',
  \`first_tcp_ms\` bigint(20) NOT NULL DEFAULT '0' COMMENT '首包时间耗时',
  \`count_type\` varchar(20) NOT NULL DEFAULT 'day' COMMENT '统计尺度(day)',
  \`count_at_time\` varchar(15) NOT NULL DEFAULT '' COMMENT '统计时间段, YYYY-MM-DD格式 => 2018-09-01',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_project_id_count_type_count_at_time\` (\`project_id\`,\`count_type\`,\`count_at_time\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='日(周)报统计数据表, 不分表, 按天统计';`

TABLE_TEMPLATE[SINGLE_T_O_DIARY] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '记录id',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`project_name\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目名称',
  \`error_total_count\` bigint(20) NOT NULL DEFAULT '0' COMMENT '当日错误总数',
  \`pv_total_count\` bigint(20) NOT NULL DEFAULT '0' COMMENT '当日pv总数',
  \`uv_total_count\` bigint(20) NOT NULL DEFAULT '0' COMMENT '当日uv总数',
  \`error_rank\` bigint(20) NOT NULL DEFAULT '0' COMMENT '当日错误排行',
  \`error_percent\` float NOT NULL DEFAULT '0' COMMENT '当日错误占百分比',
  \`count_type\` varchar(20) NOT NULL DEFAULT 'day' COMMENT '统计尺度(day)',
  \`count_range\` varchar(20) NOT NULL DEFAULT '0' COMMENT '统计尺度对应的时间范围 比如月 2018-10',
  \`count_at_time\` varchar(15) NOT NULL DEFAULT '' COMMENT '统计时间段, YYYY-MM-DD格式 => 2018-09-01',
  \`create_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库创建时间',
  \`update_time\` bigint(20) NOT NULL DEFAULT '0' COMMENT '数据库更新时间',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_project_id_count_type_count_at_time\` (\`project_id\`,\`count_type\`,\`count_at_time\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='日(周)报数据表, 不分表, 按天统计';`

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='报警记录表';`

TABLE_TEMPLATE[SINGLE_T_O_ALARM_CONFIG] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  \`project_id\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '要报警项目id',
  \`owner_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目所有人id',
  \`type\` varchar(20) NOT NULL DEFAULT 'error' COMMENT '监控类型: error是错误;perf是性能',
  \`error_type\` varchar(20) NOT NULL DEFAULT '' COMMENT '报警错误类型',
  \`error_name\` varchar(255) NOT NULL DEFAULT '' COMMENT '要报警错误名字',
  \`error_filter_list\` varchar(255) NOT NULL DEFAULT '' COMMENT '报警过滤掉的字段用,号分割',
  \`url\` varchar(255) NOT NULL DEFAULT '' COMMENT '监控的url, pref会用到,error不用',
  \`time_range_s\` int(20) unsigned NOT NULL DEFAULT '0' COMMENT '报警时间范围_秒',
  \`max_error_count\` int(20) unsigned NOT NULL DEFAULT '0' COMMENT '报警错误数阈值',
  \`alarm_interval_s\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '报警时间间隔_秒',
  \`callback\` varchar(255) NOT NULL DEFAULT '' COMMENT '错误报警的业务回调地址',
  \`page_rule\` varchar(20) NOT NULL DEFAULT 'url' COMMENT '性能报警区分url和pageType',
  \`wave_motion\` int(3) NOT NULL DEFAULT '0' COMMENT '环比上一个监控周期的错误数',
  \`is_summary\` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否为汇总错误数据 1：是0：否',
  \`webhook\` varchar(255) NOT NULL DEFAULT '' COMMENT '机器人地址',
  \`is_enable\` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否开启本条报警配置1：是0：否',
  \`note\` varchar(255) NOT NULL DEFAULT '' COMMENT '配置说明',
  \`is_delete\` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否删除(1 => 是, 0 => 否)',
  \`create_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '创建此记录的人',
  \`update_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '更新此记录的人',
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
  \`avatar_url\` varchar(200) NOT NULL DEFAULT '' COMMENT '头像地址, 默认使用贝壳logo',
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
    \`ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目参与者ucid',
    \`role\` varchar(20) NOT NULL DEFAULT '' COMMENT '参与者角色(owner => 组长, dev => 成员)',
    \`need_alarm\` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否需要报警(0 => 不需要, 1 => 需要)',
    \`is_delete\` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否已删除(0 => 未删除, 1 => 已删除)',
    \`create_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '创建者ucid',
    \`update_ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '更新者ucid',
    \`create_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '创建此记录的时间',
    \`update_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '更新此记录的时间',
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目成员表';
`
TABLE_TEMPLATE[SINGLE_T_O_SOURCEMAP] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '文件id',
  \`filename\` varchar(100) NOT NULL DEFAULT '' COMMENT '项目名称',
  \`display_name\` varchar(100) NOT NULL DEFAULT '' COMMENT '文件原本的名称',
  \`project_name\` varchar(50) NOT NULL DEFAULT '' COMMENT '项目代号(替代项目id, 方便debug)',
  \`desc\` longblob NOT NULL  COMMENT 'source-map得二进制内容',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_filename\` (\`filename\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='source-map表';`

TABLE_TEMPLATE[SINGLE_T_O_ALARM_ES_ID] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '错误id',
  \`error_es_id\` varchar(100) NOT NULL DEFAULT '' COMMENT 'ES中错误id',
  \`alarm_log_id\` bigint(20) NOT NULL COMMENT '报警日志id',
  \`project_id\` bigint(20) NOT NULL COMMENT '项目id',
  \`es_index_name\` varchar(50) NOT NULL DEFAULT '' COMMENT 'ES索引名',
  \`create_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '创建此记录的时间',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='错误报警id记录表';`

TABLE_TEMPLATE[SINGLE_T_O_DOT_EVENT_INFO] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '事件配置id',
  \`event_name\` varchar(100) NOT NULL DEFAULT '' COMMENT '事件的名称',
  \`event_display_name\` varchar(100) NOT NULL COMMENT '用于展示的事件名称',
  \`event_tag_ids\` varchar(100) NOT NULL COMMENT '事件归属的tag',
  \`event_create_user\` varchar(50) NOT NULL DEFAULT '' COMMENT '创建人',
  \`event_edit_user\` varchar(50) NOT NULL DEFAULT '' COMMENT '修改人',
  \`event_desc\` varchar(255) NOT NULL DEFAULT '' COMMENT '备注',
  \`create_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '创建此记录的时间',
  \`update_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '更新此记录的时间',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  \`is_delete\` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否已删除(0 => 未删除, 1 => 已删除)',
  \`is_visible\` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否可见(0 => 不可见, 1 => 可见)',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_event_name_project_id_is_delete\` (\`event_name\`,\`project_id\`,\`is_delete\`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打点事件配置表';`

TABLE_TEMPLATE[SINGLE_T_O_DOT_EVENT_PROPS] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '属性id',
  \`props_name\` varchar(100) NOT NULL DEFAULT '' COMMENT '属性名',
  \`props_display_name\` varchar(100) NOT NULL COMMENT '用于展示的属性名',
  \`props_data_type\` varchar(100) NOT NULL DEFAULT 'string' COMMENT '属性的数据类型',
  \`is_delete\` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否已删除(0 => 未删除, 1 => 已删除)',
  \`is_visible\` tinyint(1) unsigned NOT NULL DEFAULT '1' COMMENT '是否可见(0 => 不可见, 1 => 可见)',
  \`event_id\` bigint(20) unsigned NOT NULL COMMENT '事件id',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_props_name_event_id_is_delete\` (\`event_id\`,\`props_name\`,\`is_delete\`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打点事件属性配置表';`

TABLE_TEMPLATE[SINGLE_T_O_DOT_EVENT_TAGS] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '属性id',
  \`name\` varchar(100) NOT NULL DEFAULT '' COMMENT 'tag名称',
  \`color\` varchar(100) NOT NULL DEFAULT '#2d8cf0' COMMENT 'tag颜色',
  \`project_id\` bigint(20) NOT NULL DEFAULT '0' COMMENT '项目id',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_name_project_id\` (\`name\`,\`project_id\`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打点事件tag配置表';`

TABLE_TEMPLATE[SINGLE_T_O_DAILY_SUBSCRIBE] = `(
  \`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  \`project_id\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '被订阅项目的id',
  \`ucid\` varchar(50) NOT NULL DEFAULT '' COMMENT '日报订阅者ucid',
  \`send_time\` varchar(20) NOT NULL DEFAULT '08:00' COMMENT '日报发送时间',
  \`create_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '创建此记录的时间',
  \`update_time\` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '更新此记录的时间',
  \`email\` varchar(200) NOT NULL DEFAULT '' COMMENT '用户邮箱',
  \`project_display_name\` varchar(100) NOT NULL DEFAULT '' COMMENT '项目名称',
  \`need_callback\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否需要将原始日报数据回传',
  \`callback_url\` varchar(200) NOT NULL DEFAULT '' COMMENT '接收数据的接口地址',
  \`protocol\` varchar(10) NOT NULL DEFAULT 'http' COMMENT '接口协议',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='日报订阅表';`

function generate (baseTableName) {
   // 获取模板
  let content = TABLE_TEMPLATE[baseTableName]

  // 生成表名
  let fininalTableName = `${baseTableName}`

  return `
CREATE TABLE  IF NOT EXISTS  \`${fininalTableName}\` ${content}
    `
}

class GenerateSQL extends Base {
  static get signature () {
    return `
       Utils:GenerateSQL
       {projectIdList:项目id列表,逗号分割}
       {startAtYm:建表日期开始时间(包括该时间),${DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH}格式}
       {finishAtYm:建表日期结束时间(包括该时间),${DATE_FORMAT.COMMAND_ARGUMENT_BY_MONTH}格式}
       `
  }

  static get description () {
    return '生成项目在指定日期范围内的建表SQL'
  }

  async execute (args, options) {
    let { projectIdList } = args
    projectIdList = projectIdList.split(',')
    if (_.isEmpty(projectIdList)) {
      this.warn('自动退出:projectIdList为空 =>', projectIdList)
      return false
    }
    let commonSqlContent = `


-- Adminer 4.3.1 MySQL dump
-- 时间类型只有以下模式
--
-- year => YYYY
-- month => YYYY-MM
-- day => YYYY-MM-DD
-- hour => YYYY-MM-DD_HH
-- minute => YYYY-MM-DD_HH:mm
-- second => YYYY-MM-DD_HH:mm:ss
-- 
-- 字段规范
-- 使用下划线区分
-- 数字默认值一般为0
-- 字符串默认值一般为空字符串
-- 数据库关键字/可能为关键字的字段前, 加c_前缀
-- url => varchar(255)
-- id => bigint(20)
-- 时间戳 => bigint(20)
-- create_time => bigint(20) 数据库中记录创建的时间
-- update_time => bigint(20) 数据库中记录更新的时间
-- count_at_time => varchar(30)  文字型时间, 格式根据count_type而定
-- count_type => varchar(20)  时间格式(year/month/day/hour/minute/second)
-- url => varchar(255)
-- url => varchar(255)
-- url => varchar(255)

SET NAMES utf8mb4;
SET foreign_key_checks = 0;
SET global max_allowed_packet=524288000;

`
    for (let tableName of [
      SINGLE_T_O_PROJECT,
      SINGLE_T_O_SOURCEMAP,
      SINGLE_T_O_PROJECT_APPLY,
      SINGLE_T_R_COUNT_DAILY,
      SINGLE_T_O_ALARM_CONFIG,
      SINGLE_T_O_USER,
      SINGLE_T_O_PROJECT_MEMBER,
      SINGLE_T_R_ALARM_LOG,
      SINGLE_T_O_DIARY,
      SINGLE_T_O_ALARM_ES_ID,
      SINGLE_T_O_DOT_EVENT_INFO,
      SINGLE_T_O_DOT_EVENT_PROPS,
      SINGLE_T_O_DOT_EVENT_TAGS,
      SINGLE_T_O_DAILY_SUBSCRIBE
    ]) {
      let content = generate(tableName)
      commonSqlContent = `${commonSqlContent}\n${content}`
    }

    let insertProjectInfo = ``

    this.log(`${commonSqlContent}\n${insertProjectInfo}\n`)
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
