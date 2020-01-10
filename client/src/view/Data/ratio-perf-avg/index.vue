<template>
  <div class="pg-perf-radio-avg">
    <Spin size="large" fix v-if="loading">
      <Icon type="ios-loading" size=18 class="demo-spin-icon-load"></Icon>
      <div>{{loadingTxt}}</div>
    </Spin>
    <Row>
      <Col span="6">
        选择时间范围：
        <DatePicker
          transfer
          :value="timeRange"
          type="daterange"
          placeholder="选择开始时间"
          @on-change="handleTimeChange"
          :options="{disabledDate:isDateDisabled}"
          style="width: 200px"></DatePicker>
      </Col>
      <Col span="6">
        选择页面地址：
        <Select
          style="width: 200px"
          transfer
          v-model="currentUrl"
          filterable
          transfer-class-name="url-transfer-wrap"
          @on-change="(val)=> handleSelectChange(val, 'currentUrl')">
            <Option v-for="(url, index) in allUrlList" :value="url" :key="index">{{url}}</Option>
        </Select>
      </Col>
      <Col span="12">
        选择性能指标：
        <Select
          style="width: 350px"
          transfer
          multiple
          :max-tag-count="2"
          v-model="indicator"
          @on-change="(val)=> handleSelectChange(val, 'indicator')">
            <OptionGroup label="关键性能指标">
              <Option v-for="item in KEY_INDICATOR_TYPE_LIST" :value="item.value" :key="item.value">{{ item.name }}</Option>
            </OptionGroup>
            <OptionGroup label="区间段耗时">
              <Option v-for="item in RANGE_INDICATOR_TYPE_LIST" :value="item.value" :key="item.value">{{ item.name }}</Option>
            </OptionGroup>
        </Select>
      </Col>
    </Row>
    <br/>
    <br/>
    <Divider dashed>性能数据环比</Divider>
    <div>
      <div v-show="chartData && chartData.length" ref="line-chart" style="height:450px;width:85%;"></div>
      <div v-show="!(chartData && chartData.length)" style="padding:100px 0;text-align:center;">
        暂无数据
      </div>
    </div>
  </div>
</template>

<script>
  import echart from 'echarts'
  import moment from 'moment'
  import RatioApi from 'src/api/ratio'
  import PerformanceApi from 'src/api/performance'
  import DATE_FORMAT from 'src/constants/date_format'
  import DatetimeRangePicker from 'src/components/datetime-range-picker.vue'
  import { RANGE_INDICATOR_TYPE_LIST, KEY_INDICATOR_TYPE_LIST, chartSet } from './conf'

  export default {
    components: {
      DatetimeRangePicker
    },
    data () {
      return {
        loading: true,
        loadingTxt: '',
        lineChart: null,
        indicator: ['first_render_ms','first_response_ms','load_complete_ms'],
        allUrlList: [],
        currentUrl: '',
        RANGE_INDICATOR_TYPE_LIST,
        KEY_INDICATOR_TYPE_LIST,
        timeRange: [
          moment().subtract(7, 'day').startOf('day').toDate(),
          moment().toDate()
        ],
        height: 500,
        chartData: []
      }
    },
    methods: {
      isDateDisabled (testDate) {
        const nowTime = moment().unix()
        const testTime = moment(testDate).unix()
        return testTime > nowTime 
      },
      async handleTimeChange (selectDateRange) {
        // 如果endTime比startTime大31天以上，缩减到31天
        this.loading = true
        let [startTime, endTime] = selectDateRange
        if (moment(endTime).unix() - moment(startTime).unix() > 31 * 24 * 60 * 60) {
          endTime = moment(startTime).add(31, DATE_FORMAT.UNIT.DAY).format('YYYY-MM-DD')
        }
        startTime = moment(startTime).format('YYYY-MM-DD 00:00:00')
        endTime = moment(endTime).format('YYYY-MM-DD 23:59:59')
        this.timeRange = [startTime, endTime]
        await this.fetchAllUrl(this.timeRange)
        await this.loadData()
        this.loading = false
      },
      async loadData () {
        const [startTime, endTime] = this.timeRange
        if(!this.currentUrl) return
        this.loadingTxt = '数据处理中，页面马上呈现...'
        const result = await RatioApi.getPerfAvgData(moment(startTime).unix(), moment(endTime).unix(), this.currentUrl, this.indicator)
        const { data } = result
        this.chartData = data
        this.draw()
      },
      async fetchAllUrl(timeRange) {
        this.loadingTxt = '正在聚合页面URL数据，请耐心等候...'
        let [startTime, endTime] = timeRange
        let startAt = moment(startTime).unix()
        let endAt = moment(endTime).unix()
        let result = await PerformanceApi.fetchUrlList(startAt, endAt, 1000)
        let { pageTypeList } = _.get(result, ['data'], {})
        let pageType = pageTypeList = pageTypeList.filter(item => item !== '')
        this.allUrlList = pageType
        this.currentUrl = _.get(pageType, [0], '')
      },
      async handleSelectChange(val, key) {
        if(!val) return
        await this.loadData()
      },
      draw() {
        this.loading = false
        let data = this.chartData
        let stackAreaOption = chartSet(this, data)
        this.lineChart && this.lineChart.setOption(stackAreaOption, true)
        this.resize()
      },
      resize(){
          this.$nextTick(()=> {
          this.lineChart.resize()
        }) 
      }
    },
    async mounted () {
      this.lineChart = echart.init(this.$refs['line-chart']) 
      await this.fetchAllUrl(this.timeRange)
      await this.loadData()
      this.loading = false
      window.addEventListener('resize', this.resize)
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.resize)
    }
  }
</script>

<style lang="less">
  .pg-perf-radio-avg{
    position: relative;
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
    .demo-spin-icon-load{
        animation: ani-demo-spin 1s linear infinite;
    }
    @keyframes ani-demo-spin {
        from { transform: rotate(0deg);}
        50%  { transform: rotate(180deg);}
        to   { transform: rotate(360deg);}
    }
    .demo-spin-col{
      height: 100px;
      position: relative;
      border: 1px solid #eee;
    }
  }
  .url-transfer-wrap{
    max-width: 300px;
  }
</style>