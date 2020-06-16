/* eslint-disable */
import fs from 'fs'
import md5 from 'md5'
import _ from 'lodash'
import path from 'path'
import moment from 'moment'
import child_process from 'child_process'

import Knex from '~/src/library/mysql'
import Logger from '~/src/library/logger'
import DATE_FORMAT from '~/src/constants/date_format'
import MProject from '~/src/model/project/project'
import MDaily from '~/src/model/summary/daily_summary'
import MPerformance from '~/src/model/parse/performance'
import MErrorES from '~/src/model/elastic_search/summary/error'
import MPvES from '~/src/model/elastic_search/summary/pv'
import MUvES from '~/src/model/elastic_search/summary/uv'
import MPerformanceES from '~/src/model/elastic_search/summary/performance'
import sendMail from '~/src/library/utils/modules/mailer'
import { screenShot } from '~/src/library/utils/modules/painting_and_photo'
import App from '~/src/configs/app'
import Util from '~/src/library/utils/modules/util'
import generatePvErrorChart from '~/src/views/web_template/html_pv_error'
import generateHtmlDailyReport from '~/src/views/web_template/html_daily_report'
import mailConfig from '~/src/configs/mail'
import MAlarm from '~/src/model/project/alarm/alarm_log'
import axios from '~/src/library/http'

const DIARY_TABLE_NAME = 't_o_count_diary'
const BASE_TABLE_NAME = 't_r_count_daily'

/**
 * 抽象出策略，方便以后扩展
 * @param {string} countType 'day' or 'week'
 */ 
function getSumaryAt (countType) {
  const loop = () => ({})
  return {
    [DATE_FORMAT.UNIT.WEEK]: (sumaryAtTime) => {
      let sumaryAt = moment(sumaryAtTime, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType])
        .subtract(7, DATE_FORMAT.UNIT.DAY)
        .startOf(DATE_FORMAT.UNIT.DAY)
        .unix()
      let visitAtMoment = moment.unix(sumaryAt)
      let countAtTime = moment(sumaryAtTime).format(DATE_FORMAT.DISPLAY_BY_DAY)
      let days = Util.getWeekByTime(visitAtMoment)
     
      let startDay = days.shift()
      let endDay = days.pop()

      return {
        startAt: moment(startDay).startOf(DATE_FORMAT.UNIT.DAY).unix(),
        endAt: moment(endDay).endOf(DATE_FORMAT.UNIT.DAY).unix(),
        countAtTime,
        title: `${startDay}日——${endDay}日(上周) 灯塔每周质量报告`
      }
    },
    [DATE_FORMAT.UNIT.DAY]: (sumaryAtTime) => {
      let sumaryAt = moment(sumaryAtTime, DATE_FORMAT.COMMAND_ARGUMENT_BY_UNIT[countType])
        .subtract(1, DATE_FORMAT.UNIT.DAY)
        .startOf(DATE_FORMAT.UNIT.DAY)
        .unix()
      let visitAtMoment = moment.unix(sumaryAt)
      let countAtTime = moment(visitAtMoment).format(DATE_FORMAT.DISPLAY_BY_DAY)

      return {
        startAt: visitAtMoment.startOf(DATE_FORMAT.UNIT.DAY).unix(),
        endAt: visitAtMoment.endOf(DATE_FORMAT.UNIT.DAY).unix(),
        countAtTime,
        title: `${countAtTime}日(昨天) 灯塔每日质量报告`
      }
    }
  }[countType] || loop
}

/**
 *  计算环比
 * @param {*} data
 * @param {*} lastCycleData
 */
function computeCycleRate(data = 0, lastCycleData = 0) {
  data = Number(data)
  lastCycleData = Number(lastCycleData)
  if (!_.isNumber(data) || _.isNaN(data) || !isFinite(data)) return 0.00
  if (!_.isNumber(lastCycleData) || _.isNaN(lastCycleData) || !isFinite(lastCycleData)|| lastCycleData == 0) return 0.00
  let result = ((data - lastCycleData) / lastCycleData * 100).toFixed(2)
  return result
}

