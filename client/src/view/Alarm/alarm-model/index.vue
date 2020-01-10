<template>
  <div class="container-d85ac9">
    <div class="control-panel-header">
      <div class="date-selector">
        <Card shadow style="width:100%">
          <Row>
            <Col span="5">
              <div style="display:inline-block;">
                <DatePicker
                  type="date"
                  size="large"
                  placement="bottom-start"
                  format="yyyy-MM-dd"
                  placeholder="请选择"
                  @on-change="handleDateChange"
                  :value="status.selectDate[1]"
                  :options="{disabledDate:isDateDisabled}"
                />
              </div>
            </Col>
            <Col span="5">
              <Select size="large" style="width:200px" v-model="status.selectedErrorName" @on-change="()=> updateRecord(true)">
                <Option :key="item.error_name" v-for="item in database.errorDistributionList" :value="item.error_name">({{ item.error_count }}）{{ item.error_name.slice(0, 30) }}</Option>
              </Select>
            </Col>
            <Col span="5">
              <RadioGroup v-model="filter" type="button" @on-change="handleFilterChange" size="large">
                <Radio label="hour">小时</Radio>
                <Radio label="minute">分钟</Radio>
              </RadioGroup>
            </Col>
          </Row>
        </Card>
      </div>
    </div>

    <div class="control-panel-body">
      <Row>
        <Col span="24">
        <Card shadow>
          <p slot="title">
            <Icon type="md-analytics"/>
            单次指数平滑模型
          </p>
          <the-body-chart
            :stackAreaRecordList="database.stackAreaRecordList"
            v-on:listenHandleFilterChange="handleFilterChange"
          ></the-body-chart>
        </Card>
        </Col>
      </Row>
    </div>
  </div>
</template>

<script type="text/jsx">
  import _ from 'lodash'
  import moment from 'moment'
  import { Page } from 'iview'
  import * as ErrorApi from 'src/api/error'
  import DATE_FORMAT from 'src/constants/date_format'
  import Loading from 'src/components/loading/loading.vue'
  import DataSet from '@antv/data-set'
  import TheBodyChart from './components/the-body-chart'
  import { Icon, Poptip } from 'iview'

  export default {
    name: 'home',
    components: {
      Page,
      TheBodyChart,
      Loading,
    },
    data () {
      return {
        filter: 'hour',
        // 常量
        selectedPrefix: '',
        CONSTANT: {
          // 日期常量, 包括单位/常用日期格式化字符串, 自constants中导入
          DATE_FORMAT
        },
        // 页面状态
        status: {
          filter: 'hour',
          selectDate: [
            moment()
              .startOf('day')
              .toDate(),
            moment().toDate()
          ],
          selectedErrorName: '',
          loading: {
            errorDistributionSummary: true,
            stackAreaChart: true
          },
        },
        database: {
          errorDistributionList: [],
          stackAreaRecordList: [],
        }
      }
    },
    async mounted () {
      await this.fetchErrorDistributionList()
      await this.updateRecord(true)
    },
    methods: {
      handleFilterChange (filter) {
        if(this.status.filter === filter) return
        this.status.filter = filter
        this.fetchStackAreaRecordList()
      },
      async fetchErrorDistributionList () {
        // 启动&关闭 loading
        this.status.loading.errorDistributionSummary = true
        const { startAt, endAt } = this
        let response = await ErrorApi.fetchErrorDistributionList({
          start_at: startAt,
          end_at: endAt
        })
        this.status.loading.errorDistributionSummary = false
        let errorDistributionList = _.get(response, ['data'], [])
        this.database.errorDistributionList = errorDistributionList
        // 获取前缀
        let prefixSet = new Set()
        for (let errorDistrubution of errorDistributionList) {
          let errorName = _.get(errorDistrubution, ['error_name'], '')
          if (errorName === '') continue
          let prefix = errorName.split('_')
          if (prefix.length === 1) continue
          prefixSet.add(prefix[0] + '_')
        }
        this.database.prefixList = [...prefixSet]
        this.status.selectedErrorName = _.get(errorDistributionList, [0, 'error_name'], '')
      },
      // 更新函数添加600ms延迟, 避免由于用户快速录入内容导致频繁发送请求
      updateRecord: _.debounce(async function (reloadUrlList = false) {
        // 并发执行请求
        let fetchStackAreaRecordPromise = this.fetchStackAreaRecordList()
        await Promise.all([
          fetchStackAreaRecordPromise
        ])
      }, 600),
      
      async fetchStackAreaRecordList () {
        this.status.loading.stackAreaChart = true
        let response = await ErrorApi.fetchStackAreaRecordList({
          count_type: this.status.filter,
          start_at: this.startAt,
          end_at: this.endAt,
          error_name_list: [this.status.selectedErrorName]
        })
        this.status.loading.stackAreaChart = false
        let rawStackAreaRecordList = _.get(response, ['data'], [])
        this.database.stackAreaRecordList = rawStackAreaRecordList
      },
      async handleDateChange (selectDate) {
        let endTime = selectDate
        let startTime = moment(endTime).format('YYYY-MM-DD 00:00:00')
        endTime = moment(endTime).format('YYYY-MM-DD 23:59:59')
        this.status.selectDate = [startTime, endTime]
        // 日期范围更新后重选数据
        await this.fetchErrorDistributionList()
        await this.updateRecord(true)
      },
      isDateDisabled (testDate) {
        const nowTime = moment().unix()
        const testTime = moment(testDate).unix()
        return testTime > nowTime
      }
    },
    computed: {
      startAt () {
        let startAtDate = _.get(this, ['status', 'selectDate', '0'], new Date())
        let startAt = moment(startAtDate).unix()
        return startAt
      },
      endAt () {
        let endAtDate = _.get(this, ['status', 'selectDate', '1'], new Date())
        let endAt = moment(endAtDate).unix()
        return endAt
      },
    }
  }
</script>

<style lang="less" scoped>
  .message {
    font-size: 1vw;
  }

  .date-selector,
  .error-distribution-summary {
    width: 100%;
  }

  .dashboard {
    height: 100%;
    overflow: auto;
  }

  .url-list {
    height: 100%;
    overflow-y: auto;
  }

  .center-card-box {
    display: flex;
    align-items: center;
    justify-content: center;
    .item {
      width: 96%;
    }
  }

  .the-page_position {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .error-dashboard-auto-fresh-button {
    position: relative;
  }

  .error-dashboard-auto-fresh-button-after {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 0%;
    height: 100%;
    background-color: #478be9;
    opacity: 0.5;
    border-radius: 3px;
    animation: autoFresh 10s linear infinite;
  }

  @keyframes autoFresh {
    0% {
      width: 0%;
    }
    80% {
      background-color: #478be9;
    }
    90% {
      width: 100%;
      background-color: rgb(4, 247, 4);
    }
    100% {
      width: 100%;
      background-color: rgb(4, 247, 4);
    }
  }
</style>

<style lang="less">
  .container-d85ac9 {
    // jsx中无法使用scope, 需要为jsx部分人工构建scope
    .error-dashboard-jsx-root {
      .ext-json pre {
        white-space: pre-wrap;
      }
    }
    .icon-position {
      position: absolute;
      right: 25px;
      z-index: 7;
      top: 30px;
    }
    .poptip-content {
      display: flex;
      p {
        white-space: normal;
      }
    }
    // tooltip不消失的问题
    .ivu-card-body .g2-tooltip {
      max-width: 450px;
      max-height: 400px;
      overflow-y: auto;
      overflow-x: hidden;
    }
  }
</style>
