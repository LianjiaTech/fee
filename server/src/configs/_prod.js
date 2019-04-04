/**
 *  === prodction config ===
 *  线上环境会有 op 的配置，所有资源需要读取配置
 *
 *  created at: Thu Nov 30 2017 17:35:34 GMT+0800 (CST)
 */

import fs from 'fs'
import ini from 'ini'
import path from 'path'

const relativePath = `./system/MATRIX_ENV_CONF`
const filePath = path.resolve(relativePath)

const config = {}

if (fs.existsSync(filePath)) {
  Object.assign(
    config,
    ini.parse(fs.readFileSync(filePath, 'utf-8'))
  )
}

export default config
