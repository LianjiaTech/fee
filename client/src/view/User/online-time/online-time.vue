<template>
  <Row>
    <i-col span="24">
      <Card shadow>
        <time-bar @change="timeChange" :disabledMinute="true" :displayTypeItem="true"></time-bar>
        <div ref="pic" class="pic"></div>
      </Card>
    </i-col>
  </Row>
</template>

<script>
  import moment from 'moment'
  import BehaviorApi from 'src/api/behavior'
  import TimeBar from 'src/components/time-bar'
  import echart from 'echarts'

  const option = {
    title: {
      text: '在线时长'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value',
      axisLabel: {}
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
        smooth: true,
        lineStyle: {
          color: '#62d1b0'
        }
      }
    ]
  }

  export default {
    components: {
      TimeBar
    },
    data() {
      return {
        database: {
          axis: [],
          title: '',
          list: []
        },
        condition: {
          dateRange: [
            moment()
              .startOf('day')
              .toDate(),
            moment().toDate()
          ],
          filterBy: 'hour'
        }
      }
    },
    methods: {
      itemFormatter(e) {
        let attrs = e.tooltip._attrs
        if (e.items) {
          const items = e.items[0]
          let val = items.value
          attrs.itemTpl = `<ul class="g2-tooltip-list-item"> <li data-v-gtlv >时长：${this.MillisecondToDate(val)}</li> </ul>`
        }
      },
      getViewData(skey, svalue, data = []) {
        var ret = {
          columns: [skey, svalue],
          rows: []
        }
        data.forEach(({ key, value }) => {
          ret.rows.push({
            [skey]: key,
            [svalue]: value
          })
        })
        return ret
      },

      async timeChange(obj) {
        const { dateRange, filterBy } = obj
        this.condition.dateRange = dateRange
        this.condition.filterBy = filterBy
        this.getLineData()
      },
      MillisecondToDate(msd) {
        var time = parseFloat(msd) / 1000
        if (time != null && time !== '') {
          if (time > 60 && time < 60 * 60) {
            time = parseInt(time / 60.0) + '分钟' + parseInt((parseFloat(time / 60.0) - parseInt(time / 60.0)) * 60) + '秒'
          } else if (time >= 60 * 60 && time < 60 * 60 * 24) {
            time =
              parseInt(time / 3600.0) +
              '小时' +
              parseInt((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60) +
              '分钟' +
              parseInt((parseFloat((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60) - parseInt((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60)) * 60) +
              '秒'
          } else {
            time = parseInt(time) + '秒'
          }
        }
        return time
      },
      async getLineData() {
        this.pic.showLoading()
        const res = await BehaviorApi.getOnlineTime(this.condition.filterBy, +moment(this.condition.dateRange[0]), +moment(this.condition.dateRange[1]))
        const { axis, list } = res.data
        this.database.axis = axis
        this.database.list = list
        this.pic.hideLoading()
        this.draw()
      },
      draw() {
        option.xAxis.data = this.database.axis
        option.series[0].data = this.database.list
        option.yAxis.axisLabel.formatter = (value, index) => {
          return this.MillisecondToDate(value)
        }
        option.tooltip.formatter = (params) => {
          return `
        <div>
          <p>${params[0].name}</p>
          <p>${this.MillisecondToDate(params[0].value)}</p>
        </div>
        `
        }
        option.tooltip.axisPointer.label.formatter = (params) => {
          let val = params.value
          if (typeof val === 'number') {
            return this.MillisecondToDate(val)
          } else {
            return val
          }
        }
        this.pic.setOption(option)
        this.pic.resize()
      }
    },
    async mounted() {
      let pic = echart.init(this.$refs.pic)
      this.pic = pic
      this.getLineData()
    }
  }
</script>

<style lang="less">
  .g2-tooltip-list-item {
    margin-top: 12px;
    list-style: none;
  }

  .g2-tooltip-list li[data-v-gtlv] {
    padding: 5px 8px;
    font-size: 12px;
  }
</style>
<style scoped>
  .pic {
    height: 600px;
  }
</style>
