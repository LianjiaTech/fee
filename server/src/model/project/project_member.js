import _ from 'lodash'
import moment from 'moment'
import Knex from '~/src/library/mysql'
import Logger from '~/src/library/logger'
import MUser from '~/src/model/project/user'
import ProjectConfig from '~/src/configs/project'

const ROLE_DEV = 'dev'
const ROLE_OWNER = 'owner'

const BASE_TABLE_NAME = 't_o_project_member'
const TABLE_COLUMN = [
  `id`,
  `project_id`,
  `ucid`,
  `role`,
  `need_alarm`,
  `is_delete`,
  `create_time`,
  `create_ucid`,
  `update_time`,
  `update_ucid`
]
const DISPLAY_TABLE_COLUMN = [
  `id`,
  `project_id`,
  `ucid`,
  `role`,
  `need_alarm`,
  `create_time`,
  `create_ucid`,
  `update_time`,
  `update_ucid`
]

function getTableName () {
  return BASE_TABLE_NAME
}
/**
 * 删除不必要的字段
 * @param {*} rawRecord
 */
function formatRecord (rawRecord) {
  let record = {}
  for (let column of DISPLAY_TABLE_COLUMN) {
    if (_.has(rawRecord, [column])) {
      record[column] = rawRecord[column]
    }
  }
  return record
}

/**
 * 添加项目
 * @param {object} data
 */
async function add (data) {
  const tableName = getTableName()
  const createTime = moment().unix()
  const updateTime = createTime
  let insertData = {}
  for (let column of [
    `project_id`,
    `ucid`,
    `role`,
    `nead_alarm`,
    `create_ucid`,
    `update_ucid`
  ]) {
    if (_.has(data, [column])) {
      insertData[column] = data[column]
    }
  }
  insertData = {
    ...insertData,
    create_time: createTime,
    update_time: updateTime,
    is_delete: 0
  }
  let insertResult = await Knex
    .returning('id')
    .insert(insertData)
    .into(tableName)
    .catch(err => {
      Logger.log(err.message, 'project_member    add   出错')
      return []
    })
  let id = _.get(insertResult, [0], 0)
  return id > 0
}

/**
 * 获取项目信息
 * @param {number} id
 */
async function get (id) {
  const tableName = getTableName()
  const result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('id', '=', id)
    .catch(err => {
      Logger.log(err.message, 'project_member    get   出错')
      return []
    })
  const project = _.get(result, ['0'], {})
  return project
}

/**
 * 根据 项目id & uicd 获取成员记录
 * @param {number} projectId
 * @param {number} ucid
 */
async function getByProjectIdAndUcid (projectId, ucid) {
  let tableName = getTableName()
  let rawRecord = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('project_id', projectId)
    .andWhere('ucid', ucid)
    .catch(err => {
      Logger.log(err.message, 'project_member    getList   出错')
      return []
    })

  let record = _.get(rawRecord, [0], {})
  return record
}

/**
 * 项目列表
 */
async function getList () {
  const tableName = getTableName()
  const result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('is_delete', 0)
    .catch(err => {
      Logger.log(err.message, 'project_member    getList   出错')
      return []
    })
  return result
}

/**
 * 更新记录
 * @param {number} id
 * @param {object} updateData = {}
 */
async function update (id, updateData) {
  const nowAt = moment().unix()
  let newRecord = {}
  for (let column of [
    'project_id',
    'ucid',
    'role',
    'need_alarm',
    'is_delete',
    'update_ucid'
  ]) {
    if (_.has(updateData, [column])) {
      newRecord[column] = updateData[column]
    }
  }
  newRecord = {
    ...newRecord,
    update_time: nowAt
  }
  const tableName = getTableName()
  const result = await Knex(tableName)
    .update(newRecord)
    .where('id', id)
    .catch(err => {
      Logger.log(err.message, 'project_member    update   出错')
      return []
    })
  return result === 1
}

