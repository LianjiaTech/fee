
import Redis from 'ioredis'
import knex from 'knex'
import Manage from '~/src/commands/task/manage'

const assert = require('assert')

// redis服务器地址
let mysql_host = '127.0.0.1'
let mysql_port = '3306'

describe('Mysql 数据库环境断言', () => {
  it(mysql_host + ':' + mysql_port, (done) => {
    /**  knex 方式 */
    const Knex = knex({
      client: 'mysql',
      connection: {
        host: mysql_host,
        port: mysql_port,
        user: 'root',
        password: '123456',
        database: 'database'
      },
      debug: false,
      pool: {
        max: 10,
        min: 0,
        // 由于存在资源池, 导致句柄不被释放, 程序不能退出
        // 因此将最小句柄数设为0, 每100ms检查一次是否有超过120ms未被使用的资源
        // 以便句柄的及时回收
        // free resouces are destroyed after this many milliseconds
        idleTimeoutMillis: 100,
        // how often to check for idle resources to destroy
        reapIntervalMillis: 150
      },
      acquireConnectionTimeout: 60000,
      log: {
        error (message) {
          // assert.equal(1 > 0, true)
        }
      }
    })

    Knex
      .select('*')
      .from('t_o_project')
      .then(function (response) {
        if (response === undefined || response == 'undefined') {
          assert.equal(true, 2 < 1)
        } else {
          assert.equal(true, 2 > 1)
        }
        done()
      })
  })
})

// redis服务器地址
let redis_host = '127.0.0.1'
let redis_port = '6379'

describe('Redis 缓存环境断言', () => {
  it(redis_host + ':' + redis_port, (done) => {
    var redisClient = new Redis({
      port: redis_port,
      host: redis_host,
      retryStrategy: (hasRetryTimes) => {
        // 关闭自动重连功能
        return false
      },
      lazyConnect: true, // 初始化时不能连接Redis Server, 否则会因为无法断开连接, 导致npm run fee命令不能退出
      showFriendlyErrorStack: true
    })

    // Create a readable stream (object mode)
    var stream = redisClient.scanStream()
    stream.on('data', function (resultKeys) {
      assert.equal(true, resultKeys.length > 0)
      done()
    })
    stream.on('end', function () {

    })
  })
})

describe('指令系统校验', () => {
  var manage = new Manage()
  it('每分钟任务', () => {
    // 每分钟任务
    manage.registerTaskRepeatPer1Minute()
  })

  it('每十分钟任务', () => {
    // 每十分钟任务
    manage.registerTaskRepeatPer10Minute()
  })

  it('每六小时任务', () => {
    // 每六小时任务
    manage.registerTaskRepeatPer6Hour()
  })

  it('获取任务pid', () => {
    // 获取任务pid
    manage.getOtherTaskMangerPidList()
  })

  it('关闭所有任务', () => {
    // 关闭所有任务
    manage.getOtherTaskMangerPidList()
  })
})
process.on('unhandledRejection', function (err, p) {
  throw err
})
