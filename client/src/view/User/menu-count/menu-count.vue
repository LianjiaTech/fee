<template>
  <el-container>
    <div :data-watch="this.watchTimeSelect"></div>
    <el-header direction="horizontal" style="text-align: right;">
      <div class="header">
        <div class="date-time-range-picker">
          <DatetimeRangePicker :startAt.sync="status.startAt" :endAt.sync="status.endAt" />
        </div>
      </div>
    </el-header>
    <el-main>
      <el-card class="box-card" v-loading="loading.histogram">
        <div slot="header" class="clearfix">
          <span style="font-size:14px">{{ title }}</span>
          <el-tooltip class="item" effect="dark" content="以code为基准进行统计, 如果同一code下有多个name, 则取出现次数最多的name作为总触发次数" placement="right">
            <i class="el-icon-info"></i>
          </el-tooltip>
        </div>
        <div>
          <ve-bar height="600px" :data="histogramChartData" :extend="histogramChartSetting"></ve-bar>
        </div>
      </el-card>
      <el-card class="box-card" v-loading="loading.histogram">
        <div slot="header" class="clearfix">
          <span style="font-size:24px">详细数据</span>
          <el-tooltip class="item" effect="dark" content="该表按code-name-url进行分类统计" placement="right">
            <i class="el-icon-info"></i>
          </el-tooltip>
          <p>(按照API说明, 应该只以code作为唯一值. 但在实践中确实可能出现单一code下存在多个name和url的i情况, 因此提供该列表以供debug.)</p>
        </div>
        <div>
          <el-table :data="detailList" border>
            <el-table-column prop="code" label="code"></el-table-column>
            <el-table-column prop="name" label="名称"></el-table-column>
            <el-table-column prop="url" label="url"></el-table-column>
            <el-table-column prop="urlCount" label="出现次数"></el-table-column>
          </el-table>
        </div>
      </el-card>
    </el-main>
  </el-container>
</template>

<script>
  import _ from 'lodash'
  import moment from 'moment'

  import BehaviorApi from 'src/api/behavior'
  import DATE_FORMAT from 'src/constants/date_format'
  import DatetimeRangePicker from 'src/components/datetime-range-picker.vue'

  const SUMMARY_BY_CODE_AND_NAME_AND_URL = 'code_and_name_and_url'
  const SUMMARY_BY_CODE_AND_NAME = 'code_and_name'
  const SUMMARY_BY_CODE = 'code'

  export default {
    components: {
      DatetimeRangePicker
    },
    data() {
      return {
        constant: {
          summaryBy: {
            code: SUMMARY_BY_CODE,
            name: SUMMARY_BY_CODE_AND_NAME,
            url: SUMMARY_BY_CODE_AND_NAME_AND_URL
          }
        },
        status: {
          startAt: moment()
            .subtract(1, DATE_FORMAT.UNIT.DAY)
            .startOf(DATE_FORMAT.UNIT.DAY)
            .unix(),
          endAt: moment()
            .endOf(DATE_FORMAT.UNIT.MINUTE)
            .unix(),
          summaryBy: SUMMARY_BY_CODE
        },
        loading: {
          histogram: true
        },
        database: {
          distribution: {}
        }
      }
    },
    mounted() {
      this.fetchData()
    },
    methods: {
      async fetchData() {
        this.loading.histogram = true
        let response = await BehaviorApi.getMenuCount(this.status.startAt, this.status.endAt)
        let distribution = _.get(response, ['data'], [])
        this.database.distribution = distribution
        this.loading.histogram = false
        this.resize()
      }
    },
    computed: {
      watchTimeSelect() {
        this.fetchData()
        return `${this.status.startAt}-${this.status.endAt}`
      },
      histogramChartData() {
        let rows = []
        // 需要把这个数据规整一下
        for (let code of Object.keys(this.database.distribution)) {
          let codeDistribution = _.get(this.database.distribution, [code], {})
          let name = _.get(codeDistribution, ['maxAppearName'], '')
          let count = _.get(codeDistribution, ['maxAppearNameCount'], 0)
          rows.push({
            名称: name,
            触发次数: count
          })
        }
        let ascRows = _.sortBy(rows, (item) => {
          // 从小到大
          return item['触发次数']
        })

        return {
          columns: ['名称', '触发次数'],
          rows: ascRows
        }
      },
      histogramChartSetting() {
        // 初始区域最多展示30条记录
        const MAX_DISPLAY_RECORD = 30
        let recordListLength = this.histogramChartData.rows.length
        let showEndPercent = 0 // 从100 => 0
        if (recordListLength > 0 && recordListLength > MAX_DISPLAY_RECORD) {
          showEndPercent = 100 - (Math.floor((MAX_DISPLAY_RECORD / recordListLength) * 100) % 100)
        }

        return {
          dataZoom: {
            type: 'slider',
            show: true,
            yAxisIndex: [0],
            left: '0%',
            start: 100,
            end: showEndPercent,
            showDetail: false
          },

          yAxis: {
            axisLabel: {
              show: true,
              // 显示全部纵坐标
              interval: 0
            }
          }
        }
      },
      detailList() {
        let recordList = []
        // 需要把这个数据规整一下
        for (let code of Object.keys(this.database.distribution)) {
          let codeDistributionDetail = _.get(this.database.distribution, [code], {})
          let nameDistribution = _.get(codeDistributionDetail, ['nameDistribution'], [])
          for (let name of Object.keys(nameDistribution)) {
            let nameDistributionDetail = _.get(nameDistribution, [name], {})
            let urlDistributionDetail = _.get(nameDistributionDetail, ['urlDistribution'], {})
            for (let url of Object.keys(urlDistributionDetail)) {
              let urlCount = _.get(urlDistributionDetail, [url], 0)
              recordList.push({
                code,
                name,
                url,
                urlCount
              })
            }
          }
        }
        return recordList
      },
      title() {
        let startAtYmd = moment.unix(this.status.startAt).format(DATE_FORMAT.DISPLAY_BY_SECOND)
        let endAtYmd = moment.unix(this.status.endAt).format(DATE_FORMAT.DISPLAY_BY_SECOND)
        return `${startAtYmd}~${endAtYmd}  期间埋点触发次数`
      }
    }
  }
</script>

<style lang="less" scoped>
  .el-icon-info {
    font-size: 16px;
  }
</style>
