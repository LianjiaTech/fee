<template>
  <Card shadow>
    <!-- <quick-timebar slot="extra"
                   @dateChange="handleQuickDateChange"
                   :isDateDisabled="isDateDisabled" /> -->
    <time-bar @change="handleQuickDateChange" :disabledThirty="true"></time-bar>
    <Tabs value="line">
      <TabPane label="报警历史视图"
               name="line">
        <Card shadow>
          <StackArea :height="500"
                     :data="lineData.dataList"
                     :scale="lineData.scale"
                     :isSpinShow="isLoading.stackArea"></StackArea>
        </Card>
      </TabPane>
      <!-- <TabPane label="报警时间轴" name="timeline">
            <Card>
                <p slot="title">报警时间轴</p>
                <Card>
                  选择日期:
                  <DatePicker
                    v-model="nowDate"
                    type="date"
                    placeholder="Select date"
                    style="width: 200px"
                    @on-change="handleDateChange"
                  ></DatePicker>&nbsp;&nbsp;
                  选择时间:
                  <TimePicker
                    format="HH:mm"
                    placeholder="Select time"
                    style="width: 112px"
                    @on-change="handleTimeChange"
                    type="timerange"
                    v-model="initTimeRange"
                  ></TimePicker>&nbsp;&nbsp;
                  打开详细信息:
                  <i-Switch @on-change="handelToggle"/>&nbsp;&nbsp;&nbsp;&nbsp;
                  <span>报警总数:&nbsp;<span style="color:red">{{totalLogCount}}</span></span>
                </Card>
            </Card>
            <Card>
                <p style="width:100%;text-align:center" v-if="isShow.timeLineNoData">暂无数据</p>
                <Timeline>
                    <TimelineItem v-for="(alarmLog, index) in alarmLogList" :key="alarmLog.id">
                        <p class="time">{{alarmLog.send_at}}</p>
                        <p>
                          <span style="color:green">错误名字:</span>
                          {{alarmLog.error_name}}
                        </p>
                        <Collapse simple v-model="openMessageIndexList">
                          <Panel :name="index.toString()">详细信息
                            <p slot="content">{{alarmLog.message}}</p>
                          </Panel>
                        </Collapse>
                    </TimelineItem>
                </Timeline>
            </Card>
        </TabPane> -->
    </Tabs>
  </Card>
</template>
<script>
import { getAlarmLog, getLineAlarmLog } from '@/api/alarm'
import moment from 'moment'
import StackArea from '@/view/components/viser-stack/viser-stack.vue'
import TimeBar from '@/view/components/time-bar'

export default {
  name: 'alarm-log',
  data () {
    return {
      alarmLogList: [],
      openMessageIndexList: [],
      nowDate: new Date(),
      initTimeRange: [moment().format('HH:00'), '23:59'],
      timeRange: [moment().format('HH:00'), '23:59'],
      dateRange: [moment().startOf('day').unix(), moment().unix()],
      selectDate: moment().format('YYYY-MM-DD'),
      showDetail: false,
      totalLogCount: 0,
      isShow: {
        timeLineNoData: false,
        stackAreaText: false
      },
      isLoading: {
        stackArea: true
      },
      lineData: {
        dataList: [],
        scale: [
          {
            dataKey: 'value',
            sync: true,
            alias: '次',
            formatter: value => value + ' 次'
          },
          {
            dataKey: 'index',
            tickCount: 15,
            alias: '日期'
          }
        ]
      }
    }
  },
  mounted () {
    this.getAlarmLog()
    this.getLineAlarmLog()
  },
  components: {
    StackArea,
    TimeBar
  },
  methods: {
    async getAlarmLog () {
      const startMoment = moment(this.selectDate + ' ' + this.timeRange[0])
      const endMoment = moment(
        moment(this.selectDate + ' ' + this.timeRange[1]).format(
          'YYYY-MM-DD HH:mm:59'
        )
      )
      const { data: dataList } = await getAlarmLog({
        st: startMoment.unix() * 1000,
        et: endMoment.unix() * 1000
      })
      for (let data of dataList) {
        data['send_at'] = moment
          .unix(data['send_at'])
          .format('YYYY-MM-DD HH:mm:ss')
      }

      const len = dataList.length
      this.$set(this.isShow, 'timeLineNoData', len === 0)
      this.$set(this, 'alarmLogList', dataList)
      this.$set(this, 'totalLogCount', len)
      this.$nextTick(() => {
        this.openMessage()
      })
    },
    async getLineAlarmLog () {
      // 默认七天
      this.$set(this.isLoading, 'stackArea', true)
      const { data: dataList } = await getLineAlarmLog({
        st: this.dateRange[0],
        et: this.dateRange[1]
      })
      this.$set(this.lineData, 'dataList', dataList)
      this.$set(this.isLoading, 'stackArea', false)
    },
    handelToggle (value) {
      this.showDetail = value
      this.openMessage()
    },
    openMessage () {
      if (this.showDetail) {
        this.openMessageIndexList = Object.keys(this.alarmLogList)
      } else {
        this.openMessageIndexList = []
      }
    },
    handleTimeChange (timeRange) {
      this.timeRange = timeRange
      this.getAlarmLog()
    },
    handleDateChange (date) {
      this.selectDate = date
      this.getAlarmLog()
    },
    handleQuickDateChange (timeRange) {
      this.dateRange[0] = moment(timeRange.dateRange[0]).unix()
      this.dateRange[1] = moment(timeRange.dateRange[1]).unix()
      this.getLineAlarmLog()
    },
    isDateDisabled (testDate) {
      let testAt = moment(testDate).startOf('day').unix()
      let nowAt = moment().startOf('day').unix()
      // 只能查看最近7天的数据
      let isSelectable = (nowAt - 86400 * 14) <= testAt && testAt <= nowAt
      return isSelectable === false
    }
  }
}
</script>

