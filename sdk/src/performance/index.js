import initRenderingTime from '../first-screen-loading-time/watch_render'

export default {
  init(cb) {
    const me = this
    let times = null
    let firstScreenLoadingTime = null

    function reportPerf() {
      if (!times || !firstScreenLoadingTime) {
        return
      }
      times.firstScreenLoadingTime = firstScreenLoadingTime
      me.debugLogger('发送页面性能指标数据, 上报内容 => ', {
        ...times,
        url: `${window.location.host}${window.location.pathname}`
      })
      // 需要等待首屏数据加载完成
      cb &&
        cb.call(me, 'perf', 20001, {
          ...times,
          url: `${window.location.host}${window.location.pathname}`
        })
    }

    initRenderingTime(function(loadingTime) {
      firstScreenLoadingTime = loadingTime
      reportPerf()
    })

    // 使用load事件, 替换onload方法
    window.addEventListener('load', () => {
      if (me.needRecordPerformance === false) {
        me.debugLogger(`config.record.performance值为false, 跳过性能指标打点`)
        return
      }
      const performance = window.performance
      if (!performance) {
        // 当前浏览器不支持
        me.debugLogger('你的浏览器不支持 performance 接口')
        return
      }
      times = {}
      for (const key in performance.timing) {
        if (!isNaN(performance.timing[key])) {
          times[key] = performance.timing[key]
        }
      }
      reportPerf()
    })
  }
}