//因各项目用户量不同，排行榜仅作为参考
/**
 *
 * @param {number} visitAt
 * @returns {Promise<Array>}
 */
async function summaryDailyReport (pids = [], startAt, endAt, countType, countAtTime) {
  const projectList = await MProject.getList(pids)
  let projectsData = []
  let lastProjectsData = []

  for (let rawProject of projectList) {
    const projectId = _.get(rawProject, 'id', '')
    const projectName = _.get(rawProject, 'project_name', '')
    const displayName = _.get(rawProject, 'display_name', '')
    
    const desc = _.get(rawProject, 'c_desc', '').replace(/^负责人:/, '')
    const rate = _.get(rawProject, 'rate', 0) / 10000 * 100 + '%'
    const lastCountTime = moment(countAtTime).subtract(countType === 'week' ? 7 : 1, 'day').format(DATE_FORMAT.DISPLAY_BY_DAY)

    Logger.info(`开始处理项目${projectId}(${projectName})的数据`)
    // 先获取这个时间段的所有错误
    const { total: errorTotalCount } = await MErrorES.asyncGetTotalCount(projectId, startAt, endAt)
    // 统计Pv
    const pvTotalCount = await MPvES.asyncGetTotalCount(projectId, startAt, endAt)
    // 统计Uv
    const uvTotalCount = await MUvES.asyncGetTotalCount(projectId, startAt, endAt)
    // 统计ucid去重数
    const ucidTotalCount = await MUvES.asyncGetTotalCount(projectId, startAt, endAt, [], [], [], 'common.ucid.keyword')

    // 报警统计d
    if (pvTotalCount <= 0) continue
    const alarmCount = await MAlarm.getAlarmLogInRange(projectId, startAt, endAt)
    const lastCycleAlarmCount = await MAlarm.getAlarmLogInRange(projectId, startAt, endAt)

    Logger.info(`开始项目${projectId}(${projectName})今日的错误总数是:${errorTotalCount}`)
    Logger.info(`开始项目${projectId}(${projectName})今日的PV总数是:${pvTotalCount}`)
    //  再去查所有的项目指标
    let overview = await MPerformanceES.asyncGetOverview(projectId, startAt, endAt)
    const firstRenderMs = _.get(overview, MPerformance.INDICATOR_TYPE_首次渲染耗时, 0)
    const firstResponseMs = _.get(overview, MPerformance.INDICATOR_TYPE_首次可交互耗时, 0)
    const firstTcpMs = _.get(overview, MPerformance.INDICATOR_TYPE_首包时间耗时, 0)

    // 获取昨天/上周的数据，做环比
    const lastCycleData = await MDaily.getHistoryData(projectId, countType, lastCountTime)
    // const errorRank
    const errorPercent  = (parseInt(errorTotalCount) / parseInt(pvTotalCount) * 100).toFixed(2)
    const createTime = moment().unix()
    const thisCycleData = {
      projectId,
      projectName: displayName,
      errorTotalCount,
      pvTotalCount,
      uvTotalCount,
      ucidTotalCount,
      errorPercent,
      alarmCount: _.get(alarmCount, 'length', 0),
      firstRenderMs,
      firstResponseMs,
      firstTcpMs,
      countType,
      countAtTime,
      createTime,
      desc,
      rate,
      updateTime: createTime,
    }
    const lastData = {
      projectId,
      projectName: displayName,
      errorTotalCount: lastCycleData.error_total_count,
      pvTotalCount: lastCycleData.pv_total_count,
      uvTotalCount: lastCycleData.uv_total_count,
      ucidTotalCount: lastCycleData.ucid_total_count,
      errorPercent: lastCycleData.error_percent,
      alarmCount: _.get(lastCycleAlarmCount, 'length', 0),
      firstRenderMs: lastCycleData.first_render_ms,
      firstResponseMs: lastCycleData.first_response_ms,
      firstTcpMs: lastCycleData.first_tcp_ms,
      countType,
      countAtTime: lastCountTime
    }
    projectsData.push(thisCycleData)
    lastProjectsData.push(lastData)
  }
  return {
    projectsData,
    lastProjectsData
  }
}

