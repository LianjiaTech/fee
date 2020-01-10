<template>
  <div>
    <Card shadow class="info-card-wrapper">
      <Table ref="selection" :columns="componentConfig.table.columns" :data="dataList"></Table>
      <Page
        @on-change="handlePageChange"
        :current="current"
        :total="total"
        show-total
        class="the-page_position"
      />
    </Card>
    <Modal
      v-model="status.isShow.edit"
      title="报警配置编辑"
      @on-ok="handleOk"
      @on-cancel="handleCancel"
      :width="500"
    >
      <Form label-position="right" :label-width="100">
        <FormItem label="页面规则">
          <RadioGroup v-model="database.editData.page_rule">
            <Radio label="url">URL</Radio>
            <Radio label="page_type">PageType</Radio>
          </RadioGroup>
          <Select style="width:300px" v-model="database.editData.url" filterable>
            <Option
              v-for="pageUrl in (database.editData.page_rule === 'url' ? urlList : pageTypeList)"
              :label="pageUrl"
              :value="pageUrl"
              :key="pageUrl"
            >
              <span>{{ pageUrl }}</span>
            </Option>
          </Select>

          <toolTip :content="CONSTANT.tipContent.pageRule" type="md-help-circle"></toolTip>
        </FormItem>
        <FormItem label="性能名称">
          <Select style="width:300px" v-model="database.editData.error_name">
            <Option
              v-for="errorNameItem in perfNameList"
              :value="errorNameItem.value"
              :label="errorNameItem.label"
              :key="errorNameItem.label"
            >
              <span>{{ errorNameItem.label }}</span>
            </Option>
          </Select>
        </FormItem>
        <FormItem label="监控范围">
          <InputNumber v-model="database.editData.time_range_s" :min="600" style="width:300px"></InputNumber>
          <toolTip :content="CONSTANT.tipContent.timeRange" type="md-help-circle"></toolTip>
        </FormItem>
        <FormItem label="报警条件">
          <InputNumber v-model="database.editData.max_error_count" :min="0" style="width:300px"></InputNumber>
          <toolTip type="md-help-circle" :content="CONSTANT.tipContent.maxErrorCount"></toolTip>
        </FormItem>
        <FormItem label="沉默时间">
          <InputNumber v-model="database.editData.alarm_interval_s" :min="60" style="width:300px"></InputNumber>
          <toolTip type="md-help-circle" :content="CONSTANT.tipContent.alarmInterval"></toolTip>
        </FormItem>
        <FormItem label="备注">
          <Input
            type="textarea"
            v-model="database.editData.note"
            :autosize="true"
            style="width:300px"
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script>
/** @format */

import * as Alarm from 'src/api/alarm'
import moment from 'moment'
import toolTip from 'src/components/toolTip/index.vue'
import { Poptip } from 'iview'

