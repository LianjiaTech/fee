<template>
  <div>
    <Row>
      <Form :label-width="80"
            style="display:flex;">
        <FormItem>
          <slot name="left"></slot>
        </FormItem>
        <FormItem label="时间"
                  v-if="displayTimeItem">
          <RadioGroup v-model="timeRange"
                      @on-change="radioChange"
                      type="button">
            <Radio :label="today"
                   :disabled="disabledToday">今天</Radio>
            <Radio :label="yesterday"
                   :disabled="disabledYesterday">昨天</Radio>
            <Radio :label="sevenDays"
                   :disabled="disabledSeven">最近七天</Radio>
            <Radio :label="thirtyDays"
                   :disabled="disabledThirty">最近30天</Radio>
          </RadioGroup>
          <DatePicker :disabled="disabledDatePicker"
                      v-model="dateRange"
                      @on-change="dateChange"
                      :options="options3"
                      :clearable="false"
                      :type="datePickerType"
                      split-panels
                      placeholder="Select date"
                      :format="dateFormat"
                      style="width: 200px" />
        </FormItem>
        <FormItem label="方式"
                  v-if="displayTypeItem">
          <RadioGroup v-model="filterBy"
                      @on-change="filterChange"
                      type="button">
            <Radio label="minute"
                   :disabled="disabledMinute">按分</Radio>
            <Radio label="hour"
                   :disabled="disabledHour">按时</Radio>
            <Radio label="day"
                   :disabled="disabledDay">按日</Radio>
            <Radio label="week"
                   :disabled="disabledWeek">按周</Radio>
            <Radio label="month"
                   :disabled="disabledMonth">按月</Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </Row>
  </div>
</template>

<script>
import moment from 'moment'

const DAY_MILL = 24 * 3600 * 1000
const DATE_FORMAT_BY_DAY = 'YYYY/MM/DD'

export default {
  name: 'time-bar',
  props: {
    disabledSeven: {
      type: Boolean,
      default: false
    },
    disabledThirty: {
      type: Boolean,
      default: false
    },
    disabledDatePicker: {
      type: Boolean,
      default: false
    },
    disabledMinute: {
      type: Boolean,
      default: false
    },
    disabledHour: {
      type: Boolean,
      default: false
    },
    datePickerType: {
      type: String,
      default: 'daterange'
    },
    dateFormat: {
      type: String,
      default: 'yyyy/MM/dd'
    },
    disabledYesterday: {
      type: Boolean,
      default: false
    },
    // disabledToday: {
    //   type: Boolean,
    //   default: false
    // },
    displayTimeItem: {
      type: Boolean,
      default: true
    },
    displayTypeItem: {
      type: Boolean,
      default: false
    }
  },
  components: {},
  data () {
    const today = moment().format(DATE_FORMAT_BY_DAY)
    const yesterday = moment().subtract(1, 'days').format(DATE_FORMAT_BY_DAY)
    const sevenDays = moment().subtract(7, 'days').format(DATE_FORMAT_BY_DAY)
    const thirtyDays = moment().subtract(30, 'days').format(DATE_FORMAT_BY_DAY)
    return {
      today: `${today}-${today}`,
      yesterday: `${yesterday}-${yesterday}`,
      sevenDays: `${sevenDays}-${today}`,
      thirtyDays: `${thirtyDays}-${today}`,

      timeRange: `${today}-${today}`,
      dateRange: [moment(`${today} 00:00:00`, `${DATE_FORMAT_BY_DAY} HH:mm:ss`).toDate(), moment(`${today} 23:59:59`, `${DATE_FORMAT_BY_DAY} HH:mm:ss`).toDate()],
      filterBy: 'hour',

      disabledDay: true,
      disabledWeek: true,
      disabledMonth: true,
      disabledToday: false,
      options3: {
        disabledDate (date) {
          let initdate = Date.now() - 7 * 24 * 60 * 60 * 1000
          return (date && date.valueOf() < initdate) || (date && date.valueOf() > Date.now())
        }
      }
    }
  },
  computed: {},
  watch: {},
  methods: {
    radioChange (newVal) {
      const [st, et] = newVal.split('-')
      this.dateRange = [moment(`${st} 00:00:00`, `${DATE_FORMAT_BY_DAY} HH:mm:ss`).toDate(), moment(`${et} 23:59:59`, `${DATE_FORMAT_BY_DAY} HH:mm:ss`).toDate()]
      this.changeCallback(st, et)
    },
    filterChange () {
      const [st, et] = this.timeRange
      const days = (new Date(et).getTime() - new Date(st).getTime()) / DAY_MILL
      this.$emit('change', {
        dateRange: this.dateRange,
        filterBy: this.filterBy,
        days
      })
    },
    dateChange (args, [st, et]) {
      const [startAt, endAt] = args
      const days = (new Date(endAt).getTime() - new Date(startAt).getTime()) / DAY_MILL
      this.disabledDay = days <= 0
      this.disabledWeek = days <= 7
      this.disabledMonth = days <= 30
      if (startAt === endAt) {
        this.dateRange = [moment(`${endAt} 00:00:00`, `${DATE_FORMAT_BY_DAY} HH:mm:ss`).toDate(), moment(`${startAt} 23:59:59`, `${DATE_FORMAT_BY_DAY} HH:mm:ss`).toDate()]
      }
      this.timeRange = `${st}-${et}`
      this.$emit('change', {
        dateRange: this.dateRange,
        filterBy: this.filterBy,
        days
      })
    },
    changeCallback (st, et) {
      const days = (new Date(et).getTime() - new Date(st).getTime()) / DAY_MILL
      this.disabledDay = days <= 0
      this.disabledWeek = days <= 7
      this.disabledMonth = days <= 30
      this.$emit('change', {
        dateRange: this.dateRange,
        filterBy: this.filterBy,
        days
      })
    }
  },

  mounted () { }
}
</script>

<style>
</style>
