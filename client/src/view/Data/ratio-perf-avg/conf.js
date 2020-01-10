export const RANGE_INDICATOR_TYPE_LIST = [{
  name: 'DNS查询耗时',
  value: 'dns_lookup_ms'
}, {
  name: 'TCP链接耗时',
  value: 'tcp_connect_ms'
}, {
  name: '请求响应耗时',
  value: 'response_request_ms'
}, {
  name: '内容传输耗时',
  value: 'response_transfer_ms'
}, {
  name: 'DOM解析耗时',
  value: 'dom_parse_ms'
}, {
  name: '资源加载耗时',
  value: 'load_resource_ms'
}]
export const KEY_INDICATOR_TYPE_LIST = [{
  name: '首次渲染耗时',
  value: 'first_render_ms'
}, {
  name: '首包时间耗时',
  value: 'first_tcp_ms'
}, {
  name: '首次可交互耗时',
  value: 'first_response_ms'
}, {
  name: 'DOM_READY_耗时',
  value: 'dom_ready_ms'
}, {
  name: '页面完全加载耗时',
  value: 'load_complete_ms'
}, {
  name: '首屏加载耗时',
  value: 'first_screen_ms'
}]
export const chartSet = (_this, data) => {
  let legend = []
  let xAxis = data.map(item => item.time)
  let series = []
  for (let indicator of _this.indicator) {
    let allIndicatior = [...RANGE_INDICATOR_TYPE_LIST, ...KEY_INDICATOR_TYPE_LIST]
    allIndicatior.forEach(item => {
      if (item.value === indicator) {
        series.push({
          name: item.name,
          type: 'line',
          data: data.map(it => Math.ceil(it[indicator]))
        })
        legend.push(item.name)
      }
    })
  }

  return {
    title: {
      text: _this.currentUrl.length > 30 ? `${_this.currentUrl.slice(0, 30)}...` : _this.currentUrl,
      textStyle: {
        fontSize: 14,
        color: '#2d8cf0'
      }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      type: 'scroll',
      width: 500,
      data: [...legend, '样本数'],
      selected: {
        '样本数': false
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxis
    },
    yAxis: {
      type: 'value'
    },
    series: [...series, {
      name: '样本数',
      type: 'line',
      data: data.map(it => it.count)
    }]
  }
}
