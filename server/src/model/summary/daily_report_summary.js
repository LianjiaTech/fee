/* eslint-disable */
import Knex from '~/src/library/mysql'
import moment from 'moment'
import _ from 'lodash'
import Logger from '~/src/library/logger'
import DATE_FORMAT from '~/src/constants/date_format'
import MProject from '~/src/model/project/project'
import MProjectMember from '~/src/model/project/project_member'
import MUser from '~/src/model/project/user'
import MPerformance from '~/src/model/parse/performance'
import MErrorES from '~/src/model/elastic_search/summary/error'
import MPvES from '~/src/model/elastic_search/summary/pv'
import MUvES from '~/src/model/elastic_search/summary/uv'
import MDiary from '~/src/model/parse/diary'
import MPerformanceES from '~/src/model/elastic_search/summary/performance'
import sendMail from '~/src/library/utils/modules/mailer'
import PaintingAndPhoto from '~/src/library/utils/modules/painting_and_photo'
import App from '~/src/configs/app'
import Util from '~/src/library/utils/modules/util'
import generatePvErrorChart from '~/src/views/web_template/html_pv_error'
import generateHtmlDailyReport from '~/src/views/web_template/html_daily_report'
import mailConfig from '~/src/configs/mail'
import MAlarmConfig from '~/src/model/project/alarm/alarm_config'

const BASE_TABLE_NAME = 't_r_count_daily'
const DIARY_TABLE_NAME = 't_o_count_diary'

//因各项目用户量不同，排行榜仅作为参考
/**
 *
 * @param {number} visitAt
 * @returns {Promise<Array>}
 */
async function summaryDailyReport (visitAt, countType) {
  let visitAtMoment = moment.unix(visitAt)
  const countAtTime = visitAtMoment.format('YYYY-MM-DD')
  const projectList = await MProject.getList()
  let startAt, endAt
  let title
  //在这里判断是周还是天
  if (DATE_FORMAT.UNIT.WEEK === countType) {
    const days = Util.getWeekByTime(visitAtMoment)
    const startDay = days.shift()
    const endDay = days.pop()
    title = `${startDay}日——${endDay}日(上周) 灯塔每周质量报告`
    startAt = moment(startDay).startOf(DATE_FORMAT.UNIT.DAY).unix()
    endAt = moment(endDay).endOf(DATE_FORMAT.UNIT.DAY).unix()
  } else {
    title = `${countAtTime}日(昨天) 灯塔每日质量报告`
    startAt = visitAtMoment.startOf(DATE_FORMAT.UNIT.DAY).unix()
    endAt = visitAtMoment.endOf(DATE_FORMAT.UNIT.DAY).unix()
  }
  const projectsData = []
  for (let rawProject of projectList) {
    const projectId = _.get(rawProject, 'id', '')
    const projectName = _.get(rawProject, 'project_name', '')
    const displayName = _.get(rawProject, 'display_name', '')
    const projectMail = _.get(rawProject, 'mail', '')
    const desc = _.get(rawProject, 'c_desc', '').replace(/^负责人:/, '')
    const rate = _.get(rawProject, 'rate', 0) / 10000 * 100 + '%'
    Logger.info(`开始处理项目${projectId}(${projectName})的数据`)
    // 先获取这个时间段的所有错误
    const { total: errorTotalCount } = await MErrorES.asyncGetTotalCount(projectId,
      startAt, endAt)
    // 统计Pv
    const pvTotalCount = await MPvES.asyncGetTotalCount(projectId, startAt,
      endAt)
    // 统计Uv
    const uvTotalCount = await MUvES.asyncGetTotalCount(projectId, startAt,
      endAt)
    // 报警统计
    if (pvTotalCount <= 0) {
      continue
    }
    const alarmCount = await MAlarmConfig.getCount(projectId)
    Logger.info(`开始项目${projectId}(${projectName})今日的错误总数是:${errorTotalCount}`)
    Logger.info(`开始项目${projectId}(${projectName})今日的PV总数是:${pvTotalCount}`)
    //  再去查所有的项目指标
    // @todo(yaozeyuan) 接口已发生变动,需要适配参数
    let overview = await MPerformanceES.asyncGetOverview(projectId, startAt,
      endAt)
    const firstRenderMs = _.get(overview, MPerformance.INDICATOR_TYPE_首次渲染耗时, 0)
    const firstResponseMs = _.get(overview, MPerformance.INDICATOR_TYPE_首次可交互耗时,
      0)
    const firstTcpMs = _.get(overview, MPerformance.INDICATOR_TYPE_首包时间耗时, 0)
    // const errorRank
    const errorPercent = (parseInt(errorTotalCount) / parseInt(pvTotalCount) *
      100).toFixed(2)
    const createTime = moment().unix()
    const todayData = {
      projectId,
      projectName,
      errorTotalCount,
      pvTotalCount,
      uvTotalCount,
      errorPercent,
      alarmCount,
      firstRenderMs,
      firstResponseMs,
      firstTcpMs,
      countType: DATE_FORMAT.UNIT.DAY,
      countAtTime,
      createTime,
      desc,
      rate,
      updateTime: createTime,
    }
    todayData.projectName = displayName
    todayData.projectMail = projectMail
    projectsData.push(todayData)
  }
  projectsData.sort((itemA, itemB) => itemB.errorPercent - itemA.errorPercent)
  return {
    title,
    countAtTime,
    projectsData,
  }
}

