<template>
  <div>
    <Row>
      <Form :model="form" :label-width="80" style="display: flex;">
        <FormItem label="时间">
          <RadioGroup v-model="form.time" type="button">
            <Radio :label="today">今天</Radio>
            <Radio :label="yesterday">昨天</Radio>
            <Radio :label="sevenDays">最近七天</Radio>
            <Radio :label="thirtyDays">最近30天</Radio>
          </RadioGroup>
          <DatePicker
            v-model="form.dateRange"
            type="daterange"
            split-panels
            placeholder="Select date"
            style="width: 200px"/>
        </FormItem>
        <FormItem label="方式">
          <RadioGroup v-model="form.type" type="button">
            <Radio label="time">按时</Radio>
            <Radio label="day">按日</Radio>
            <Radio label="week" :disabled="disabledWeek">按周</Radio>
            <Radio label="month" :disabled="disabledMonth">按月</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Row>
    <Row style="margin-top: 20px;">
      <i-col span="24">
        <Card shadow>
          <div ref="dom" class="charts chart-bar" style="height: 500px;"></div>
        </Card>
      </i-col>
    </Row>
  </div>
</template>
<script>
  import echarts from 'echarts'
  import moment from 'moment'
  import { ChartBar } from '_c/charts'
  import CountTo from '_c/count-to'
  import InforCard from '_c/info-card'
  import { getOnlineTime } from '@/api/online'

  const DAY_MILL = 24 * 3600 * 1000

  export default {
    components: {
      ChartBar,
      CountTo,
      InforCard
    },
    data () {
      return {
        form: {
          time: `${moment().format('YYYY/MM/DD')}-${moment().format('YYYY/MM/DD')}`,
          type: 'time',
          dateRange: [new Date(), new Date()]
        },
        st: new Date(),
        et: new Date(),
        days: 1,
        disabledWeek: true,
        disabledMonth: true,

        today: `${moment().format('YYYY/MM/DD')}-${moment().format('YYYY/MM/DD')}`,
        yesterday: `${moment().subtract(1, 'days').format('YYYY/MM/DD')}-${moment().subtract(1, 'days').format('YYYY/MM/DD')}`,
        sevenDays: `${moment().subtract(7, 'days').format('YYYY/MM/DD')}-${moment().format('YYYY/MM/DD')}`,
        thirtyDays: `${moment().subtract(30, 'days').format('YYYY/MM/DD')}-${moment().format('YYYY/MM/DD')}`,

        xAxisData: [],

        asynEndVal: 487
      }
    },
    methods: {
      init () {
        setInterval(() => {
          this.asynEndVal += parseInt(Math.random() * 20)
          this.integratedEndVal += parseInt(Math.random() * 30)
        }, 2000)
      },
      getTime (mill) {
        const minute = Math.floor(mill / 60000)
        const seconds = Math.floor((mill - minute * 60000) / 1000)
        return `${minute}:${seconds}`
      },
      genTimeRange (type, st, et) {
        const arr = []
        if (type === 'time') {
          for (let i = 0; i < 23; i++) {
            arr.push(`0${i}:00~0${i + 1}:59`)
          }
          return arr
        }

        if (type === 'day') {
          for (let i = 0; i < this.days; i++) {
            arr.push(
              moment(et)
                .subtract(i, 'days')
                .format('YYYY/MM/DD')
            )
          }
          return arr.reverse()
        }
      }
    },
    watch: {
      'form.time' (newVal) {
        const arr = newVal.split('-')
        this.form.dateRange = [new Date(arr[0]), new Date(arr[1])]
      },
      'form.type' (type) {
        this.xAxisData = this.genTimeRange(type, this.st, this.et)
      },
      'form.dateRange' (newVal) {
        this.form.time = `${moment(newVal[0]).format('YYYY/MM/DD')}-${moment(newVal[1]).format('YYYY/MM/DD')}`
        this.st = newVal[0]
        this.et = newVal[1]

        const days = (new Date(newVal[1]).getTime() - new Date(newVal[0]).getTime()) / DAY_MILL
        this.days = days
        this.disabledWeek = days <= 7
        this.disabledMonth = days <= 30
      }
    },
    async mounted () {
      let xAxisData = []
      let seriesData = []

      const res = await getOnlineTime()
      res.data.forEach(({key, value}) => {
        // xAxisData.push(key)
        seriesData.push(value)
      })

      this.$nextTick(() => {
        let option = {
          title: {
            text: '在线时长统计',
            // subtext: '近一个月',
            x: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            data: xAxisData,
            axisLabel: {
              showMinLabel: true,
              interval: 2
            },
            min: 'dataMin'
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              showMinLabel: true
            },
            axisPointer: {
              borderColor: 'red',
              label: {
                formatter: (value, index) => {
                  return this.getTime(value)
                }
              }
            }
          },
          series: [
            {
              data: seriesData,
              type: 'line',
              smooth: false
            }
          ]
        }
        let dom = echarts.init(this.$refs.dom, 'tdTheme')
        dom.setOption(option)
      })
    }
  }
</script>

<style lang="less" scoped>
  .count-style {
    font-size: 50px;
  }
</style>
