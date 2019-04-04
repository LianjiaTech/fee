<template>
  <div>
    <Card shadow
          class="info-card-wrapper">
      <div slot="title">报警配置
        <Button type="primary"
                class="btn_add"
                @click="handleAdd">新增</Button>
      </div>
      <Table ref="selection"
             :columns="componentConfig.table.columns"
             :data="componentConfig.table.dataList"></Table>
      <Page @on-change="handlePageChange"
            :current="componentConfig.page.current"
            :total="componentConfig.page.total"
            show-total
            class="the-page_position" />
    </Card>
    <Modal v-model="status.isShow.edit"
           title="报警配置编辑"
           @on-ok="handleOk"
           @on-cancel="handleCancel"
           :width="500">
      <Form :model="database.editData"
            label-position="left"
            :label-width="130">
        <FormItem label="错误名称">
          <Select style="width:300px"
                  v-model="database.editData.error_name"
                  filterable>
            <Option v-for="errorNameItem in database.errorNameList"
                    :value="errorNameItem.label"
                    :label="errorNameItem.label"
                    :key="errorNameItem.label"><span>{{ errorNameItem.label }}</span><span style="float:right;color:red">{{errorNameItem.value}}</span></Option>
          </Select>
        </FormItem>
        <FormItem label="监控范围(最近x秒)">
          <InputNumber v-model="database.editData.time_range_s"
                       style="width:300px"></InputNumber>
        </FormItem>
        <FormItem label="错误数达到x以上">
          <InputNumber v-model="database.editData.max_error_count"
                       style="width:300px"></InputNumber>
        </FormItem>
        <FormItem label="沉默时间">
          <InputNumber v-model="database.editData.alarm_interval_s"
                       style="width:300px"></InputNumber>
          <toolTip type="md-help-circle"
                   :content="CONSTANT.tipContent"></toolTip>
        </FormItem>
        <FormItem label="备注">
          <input type="textarea"
                 v-model="database.editData.note"
                 :autosize="true"
                 style="width:300px">
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script>
import * as Alarm from '@/api/alarm'
import toolTip from '@/view/components/toolTip/index.vue'

