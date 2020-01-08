/**
 * 提供给用户查看报警push消息中错误详情的接口
 * 不需要登录 & 不需要项目权限
 * @author wangqiang025@ke.com
 * create at 2019-04-09
 */ 
import _ from 'lodash'

import API_RES from '~/src/constants/api_res'
import MProject from '~/src/model/project/project'
import MAlarmLogDetail from '~/src/model/project/alarm/alarm_error'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'

const getErrorAlarmDetail = RouterConfigBuilder.routerConfigBuilder('/api/alarm/error/detail', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const projectId = _.get(req, ['body', 'pid'], false)
  const alarmLogId = _.get(req, ['body', 'lid'], false)
  const size = _.get(req, ['body', 'size'], 10)
  const page = _.get(req, ['body', 'page'], 1)

  if (!projectId || !alarmLogId) {
    res.send(API_RES.showError('缺少查询参数：【pid】【lid】'))
    return
  }

  const project = await MProject.get(projectId)  
  const { result, total } = await MAlarmLogDetail.getErrorListByIds(alarmLogId, projectId, page, size )
  const project_name = _.get(project, 'project_name', '')
  const display_name = _.get(project, 'display_name', project_name)

  let index = 0
  let formatRecordList = []
  for (let rawResult of result) {
    index = index + 1
    let extraJson = _.get(rawResult, ['extra'], '{}')
    let extra = {}
    try {
      extra = JSON.parse(extraJson)
    } catch (e) {
      extra = extraJson
    }
    let record = {
      id: index,
      error_type: _.get(rawResult, ['code'], 1),
      error_name: _.get(rawResult, ['detail', 'error_no'], ''),
      http_code: _.get(rawResult, ['detail', 'http_code'], 0),
      during_ms: _.get(rawResult, ['detail', 'during_ms'], 0),
      request_size_b: _.get(rawResult, ['detail', 'request_size_b'], 0),
      response_size_b: _.get(rawResult, ['detail', 'response_size_b'], 0),
      url: _.get(rawResult, ['detail', 'url'], ''),
      country: _.get(rawResult, ['country'], ''),
      province: _.get(rawResult, ['province'], ''),
      city: _.get(rawResult, ['city'], ''),
      log_at: _.get(rawResult, ['time'], 0),
      ext: {
        ...rawResult,
        extra,
      },
    }
    formatRecordList.push(record)
  }

  let pageData = {
    name: display_name,
    pager: {
      total,
      size,
      currentPage: page
    },
    list: formatRecordList,
  }

  res.send(API_RES.showResult(pageData))
}, false, false)

export default {
  ...getErrorAlarmDetail,
}
