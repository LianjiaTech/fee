<template>
  <div>
    <Row style='margin-top: 20px;'>
      <Card shadow>
        <ve-bar
          width="auto"
          height="600px"
          :data="chartData"
          :settings="chartSettings"
          :extend="chartExtend"
        ></ve-bar>

      </Card>
    </Row>
  </div>
</template>

<script>
  import VeBar from 'v-charts/lib/bar.common'
  import InforCard from '_c/info-card'
  import CountTo from '_c/count-to'
  import { ChartBar, ChartPie } from '_c/charts'
  import { getMenuCount } from '@/api/behavior'

  export default {
    name: 'home',
    components: {
      InforCard,
      CountTo,
      ChartPie,
      ChartBar,
      VeBar
    },
    data () {
      return {
        chartSettings: {
          // min: [100, 300]
          // max: [100, 300]
          metrics: ['totalCount'],
          dataOrder: {
            label: 'totalCount',
            order: 'desc'
          },
          labelMap: {
            menuName: '菜单名称',
            totalCount: 'PV'
          }
        },
        chartData: {
          columns: ['menuName', 'totalCount', 'menuCode', 'menuUrl'],
          rows: []
        }
      }
    },

    mounted () {
      this.fetchData()
    },
    methods: {
      getViewData (skey, svalue, data = []) {
        let chartData = {
          columns: [skey, svalue],
          rows: []
        }
        let recordList = []
        for (let rawRecord of data) {
          let {menuName, totalCount} = rawRecord
          let record = {
            [skey]: menuName,
            [svalue]: totalCount
          }
          recordList.push(record)
        }
        chartData.rows = recordList
        return chartData
      },
      async fetchData () {
        const res = await getMenuCount()
        this.chartData = this.getViewData('menuName', 'totalCount', res.data)
        this.resize()
      }
    },
    computed: {
      chartExtend () {
        // 初始区域最多展示30条记录
        const MAX_DISPLAY_RECORD = 30
        let recordListLength = this.chartData.rows.length
        let showEndPercent = 0 // 从100 => 0
        if (recordListLength > 0 && recordListLength > MAX_DISPLAY_RECORD) {
          showEndPercent = 100 - (Math.floor(MAX_DISPLAY_RECORD / recordListLength * 100) % 100)
        }

        return {
          title: {
            show: true,
            text: '近一周菜单点击量'
          },

          dataZoom: {
            type: 'slider',
            show: true,
            yAxisIndex: [0],
            left: '0%',
            start: 100,
            end: showEndPercent,
            showDetail: false
          },

          yAxis: {
            axisLabel: {
              show: true,
              interval: 0
            }
          }
        }
      }
    }
  }
</script>

<style lang='less' scoped>
  .count-style {
    font-size: 50px
  }
</style>