export default {
  components: {
    toolTip: toolTip
  },
  data () {
    return {
      CONSTANT: {
        tipContent: '报警后如果未恢复正常，间隔多久重新发一次报警（最低为60s）'
      },
      database: {
        errorNameList: [],
        editData: {}
      },
      status: {
        isShow: {
          edit: false
        },
        isEditStatus: {
          add: false,
          modify: false
        }
      },
      componentConfig: {
        page: {
          current: 1,
          total: 0
        },
        table: {
          columns: [
            {
              title: '配置ID',
              key: 'id',
              align: 'center',
              width: 80
            },
            {
              title: '错误名称',
              key: 'error_name',
              align: 'center'
            },
            {
              title: '监控范围',
              key: 'time_range_s',
              align: 'center',
              width: 125,
              renderHeader: (h, params) => {
                return (
                  <div><p>监控范围</p><p>(最近x秒)</p></div>
                )
              }
            },
            {
              title: '错误数达到x以上',
              key: 'max_error_count',
              align: 'center',
              renderHeader: (h, params) => {
                return (
                  <div><p>报警条件</p><p>(错误数 > x</p></div>
                )
              }
            },
            {
              title: '沉默时间',
              key: 'alarm_interval_s',
              align: 'center',
              renderHeader: (h, params) => {
                return (
                  <div>
                    <span>沉默时间</span>
                    <tool-tip content={this.CONSTANT.tipContent} type="md-help-circle" position="absolute"></tool-tip>
                  </div>
                )
              }
            },
            {
              title: '创建人',
              key: 'create_ucid',
              align: 'center',
              width: 100
            },
            {
              title: '修改人',
              key: 'update_ucid',
              align: 'center',
              width: 100
            },
            {
              title: '备注',
              key: 'note',
              align: 'center'
            },
            {
              title: '启用',
              key: 'action',
              width: 70,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h('iSwitch', {
                    props: {
                      value: params.row.is_enable === 1
                    },
                    on: {
                      'on-change': status => {
                        this.toggleEnableAlarm(status, params)
                      }
                    }
                  })
                ])
              }
            },
            {
              title: '操作',
              key: 'action',
              width: 100,
              align: 'center',
              render: (h, params) => {
                return h('div', [
                  h(
                    'icon',
                    {
                      props: {
                        type: 'ios-create',
                        size: '24',
                        color: '#2db7f5'
                      },
                      on: {
                        click: () => {
                          this.handleModify(params)
                        }
                      }
                    }
                  ),
                  h(
                    'icon',
                    {
                      props: {
                        type: 'md-close',
                        size: '24',
                        color: '#dd5a43'
                      },
                      on: {
                        click: () => {
                          this.$Modal.confirm({
                            title: '确认删除?',
                            onOk: () => {
                              this.handleDelete(params)
                            }
                          })
                        }
                      }
                    }
                  )
                ])
              }
            }
          ],
          dataList: []
        }
      }
    }
  },
  mounted () {
      this.getAlarmList()
  },
  methods: {
    async addAlarm (params) {
      if (params.alarm_interval_s < 60) {
        params.alarm_interval_s = 60
      }
      const res = await Alarm.add({
        errorType: 8,
        errorName: params.error_name || '*',
        timeRange: params.time_range_s,
        maxErrorCount: params.max_error_count,
        alarmInterval: params.alarm_interval_s,
        isEnable: 1,
        note: params.note
      })
      this.$Message.info(res.msg)
    },
    // 获取报警配置列表
    async getAlarmList (params) {
      const result = await Alarm.getAlarmList({
        currentPage: params || this.componentConfig.page.current
      })
      const data = result.data
      this.componentConfig.table.dataList = data.list
      this.componentConfig.page.total = data.totalCount
      this.componentConfig.page.current = data.currentPage
    },
    // 更新接口
    async updateAlarm (params) {
      if (params.alarm_interval_s < 60) {
        params.alarm_interval_s = 60
      }
      const result = await Alarm.update({
        id: params.id,
        errorType: 8,
        errorName: params.error_name,
        timeRange: params.time_range_s,
        maxErrorCount: params.max_error_count,
        alarmInterval: params.alarm_interval_s,
        isEnable: params.is_enable,
        note: params.note
      })
      this.$Message.info(result.msg)
    },
    // 获取err_name
    async getAlarmErrorNameList () {
      let result = await Alarm.getAlarmErrorNameList()
      result = result.data.filter(item => item['error_count'] >= 5)
      let resultList = []
      for (let rawData of result) {
        resultList.push({
          label: rawData['error_name'],
          value: rawData['error_count']
        })
      }
      resultList.unshift({
        label: '*',
        value: '监控所有'
      })
      this.database.errorNameList = resultList
    },
    // 删除回调
    async handleDelete (params) {
      const result = await Alarm.remove({
        id: params.row.id
      })
      this.$Message.info(result.msg)
      this.getAlarmList()
    },
    // 新增回调
    async handleAdd () {
      await this.getAlarmErrorNameList()
      this.status.isShow.edit = true
      this.status.isEditStatus.add = true
      this.database.editData = {
        error_name: this.database.errorNameList[0]['label'],
        time_range_s: 0,
        max_error_count: 0,
        alarm_interval_s: 60,
        note: ''
      }
    },
    // 修改配置
    handleModify (param) {
      this.status.isShow.edit = true
      this.status.isEditStatus.modify = true
      this.database.editData = { ...param.row }
      this.getAlarmErrorNameList()
    },
    // 切页
    handlePageChange (current) {
      this.getAlarmList(current)
    },
    async handleOk () {
      if (this.status.isEditStatus.add) {
        if (this.database.editData.time_range_s === 0) {
          this.$Message.error('添加失败，监控范围不能是0')
          return
        }
        if (this.database.editData.max_error_count === 0) {
          this.$Message.error('添加失败，错误数不能是0')
          return
        }
        await this.addAlarm(this.database.editData)
        this.status.isEditStatus.add = false
      }
      if (this.status.isEditStatus.modify) {
        this.status.isEditStatus.modify = false
        await this.updateAlarm(this.database.editData)
      }
      this.getAlarmList()
    },
    handleCancel () {
      this.$Message.info('取消编辑')
      this.status.isEditStatus.add = false
      this.status.isEditStatus.modify = false
    },
    async toggleEnableAlarm (status, params) {
      let isEnable = 0
      let row = params.row
      if (status) {
        isEnable = 1
      }
      row.is_enable = isEnable
      await this.updateAlarm(row)
      this.getAlarmList()
    }
  }
}
</script>

<style lang="less" scoped>
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
