export const dotDataLineOptions = data => {
  let { title, subtext, color, legend, xAxis, series, tooltip } = data
  return {
    title: {
      text: title,
      subtext
    },
    color,
    tooltip,
    legend,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis,
    yAxis: {
      type: 'value'
    },
    series: series || [
      {
        name: 'Error',
        type: 'bar',
        stack: '总量',
        label: {
          normal: {
            show: true,
            position: 'insideRight'
          }
        },
        data: [320, 302, 301]
      },
      {
        name: 'Perf',
        type: 'bar',
        stack: '总量',
        label: {
          normal: {
            show: true,
            position: 'insideRight'
          }
        },
        data: [120, 132, 101]
      },
      {
        name: 'Product',
        type: 'bar',
        stack: '总量',
        label: {
          normal: {
            show: true,
            position: 'insideRight'
          }
        },
        data: [220, 182, 191]
      }
    ]
  }
}
