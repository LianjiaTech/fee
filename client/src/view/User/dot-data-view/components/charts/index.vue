<template>
  <div class="cmp-dot-data-charts">
    <Spin size="large" fix v-if="spinShow"></Spin>
    <Tabs value="name1" v-show="chartData.length > 0">
      <TabPane label="折线图" name="name1" icon="ios-trending-up">
        <div class="charts-line" ref="dot-data-line"></div>
      </TabPane>
      <TabPane label="饼图" name="name2" icon="ios-pie-outline">
        <div class="charts-pie" ref="dot-data-pie"></div>
      </TabPane>
    </Tabs>
    <No-Data v-show="!chartData.length"></No-Data>
  </div>
</template>
<script>
  import echart from 'echarts'
  import NoData from 'src/components/no-data/'
  import { dotDataLineOptions, dotDataPieOptions } from '../../conf'
  export default {
    components: { NoData },
    props: {
      loading: false,
      chartData: {
        type: Array,
        default: () => []
      }
    },
    data() {
      return {
        spinShow: true,
        stackAreaPic: null,
        filter: {}
      }
    },
    mounted() {
      this.stackAreaPic = echart.init(this.$refs['dot-data-line'])
      this.pieAreaPic = echart.init(this.$refs['dot-data-pie'])
      this.draw()
      this.$bus.$on('dot-filter-change', (filter) => {
        this.filter = filter
      })
    },
    methods: {
      draw() {
        this.drawLine()
        this.drawPie()
      },
      drawLine() {
        const options = dotDataLineOptions(this.chartData, this.filter)
        this.stackAreaPic.setOption(options, true)
        this.$nextTick(() => {
          this.stackAreaPic.resize()
        })
      },
      drawPie() {
        const options = dotDataPieOptions(this.chartData)
        this.pieAreaPic.setOption(options, true)
        this.$nextTick(() => {
          this.pieAreaPic.resize()
        })
      }
    },
    watch: {
      chartData(val) {
        this.draw()
      },
      loading(val) {
        val ? (this.spinShow = true) : (this.spinShow = false)
      }
    }
  }
</script>
<style lang="less" scoped>
  .cmp-dot-data-charts {
    background: #fff;
    margin-top: 20px;
    padding: 40px;
    position: relative;
    .charts-pie,
    .charts-line {
      height: 400px;
      width: 90%;
    }
  }
</style>
