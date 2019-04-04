import _ from 'lodash'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'
import API_RES from '~/src/constants/api_res'
import MAlarmConfig from '~/src/model/project/alarm/alarm_config'
import moment from 'moment'
import MMonitor from '~/src/model/parse/monitor'
import MUser from '~/src/model/project/user'
import MErrorSummary from '~/src/model/summary/error_summary'

const PAGE_SIZE = 10

const insertAlarmConfig = RouterConfigBuilder.routerConfigBuilder('/api/alarm/config/add', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const body = _.get(req, ['body'], {})
  const projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
  const ownerUcid = _.get(body, ['ownerUcid'], '0')
  let errorName = _.get(body, ['errorName'], '')
  const errorType = _.get(body, ['errorType'], '')
  let timeRange = parseInt(_.get(body, ['timeRange'], 0))
  const maxErrorCount = parseInt(_.get(body, ['maxErrorCount'], 10000))
  const alarmInterval = parseInt(_.get(body, ['alarmInterval'], 0))
  const isEnable = parseInt(_.get(body, ['isEnable'], 1))
  const note = _.get(body, ['note'], '')
  const createUcid = _.get(req, ['fee', 'user', 'ucid'], 0)
  const updateUcid = createUcid
  if (errorType === '') {
    res.send(API_RES.showError('错误类型不能是空'))
    return
  }
  if (errorName === '') {
    errorName = '*'
  }
  if (
    _.isInteger(timeRange) === false ||
    _.isInteger(maxErrorCount) === false ||
    _.isInteger(alarmInterval) === false ||
    _.isInteger(isEnable) === false
  ) {
    res.send(API_RES.showError('请输入正确的数据格式'))
    return
  }
  let insertData = {
    project_id: projectId,
    owner_ucid: ownerUcid,
    error_type: errorType,
    error_name: errorName,
    time_range_s: timeRange,
    max_error_count: maxErrorCount,
    alarm_interval_s: alarmInterval,
    is_enable: isEnable,
    note,
    create_ucid: createUcid,
    update_ucid: updateUcid
  }
  let isSuccess = await MAlarmConfig.add(insertData)
  if (isSuccess) {
    res.send(API_RES.showResult([], '添加成功'))
  } else {
    res.send(API_RES.showError('添加失败'))
  }
})

let getOneAlarmConfig = RouterConfigBuilder.routerConfigBuilder('/api/alarm/config/query', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let query = _.get(req, ['query'], {})
  let id = parseInt(_.get(query, ['id'], 0))

  if (_.isInteger(id) === false) {
    res.send(API_RES.showError('请输入正确格式的数据'))
    return
  }
  const rawRecord = await MAlarmConfig.query(id)
  const record = MAlarmConfig.formatRecord(rawRecord)

  res.send(API_RES.showResult(record))
})

const getAllAlarmConfig = RouterConfigBuilder.routerConfigBuilder('/api/alarm/config/list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const projectId = _.get(req, ['fee', 'project', 'projectId'], 1)
  const currentPage = parseInt(_.get(req, ['query', 'currentPage'], 1))
  const offset = (currentPage - 1) * PAGE_SIZE
  const limit = PAGE_SIZE
  if (_.isInteger(currentPage) === false) {
    res.send(API_RES.showError('请输入正确格式的数据'))
    return
  }

  const result = {
    currentPage,
    pageSize: PAGE_SIZE
  }
  const rawRecordlist = await MAlarmConfig.getList(projectId, offset, limit)

  // 规整数据，删除不必要的字段
  const recordList = []
  for (let rawRecord of rawRecordlist) {
    const record = MAlarmConfig.formatRecord(rawRecord)
    const errorType = record['error_type']
    const createUcid = record['create_ucid']
    const updateUcid = record['update_ucid']
    const createUser = await MUser.get(createUcid)
    const updateUser = await MUser.get(updateUcid)
    record['error_type_name'] = MMonitor.ERROR_TYPE_MAP[errorType]
    record['create_ucid'] = _.get(createUser, ['nickname'], createUcid)
    record['update_ucid'] = _.get(updateUser, ['nickname'], updateUcid)
    recordList.push(record)
  }

  result.list = recordList
  result.totalCount = await MAlarmConfig.getCount(projectId)
  res.send(API_RES.showResult(result))
})