/**
 * 持久化报告数据
 * @param reportDatas
 * @returns {Promise<void>}
 */
async function dailyReportDataPersistence(projectsData) {
  const _insertOrUpdateError = insertOrUpdateError()
  const _insertOrUpdatePerf = insertOrUpdatePerf()
  for (let i = 0; i < projectsData.length; i++) {
    const item = projectsData[i]
    const {
      pvTotalCount,
      uvTotalCount
    } = item
    if (pvTotalCount > 0 && uvTotalCount > 0) {
      _insertOrUpdateError(item, i + 1)
      _insertOrUpdatePerf(item)
    }
  }
  _insertOrUpdateError()
  _insertOrUpdatePerf()
}
/**
 * 【错误数据】插入或者更新
 * @param report
 * @returns {Promise<*>}
 */
function insertOrUpdateError() {
  let data = []
  return function (report, error_rank) { 
    if (!report && !error_rank) return insertOrUpdate(data, DIARY_TABLE_NAME)
    if (!report.projectId || !report.countType || !report.countAtTime) return

    const {
      projectId: project_id,
      projectName: project_name,
      errorTotalCount: error_total_count,
      pvTotalCount: pv_total_count,
      uvTotalCount: uv_total_count,
      ucidTotalCount: ucid_total_count,
      errorPercent: error_percent,
      countType: count_type,
      countAtTime: count_at_time,
      createTime: create_time,
      updateTime: update_time,
    } = report
    data.push({
      project_id,
      project_name,
      error_total_count,
      pv_total_count,
      uv_total_count,
      ucid_total_count,
      error_rank,
      error_percent,
      count_type,
      count_range: moment(count_at_time).format('YYYY-MM'),
      count_at_time,
      create_time,
      update_time,
    })
  }
}

/**
 * 【性能数据】插入或者更新
 * @param report
 * @returns {Promise<*>}
 */
function insertOrUpdatePerf() {
  let list = []
  return function (report = null) {
    if (!report) return insertOrUpdate(list, BASE_TABLE_NAME)
    if (!report.projectId || !report.countType || !report.countAtTime) {
      return
    }
    const {
      projectId: project_id,
      projectName: project_name,
      errorTotalCount: error_total_count,
      firstRenderMs: first_render_ms,
      firstResponseMs: first_response_ms,
      firstTcpMs: first_tcp_ms,
      countType: count_type,
      countAtTime: count_at_time,
      createTime: create_time,
      updateTime: update_time,
    } = report
    const data = {
      project_id,
      project_name,
      error_total_count,
      first_render_ms,
      first_response_ms,
      first_tcp_ms,
      count_type,
      count_at_time,
      create_time,
      update_time,
    }
    list.push(data)
  }
}

/**
 * 插入或者更新数据的方法
 * @param insertList
 * @param tableName
 * @returns {Promise<boolean>}
 */
async function insertOrUpdate (insertList, tableName) {
  if (!(insertList instanceof Array)) {
    insertList = [insertList]
  }
  const [first] = insertList
  const insertResult = await Knex.raw(
    Knex(tableName).insert(insertList).toQuery() + ' ON DUPLICATE KEY UPDATE ' +
    Object.getOwnPropertyNames(first)
      .map((field) => `${field}=VALUES(${field})`)
      .join(', '))
      .catch(e => {
        Logger.warn(`数据插入失败，失败原因====>` + e.message || e.stack || e)
        return []
      })
  let insertId = _.get(insertResult, [0], 0)
  return insertId > 0
}


