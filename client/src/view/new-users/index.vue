<template>
  <div>
    <Row>
      <Card shadow>
        <p slot="title">新增用户({{title}})</p>
        <time-bar :disabledMinute="true"
                  :displayTypeItem="true"
                  @change='dateChange'>
          <Cascader style="margin-left:-70px !important;width:100px"
                    :clearable="false"
                    :data="city"
                    v-model="selectCity"
                    change-on-select
                    @on-change="cityChange"
                    slot="left"></Cascader>
        </time-bar>
        <ve-line :data="lineChartData"
                 :extend="chartExtend"></ve-line>
      </Card>
    </Row>
    <Row>
      <Col span="14">
      <Card shadow>
        <p slot="title">省分布</p>
        <ve-map :data="mapChartData"></ve-map>
      </Card>
      </Col>
      <Col span="10">
      <Card shadow>
        <p slot="title">省排名</p>
        <Table :columns='columns'
               :data='tableData'
               height=400 />
      </Card>
      </Col>
    </Row>
  </div>
</template>
<script>
import moment from 'moment'
import _ from 'lodash'
import VeLine from 'v-charts/lib/line.common'
import VeMap from 'v-charts/lib/map.common'
import { getNewUsersByLine, getNewUsersByMap } from '@/api/behavior'
import TimeBar from '@/view/components/time-bar'
import city from './city'

export default {
  components: {
    VeLine,
    TimeBar,
    VeMap
  },
  data () {
    this.chartExtend = {
      // 'yAxis': {} 配置会对应设置到两个轴上，设置0对应左轴，设置1对应右轴
      // 具体内容参考 echarts 中对于 yAxis 的配置
      // http://echarts.baidu.com/option.html#yAxis
      tooltip: {
        formatter (params) {
          if (params[0] && params[0].data) {
            return `日期：${params[0].data[0]} </br> 人次：${params[0].data[1]}`
          }
        }
      },
      yAxis: {
        axisLabel: {
          formatter (val) {
            return val
          }
        }
      }
    }
    return {
      title: '全国',
      lineChartData: [],
      city,
      selectCity: ['全国'],
      lineTimeParam: {},
      mapChartData: [],
      columns: [
        {
          title: '排名',
          type: 'index',
          align: 'center'
        },
        {
          title: '省份',
          key: 'name',
          align: 'center'
        },
        {
          title: '数量',
          key: 'value',
          align: 'center'
        }
      ],
      tableData: []
    }
  },
  methods: {
    getViewData (skey, svalue, data = []) {
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

    async dateChange (fromChildObj) {
      this.$set(this.lineTimeParam, 'st', moment(moment(fromChildObj.dateRange[0]).format('YYYY/MM/DD 00:00:00'), 'YYYY/MM/DD HH:mm:ss').unix() * 1000)
      this.$set(this.lineTimeParam, 'et', moment(moment(fromChildObj.dateRange[1]).format('YYYY/MM/DD 23:59:59'), 'YYYY/MM/DD HH:mm:ss').unix() * 1000)
      this.$set(this.lineTimeParam, 'filterBy', fromChildObj.filterBy)
      await this.getLineData()
      await this.getMapData()
    },
    MillisecondToDate (msd) {
      var time = parseFloat(msd) / 1000
      if (time != null && time !== '') {
        if (time > 60 && time < 60 * 60) {
          time = parseInt(time / 60.0) + '分钟' + parseInt((parseFloat(time / 60.0) -
            parseInt(time / 60.0)) * 60) + '秒'
        } else if (time >= 60 * 60 && time < 60 * 60 * 24) {
          time = parseInt(time / 3600.0) + '小时' + parseInt((parseFloat(time / 3600.0) -
            parseInt(time / 3600.0)) * 60) + '分钟' +
            parseInt((parseFloat((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60) -
              parseInt((parseFloat(time / 3600.0) - parseInt(time / 3600.0)) * 60)) * 60) + '秒'
        } else {
          time = parseInt(time) + '秒'
        }
      }
      return time
    },
    async cityChange (value) {
      const cityLength = value.length
      let type = 'country'
      let country = '中国'
      let city = ''
      let province = value[0]
      let title = province
      if (cityLength === 2) {
        city = value[1]
        title += '/' + city
        type = 'city'
      } else {
        if (province === '全国') {
          type = 'country'
        } else {
          type = 'province'
        }
      }
      this.lineTimeParam['country'] = country
      this.lineTimeParam['city'] = city
      this.lineTimeParam['province'] = province
      this.lineTimeParam['type'] = type
      await this.getLineData()
      this.title = title
    },
    async getLineData () {
      const res = await getNewUsersByLine(this.lineTimeParam)
      this.lineChartData = this.getViewData('时间', '新增用户', res.data)
    },
    async getMapData () {
      const params = {
        st: this.lineTimeParam.st,
        et: this.lineTimeParam.et,
        field: 'province'
      }
      let mapData = await getNewUsersByMap(params)
      const list = _.get(mapData, ['data'], [])
      this.mapChartData = this.getViewData('位置', '人次', list.map((item) => {
        return {
          key: item['name'],
          value: item['value']
        }
      }))
      this.tableData = list.sort((item1, item2) => item2.value - item1.value)
    }
  },
  async mounted () {
    this.resize()
    this.lineTimeParam = {
      filterBy: 'hour',
      st: moment(moment().format('YYYY/MM/DD 00:00:00'), 'YYYY/MM/DD HH:mm:ss').unix() * 1000,
      et: moment(moment().format('YYYY/MM/DD 23:59:59'), 'YYYY/MM/DD HH:mm:ss').unix() * 1000,
      type: 'country',
      country: '中国',
      province: '全国',
      city: ''
    }
    await this.getLineData()
    await this.getMapData()
  }
}
</script>

<style lang="less" scoped>
.count-style {
  font-size: 50px;
}
</style>
