<template>
  <div class="container">
    <Row :gutter="20">
      <Col span="8">
        选择开始月份：
        <DatePicker :value="startMonth" type="month" placeholder="选择开始月份" @on-change="handleStartDateChange" :options="{ disabledDate: isDateDisabled }" style="width: 200px"></DatePicker>
      </Col>
      <Col span="8">
        选择结束月份：
        <DatePicker :value="endMonth" type="month" placeholder="选择结束月份" @on-change="handleEndDateChange" :options="{ disabledDate: isDateDisabled }" style="width: 200px"></DatePicker>
      </Col>
    </Row>
    <br />
    <br />
    <v-chart :force-fit="true" :height="height" :data="chartData" :scale="scale">
      <v-tooltip />
      <v-point position="day*value" shape="circle" />
      <v-smooth-line position="day*value" color="type" :size="2" />
      <v-legend />
      <v-axis data-key="day" :label="axisLabel" />
    </v-chart>
  </div>
</template>

<script>
  import moment from 'moment'
  import RatioApi from 'src/api/ratio'
  import DatetimeRangePicker from 'src/components/datetime-range-picker.vue'

  const scale = [
    {
      dataKey: 'value',
      alias: '错误数量排名'
    },
    {
      dataKey: 'day',
      alias: '当月日期'
    }
  ]
  const minDate = moment('2019-01-01').unix()
  const formatter = (val) => `${val}日`
  export default {
    components: {
      DatetimeRangePicker
    },
    data() {
      return {
        axisLabel: {
          formatter
        },
        scale,
        startMonth: moment.unix(minDate).format('YYYY-MM'),
        endMonth: moment().format('YYYY-MM'),
        height: 500,
        chartData: []
      }
    },
    methods: {
      isDateDisabled(testDate) {
        const nowTime = moment().unix()
        const testTime = moment(testDate).unix()
        return testTime > nowTime || testTime < minDate
      },
      checkDate() {
        const startAt = moment(this.startMonth).unix()
        const endAt = moment(this.endMonth).unix()
        if (startAt > endAt) {
          const month = this.startMonth
          this.startMonth = this.endMonth
          this.endMonth = month
        }
      },
      handleStartDateChange(val) {
        this.startMonth = val
        return this.loadData()
      },
      handleEndDateChange(val) {
        this.endMonth = val
        return this.loadData()
      },
      async loadData() {
        this.checkDate()
        const { startMonth, endMonth } = this
        const result = await RatioApi.getDataErrorNum(startMonth, endMonth, 'error_rank')
        const { data } = result
        this.chartData = data
      }
    },
    mounted() {
      this.loadData()
    }
  }
</script>

<style lang="less" scoped>
  .header {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  .url-list {
    .url-detail {
      overflow: hidden;
      word-break: normal;
    }
  }

  .el-tab-pane {
    transition: display 1s;
  }
</style>