/**
 * 持久化报告数据
 * @param reportDatas
 * @returns {Promise<void>}
 */
async function dailyReportDataPersistence (projectsData) {
  for (let i = 0; i < projectsData.length; i++) {
    const item = projectsData[i]
    const { pvTotalCount, uvTotalCount, errorTotalCount } = item
    if (pvTotalCount > 0 && uvTotalCount > 0 && errorTotalCount > 0) {
      await insertOrUpdateDiary(item, i + 1)
    }
  }
}

/**
 * 插入或者更新数据
 * @param report
 * @returns {Promise<*>}
 */
async function insertOrUpdateData (report) {
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
  return insertOrUpdate(data, BASE_TABLE_NAME)
}

async function insertOrUpdateDiary (report, error_rank) {
  if (!report.projectId || !report.countType || !report.countAtTime) {
    return
  }
  const {
    projectId: project_id,
    projectName: project_name,
    errorTotalCount: error_total_count,
    pvTotalCount: pv_total_count,
    uvTotalCount: uv_total_count,
    errorPercent: error_percent,
    countType: count_type,
    countAtTime: count_at_time,
    createTime: create_time,
    updateTime: update_time,
  } = report

  const data = {
    project_id,
    project_name,
    error_total_count,
    pv_total_count,
    uv_total_count,
    error_rank,
    error_percent,
    count_type,
    count_range: moment(count_at_time).format('YYYY-MM'),
    count_at_time,
    create_time,
    update_time,
  }
  return insertOrUpdate(data, DIARY_TABLE_NAME)
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
    Object.getOwnPropertyNames(first).
      map((field) => `${field}=VALUES(${field})`).
      join(', ')).catch(e => {
    console.log(e)
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
async function sendDailyMail (data) {
  let { countAtTime, projectsData, title: mailTitle } = data
  //先排除几个数据都是0的，都是0说明还没有接入
  let mails = []
  for (const { projectId } of projectsData) {
    const members = await MProjectMember.getProjectMemberList(projectId)
    for (const member of members) {
      if (!member) {
        continue
      }
      const ucid = _.get(member, ['ucid'], '')
      const userData = await MUser.get(ucid)
      const mail = _.get(userData, ['email'], '')
      if (mail) {
        mails.push(mail)
      }
    }
  }
  mails = mails.concat(mailConfig.leaders)
  projectsData = projectsData.filter(
    ({ errorTotalCount, firstRenderMs, firstResponseMs, firstTcpMs }) => errorTotalCount ||
      firstRenderMs || firstResponseMs || firstTcpMs)
  const errorTotalCountArray = fileterProjectsDataByProp(projectsData,
    'errorTotalCount')
  const firstRenderMsArray = fileterProjectsDataByProp(projectsData,
    'firstRenderMs')
  const firstResponseMsArray = fileterProjectsDataByProp(projectsData,
    'firstResponseMs')
  const firstTcpMsArray = fileterProjectsDataByProp(projectsData,
    'firstTcpMs')
  const screenWidth = 840
  const pvAndErrorArray = generateRankData(projectsData)

  const { png: errorTotalCountImg } = await PaintingAndPhoto(
    generatePvErrorChart(pvAndErrorArray, '错误分析柱状图'), {
      width: screenWidth,
      height: pvAndErrorArray.length * 38 + 100,
      waitRenderTime: 5000,
    })
  Logger.info(`错误柱状图渲染完成`)
  const errorTable = generateMailHtmlDaily(errorTotalCountArray, '错误数量')
  const firstRenderTable = generateMailHtmlDaily(firstRenderMsArray,
    '首次渲染耗时(ms)')
  const firstResponseTable = generateMailHtmlDaily(firstResponseMsArray,
    '首次可交互耗时(ms)')
  const firstTcpTable = generateMailHtmlDaily(firstTcpMsArray, '首包时间耗时(ms)')
  let html = generateHtmlDailyReport({
    mailTitle,
    errorTotalCountImg,
    errorTable,
    firstRenderTable,
    firstResponseTable,
    firstTcpTable,
  })
  const { pdf } = await PaintingAndPhoto(
    html, {
      width: 800,
      pngType: false,
      pdfType: true,
    })
  const pdfPath = pdf.match(/\/([^\/]+)$/)[1]
  html = html.replace('<!--下载预留-->',
    `<a href="${App.mailAttachmentDownloadHost || App.host}/painting/${pdfPath}"><button>下载附件</button></a>`)
  html = html.replace(/<div class="title">[^\n]+/, '')
  await sendMail({
    to: mails,
    title: mailTitle,
    text: '灯塔每日质量报告',
    html,
  })
}

function generateRankData (projectsData) {
  const rankMapData = projectsData.map(projectData => {
    const { projectName, errorTotalCount: error, pvTotalCount: pv, uvTotalCount: uv, alarmCount: alarm } = projectData
    const percent = (parseInt(error) / parseInt(pv) * 100).toFixed(2)
    return {
      label: `${projectName}(${percent}%)`,
      error,
      pv,
      uv,
      alarm,
      percent: percent,
    }
  })
  rankMapData.sort(
    ({ percent: percentA }, { percent: percentB }) => percentA * 100 -
    percentB * 100 > 0
      ? 1
      : -1)
  const data = []
  for (const rankData of rankMapData) {
    const { label, error, pv, uv, alarm } = rankData
    data.push({ label, type: '设置报警数量', value: alarm })
    data.push({ label, type: '错误数量', value: error })
    data.push({ label, type: 'uv', value: uv })
    data.push({ label, type: '数据总量', value: pv })
  }
  return data
}

/**
 * 根据项目数据过滤
 * @param projectsData
 * @param propName
 * @returns {*|void|this}
 */
function fileterProjectsDataByProp (projectsData, propName) {
  return projectsData.filter(projectData => projectData[propName]).
    map(projectData => ({
      value: projectData[propName],
      projectName: projectData.projectName,
      desc: projectData.desc,
      rate: projectData.rate,
    })).
    sort((a, b) => a.value - b.value)
}

/**
 * 邮件模板
 * @param projectsData
 * @param valueTitle
 * @returns {string}
 */
function generateMailHtmlDaily (projectsData, valueTitle) {
  return `
     <table>
        <tbody>
           <tr><th>项目名称</th><th>${valueTitle}</th><th>抽样比例</th><th>项目负责人</th></tr>
           ${projectsData.map(
    ({ projectName, value, desc, rate }) => `<tr><td>${projectName}</td><td>${value}</td><td>${rate}</td><td>${desc}</td></tr>`).
    join('')}
        </tbody>
    </table>`
}

function formatNumber (number) {
  number = number.toString()
  const numbers = number.split('.')
  const integer = numbers[0]
  let finalNumber = ''
  const integerLength = integer.length - 1
  for (let i = integer.length - 1; i >= 0; i--) {
    if (integerLength - i > 0 && (integerLength - i) % 3 == 0) {
      finalNumber = ',' + finalNumber
    }
    finalNumber = integer[i] + finalNumber
  }
  if (numbers[1]) {
    finalNumber = `${finalNumber}.${numbers[1]}`
  }
  return finalNumber
}

export default {
  summaryDailyReport,
  sendDailyMail,
  dailyReportDataPersistence,
}
