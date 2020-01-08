
import _ from 'lodash'
import moment from 'moment'
import API_RES from '~/src/constants/api_res'
import MUser from '~/src/model/project/user'
import MD_DOT_E_CONFIG from '~/src/model/project/dot/events'
import MD_DOT_P_CONFIG from '~/src/model/project/dot/props'
import MD_DOT_TAG_CONFIG from '~/src/model/project/dot/tags'
import ES_DOT_INDEX_DEL from '~/src/model/elastic_search/dot/event'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'

function fieldsCheck(obj, keys) { 
  let errorMsg = ''
  let rules = {
    event_name: {
      values: ['', null],
      msg: '事件名不能为空！'
    },
    event_display_name: {
      values: ['', null],
      msg: '事件显示名不能为空！'
    },
    event_tag_name: {
      values: ['', null],
      msg: '事件标签名不能为空！'
    },
    props_name: {
      values: ['', null],
      msg: '属性名不能为空！'
    },
    props_display_name: {
      values: ['', null],
      msg: '属性显示名不能为空！'
    },
    is_delete: {
      check(val) {
        return /[0,1]/.test(val)
      },
      msg: 'is_delete属性值非法！'
    },
    is_visible: {
      check(val) {
        return /[0,1]/.test(val)
      },
      msg: 'is_visible属性值非法！'
    },
    event_desc: {
      check(val) {
        return typeof val === 'string' && val.length <= 200
      },
      msg: '备注不能超过200个字符！'
    }
  }
  for (let key of keys) {
    let rule = rules[key]
    if (!rule) continue
    if (rule.values && _.includes(rule.values, _.get(obj, [key], ''))) { 
      errorMsg = _.get(rule, 'msg', '')
      break
    }
    if (rule.check) { 
      if (!rule.check(_.get(obj, [key], ''))) { 
        errorMsg = _.get(rule, 'msg', '')
        break
      }
    }
  }
  return errorMsg
}
function formatBody(req) {
  const project_id = _.get(req, ['fee', 'project', 'projectId'], 0)
  const event_create_user = _.get(req, ['fee', 'user', 'ucid'], '')
  const event_edit_user = event_create_user
  const body = _.get(req, ['body'], {})

  // info
  const info = {
    project_id,
    event_edit_user,
    event_create_user,
    event_name: _.get(body, ['event_name'], ''),
    event_display_name: _.get(body, ['event_display_name'], ''),
    event_tag_ids: _.get(body, ['event_tag_ids'], []).join(','),
    event_desc: _.get(body, ['event_desc'], ''),
    is_delete: _.get(body, ['is_delete'], 0),
    is_visible: _.get(body, ['is_visible'], 1),
  }
  console.log(info, '==info==')
  let errorMsg = fieldsCheck(info, Object.keys(info))
  if (errorMsg) return { errorMsg }

  // properties
  const properties = _.get(body, ['properties'], [])
  console.log(properties, '==properties==')
  for (let prop of properties) { 
    errorMsg = fieldsCheck(prop, Object.keys(prop))
    if (errorMsg) return { errorMsg }
  }
  
  return {
    info,
    properties
  }
}

/**
 * add
 */
let createEventConfig = RouterConfigBuilder.routerConfigBuilder('/api/dot/config/add', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  // 校验字段的合法性
  let { info, properties, errorMsg } = formatBody(req)
  if (errorMsg) return res.send(API_RES.showError(errorMsg))
  
  // 根据event_name查询是否存在相同事件名的记录
  let _data = await MD_DOT_E_CONFIG.query(info.project_id, info.event_name)
  let event_id = _.get(_data, [0, 'id'], '')
  if (event_id) return res.send(API_RES.showError(`事件名已经存在！`))
  // 没有则添加
  event_id = await MD_DOT_E_CONFIG.add(info)
  if (!event_id) return res.send(API_RES.showError(`事件${info.event_display_name}创建失败！`))

  // 没有设置事件属性，则跳过
  if (!properties.length) return API_RES.showResult('创建成功！')

  let pops = properties.map(prop => ({ 
    ...prop,
    event_id
  }))
  let propsId = await MD_DOT_P_CONFIG.add(pops)
  if (!propsId) return res.send(API_RES.showError(`事件${info.event_display_name}属性创建失败！`))
  API_RES.showResult('创建成功！')
})

/**
 * update
 */