export default {
  components: {
    toolTip: toolTip
  },
  props: {
    dataList: {
      type: Array,
      default: []
    },
    pageTypeList: {
      type: Array,
      default: () => []
    },
    urlList: {
      type: Array,
      default: []
    },
    perfNameList: {
      type: Array,
      default: []
    },
    current: {
      type: Number,
      default: 1
    },
    total: {
      type: Number,
      default: 0
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      CONSTANT: {
        tipContent: {
          timeRange: '监控最近x秒内的页面性能(最低600秒)',
          alarmInterval: '报警后如果未恢复正常，间隔多久重新发一次报警(最低为60s)',
          maxErrorCount: '页面性能耗时或响应时间在给定时间范围内的平均值超过x毫秒, 触发报警',
          pageRule: 'PageType是由SDK中设置的getPageType方法生成，URL则是性能上报时的页面url生成'
        }
      },
      database: {
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
        table: {
          columns: [
            {
              title: '配置ID',
              key: 'id',
              align: 'center',
              width: 80
            },
            {
              title: 'URL',
              key: 'url',
              width: 200,
              align: 'center',
              render: (h, params) => {
                return (
                  <div>
                    <Poptip trigger="hover" content={params.row.url}>
                      <p style="width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        {params.row.url}
                      </p>
                    </Poptip>
                  </div>
                )
              },
              renderHeader: (h, params) => {
                return (
                  <div>
                    <span>URL</span>
                    <tool-tip
                      placement="right"
                      content={'hover显示完整URL'}
                      type="md-help-circle"
                      position="absolute"></tool-tip>
                  </div>
                )
              }
            },
            {
              title: '性能名称',
              key: 'indicator_name',
              align: 'center'
            },
            {
              title: '监控范围',
              key: 'time_range_s',
              align: 'center',
              width: 125,
              renderHeader: (h, params) => {
                return (
                  <div>
                    <span>监控范围</span>
                    <tool-tip
                      placement="right"
                      content={this.CONSTANT.tipContent.timeRange}
                      type="md-help-circle"
                      position="absolute"></tool-tip>
                  </div>
                )
              }
            },
            {
              title: '时间超过x秒',
              key: 'max_error_count',
              align: 'center',
              renderHeader: (h, params) => {
                return (
                  <div>
                    <span>报警条件</span>
                    <tool-tip
                      placement="right"
                      content={this.CONSTANT.tipContent.maxErrorCount}
                      type="md-help-circle"
                      position="absolute"></tool-tip>
                  </div>
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
                    <tool-tip
                      placement="right"
                      content={this.CONSTANT.tipContent.alarmInterval}
                      type="md-help-circle"
                      position="absolute"></tool-tip>
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
                      'on-change': (status) => {
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
                  h('icon', {
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
                  }),
                  h('icon', {
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
                  })
                ])
              }
            }
          ]
        }
      }
    }
  },
  methods: {
    getAlarmList(params) {
      this.$emit('updateData', params)
    },
    async addAlarm(params) {
      if (params.alarm_interval_s < 60) {
        params.alarm_interval_s = 60
      }
      const res = await Alarm.add({
        pageRule: params.page_rule,
        type: 'perf',
        errorType: 9,
        url: params.url,
        errorName: params.error_name || '*',
        timeRange: params.time_range_s,
        maxErrorCount: params.max_error_count,
        alarmInterval: params.alarm_interval_s,
        isEnable: 1,
        note: params.note
      })
      this.$Message.info(res.msg)
    },
    // 更新接口
    async updateAlarm(params) {
      if (params.alarm_interval_s < 60) {
        params.alarm_interval_s = 60
      }
      const result = await Alarm.update({
        pageRule: params.page_rule,
        id: params.id,
        errorType: 8,
        errorName: params.error_name,
        url: params.url,
        timeRange: params.time_range_s,
        maxErrorCount: params.max_error_count,
        alarmInterval: params.alarm_interval_s,
        isEnable: params.is_enable,
        note: params.note
      })
      this.$Message.info(result.msg)
    },
    // 删除回调
    async handleDelete(params) {
      const result = await Alarm.remove({
        id: params.row.id
      })
      this.$Message.info(result.msg)
      this.getAlarmList()
    },
    // 新增回调
    async handleAdd() {
      this.status.isShow.edit = true
      this.status.isEditStatus.add = true
      this.$set(this.database, 'editData', {
        error_name: this.perfNameList[0]['value'],
        url: '',
        page_rule: 'url',
        time_range_s: 600,
        max_error_count: 0,
        alarm_interval_s: 60,
        note: ''
      })
    },
    // 修改配置
    async handleModify(param) {
      this.status.isShow.edit = true
      this.status.isEditStatus.modify = true
      this.database.editData = { ...param.row }
    },
    // 切页
    handlePageChange(current) {
      this.getAlarmList(current)
    },
    async handleOk() {
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
    handleCancel() {
      this.$Message.info('取消编辑')
      this.status.isEditStatus.add = false
      this.status.isEditStatus.modify = false
    },
    async toggleEnableAlarm(status, params) {
      let isEnable = 0
      let row = params.row
      if (status) {
        isEnable = 1
      }
      row.is_enable = isEnable
      await this.updateAlarm(row)
      this.getAlarmList()
    }
  },
  watch: {
    isEdit(value) {
      if (value) {
        this.handleAdd()
      }
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