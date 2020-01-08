import Base from '~/src/commands/base'
import http from '~/src/library/http'
import watchServer from '~/src/configs/watch_server'

class HeartBeat extends Base {
  static get signature () {
    return `
     Utils:HeartBeat
     `
  }

  static get description () {
    return `心跳接口报告本服务还是活着得`
  }

  async execute (args, options) {
    this.log(`开始报告心跳数据`)
    const {watchServerId, reportServerHost} = watchServer
    await http.get(`${reportServerHost}/heart_beat/${watchServerId}`)
      .then(data => ({data}))
      .catch(error => ({error}))
    this.log(`心跳数据报告完毕`)
  }
}

export default HeartBeat