/**
 * 按照格式发送邮件
 * @param data
 * @returns {Promise<void>}
 */
async function sendDailyMail (data, subscriptionList) {
  let {
    lastProjectsData,
    projectsData,
    sumaryAtTime,
    title: mailTitle,
    countType,
    sendAllProjectsData
  } = data
  // 文件存储的上一级目录名称，YYYY-MM-DD日期格式
  const PARENTDIR = moment(sumaryAtTime).format(DATE_FORMAT.DISPLAY_BY_DAY)
  const BASEPATH = path.resolve(__dirname, `../../../painting/${countType}/${PARENTDIR}`)

  // 如果是需要发送全部项目数据
  if (sendAllProjectsData) {
    // 先去清理一下之前的文件, 每天只清理一次
    clear10DaysAgoDir(sumaryAtTime, countType)
    let html = await generateMailContent(BASEPATH, { projectsData, lastProjectsData }, mailTitle)
    let downloadPath = getPdfFilePath(html, 'ALL', countType, PARENTDIR)

    await send(downloadPath, {
      to: mailConfig.leaders,
      title: mailTitle,
      html
    })
    return
  }

  // 需要根据用户email进行分组
  let subscriptionMap = new Map()
  let list = subscriptionList.reduce((pre, cur) => {
    let email = cur.email || ''
    let data = projectsData.filter(p => p.projectId == cur.project_id)
    pre.set(email, {
      ucid: cur.ucid || '',
      needCallback: cur.need_callback,
      callbackUrl: `${cur.protocol}://${cur.callback_url}`,
      data: Array.from(new Set([..._.get(pre.get(email), ['data'], []), ...data]))
    })
    return pre
  }, subscriptionMap)
  let users = list.keys()

  for (let key of users) { 
    const {
      data: projectsData,
      needCallback,
      callbackUrl
    } = subscriptionMap.get(key)
    // 回传数据给接口
    if (needCallback) await executeCallback(callbackUrl, projectsData)
    // 获取邮件原始内容
    const html = await generateMailContent(BASEPATH, { projectsData, lastProjectsData }, mailTitle)
    // 生成下载链接
    let downloadPath = getPdfFilePath(html, key, countType, PARENTDIR)
    // 发送邮件
    this.log(`发送给【${key}】的邮件：${JSON.stringify(projectsData)}`)
    await send(downloadPath, {
      to: [key],
      title: mailTitle,
      html,
      needCC: false
    })
  }
}

/**
 * 生成邮件内容以及pdf文件
 * @param {string} dirPath
 * @param {object} data
 * @param {string} mailTitle
 * @param {string} pdfFileName
 */ 
async function generateMailContent(dirPath, data, mailTitle) {
  let pvAndErrorArray = []
  let errorTotalCountImg = []
  let { projectsData, lastProjectsData } = data

  const table = generateMailHtmlDaily(projectsData, lastProjectsData)

  for (let index = 0, len = projectsData.length; index < len; index++) { 
    let project = projectsData[index]
    let {
      projectId: pid,
      projectName: pname,
      errorTotalCount: error,
      pvTotalCount: pv,
    } = project
    let lastData = _.find(lastProjectsData, (item) => item.projectName === pname)
    let percent = (parseInt(error) / parseInt(pv) * 100).toFixed(2)

    Logger.info(`开始生成项目【${pname}（${pid}）】的数据截图，`)
    let pngFilePath = path.join(dirPath, `./${pid}.png`)
    pvAndErrorArray = generateRankData([project], lastData)
    let title = `${pname}（${percent}%）`
    let { png } = await screenShot(
      generatePvErrorChart(pvAndErrorArray, title),
      dirPath,
      pngFilePath,
      {
        width: 840,
        height: pvAndErrorArray.length * 38 + 100,
        waitRenderTime: 5000,
      }
    ).catch(e => { 
      Logger.warn(`生成错误分析柱状图出错，错误原因 ===>${e.message || e.stack || e}`)
    })
    png && errorTotalCountImg.push(png)
  }

  let html = generateHtmlDailyReport({
    mailTitle,
    errorTotalCountImg,
    table
  })
  return html
}

