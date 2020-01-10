<template>
  <div class="pg-dot-data-view">
    <Filters @on-change="handleFilterChange" />
    <Charts :chartData="chartData" :loading="isLoading" />
  </div>
</template>
<script>
  import * as ApiDot from 'src/api/dot'
  import Filters from './components/filter/index.vue'
  import Charts from './components/charts/index.vue'

  export default {
    components: {
      Filters,
      Charts
    },
    data() {
      return {
        chartData: [],
        isLoading: false
      }
    },
    methods: {
      // 筛选条件发生变化
      handleFilterChange(conditions) {
        this.queryData(conditions)
      },
      // 获取数据
      queryData(conditions) {
        this.isLoading = true
        ApiDot.queryDotDataByFilters(conditions).then((res) => {
          if (res.code == 0) {
            let aggs = _.get(res, ['data', 'aggregation'], [])
            this.chartData = aggs
            this.isLoading = false
          }
        })
      }
    }
  }
</script>
<style lang="less" scoped>
  .pg-dot-data-view {
  }
</style>
