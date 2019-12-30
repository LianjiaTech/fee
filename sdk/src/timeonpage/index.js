export default {
  init (cb) {
    const OFFLINE_MILL = 15 * 60 * 1000 // 15分钟不操作认为不在线
    const SEND_MILL = 5 * 1000 // 每5s打点一次

    let lastTime = Date.now()

    window.addEventListener('click', () => {
      if (this.needRecordTimeOnPage === false) {
        this.debugLogger(`config.record.time_on_page值为false, 跳过停留时长打点`)
        return
      }

      const now = Date.now()
      const duration = now - lastTime
      if (duration > OFFLINE_MILL) {
        lastTime = Date.now()
      } else if (duration > SEND_MILL) {
        lastTime = Date.now()
        this.debugLogger('发送用户留存时间埋点, 埋点内容 => ', { duration_ms: duration })
        // 用户在线时长
        cb && cb.call(this, 10001, { duration_ms: duration })
      }
    }, false)
  }
}
