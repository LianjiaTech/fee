
import ParseBase from '~/src/commands/parse/base'
import _ from 'lodash'
import MUserFirstLoginAt from '~/src/model/parse/user_first_login_at'
import DATE_FORMAT from '~/src/constants/date_format'

/**
 * 解析用户点击情况
 */
class UserFirstLoginAt extends ParseBase {
  static get signature () {
    return `
     Parse:UserFirstLoginAt 
     {startAtYmdHi:日志扫描范围上限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     {endAtYmdHi:日志扫描范围下限${DATE_FORMAT.COMMAND_ARGUMENT_BY_MINUTE}格式}
     `
  }

  static get description () {
    return '[按天] 解析kafka日志, 记录用户首次登陆时间'
  }

  /**
     * 判断该条记录是不是需要解析的记录
     * @param {Object} record
     * @return {Boolean}
     */
  isLegalRecord (record) {
    let ucid = _.get(record, ['common', 'ucid'], '')
    ucid = `${ucid}`
    let isLegal = ucid.length > 0 && ucid.length <= 20
    return isLegal
  }

  /**
   * 更新记录
   */
  async processRecordAndCacheInProjectMap (record) {
    let ucid = _.get(record, ['common', 'ucid'], '')
    let projectId = _.get(record, ['project_id'], '')

    let country = _.get(record, ['country'], '')
    let province = _.get(record, ['province'], '')
    let city = _.get(record, ['city'], '')

    let firstVisitAt = _.get(record, ['time'], 0)

    let dbRecordMap = new Map()
    let dbRecord = {
      ucid,
      project_id: projectId,
      country,
      province,
      city,
      first_visit_at: firstVisitAt
    }
    if (this.projectMap.has(projectId)) {
      dbRecordMap = this.projectMap.get(projectId)
      if (dbRecordMap.has(ucid)) {
        let existRecord = dbRecordMap.get(ucid)
        if (existRecord['first_visit_at'] > dbRecord['first_visit_at']) {
          dbRecordMap.set(ucid, dbRecord)
        }
      } else {
        dbRecordMap.set(ucid, dbRecord)
      }
    }
    this.projectMap.set(projectId, dbRecordMap)
    return true
  }

  /**
   * 将数据同步到数据库中
   */
  async save2DB () {
    let totalRecordCount = this.getRecordCountInProjectMap()
    let processRecordCount = 0
    let successSaveCount = 0
    for (let [projectId, dbRecordMap] of this.projectMap) {
      let ucidList = []
      for (let ucid of dbRecordMap.keys()) {
        ucidList.push(ucid)
      }
      let existUcidSet = await MUserFirstLoginAt.filterExistUcidSetInDb(projectId, ucidList)

      for (let [ucid, dbRecord] of dbRecordMap) {
        let {
          project_id: projectId,
          country,
          province,
          city,
          first_visit_at: firstVisitAt
        } = dbRecord

        let isSuccess = false
        ucid = `${ucid}` // 专门转成string
        if (existUcidSet.has(ucid) === false) {
          // 只有ucid不存在的时候, 才需要插入
          isSuccess = await MUserFirstLoginAt.replaceInto(projectId, ucid, firstVisitAt, country, province, city)
        }
        processRecordCount = processRecordCount + 1
        if (isSuccess) {
          successSaveCount = successSaveCount + 1
        }
        this.reportProcess(processRecordCount, successSaveCount, totalRecordCount)
      }
    }
    return { totalRecordCount, processRecordCount, successSaveCount }
  }

  /**
   * 统计 projectUvMap 中的记录总数
   */
  getRecordCountInProjectMap () {
    let totalCount = 0
    for (let [projectId, dbRecordMap] of this.projectMap) {
      for (let [ucid, dbRecord] of dbRecordMap) {
        totalCount = totalCount + 1
      }
    }
    return totalCount
  }
}

export default UserFirstLoginAt
