<template>
  <div>
    <Card shadow>
      <Tabs v-model="status.tabName">
        <TabPane label="错误" name="error">
          <error-config :dataList="componentConfig.table.dataList.error" :current="componentConfig.page.current.error" :total="componentConfig.page.total.error" :isEdit="status.isEdit.error" @updateData="getErrorConfigList" />
        </TabPane>
        <TabPane label="性能" name="perf">
          <perf-config
            :dataList="componentConfig.table.dataList.perf"
            :urlList="componentConfig.urlList"
            :pageTypeList="componentConfig.pageTypeList"
            :perfNameList="componentConfig.perfNameList"
            :current="componentConfig.page.current.perf"
            :total="componentConfig.page.total.perf"
            :isEdit="status.isEdit.perf"
            @updateData="getPerfConfigList"
          />
        </TabPane>
        <Button type="primary" class="btn_add" slot="extra" style="position:relative;top:0px" @click="handleAdd">新增</Button>
      </Tabs>
    </Card>
  </div>
</template>

<script>
  /** @format */

  import * as Alarm from 'src/api/alarm'
  import Performance from 'src/api/performance'
  import toolTip from 'src/components/toolTip/index.vue'
  import errorConfig from './components/error.vue'
  import perfConfig from './components/performance.vue'
  import moment from 'moment'
  export default {
    components: {
      toolTip: toolTip,
      errorConfig,
      perfConfig
    },
    data() {
      return {
        componentConfig: {
          page: {
            current: {
              error: 1,
              perf: 1
            },
            total: {
              error: 0,
              perf: 0
            }
          },
          table: {
            dataList: {
              error: [],
              perf: []
            }
          },
          urlList: [],
          perfNameList: []
        },
        status: {
          tabName: 'error',
          isEdit: {
            error: false,
            perf: false
          }
        }
      }
    },
    mounted() {
      this.getErrorConfigList()
      this.getPerfConfigList()
      this.getUrlList()
      this.getPerfNameList()
    },
    methods: {
      // 获取错误报警配置列表
      async getErrorConfigList(params) {
        const result = await Alarm.getAlarmList({
          currentPage: params || this.componentConfig.page.current.error,
          type: 'error'
        })
        const data = result.data
        this.componentConfig.table.dataList.error = data.list
        this.componentConfig.page.total.error = data.totalCount
        this.componentConfig.page.current.error = data.currentPage
      },
      // 获取性能报警配置列表
      async getPerfConfigList(params) {
        const result = await Alarm.getAlarmList({
          currentPage: params || this.componentConfig.page.current.perf,
          type: 'perf'
        })
        const data = result.data
        this.componentConfig.table.dataList.perf = data.list
        this.componentConfig.page.total.perf = data.totalCount
        this.componentConfig.page.current.perf = data.currentPage
      },
      // 新增回调
      async handleAdd() {
        let isEditError = this.status.tabName === 'error'
        this.$set(this.status.isEdit, 'error', false)
        this.$set(this.status.isEdit, 'perf', false)
        this.$nextTick(() => {
          this.$set(this.status.isEdit, 'error', isEditError)
          this.$set(this.status.isEdit, 'perf', !isEditError)
        })
      },
      // 获取urlList
      async getUrlList() {
        let nowMoment = moment()
        let eightDayAgoMoment = moment().subtract(6, 'day')
        // @todo(yaozeyuan) 这个接口已废弃, 待性能页面升级完成后, 需要重新适配
        let result = await Performance.fetchUrlList(eightDayAgoMoment.unix(), nowMoment.unix())
        let { urlList, pageTypeList } = _.get(result, ['data'], {})

        this.componentConfig.urlList = urlList.filter((item) => item !== '')
        this.componentConfig.pageTypeList = pageTypeList.filter((item) => item !== '')
      },
      // 获取err_name
      async getPerfNameList() {
        let result = await Alarm.getAlarmPerfNameList()
        this.componentConfig.perfNameList = result.data
      }
    }
  }
</script>

<style lang="less" scoped>
  /** @format */

  .btn_add {
    position: absolute;
    top: 5px;
    right: 20px;
  }
  .the-page_position {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    flex-direction: row;
    flex-wrap: wrap;
  }
</style>
