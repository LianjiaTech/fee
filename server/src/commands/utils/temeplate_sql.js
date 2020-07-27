import Base from '~/src/commands/base'
import Knex from '~/src/library/mysql'

import TABLE_TEMPLATE, { 
  SINGLE_T_O_USER,
  SINGLE_T_O_PROJECT,
  SINGLE_T_O_PROJECT_APPLY,
  SINGLE_T_O_PROJECT_MEMBER,
  SINGLE_T_O_DIARY,
  SINGLE_T_R_ALARM_LOG,
  SINGLE_T_O_ALARM_CONFIG,
  SINGLE_T_R_COUNT_DAILY,
  SINGLE_T_O_ALARM_ES_ID,
  SINGLE_T_O_SOURCEMAP,
  SINGLE_T_O_DOT_EVENT_INFO,
  SINGLE_T_O_DOT_EVENT_PROPS,
  SINGLE_T_O_DOT_EVENT_TAGS,
  SINGLE_T_O_DAILY_SUBSCRIBE
} from '~/src/constants/mysql_template'


async function getSQL () {
  let sql = ''
  let sqlList = []
  sqlList[0] = getUserSQL()
  sqlList[1] = getProjectSQL()
  
  for (let sql of sqlList) {
    await Knex.schema.raw(sql)
  }
  sql = sqlList.join('')
  return sql
}
// 生成用户数据
function getUserSQL () {
  let sql = `
    REPLACE INTO t_o_user VALUES (1, '1234567890', 'test@qq.com', 'test@qq.com', '7d7d1d6472e01343d3d9206aaf0c1a29', '测试', 'admin', 'site', 'http://ww1.sinaimg.cn/large/00749HCsly1fwofq2t1kaj30qn0qnaai.jpg', '', '0', 0, 0);
  `
  return sql
}
// 生成项目数据
function getProjectSQL () {
  let sql = `
    REPLACE INTO \`t_o_project\` (\`id\`, \`rate\`, \`display_name\`, \`project_name\`, \`mail\`, \`home_page\`, \`c_desc\`, \`is_delete\`, \`create_ucid\`, \`update_ucid\`, \`create_time\`, \`update_time\`) VALUES (1, 10000, '模板项目', 'template', 'test@qq.com', 'http://www.fee-test.com', '负责人:你好', 0, '1234567890', '1234567890', 0, 0);
  `
  return sql
}
// 创建表
function generate (baseTableName) {
  // 获取模板
  let content = TABLE_TEMPLATE[baseTableName]
  // 生成表名
  let fininalTableName = `${baseTableName}`
  return `
CREATE TABLE  IF NOT EXISTS  \`${fininalTableName}\` ${content}
`
}

class TemplateSQL extends Base {
  static get signature () {
    return `
       Utils:TemplateSQL
       `
  }

  static get description () {
    return '生成样例数据'
  }

  async execute (args, options) {
    // 创建表
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
      // await Knex.schema.raw(content)
    }
    // 插入测试数据
    await getSQL()
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
export default TemplateSQL