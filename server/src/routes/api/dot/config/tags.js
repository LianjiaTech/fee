
import _ from 'lodash'
import API_RES from '~/src/constants/api_res'
import MD_DOT_TAG_CONFIG from '~/src/model/project/dot/tags'
import RouterConfigBuilder from '~/src/library/utils/modules/router_config_builder'

/**
 * 为项目的事件名添加 tag属性
 */
let createProjectTagConfig = RouterConfigBuilder.routerConfigBuilder('/api/dot/config/tag/add', RouterConfigBuilder.METHOD_TYPE_POST, async (req, res) => {
  const project_id = _.get(req, ['fee', 'project', 'projectId'], 0)
  const color = _.get(req, ['body', 'color'], 'rgba(45,140,240,1)')
  const name = _.get(req, ['body', 'name'], '')
  const tagId = _.get(req, ['body', 'id'], '')
  // 传来id就是更新操作
  if (tagId) { 
    let result = await MD_DOT_TAG_CONFIG.update(tagId, { color, name })
    if (!result) return res.send(API_RES.showError(`更新失败！`))
    return res.send(API_RES.showResult('更新成功'))
  }
  // 如果标签名已经存在
  const isExist = await MD_DOT_TAG_CONFIG.query({project_id, name})
  if (isExist.length) { 
    return res.send(API_RES.showError(`该项目下，name等于${name}的标签已经存在！`))
  }

  let id = MD_DOT_TAG_CONFIG.add({ project_id, color, name })
  if (!id) return res.send(API_RES.showError(`创建失败！`))
  res.send(API_RES.showResult('创建成功'))
})

/**
 * 查询项目tags配置
 */
let getProjectTagConfig = RouterConfigBuilder.routerConfigBuilder('/api/dot/config/tag/query', RouterConfigBuilder.METHOD_TYPE_GET, async (req, res) => {
  const project_id = _.get(req, ['fee', 'project', 'projectId'], 0)
  const result = await MD_DOT_TAG_CONFIG.query({project_id})
  res.send(API_RES.showResult(result))
})




export default {
  ...createProjectTagConfig,
  ...getProjectTagConfig
}


