import MProject from '~/src/model/project/project'
import MSummary from '~/src/model/elastic_search/summary/count'
import moment from 'moment'
import shell from 'shelljs'
import fs from 'fs'
import _ from 'lodash'

// 获取磁盘当前的空间
/**
 * 获取占用得磁盘空间
 * @returns {Promise<*>}
 */
async function getDiskInfo () {
  return new Promise(resolve => {
    shell.exec('df -lh',
      (error, data, stderr) => resolve({ error: stderr, data }))
  })
}

function getFilePathByTime (time) {
  const filePath = __dirname.split('fee-rd')[0]
  const month = moment(time).format('YYYYMM')
  const day = moment(time).format('DD')
  const jsonDirPath = `${filePath}fee-rd/log/kafka/json/month_${month}/day_${day}`
  const rawDirPath = `${filePath}fee-rd/log/kafka/raw/month_${month}/day_${day}`
  return { jsonDirPath, rawDirPath }
}

// 获取当天数据的磁盘占用大小
/**
 * 获取磁盘得大小
 * @param time
 * @returns {Promise<{jsonSize: any, rawSize: any}>}
 */
async function getFileSizeByDay (time) {
  // 获取当前这一天的数据的磁盘占用情况
  //这里在路径上面匹配fee-rd工程前的部分作为基础的目录结构
  const { jsonDirPath, rawDirPath } = getFilePathByTime(time)
  const [jsonSize, rawSize] = await Promise.all([
    new Promise(resolve =>
      shell.exec(`du -sh ${jsonDirPath}`, (error, data) => resolve(data))),
    new Promise(resolve =>
      shell.exec(`du -sh ${rawDirPath}`, (error, data) => resolve(data))),
  ])
  return { jsonSize, rawSize }
}

/**
 * 获取log总数量
 * @param time
 * @returns {Promise<{jsonCount: any, rawCount: any}>}
 */
async function getLogCount (time) {
  const { jsonDirPath, rawDirPath } = getFilePathByTime(time)
  const jsonOrder = `grep -rn .  ${jsonDirPath} |wc -l`
  const rawOrder = `grep -rn .  ${rawDirPath} |wc -l`
  const jsonCount = await new Promise(
    resolve => shell.exec(jsonOrder,
      (error, count) => resolve(Number(count) || 0)))
  const rawCount = await new Promise(
    resolve => shell.exec(rawOrder,
      (error, count) => resolve(Number(count) || 0)))
  return { jsonCount, rawCount }
}

/**
 * 获取每个项目的log数量
 * @param startAt
 * @param endAt
 * @returns {Promise<Array>}
 */
async function getProjectSizeData(startAt, endAt) {
  const { total, aggs } = await MSummary.asyncGetTotalCount(startAt, endAt)
  const projectInfoList = await MProject.getList()

  let projectSizeData = []
  for (let agg of aggs) { 
    let projectName = _.get(projectInfoList.filter(info => info.project_name === agg.key), [0, 'display_name'], '')
    if (!projectName) continue
    projectSizeData.push({
      projectName,
      jsonCount: agg.doc_count
    })
  }
  return { total, projectSizeData }
  // const { jsonDirPath } = getFilePathByTime(time)
  // const projectInfoList = await MProject.getList()
  // const logNumbers = {}
  // // 便利所有的log日志来统计每个pid下的数量
  // readDirLogs(jsonDirPath, function (stringLogs) {
  //   const logs = stringLogs.split('\n')
  //   for (const log of logs) {
  //     try {
  //       const jsonLog = JSON.parse(log)
  //       const { project_name } = jsonLog
  //       if (!project_name) {
  //         continue
  //       }
  //       let num = logNumbers[project_name]
  //       if (undefined === num) {
  //         num = 0
  //       }
  //       num++
  //       logNumbers[project_name] = num
  //     } catch (e) {
  //       continue
  //     }
  //   }
  // })
  // const result = []
  // // 再这里统计所有的数据了
  // for (const pid in logNumbers) {
  //   const projectInfo = projectInfoList.find(
  //     ({ project_name }) => project_name === pid)
  //   if (!projectInfo) {
  //     continue
  //   }
  //   const { display_name: projectName } = projectInfo
  //   result.push({
  //     projectName,
  //     jsonCount: logNumbers[pid],
  //   })
  // }
  // return result
}

//用递归得方式去遍历所有的log文件
function readDirLogs (baseDir, callback) {
  let dayDirFiles = []
  try {
    dayDirFiles = fs.readdirSync(baseDir)
  } catch (error) {
    dayDirFiles = []
  }
  const logFiles = dayDirFiles.filter(file => /\.log/.test(file))
  const dirs = dayDirFiles.filter(file => !/\./.test(file))
  // 这里去解析logs
  for (const logFile of logFiles) {
    const logFilePath = `${baseDir}/${logFile}`
    let fileString = ''
    try {
      fileString = fs.readFileSync(logFilePath)
    } catch (error) {
      fileString = ''
    }
    callback(fileString.toString())
  }
  //这里去处理还是dir得路径
  for (const dir of dirs) {
    const childDir = `${baseDir}/${dir}`
    readDirLogs(childDir, callback)
  }
}


/**
 *  获取ip地址
 */
function getLocalIp () {
  return new Promise(resolve => shell.exec('ifconfig', (error, data) => {
    resolve(data.match(/inet\s+([^\s]+)/g).
      filter(item => !/127\.0\.0\.1/.test(item)).
      map(item => item.replace(/inet|\s/g, ''))[0])
  }))
}

export default {
  getDiskInfo,
  getFileSizeByDay,
  getLogCount,
  getProjectSizeData,
  getLocalIp,
}
