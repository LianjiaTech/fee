import redisConfig from '~/src/configs/redis'
import Redis from 'ioredis'
import _ from 'lodash'
import Logger from '~/src/library/logger'

/**
 * 原生Redis有这么几个问题
 * 1. 命令没有参数提示
 * 2. 连接Redis后不会自动断开, 导致程序无法正常退出
 * 因此, 在这里手工对ioredis进行了一次手工封装, 添加参数提示和链接自动断开逻辑, 方便使用
 * 目前只用到了setex和get方法, 后续有需要可以再添加
 */
class RedisClient {
  constructor (isTest = false) {
    this.redisClient = new Redis({
      port: redisConfig.port,
      host: redisConfig.host,
      retryStrategy: (hasRetryTimes) => {
        // 关闭自动重连功能
        return false
      },
      lazyConnect: true, // 初始化时不能连接Redis Server, 否则会因为无法断开连接, 导致npm run fee命令不能退出
      showFriendlyErrorStack: true,
    })
    this.isTest = isTest
    this.disconnectTimeoutId = null
    // 利用debounce限制当连接空闲1s以上时, 自动断开链接, 避免由于持有连接句柄导致进程无法退出
    this._debounceDisconnect = _.debounce(async () => {
      if (this.checkIsConnected() === true) {
        this.redisClient.disconnect()
        this._log(
          `disconnect success! now connect status change to => ${this.checkIsConnected()}`)
      }
    }, 1 * 1000)
  }

  checkIsConnected () {
    // ioRedis检查标准 =>
    // if (this.status === 'connecting' || this.status === 'connect' || this.status === 'ready') {
    let redisClientStatus = _.get(this.redisClient, ['status'], '')
    let isConnected = _.includes(['connecting', 'connect', 'ready'],
      redisClientStatus)
    this._log('redisClientStatus =>', redisClientStatus)
    return isConnected
  }

  /**
   * 自动重连
   */
  async _autoConnect () {
    this._log('connect: this.checkIsConnected() =>', this.checkIsConnected())
    if (this.checkIsConnected() === false) {
      await this.redisClient.connect().catch((e) => {
        this._log('catch eeeeerrrrror')
        this._log('e =>', e)
      })
      this._log(
        `connect success! now connect status change to => ${this.checkIsConnected()}`)
      return true
    }
    return false
  }

  /**
   * 自动断开
   */
  async _autoDisconnect () {
    if (this.disconnectTimeoutId) {
      clearTimeout(this.disconnectTimeoutId)
    }
    this.disconnectTimeoutId = setTimeout(() => this._debounceDisconnect(),
      2000)
  }

  /**
   * 内部log方法
   */
  _log () {
    if (this.isTest) {
      Logger.log(...arguments)
    }
  }

  /**
   * 取值
   * @param {String} key
   */
  async asyncGet (key) {
    // await this._autoConnect()
    const { data, error } = await this.redisClient.get(key).
      then(data => ({ data })).
      catch(error => ({ error }))
    if (error) {
      const connectFlag = await this._autoConnect()
      if (connectFlag) {
        return this.asyncGet(key)
      }
    }
    let result = JSON.parse(data)
    await this._autoDisconnect()
    return result
  }

  /**
   * 设值
   * @param {String} key
   * @param {Number} expire
   * @param {String} value
   */
  async asyncSetex (key, expire, value) {
    // await this._autoConnect()
    // 统一存入json后数据
    let valueJSON = JSON.stringify(value)
    const { data, error } = await this.redisClient.setex(key, expire,
      valueJSON).
      then(data => ({ data })).
      catch(error => ({ error }))
    if (error) {
      const connectFlag = await this._autoConnect()
      if (connectFlag) {
        return this.asyncSetex(key, expire, value)
      }
    }
    await this._autoDisconnect()
    return data
  }

  /**
   * 设置值
   * @param key
   * @param value
   * @returns {Promise<void>}
   */
  async asynSetValue (key, value) {
    if ('object' === typeof value) {
      value = JSON.stringify(value)
    }
    const { error } = await this.redisClient.set(key, value).
      catch(error => ({ error }))
    if (error) {
      const connectFlag = await this._autoConnect()
      if (connectFlag) {
        return this.asynSetValue(key, value)
      }
    }
    await this._autoDisconnect()
  }

  /**
   * 获取value
   * @param key
   * @returns {Promise<void>}
   */
  async asyncGetValue (key) {
    let { data, error } = await this.redisClient.get(key).
      then(data => ({ data })).
      catch(error => ({ error }))
    // 如果发现有错误就尝试重连
    if (error) {
      const connectFlag = await this._autoConnect()
      if (connectFlag) {
        return this.asyncGetValue(key)
      }
    }
    try {
      data = JSON.parse(data)
    } catch (error) {
    }
    await this._autoDisconnect()
    return data
  }

  /**
   * 删除值
   * @param key
   * @returns {Promise<void>}
   */
  async asyncDelValue (key) {
    let { data, error } = await this.redisClient.del(key).
      then(data => ({ data })).
      catch(error => ({ error }))
    // 如果发现有错误就尝试重连
    if (error) {
      const connectFlag = await this._autoConnect()
      if (connectFlag) {
        return this.asyncDelValue(key)
      }
    }
    try {
      data = JSON.parse(data)
    } catch (error) {
    }
    await this._autoDisconnect()
    return data
  }

}

let client = new RedisClient()

export default client