let deleteOneAlarmConfig = RouterConfigBuilder.routerConfigBuilder('/api/alarm/config/delete', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let id = parseInt(_.get(req, ['query', 'id'], 0))
  let updateUcid = _.get(req, ['fee', 'user', 'ucid'])
  let updateTime = moment().unix()

  if (_.isInteger(id) === false) {
    res.send(API_RES.showError('请输入正确的数据格式'))
    return
  }

  let updateData = {
    is_delete: 1,
    update_ucid: updateUcid,
    update_time: updateTime
  }
  let result = await MAlarmConfig.update(id, updateData)
  if (result === 0) {
    res.send(API_RES.showError('删除失败'))
  } else {
    res.send(API_RES.showResult([], '删除成功'))
  }
})

let updateOneAlarmConfig = RouterConfigBuilder.routerConfigBuilder('/api/alarm/config/update', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let body = _.get(req, ['body'], {})
  let id = parseInt(_.get(body, ['id'], 0))
  let updateUcid = _.get(req, ['fee', 'user', 'ucid'])
  let updateData = {
    update_ucid: updateUcid
  }

  if (_.isInteger(id) === false) {
    res.send(API_RES.showError('数据格式不正确'))
  }

  // 不需转换字段
  for (let column of ['ownerUcid', 'errorName', 'errorType', 'note']) {
    if (_.has(body, [column])) {
      const underlineName = _.snakeCase(column)
      updateData[underlineName] = _.get(body, [column])
    }
  }
  // 需转为number的字段
  for (let column of ['maxErrorCount', 'isEnable']) {
    if (_.has(body, [column])) {
      const integerValue = parseInt(_.get(body, [column]))
      if (_.isInteger(integerValue) === false) {
        res.send(API_RES.showError(`${column}数据格式不正确`))
        return
      }

      const underlineName = _.snakeCase(column)
      updateData[underlineName] = integerValue
    }
  }
  // 需转为number的字段,且单位为s的字段
  for (let column of ['timeRange', 'alarmInterval']) {
    if (_.has(body, [column])) {
      let integerValue = parseInt(_.get(body, [column]))
      if (_.isInteger(integerValue) === false) {
        res.send(API_RES.showError(`${column}数据格式不正确`))
        return
      }
      if (column === 'alarmInterval' && integerValue < 60) {
        integerValue = 60
      }
      const underlineName = _.snakeCase(column) + '_s'
      updateData[underlineName] = integerValue
    }
  }
  let result = await MAlarmConfig.update(id, updateData)
  if (result === 0) {
    res.send(API_RES.showError('更新失败'))
  } else {
    res.send(API_RES.showResult([], '更新成功'))
  }
})
const getErrorNameList = RouterConfigBuilder.routerConfigBuilder('/api/alarm/config/error_name_list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const projectId = _.get(req, ['fee', 'project', 'projectId'], 0)
  const errorType = _.get(req, ['query', 'errorType'], MMonitor.ERROR_TYPE_HTTP_ERROR)
  const errorNameList = await MErrorSummary.getErrorNameList(projectId, errorType)
  // 变为前端需要的格式的数据
  let result = []
  for (let errorName of errorNameList) {
    const error = {
      label: errorName,
      value: errorName
    }
    result.push(error)
  }
  result.push({
    label: '*(监控所有)',
    value: '*'
  })
  res.send(API_RES.showResult(result))
})

const getErrorTypeList = RouterConfigBuilder.routerConfigBuilder('/api/alarm/config/error_type_list', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  // 变为前端需要的格式的数据
  let result = []
  for (let errorType of Object.keys(MMonitor.ERROR_TYPE_MAP)) {
    const error = {
      label: MMonitor.ERROR_TYPE_MAP[errorType],
      value: errorType
    }
    result.push(error)
  }
  res.send(API_RES.showResult(result))
})

export default {
  ...insertAlarmConfig,
  ...getOneAlarmConfig,
  ...getAllAlarmConfig,
  ...deleteOneAlarmConfig,
  ...updateOneAlarmConfig,
  ...getErrorNameList,
  ...getErrorTypeList
}
