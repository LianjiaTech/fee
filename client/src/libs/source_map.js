/** @format */

import Axios from 'axios'

const SOURCE_MAP_PACKAGE_PATH = 'https://unpkg.com/source-map@0.7.3/dist/source-map.js'

// 存储source-map的map
const smMap = new Map()

/**
 * 通过报错问价后加.map后缀获取sourceMap文件
 * @export
 * @param {*} fileName
 * @returns
 */
export async function getOnlineJsSourceMap(mapPath) {
  const mapValue = smMap.get(mapPath)
  if (mapValue !== undefined) {
    return mapValue
  }
  const value = await Axios.get(mapPath)
    .then((res) => res.data)
    .catch((error) => {
      throw new Error(`获取线上sourceMap文件失败：${error.message}`)
    })
  smMap.set(mapPath, value)
  return value
}

/**
 * 根据sourceMap 获取报错的具体位置和字段
 * @param fileName
 * @param line
 * @param column
 * @returns {Promise<any>}
 */
export async function findDetailInSourceMap(fileName, line, column, rawSourceMap) {
  // 先转化为fileName
  line = parseInt(line)
  column = parseInt(column)

  if (!rawSourceMap) {
    return
  }
  if (!window.sourceMap) {
    await appendScript(SOURCE_MAP_PACKAGE_PATH)
    window.sourceMap.SourceMapConsumer.initialize({
      'lib/mappings.wasm': 'https://unpkg.com/source-map@0.7.3/lib/mappings.wasm'
    })
  }
  // 这里还没有的话肯定是source-map库加载失败了
  if (!window.sourceMap) {
    return
  }
  const { SourceMapConsumer } = window.sourceMap
  // 如果没有sourceMap这个包
  return new Promise((resolve) =>
    SourceMapConsumer.with(rawSourceMap, null, (consumer) => {
      const pos = consumer.originalPositionFor({
        line,
        column
      })
      resolve(pos)
    })
  )
}

/**
 * 异步引入script文件
 * @param src
 * @returns {Promise<any>}
 */
async function appendScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = src
    script.crossOrigin = 'anonymous'
    script.onload = resolve
    script.onerror = resolve
    document.body.appendChild(script)
  })
}

/**
 * 用source-map去格式化stack
 * @param stack
 * @returns {Promise<void>}
 */
export async function formatStack(rawStack, sourceMapContent) {
  // 翻译各种堆栈信息,遍历stack,先都转成string
  if (!rawStack) {
    return rawStack
  }
  if ('string' !== typeof rawStack) {
    rawStack = JSON.stringify(rawStack)
  }
  // 按行去分割 stack
  const stacks = rawStack.split('\n')
  const formatStacks = []
  for (let stack of stacks) {
    // 匹配出包含 关键信息得关键字
    // stack = (stack + '').trim()
    const stackMatch = stack.match(/(https*:\/\/[^?]+).*:(\d+):(\d+)/)
    if (!stackMatch) {
      formatStacks.push(stack)
      continue
    }
    //如果匹配到了，就用匹配到的
    const [matchedStack, rawFile, rawLine, rawColumn] = stackMatch

    const pos = await findDetailInSourceMap(rawFile, rawLine, rawColumn, sourceMapContent)
    if (!pos) {
      formatStacks.push(stack)
      continue
    }
    const { source, line, column, name } = pos
    if (source === null && line === null && column === null && name === null) {
      formatStacks.push(stack)
      continue
    }
    // 这里用重新格式化后的字段去替代原来的stack
    const formatStack = `${name ? `(error field:'${name}')` : ''} ${stack.replace(matchedStack, `${source}:${line}:${column}`)}`
    formatStacks.push(formatStack)
  }
  return formatStacks.join('\n')
}
