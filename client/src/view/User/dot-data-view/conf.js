import _ from 'lodash'
import echart from 'echarts'

export const getMeasuresConfig = (propsConfig = []) => {
  propsConfig = propsConfig.map((prop) => {
    return {
      label: prop.props_display_name,
      value: prop.props_name,
      children:
        prop.props_data_type === 'number'
          ? [
              {
                label: '去重数',
                value: 'Unique'
              },
              {
                label: '平均值',
                value: 'AVG'
              },
              {
                label: '最大值',
                value: 'MAX'
              },
              {
                label: '最小值',
                value: 'MIN'
              }
            ]
          : [
              {
                label: '去重数',
                value: 'Unique'
              }
            ]
    }
  })
  propsConfig.unshift({
    label: '总数',
    value: 'Count'
  })
  return propsConfig
}

export const functionsConfig = (type) =>
  ({
    string: [
      {
        name: '等于',
        value: 'equal'
      },
      {
        name: '不等于',
        value: 'notEqual'
      },
      {
        name: '包含',
        value: 'contain'
      },
      {
        name: '不包含',
        value: 'notContain'
      }
    ],
    number: [
      {
        name: '等于',
        value: 'equal'
      },
      {
        name: '不等于',
        value: 'notEqual'
      },
      {
        name: '小于',
        value: 'less'
      },
      {
        name: '大于',
        value: 'greater'
      }
    ],
    boolean: [
      {
        name: '等于',
        value: 'equal'
      }
    ]
  }[type])

export const dotDataLineOptions = (chartData = [], filter = {}) => {
  let byField = _.get(filter, ['byFields'], '')
  let legendName = `${_.get(filter, ['name'], '')}的${_.get(filter, ['propName'], '')}`

  let _date = chartData.reduce((pre, cur) => {
    pre.add(cur.display_time)
    return pre
  }, new Set())

  let map = new Map()
  let _len = _date.size
  let data = []

  for (let i = 0, len = chartData.length; i < len; i++) {
    let item = chartData[i]
    if (map.has(item.name)) {
      let arr = map.get(item.name)
      _.set(arr, [i % _len], item.value)
      continue
    }
    map.set(item.name, Array.from(_len).fill(0))
    let arr = map.get(item.name)
    _.set(arr, [i % _len], item.value)
  }

  let date = Array.from(_date)
  if (byField === 'total') {
    data = [
      {
        name: legendName,
        type: 'line',
        data: chartData.map((item) => item.value)
      }
    ]
  } else {
    for (let [key, value] of map.entries()) {
      data.push({
        name: key,
        type: 'line',
        data: value
      })
    }
  }
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      enterable: true,
      confine: true
    },
    legend: {
      width: '50%',
      type: 'scroll',
      top: 'top',
      data: byField === 'total' ? [legendName] : Array.from(map.keys()).map((item) => item + ''),
      formatter: function(name) {
        return echart.format.truncateText(name, 240, '14px Microsoft Yahei', '…')
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '60%',
        handleStyle: {
          color: '#fff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
          shadowOffsetX: 2,
          shadowOffsetY: 2
        }
      }
    ],
    xAxis: {
      type: 'category',
      data: date
    },
    yAxis: {
      type: 'value'
    },
    series: data
  }
}

export const dotDataPieOptions = (chartData = []) => {
  let _map = chartData.reduce((pre, cur) => {
    if (pre.has(cur.name)) {
      let value = pre.get(cur.name) + cur.value
      pre.set(cur.name, value)
    } else {
      pre.set(cur.name, cur.value)
    }
    return pre
  }, new Map())

  let data = []
  for (let [key, value] of _map.entries()) {
    let item = {
      name: key + '',
      value
    }
    data.push(item)
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {d}%',
      confine: true
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 5,
      data: Array.from(_map.keys()).map((item) => item + ''),
      formatter: function(name) {
        return echart.format.truncateText(name, 140, '14px Microsoft Yahei', '…')
      },
      tooltip: {
        show: true
      },
      pageButtonGap: 1
    },
    series: [
      {
        name: '分布情况',
        type: 'pie',
        radius: '75%',
        center: ['50%', '60%'],
        data: data,
        label: {
          formatter: (val) => {
            return echart.format.truncateText(val.name, 140, '14px Microsoft Yahei', '…')
          }
        },
        itemStyle: {
          emphasis: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
}
