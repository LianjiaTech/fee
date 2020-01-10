<template>
  <Card shadow>
    <time-bar @change="handleQuickDateChange" :disabledThirty="true"></time-bar>
    <Tabs value="error">
      <TabPane label="错误" name="error">
        <Card shadow>
          <StackArea :height="500" :data="lineData.dataList.error" :scale="lineData.scale.error" :isSpinShow="isLoading.stackArea.error"></StackArea>
        </Card>
      </TabPane>
      <TabPane label="性能" name="perf">
        <Card shadow>
          <StackArea :height="500" :data="lineData.dataList.perf" :scale="lineData.scale.perf" :isSpinShow="isLoading.stackArea.perf"></StackArea>
        </Card>
      </TabPane>
    </Tabs>
  </Card>
</template>
<script>
  import { getAlarmLog, getLineAlarmLog } from 'src/api/alarm'
  import moment from 'moment'
  import StackArea from 'src/components/viser-stack/viser-stack.vue'
  import TimeBar from 'src/components/time-bar'

  export default {
    name: 'alarm-log',
    data() {
      return {
        alarmLogList: [],
        openMessageIndexList: [],
        nowDate: new Date(),
        initTimeRange: [moment().format('HH:00'), '23:59'],
        timeRange: [moment().format('HH:00'), '23:59'],
        dateRange: [
          moment()
            .startOf('day')
            .unix(),
          moment()
            .endOf('day')
            .unix()
        ],
        selectDate: moment().format('YYYY-MM-DD'),
        showDetail: false,
        totalLogCount: 0,
        isShow: {
          timeLineNoData: false,
          stackAreaText: false
        },
        isLoading: {
          stackArea: {
            error: true,
            perf: true
          }
        },
        lineData: {
          dataList: {
            error: [],
            perf: []
          },
          scale: {
            error: [
              {
                dataKey: 'value',
                sync: true,
                alias: '次',
                formatter: (value) => value + ' 次'
              },
              {
                dataKey: 'index',
                tickCount: 15,
                alias: '日期'
              }
            ],
            perf: [
              {
                dataKey: 'value',
                sync: true,
                alias: '次',
                formatter: (value) => value + ' 次'
              },
              {
                dataKey: 'index',
                tickCount: 15,
                alias: '日期'
              }
            ]
          }
        }
      }
    },
    mounted() {
      this.getAlarmLog()
      this.getLineAlarmLog()
    },
    components: {
      StackArea,
      TimeBar
    },
    methods: {
      async getAlarmLog() {
        const startMoment = moment(this.selectDate + ' ' + this.timeRange[0])
        const endMoment = moment(moment(this.selectDate + ' ' + this.timeRange[1]).format('YYYY-MM-DD HH:mm:59'))
        const { data: dataList } = await getAlarmLog({
          st: startMoment.unix() * 1000,
          et: endMoment.unix() * 1000
        })
        for (let data of dataList) {
          data['send_at'] = moment.unix(data['send_at']).format('YYYY-MM-DD HH:mm:ss')
        }

        const len = dataList.length
        this.$set(this.isShow, 'timeLineNoData', len === 0)
        this.$set(this, 'alarmLogList', dataList)
        this.$set(this, 'totalLogCount', len)
        this.$nextTick(() => {
          this.openMessage()
        })
      },
      async getLineAlarmLog() {
        // 默认七天
        this.$set(this.isLoading.stackArea, 'error', true)
        const { data } = await getLineAlarmLog({
          st: this.dateRange[0],
          et: this.dateRange[1]
        })
        this.$set(this.lineData.dataList, 'error', data.error)
        this.$set(this.isLoading.stackArea, 'error', false)
        this.$set(this.lineData.dataList, 'perf', data.perf)
        this.$set(this.isLoading.stackArea, 'perf', false)
      },
      handelToggle(value) {
        this.showDetail = value
        this.openMessage()
      },
      openMessage() {
        if (this.showDetail) {
          this.openMessageIndexList = Object.keys(this.alarmLogList)
        } else {
          this.openMessageIndexList = []
        }
      },
      handleTimeChange(timeRange) {
        this.timeRange = timeRange
        this.getAlarmLog()
      },
      handleDateChange(date) {
        this.selectDate = date
        this.getAlarmLog()
      },
      handleQuickDateChange(timeRange) {
        this.dateRange[0] = moment(timeRange.dateRange[0]).unix()
        this.dateRange[1] = moment(timeRange.dateRange[1]).unix()
        this.getLineAlarmLog()
      },
      isDateDisabled(testDate) {
        let testAt = moment(testDate)
          .startOf('day')
          .unix()
        let nowAt = moment()
          .startOf('day')
          .unix()
        // 只能查看最近7天的数据
        let isSelectable = nowAt - 86400 * 14 <= testAt && testAt <= nowAt
        return isSelectable === false
      }
    }
  }
</script>