let updateEventConfig = RouterConfigBuilder.routerConfigBuilder('/api/dot/config/update', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  let id = _.get(req, ['body', 'id'], 0)
  let properties = _.get(req, ['body', 'properties'], [])
  let project_id = _.get(req, ['fee', 'project', 'projectId'], 0)
  let event_edit_user = _.get(req, ['fee', 'user', 'ucid'], '')
  let failMsg = ''

  if (!id || !project_id) return res.send(API_RES.showError('缺少必要参数【id】'))
  let keys = ['event_display_name', 'event_tag_ids', 'event_desc', 'is_delete', 'is_visible']
  let data = keys.reduce((pre, cur) => { 
    if (cur === 'event_tag_ids') {
      let ids = _.get(req, ['body', cur], undefined)
      pre[cur] = ids ? ids.join(',') : ids
    } else { 
      pre[cur] = _.get(req, ['body', cur], undefined)
    }
    return pre
  }, {})
  data.event_edit_user = event_edit_user
  console.log('===event_update=====', data)
  // 更新事件的属性
  let isSuccess = await MD_DOT_E_CONFIG.update(id, project_id, data)
  if(!isSuccess) failMsg = `id为【${id}】的记录更新失败！`
  // 更新事件属性的属性
  if (properties.length) { 
    // 能变更的字段key
    let updateData = []
    let insertData = []
    let propId = undefined
    let keys = ['props_display_name', 'is_visible', 'is_delete']
    for (let prop of properties) { 
      propId = _.get(prop, ['id'], undefined)
      // 如果已经存在，则更新字段值
      if (propId) {
        let data = keys.reduce((pre, cur) => { 
          pre[cur] = _.get(prop, [cur], undefined)
          return pre
        }, {})
        updateData.push({ ...data, event_id: id, id: propId })
        continue
      }
      // 如果不存在，则添加
      insertData.push({ ...prop, event_id: id})
    }
    if (updateData.length) { 
      isSuccess = await MD_DOT_P_CONFIG.update(updateData)
      console.log(isSuccess, '===updateData=====', updateData)
      if(!isSuccess) failMsg = `id为${propId}的属性更新失败！`
    }
    if (insertData.length) { 
      console.log('===insertData=====', insertData)
      isSuccess = await MD_DOT_P_CONFIG.add(insertData)
      if (!isSuccess) failMsg = `属性新增失败！` 
    }
  }
  // 如果删除事件打点配置，则需要删除ES中的索引，防止之后创建相同名称的索引导致数据存储失败
  // let eventConfig = await MD_DOT_E_CONFIG.query(project_id, '', id)
  // if (_.get(data, ['is_delete'], 0)) { 
  //   let name = _.get(eventConfig, ['event_name'], '')
  //   let isDelSuccess = await ES_DOT_INDEX_DEL.delDotConfigByIndexName(project_id, name)
  //   failMsg = isDelSuccess ? null : `索引【dt-dot-${project_id}_${name}】删除失败`
  // }

  if (failMsg) return res.send(API_RES.showError(failMsg))
  res.send(API_RES.showResult('更新成功！'))
})


/**
 * 根据事件ID || 事件name || tagid 查询配置
 */
let getEventConfig = RouterConfigBuilder.routerConfigBuilder('/api/dot/config/query', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  let project_id = _.get(req, ['fee', 'project', 'projectId'], 0)
  let eventName = _.get(req, ['query', 'name'], '')
  // let tagName = _.get(req, ['query', 'tagName'], '')

  let result = await MD_DOT_E_CONFIG.query(project_id, eventName)
  let data = []
  let ids = result.map(res => res.id)
  let details = await MD_DOT_P_CONFIG.query(ids)
  let tags = await MD_DOT_TAG_CONFIG.query({ project_id })
  
  for (let res of result) {
    const createUser = await MUser.get(res.event_create_user)
    const updateUser = await MUser.get(res.event_edit_user)
    const ids = res.event_tag_ids.split(',').filter(Boolean)
    
    data.push({
      id: res.id,
      event_name: res.event_name,
      event_display_name: res.event_display_name,
      event_tag_name: ids.map(id => _.find(tags, function (tag) { return tag.id == id })),
      utime: moment(res.update_time*1000).format('YYYY-MM-DD HH:mm:ss'),
      cname: _.get(createUser, ['nickname'], res.event_create_user),
      uname: _.get(updateUser, ['nickname'], res.event_edit_user),
      properties: _.filter(details, { event_id: res.id }),
      event_desc: res.event_desc,
      is_delete: res.is_delete,
      is_visible: res.is_visible
    })
  }
  res.send(API_RES.showResult(data))
})


export default {
  ...createEventConfig,
  ...getEventConfig,
  ...updateEventConfig,
}


