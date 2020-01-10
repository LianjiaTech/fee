<template>
  <div class="component-container">
    <!-- 利用data属性, 每次选择完日期后强制更新startAt/endAt -->
    <div class="date-time-range-select" :data-select-date-str="selectDateRangeStr">
      <el-date-picker
        v-model="status.dateTimeRange"
        :time-arrow-control="true"
        type="datetimerange"
        :picker-options="constant.pickerOption"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        align="right"
      ></el-date-picker>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  import DATE_FORMAT from 'src/constants/date_format'

  /**
   * 日期选择器, 默认值为传入的
   * 传入startAt和endAt(unix时间戳)
   */
  export default {
    props: {
      startAt: Number,
      endAt: Number,
      pickerOptions: {
        type: Object,
        default: () => ({})
      }
    },
    data: function() {
      let nowAtMoment = moment().startOf(DATE_FORMAT.UNIT.MINUTE)
      let nowAt = nowAtMoment
        .clone()
        .endOf(DATE_FORMAT.UNIT.MINUTE)
        .unix()
      return {
        constant: {
          nowAt: nowAt,
          pickerOption: {
            shortcuts: [
              {
                text: '最近30分钟',
                onClick(picker) {
                  const end = nowAtMoment.clone().toDate()
                  const start = nowAtMoment
                    .clone()
                    .subtract(30, DATE_FORMAT.UNIT.MINUTE)
                    .startOf(DATE_FORMAT.UNIT.MINUTE)
                    .toDate()
                  picker.$emit('pick', [start, end])
                }
              },
              {
                text: '最近1小时',
                onClick(picker) {
                  const end = nowAtMoment.clone().toDate()
                  const start = nowAtMoment
                    .clone()
                    .subtract(1, DATE_FORMAT.UNIT.HOUR)
                    .startOf(DATE_FORMAT.UNIT.MINUTE)
                    .toDate()
                  picker.$emit('pick', [start, end])
                }
              },
              {
                text: '最近6小时',
                onClick(picker) {
                  const end = nowAtMoment.clone().toDate()
                  const start = nowAtMoment
                    .clone()
                    .subtract(6, DATE_FORMAT.UNIT.HOUR)
                    .startOf(DATE_FORMAT.UNIT.MINUTE)
                    .toDate()
                  picker.$emit('pick', [start, end])
                }
              },
              {
                text: '最近1天',
                onClick(picker) {
                  const end = nowAtMoment.clone().toDate()
                  const start = nowAtMoment
                    .clone()
                    .subtract(1, DATE_FORMAT.UNIT.DAY)
                    .startOf(DATE_FORMAT.UNIT.DAY)
                    .toDate()
                  picker.$emit('pick', [start, end])
                }
              },
              {
                text: '最近3天',
                onClick(picker) {
                  const end = nowAtMoment.clone().toDate()
                  const start = nowAtMoment
                    .clone()
                    .subtract(3, DATE_FORMAT.UNIT.DAY)
                    .startOf(DATE_FORMAT.UNIT.DAY)
                    .toDate()
                  picker.$emit('pick', [start, end])
                }
              },
              {
                text: '最近一周',
                onClick(picker) {
                  const end = nowAtMoment.clone().toDate()
                  const start = nowAtMoment
                    .clone()
                    .subtract(7, DATE_FORMAT.UNIT.DAY)
                    .startOf(DATE_FORMAT.UNIT.DAY)
                    .toDate()
                  picker.$emit('pick', [start, end])
                }
              },
              {
                text: '最近一个月',
                onClick(picker) {
                  const end = nowAtMoment.clone().toDate()
                  const start = nowAtMoment
                    .clone()
                    .subtract(1, DATE_FORMAT.UNIT.MONTH)
                    .startOf(DATE_FORMAT.UNIT.DAY)
                    .toDate()
                  picker.$emit('pick', [start, end])
                }
              }
            ],
            ...this.pickerOptions
          }
        },
        status: {
          dateTimeRange: [
            // 默认是一天
            moment.unix(this.startAt).toDate(),
            moment.unix(this.endAt).toDate()
          ]
        }
      }
    },
    computed: {
      selectDateRangeStr: function() {
        let startAt = moment(this.status.dateTimeRange[0]).unix()
        let endAt = moment(this.status.dateTimeRange[1]).unix()
        // 更新所选时间
        this.$emit('update:startAt', startAt)
        this.$emit('update:endAt', endAt)

        let startAtStr = moment.unix(this.startAt).format(DATE_FORMAT.DISPLAY_BY_SECOND)
        let endAtStr = moment.unix(this.startAt).format(DATE_FORMAT.DISPLAY_BY_SECOND)
        return `${startAtStr}~${endAtStr}`
      }
    }
  }
</script>

<style lang="less" scoped>
  .component-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
</style>