/**
 * 获取某一成员下所有项目列表
 * @param {*} ucid 成员的ucid
 */
async function getProjectMemberListByUcid (ucid, offset, max) {
  const tableName = getTableName()
  let rawRecordList = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('ucid', ucid)
    .andWhere('is_delete', 0)
    .offset(offset)
    .limit(max)
    .catch(err => {
      Logger.log(err.message, 'project_member    getProjectIdList   出错')
      return []
    })

  // 获取默认项目列表，造数据添加权限
  let templateRecord = {
    id: 0,
    ucid,
    role: ROLE_DEV,
    need_alarm: 0,
    is_delete: 0,
    create_time: 0,
    create_ucid: 0,
    update_time: 0,
    update_ucid: 0
  }
  let projectMemberMap = {}
  for (let rawRecord of rawRecordList) {
    const { project_id: projectId } = rawRecord
    projectMemberMap[projectId] = 1
  }
  for (let openProjectId of ProjectConfig.OPEN_PROJECT_ID_LIST) {
    if (_.has(projectMemberMap, [openProjectId]) === false) {
      let template = {
        ...templateRecord,
        project_id: openProjectId
      }
      rawRecordList.push(template)
    }
  }
  return rawRecordList
}

/**
 * 根据项目id获取这个项目下所有用户列表
 * @param {*} projectId
 */
async function getProjectMemberList (projectId) {
  const tableName = getTableName()
  const result = await Knex
    .select(TABLE_COLUMN)
    .from(tableName)
    .where('project_id', projectId)
    .andWhere('is_delete', 0)
    .catch(err => {
      Logger.log(err.message, 'project_member    getMemberIdList   出错')
      return []
    })
  return result
}

/**
 * 检查用户是不是项目owner
 * @param {*} projectId
 * @param {*} ucid
 */
async function isProjectOwner (projectId, ucid) {
  let record = await getByProjectIdAndUcid(projectId, ucid)
  if (_.isEmpty(record)) {
    return false
  }
  let isExist = _.get(record, ['is_delete'], 1) === 0
  let isOwner = _.get(record, ['role'], ROLE_DEV) === ROLE_OWNER
  if (isExist && isOwner) {
    return true
  }
  return false
}

/**
 * 检查用户是否有项目权限
 * @param {*} projectId
 * @param {*} ucid
 */
async function hasPrivilege (projectId, ucid) {
  // 检查是否是项目1，如果是，则通过（默认项目1是展示项目，都会有权限）
  if (_.indexOf(ProjectConfig.OPEN_PROJECT_ID_LIST, projectId) >= 0) {
    return true
  }
  // 检查是否是admin,如果是，直接通过检查
  const isAdmin = await MUser.isAdmin(ucid)
  if (isAdmin) {
    return true
  }
  // 不是admin
  let record = await getByProjectIdAndUcid(projectId, ucid)
  if (_.isEmpty(record)) {
    return false
  }
  let isExist = _.get(record, ['is_delete'], 1) === 0
  return isExist
}

/**
 * 获取某一下项目下，需要报警的人的ucid列表
 * @param {number} projectId
 */
async function getAlarmUcidList (projectId) {
  const tableName = getTableName()
  const rawRecordList = await Knex
    .select('ucid')
    .from(tableName)
    .where('project_id', projectId)
    .andWhere('need_alarm', 1)
    .catch(() => {
      return []
    })
  let result = []
  for (let rawRecord of rawRecordList) {
    let ucid = _.get(rawRecord, ['ucid'], 0)
    result.push(ucid)
  }
  return result
}
export default {
  get,
  getList,
  update,
  getTableName,
  add,

  // 限制导出数据
  formatRecord,

  // 获取某一用户的项目id list
  getProjectMemberListByUcid,
  // 获取某一项目的成员id list
  getProjectMemberList,
  getByProjectIdAndUcid,

  hasPrivilege,
  isProjectOwner,

  getAlarmUcidList,

  ROLE_DEV,
  ROLE_OWNER
}
