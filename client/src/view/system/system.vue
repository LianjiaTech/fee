<template>
  <Row style="margin-top: 20px;">
    <Card shadow>
      <div
        ref="dom"
        style="height: 610px;"
      ></div>
    </Card>
  </Row>
</template>

<script>
  import echarts from 'echarts'
  import { getSystemInfo } from '@/api/system'
  import { off, on } from '@/libs/tools'

  export default {
    name: 'system',
    data () {
      return {
        dom: null
      }
    },
    methods: {
      resize () {
        this.dom.resize()
      },
      updateAxisPointer (event) {
        var xAxisInfo = event.axesInfo[0]
        if (xAxisInfo) {
          var dimension = xAxisInfo.value + 1
          this.dom.setOption({
            series: {
              id: 'pie',
              label: {
                formatter: '{b}: {@[' + dimension + ']} ({d}%)'
              },
              encode: {
                value: dimension,
                tooltip: dimension
              }
            }
          })
        }
      }
    },
    async mounted () {
      let source = []
      const res = await getSystemInfo()

      source.push(['product', ...res.data.time])
      res.data.list.forEach(({key, value}) => {
        source.push([key, ...value])
      })

      const option = {
        legend: {},
        tooltip: {
          trigger: 'axis',
          showContent: false
        },
        dataset: {
          source
        },
        xAxis: {type: 'category'},
        yAxis: {gridIndex: 0},
        grid: {top: '55%'},
        series: [
          {type: 'line', smooth: true, seriesLayoutBy: 'row'},
          {type: 'line', smooth: true, seriesLayoutBy: 'row'},
          {type: 'line', smooth: true, seriesLayoutBy: 'row'},
          {type: 'line', smooth: true, seriesLayoutBy: 'row'},
          {type: 'line', smooth: true, seriesLayoutBy: 'row'},
          {type: 'line', smooth: true, seriesLayoutBy: 'row'},
          {
            type: 'pie',
            id: 'pie',
            radius: '30%',
            center: ['50%', '25%'],
            label: {
              formatter: '{b}: {@2012} ({d}%)'
            },
            encode: {
              itemName: 'product',
              value: '2012',
              tooltip: '2012'
            }
          }
        ]
      }

      this.$nextTick(() => {
        this.dom = echarts.init(this.$refs.dom)
        this.dom.setOption(option)
        on(window, 'resize', this.resize())

        this.dom.on('updateAxisPointer', this.updateAxisPointer)
      })
    },
    beforeDestroy () {
      off(window, 'resize', this.resize())
    }
  }
</script>
