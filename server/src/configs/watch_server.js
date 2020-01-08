import env from '~/src/configs/env'

const testing = {
  watchServerId: '',
  watchList: [{
    title: '灯塔服务器manager服务',
    id: '',
    lastSafeTime: Date.now(),
    alarmWaitTime: 15 * 60 * 1000,
    from: '来自testing服务器的监听',
    mails: []
  }],
  kafkaWatchList: [{
    title: '灯塔Consume:Kafka',
    id: '',
    alarmWaitTime: 10 * 1000,
    from: '来自testing服务器的监听',
    mails: [],
    ucids: [],
  }],
  serverPort: 3089,
  reportServerHost: ''
}
const development = {
  watchServerId: '',
  watchList: [{
    title: '灯塔develop务器manager服务',
    id: '',
    lastSafeTime: Date.now(),
    alarmWaitTime: 2 * 60 * 1000,
    from: '来自develop服务器的监听',
    mails: []
  }],
  kafkaWatchList: [{
    title: '灯塔Consume:Kafka',
    id: '',
    alarmWaitTime: 10 * 1000,
    from: '来自develop服务器的监听',
    mails: [],
    ucids: []
  }],
  serverPort: 3089,
  reportServerHost: ''
}
const production = testing
const backup = {
  watchServerId: '',
  watchList: [{
    title: '灯塔backup服务器manager服务',
    id: '',
    lastSafeTime: Date.now(),
    alarmWaitTime: 15 * 60 * 1000,
    from: '来自backup服务器的监听',
    mails: []
  }],
  serverPort: 3089,
  reportServerHost: ''
}

const config = {
  development,
  testing,
  production,
  backup
}
export default config[env]