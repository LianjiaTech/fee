<template>
  <Tabs>
    <TabPane label="堆叠图" icon="md-pulse">
      
      <Card shadow>
        <RadioGroup v-model="filter" type="button" @on-change="handleFilterChange" size="large">
          <Radio label="hour">小时</Radio>
          <Radio label="minute" :disabled="minuteDisable">
            分钟
            <Tooltip placement="right">
              <i class="el-icon-question"></i>
              <div slot="content">
                <p>提示：</p>
                <p><b>考虑查询性能以及接口性能问题</b></p>
                <p><b>仅支持单个错误类型按分钟查看</b></p>
              </div>
            </Tooltip>
          </Radio>
        </RadioGroup>
        <ve-line ref="error-chart" height="430px" :data-empty="!(lineData.rows && lineData.rows.length) && !isSpinShowStack" :data="lineData" :extend="chartExtend" :loading="isSpinShowStack"></ve-line>
      </Card>
    </TabPane>
    <TabPane label="扇形图" icon="md-pie">
      <Card shadow>
        <ve-pie :data-empty="!(pieData.rows && pieData.rows.length) && !isSpinShowPie" height="450px" :data="pieData" :loading="isSpinShowPie" :legend-visible="false"></ve-pie>
      </Card>
    </TabPane>
    <TabPane label="地图" icon="md-map">
      <Col span="16">
        <Card shadow>
          <ve-map height="450px" :data="geographyChartDistributionRecord" />
        </Card>
      </Col>
      <Col span="8">
        <Card shadow>
          <p slot="title">排名</p>
          <Table
            size="small"
            :columns="Mapcolumns"
            :data="mapTableData"
            :loading="tableLoading"
            :height="450"
          />
        </Card>
      </Col>
    </TabPane>
    
  </Tabs>
</template>
<script>
  import echart from 'echarts'
  import Loading from 'src/components/loading/loading.vue'
  import VeMap from 'v-charts/lib/map.common'
  import VePie from 'v-charts/lib/pie.common'
  import 'v-charts/lib/style.css'
  
  export default {
    name: 'TheBodyChart',
    components: {
      Loading,
      VeMap,
      VePie
    },
    props: {
      selectedErrorNameNum: {
        type: Number,
        default: 0
      },
      stackAreaRecordList: {
        type: Array,
        default: []
      },
      isSpinShowStack: {
        type: Boolean,
        default: false
      },
      pieChartDistribution: {
        type: Array,
        default: []
      },
      isSpinShowPie: {
        type: Boolean,
        default: false
      },
      isSpinShowMap: {
        type: Boolean,
        default: false
      },
      geographyChartDistributionRecord: {
        type: Object,
        default: {}
      },
      Mapcolumns: {
        type: Array,
        default: []
      },
      mapTableData: {
        type: Array,
        default: []
      },
      tableLoading: {
        type: Boolean,
        default: false
      }
    },
    watch: {
      stackAreaRecordList () {
        this.draw()

      },
    },
    data () {
      return {
        filter: 'hour',
        pieData: {},
        lineData: {}
      }
    },
    computed: {
      minuteDisable () {
        if(this.selectedErrorNameNum > 1) this.filter = 'hour'
        return this.selectedErrorNameNum > 1
      },
      chartExtend () {
        return {
          tooltip: {
            triggerOn: 'click',
            enterable: true,
            transitionDuration: 1,
            confine: true,
            formatter: (params) => {
              let spans = ''
              let axisValueLabel = ''
              params.sort((a, b) => b.value - a.value)
              if (typeof params.forEach === 'function') {
                params.forEach(item => {
                  axisValueLabel = item.axisValueLabel || item.axisValue
                  spans += `<div style="margin:2px 0 0 2px;width:250px;">
                      <span style="vertical-align:middle;display:inline-block;width:14px;height:14px;border-radius:50%;background-color:${item.color}"></span>
                      <span style="font: 14px/21px sans-serif;width:150px;vertical-align:top;color:white;display:inline-block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${item.seriesName}</span>
                      <span style="font: 14px/21px sans-serif;display:inline-block;vertical-align:top;color:white">:${item.value[1]}</span>
                    </div>`
                })
              }
              return `
                <div style="max-height:140px;overflow-y:auto">
                  <div>${axisValueLabel}</div>
                  ${spans}
                </div>
              `
            }
          },
          legend: {
            type: 'scroll',
            padding: [5, 10],
            top: 10,
            formatter: function (name) {
              return name.slice(0, 10) + '...'
            },
            tooltip: {
              show: true,
              triggerOn: 'mousemove'
            }
          },
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: this.filter === 'hour' ? 100 : 10
            }, {
              start: 0,
              end: this.filter === 'hour' ? 100 : 10,
              realtime: false,
              handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
              handleSize: '70%',
              handleStyle: {
                color: '#fff',
                shadowBlur: 3,
                shadowColor: 'rgba(0, 0, 0, 0.6)',
                shadowOffsetX: 2,
                shadowOffsetY: 2
              }
            }
          ]
        }
      }
    },
    mounted () {
      this.draw()
      this.$nextTick(()=> {
        this.$refs['error-chart'].echarts.resize()
      })
    },
    methods: {
      handleFilterChange (filter) {
        this.filter = filter
        this.$emit('listenHandleFilterChange', filter)
      },
      draw () {
        this.drawStackArea()
        this.drawPie()
      },
      drawStackArea () {
        let keys = new Set()
        let result = new Map()
        let rows = []
        for(let record of this.stackAreaRecordList ){
          let { index_display: display, name, value } = record
          keys.add(name)
          if(result.has(display)){
            let item = result.get(display)
            item[name] = value
            continue
          }
          result.set(display, {[name]: value })
        }
        for (let [key, value] of result.entries()) {
          rows.push({
            display: key,
            ...value
          })
        }
        this.lineData = {
          columns: ['display', ...keys],
          rows
        }
      },
      drawPie () {
        let seriesData = this.pieChartDistribution
        this.pieData = {
          columns: ['name', 'value'],
          rows: seriesData
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  .data-empty-wrap{
    display: flex;
    align-items: center;
    height: 450px;
  }
</style>
