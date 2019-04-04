<template>
      <Card style="height:530px">
        <p slot="title">用户在线时长</p>
        <v-chart :forceFit="true" :height="height" :data="chartData" :scale="lineScale" :padding="[10,80,60,70]">
          <v-tooltip :onChange="itemFormatter"/>
          <v-axis data-key="value" :label="{
           formatter: (val) => {
             return `${MillisecondToDate(val)}`
          }
        }"/>
          <v-smooth-line position="key*value"/>
          <v-point position="key*value" shape="circle"/>
        </v-chart>
      </Card>
</template>

<script>
  import moment from 'moment'
  import { getOnlineTime } from '@/api/behavior'

  export default {
    data () {
      return {
        chartData: [],
        lineScale: [{
          dataKey: 'value'
        }, {
          dataKey: 'key',
          tickCount: 7,
          alias: '日期',
          nice: false
        }],
        height: 420
      }
    },
    methods: {
      itemFormatter (e) {
        let attrs = e.tooltip._attrs
        if (e.items) {
          const items = e.items[0]
          let val = items.value
          attrs.itemTpl = `<ul class="g2-tooltip-list-item"> <li data-v-gtlv >时长：${this.MillisecondToDate(val)}</li> </ul>`
        }
      },
      getViewData (skey, svalue, data = []) {
        var ret = {
          columns: [skey, svalue],
          rows: []
        }
        data.forEach(({
                        key,
                        value
                      }) => {
          ret.rows.push({
            [skey]: key,
            [svalue]: value
          })
        })
        return ret
      },

      async timeChange (obj) {
        const {
          dateRange,
          filterBy
        } = obj
        const res = await getOnlineTime({
          filterBy,
          st: +moment(dateRange[0]),
          et: +moment(dateRange[1])
        })

        this.chartData = res.data
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
      }
    },
    async mounted () {
      this.resize()
      const res = await getOnlineTime({
        filterBy: 'hour',
        st: moment(moment().format('YYYY/MM/DD 00:00:00'), 'YYYY/MM/DD HH:mm:ss').unix() * 1000,
        et: moment(moment().format('YYYY/MM/DD 23:59:59'), 'YYYY/MM/DD HH:mm:ss').unix() * 1000
      })
      this.chartData = res.data
    }
  }
</script>

<style lang="less">
  .count-style {
    font-size: 50px;
  }

  .g2-tooltip-list-item {
    margin-top: 12px;
    list-style: none;
  }

  .g2-tooltip-list li[data-v-gtlv] {
    padding: 5px 8px;
    font-size: 12px;
  }
</style>
