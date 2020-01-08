import fs from 'fs-extra'
import puppeteer from 'puppeteer'
import md5 from 'md5'
import path from 'path'
import shell from 'shelljs'
import Util from '~/src/library/utils/modules/util'

/**
 * 根据传入网页得字符串生成一个页面，
 * 再用chrome内核去访问，生成一张截图
 * 读取这张图片并转化为base64返回
 */
export default async function (
  htmlString,
  { width = 600, height = 450, pngType = true, pdfType = false, waitRenderTime = 0 } = {}) {

  // 先用内容md5生成一个唯一的id
  const hashName = md5(htmlString)
  // const url = path.resolve(__dirname,
  //   `../../../../painting/${hashName}.html`)
  // fs.writeFileSync(url, htmlString)
  // 然后那puppeteer 去访问网页得地址
  const browser = await puppeteer.launch(
    { args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width, height })
  await page.setContent(htmlString)
  if (waitRenderTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitRenderTime))
  }
  try {
    await page.waitForNavigation({ waitUntil: ['load'], timeout: 5000 })
  } catch (e) {
    console.error(e)
  }
  // 加载完以后取页面得真实高度
  const { realWidth, realHeight } = await page.evaluate(() => {
    return {
      realWidth: document.body.offsetWidth,
      realHeight: document.body.offsetHeight,
    }
  })
  let png
  if (pngType) {
    const pngPath = path.resolve(__dirname,
      `../../../../painting/${hashName}.png`)
    // await page.setViewport({ width: realWidth, height: realHeight})
    await page.screenshot({ path: pngPath })
    const imageBuf = fs.readFileSync(pngPath)
    png = `data:image/png;base64,${imageBuf.toString('base64')}`
    fs.removeSync(pngPath)
  }
  let pdf
  if (pdfType) {
    const pdfPath = path.resolve(__dirname,
      `../../../../painting/${hashName}.pdf`)
    await page.pdf(
      { path: pdfPath, width: `${realWidth}px`, height: `${realHeight * 2}px` })
    pdf = pdfPath
  }
  await browser.close()
  // 下面再去文件夹中读取这张图片
  // 删除html和图片文件
  return {
    png,
    pdf,
  }
}

export const screenShot = async function (
  htmlString,
  baseDir,
  filePath,
  { width = 600, height = 450, pngType = true, pdfType = false, waitRenderTime = 0 } = {}) {
  let res = {
    png: '',
    pdf: ''
  }
  const BASEDIR = baseDir
  const FILEPATH = filePath

  let pngExsit = hasAlreadyExsitPng()
  let pdfExsit = hasAlreadyExsitPdf()

  if (pngType && !pngExsit) await generatePng()
  if (pdfType && !pdfExsit) await generatePdf()

  return res

  // 初始化
  async function init () {
    // 然后那puppeteer 去访问网页得地址
    const browser = await puppeteer.launch(
      { args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    await page.setViewport({ width, height })
    await page.setContent(htmlString)
    if (waitRenderTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitRenderTime))
    }
    try {
      await page.waitForNavigation({ waitUntil: ['load'], timeout: 5000 })
    } catch (e) {
      console.error(e)
    }
    // 加载完以后取页面得真实高度
    const { realWidth, realHeight } = await page.evaluate(() => {
      return {
        realWidth: document.body.offsetWidth,
        realHeight: document.body.offsetHeight
      }
    })
    return {
      page,
      browser,
      realWidth,
      realHeight
    }
  }

  async function generatePng () {
    // 判断文件夹是否已经存在
    let isDirExist = Util.fsExistsSync(BASEDIR)
    if (!isDirExist) {
      shell.mkdir('-p', BASEDIR)
    }
    const { page, browser } = await init()
    await page.screenshot({ path: FILEPATH })
    const imageBuf = fs.readFileSync(FILEPATH)
    res.png = `data:image/png;base64,${imageBuf.toString('base64')}`
    await browser.close()
  }

  async function generatePdf () {
    const { page, browser, realWidth, realHeight } = await init()
    await page.pdf({ path: FILEPATH, width: `${realWidth}px`, height: `${realHeight * 2}px` })
    res.pdf = FILEPATH
    await browser.close()
  }

  function hasAlreadyExsitPng () {
    // 判断图片是不是已经生成过了
    let isFileExist = Util.fsExistsSync(FILEPATH)
    if (isFileExist) {
      const imageBuf = fs.readFileSync(FILEPATH)
      res.png = `data:image/png;base64,${imageBuf.toString('base64')}`
      return true
    }
    return false
  }

  function hasAlreadyExsitPdf () {
    // 判断pdf是不是已经生成过了
    let isFileExist = Util.fsExistsSync(FILEPATH)
    if (isFileExist) {
      res.pdf = FILEPATH
      return true
    }
    return false
  }
}
