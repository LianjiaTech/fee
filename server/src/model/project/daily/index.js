import _ from 'lodash'
import moment from 'moment'
import Knex from '~/src/library/mysql'
import Logger from '~/src/library/logger'

const BASE_TABLE_NAME = 't_o_daily_subscribe'
const MEMBER_TABLE_NAME = 't_o_project_member'
const PROJECT_TABLE_NAME = 't_o_project'
const SENDTIME = '06:00'

const TABLE_COLUMN = [
  `id`,
  `ucid`,
  `email`,
  `need_callback`,
  `protocol`,
  `callback_url`,
  `send_time`,
  `project_id`,
  `project_display_name`,
  `create_time`,
  `update_time`
]

/**
 * 添加订阅记录
 * @param {object} data
 */
async function add (data) {
  let _err = false
  let createTime = moment().unix()
  let updateTime = createTime

  for (let item of data) {
    item.create_time = createTime
    item.update_time = updateTime
  }
  await Knex.returning('id').insert(data).into(BASE_TABLE_NAME).catch(err => {
    _err = err
    Logger.log(err.message, 't_o_daily_subscribe    add   出错')
    return []
  })
  return _err
}

/**
 * 根据ucid 或 id 删除订阅列表
 * @param {*} ucid 成员的ucid
 * @param {*} projectId 项目的id
 */
async function deleteRecords (ucid, projectId) {
  let _err = false
  let knex = Knex(BASE_TABLE_NAME)
  if (ucid) knex = knex.where('ucid', ucid) // 只传入ucid的话，就会删除该用户订阅的所有项目记录
  if (projectId) knex = knex.where('project_id', projectId)
  await knex
    .del()
    .catch(err => {
      _err = err
      Logger.log(err.message, 't_o_daily_subscribe    deleteRecords   出错')
      return []
    })
  return _err
}

/**
 * 根据ucid/send_time获取订阅列表
 * @param {*} ucid 成员的ucid
 * @param {*} sendTime 发送时间
 */
async function getSubscriptionList ({ ucid, sendTime, email }) {
  let knex = Knex(BASE_TABLE_NAME).select(TABLE_COLUMN)
  if (ucid) knex = knex.where('ucid', ucid)
  if (sendTime) knex = knex.where('send_time', sendTime)
  if (email) knex = knex.where('email', email)

  const result = await knex.catch(err => {
    Logger.log(err.message, 't_o_daily_subscribe    getAll   出错')
    return []
  })
  return result
}

/**
 * 获取某一成员下所有项目列表
 * @param {*} ucid 成员的ucid
 */
async function getProjectMemberListByUcid (ucid) {
  let rawRecordList = await Knex(MEMBER_TABLE_NAME)
    .where(`${MEMBER_TABLE_NAME}.ucid`, ucid)
    .andWhere(`${MEMBER_TABLE_NAME}.is_delete`, 0)
    .join(PROJECT_TABLE_NAME, function () {
      this.on(`${PROJECT_TABLE_NAME}.is_delete`, '=', 0)
        .andOn(`${PROJECT_TABLE_NAME}.id`, '=', `${MEMBER_TABLE_NAME}.project_id`)
    })
    .select(`${PROJECT_TABLE_NAME}.id`, `${PROJECT_TABLE_NAME}.display_name`, `${MEMBER_TABLE_NAME}.ucid`)
  return rawRecordList
}

export default {
  add,
  deleteRecords,
  getSubscriptionList,
  getProjectMemberListByUcid,
  SENDTIME
}