/**
 *  仅当用户点击下载附件的时候才去生成pdf
 * @param {string} html 内容
 * @param {string} basePath 存储目录
 * @param {string} pdfFileName 文件名
 */
async function geteratePdf (html, basePath, pdfFileName) { 
  const pdfFilePath = path.join(basePath, `./${pdfFileName}.pdf`)
  const { pdf } = await screenShot(
    html, basePath, pdfFilePath, {
      width: 800,
      pngType: false,
      pdfType: true,
    }
  )
  return pdf
}

/**
 * 生成pdf下载链接地址
 * @param {string} html
 * @param {string} email
 * @param {string} countType
 * @param {string} dir
 */ 
function getPdfFilePath(html, email, countType, dir) { 
  // 先用内容md5生成一个唯一的id
  const hashName = md5(html)
  const downloadPath = `${App.mailAttachmentDownloadHost || App.host}/api/project/daily/download?countType=${countType}&email=${email}&hash=${hashName}&dir=${dir}`
  return downloadPath
}

/**
 * 发送邮件
 * @param {Array} to
 * @param {string} title
 * @param {string} html
 * */ 
function send(downloadPath, { to, title, html, needCC = true }) {
  // html = html.replace('<!--下载预留-->', `<a href="${downloadPath}"><button>下载附件</button></a>`)
  // 先干掉下载
  html = html.replace('<!--下载预留-->', '')
  html = html.replace(/<div class="title">[^\n]+/, '')
  Logger.info(`开始发送邮件，邮件名称${title}，接收人${JSON.stringify(to)}`)
  return sendMail({
    to,
    title: title,
    text: '灯塔每日质量报告',
    html
  }, needCC)
}

/**
 * 日报数据转换
 * @param {*} projectsData
 * @param {*} lastCycleData
 * @returns
 */
function generateRankData(projectsData, lastCycleProjectData = {}) {
  const rankMapData = projectsData.map(projectData => {
    const { errorTotalCount: error, pvTotalCount: pv, uvTotalCount: uv, alarmCount: alarm, countAtTime: time } = projectData
    const { errorTotalCount: error_2, pvTotalCount: pv_2, uvTotalCount: uv_2, alarmCount: alarm_2, countAtTime: time_2 } = lastCycleProjectData
    return {
      error,
      error_2,
      pv,
      pv_2,
      uv,
      uv_2,
      alarm,
      alarm_2,
      time,
      time_2
    }
  })
  // rankMapData.sort(({ percent: percentA }, { percent: percentB }) => percentA * 100 - percentB * 100 > 0 ? 1 : -1)
  let data = []
  for (const rankData of rankMapData) {
    const {
      error,
      error_2,
      pv,
      pv_2,
      uv,
      uv_2,
      alarm,
      alarm_2,
      time,
      time_2,
    } = rankData
    let type1 = moment(time).format('MM月DD日')
    let type2 = moment(time_2).format('MM月DD日')

    data = data.concat([
      { label: '错误数量', type: type1, value: error },
      { label: '错误数量', type: type2, value: error_2 },
      { label: 'uv', type: type1, value: uv },
      { label: 'uv', type: type2, value: uv_2 },
      { label: '数据总量', type: type1, value: pv },
      { label: '数据总量', type: type2, value: pv_2 },
      { label: '报警数量', type: type1, value: alarm },
      { label: '报警数量', type: type2, value: alarm_2 },
    ])
  }
  return data
}


/**
 * 邮件模板
 * @param projectsData
 * @param lastProjectsData
 * @returns {string}
 */
function generateMailHtmlDaily(projectsData, lastProjectsData) {
  let tables = [{
    title: '错误统计',
    sortBy: 'errorTotalCount',
    columns: [{
      key: 'errorTotalCount',
      name: '错误数量'
    }, {
      key: 'pvTotalCount',
      name: '数据总量'
    }, {
      key: 'uvTotalCount',
      name: 'UV总量'
    }, {
      key: 'ucidTotalCount',
      name: 'ucid去重数'
    }, {
      key: 'errorPercent',
      name: '错误占比'
    }, {
      key: 'alarmCount',
      name: '报警次数'
    }]
  }, {
    title: '首次渲染耗时统计(ms)',
    columns: 'firstRenderMs',
    sortBy: 'firstRenderMs'
  }, {
    title: '首次可交互耗时统计(ms)',
    columns: 'firstResponseMs',
    sortBy: 'firstResponseMs'
  }, {
    title: '首包时间耗时统计(ms)',
    columns: 'firstTcpMs',
    sortBy: 'firstTcpMs'
  }]
  let html = ''
  for (let table of tables) {
    let { title, columns } = table
    if (!Array.isArray(columns)) {
      columns = [{
        key: columns,
        name: title
      }]
    }
    let colspan = columns.length + 3
    projectsData.sort((a, b) => a[table.sortBy] - b[table.sortBy])
    
    html += `<div>
      <h3>${title}</h3>
      <table>
        <tbody>
          <tr>
            <th>项目名称</th>
              ${columns.map(col => {
                return `<th>${col.name}</th>`
              }).join('')}
            <th>抽样比例</th>
            <th>项目负责人</th>
          </tr>
          ${
            !projectsData.length ? `<tr><td colspan="${colspan}" align="center">今日暂无数据</td></tr>` : projectsData.map((project) => {
              let lastData = _.find(lastProjectsData, (item) => item.projectName === project.projectName)
              return `<tr>
                <td>${project.projectName}</td>
                ${
                  columns.map(col => {
                    let { key } = col
                    let cycleRate = computeCycleRate(project[key], lastData[key])
                    return `
                      <td>
                        ${project[key]}
                        <span class="cycle-ratio_${cycleRate > 0 ? 'up' : 'down'}">
                          ${cycleRate > 0 ? '&#8593;' : '&#8595;'} ${Math.abs(cycleRate)}%
                        <span>
                      </td>`
                  }).join('')
                }
                  <td>${project.rate}</td>
                  <td>${project.desc}</td>
                </tr>`
            }).join('')
          }
        </tbody>
      </table>
    </div>`
  }
  return html
}

/**
 * 执行业务回调
 * @param {Array} data
 * @param {string} url
 */
async function executeCallback (url, data) {
  if (!url) return
  await axios.post(url, {
    data
  }, {
    timeout: 1000 * 5
  }).catch(err => { 
    Logger.warn(`执行业务回调出错，回调地址[${url}]，错误原因===> ${err.stack}`)
  })
}

/**
 * 清除十天之前的文件
 * @param {string} summaryAt
 * @param {string} countType
 */
function clear10DaysAgoDir(summaryAt, countType) {
  let baseDir = path.resolve(__dirname, `../../../painting/${countType}`)
  let _10DaysAgo = moment(summaryAt).subtract(10, 'day').format(DATE_FORMAT.DISPLAY_BY_DAY)
  let isExist = Util.fsExistsSync(baseDir)
  let dirs = []

  if (isExist) {
    dirs = fs.readdirSync(baseDir)
    dirs = dirs.filter(dir => { 
      let stat = fs.statSync(path.join(baseDir, `./${dir}`))
      if (!stat.isDirectory()) return false
      if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(dir)) return false
      return moment(dir).isBefore(_10DaysAgo)
    })
  }
  for (let dir of dirs) { 
    let _path = path.join(baseDir, `./${dir}`)
    child_process.exec(`rm -rf ${_path}`)
  }
}
  
export default {
  getSumaryAt,
  geteratePdf,
  generateMailContent,
  summaryDailyReport,
  sendDailyMail,
  dailyReportDataPersistence,
}
