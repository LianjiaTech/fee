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
      :width="600"
    >
      <Form :model="database.editData" label-position="right" :label-width="100">
        <FormItem label="错误名称">
          <Select
            style="width:300px"
            transfer-class-name="select-error-name"
            v-model="database.editData.error_name"
            filterable
          >
            <Option
              v-for="errorNameItem in database.errorNameList"
              :value="errorNameItem.label"
              :label="errorNameItem.label"
              :key="errorNameItem.label"
            >
              <span>{{ errorNameItem.label }}</span>
              <span style="float:right;color:red">{{errorNameItem.value}}</span>
            </Option>
          </Select>
        </FormItem>
        <FormItem label="过滤错误">
          <Select
            multiple
            v-model="database.editData.error_filter_list"
            filterable
            remote
            :remote-method="filterErrorDes"
            style="width:300px"
            placeholder="请输入要过滤得字段"
            ref="select"
          >
            <Option v-for="item in database.editFilterList" :value="item" :key="item">{{ item }}</Option>
          </Select>
          <toolTip type="md-help-circle" :content="CONSTANT.filterContent"></toolTip>
        </FormItem>
        <FormItem label="监控范围">
          <InputNumber v-model="database.editData.time_range_s" :min="0" style="width:300px"></InputNumber>
          <toolTip type="md-help-circle" :content="CONSTANT.rangContent"></toolTip>
        </FormItem>
        <FormItem label="错误数量阈值">
          <Row>
            <Col span="12">
              <InputNumber
                v-model="database.editData.max_error_count"
                :min="0"
                style="width:150px"
              />
              <toolTip type="md-help-circle" :content="CONSTANT.countContent" />
            </Col>
          </Row>
          <Row>
            <Col span="12">
              <Radio-group v-model="database.editData.is_summary" style="width:150px">
                <Radio :label="1">汇总值</Radio>
                <Radio :label="0">非汇总值</Radio>
              </Radio-group>
              <toolTip type="md-help-circle" :content="CONSTANT.summaryContent" />
            </Col>
          </Row>
        </FormItem>
        <FormItem label="抖动阈值">
          <InputNumber :max="100" :min="0" v-model="database.editData.wave_motion" />%
          <Tooltip transfer max-width="200">
            <Icon type="md-help-circle"></Icon>
            <div slot="content">
              <span>{{CONSTANT.waveContent}}</span>
              <a
                style="display: inline-block"
                href="http://weapons.ke.com/project/358/wiki/page/3173"
              >详情参见文档</a>
            </div>
          </Tooltip>
        </FormItem>
        <FormItem label="沉默时间">
          <InputNumber v-model="database.editData.alarm_interval_s" :min="60" style="width:300px"></InputNumber>
          <toolTip type="md-help-circle" :content="CONSTANT.tipContent"></toolTip>
        </FormItem>
        <FormItem label="页面URL规则">
          <Input
            v-model="database.editData.url"
            placeholder="支持正则（如：\d+/path/test$）或指定页面URL"
            :min="0"
            style="width:300px"
          ></Input>
          <toolTip type="md-help-circle" :content="CONSTANT.pageContent"></toolTip>
        </FormItem>
        <FormItem label="业务回调地址">
          <Input
            v-model="database.editData.callback"
            placeholder="POST接口地址"
            :autosize="true"
            style="width:300px"
          />
          <Tooltip transfer max-width="200">
            <Icon type="md-help-circle"></Icon>
            <div slot="content">
              <span>{{CONSTANT.callbackContent}}</span>
              <a
                style="display: inline-block"
                href="http://weapons.ke.com/project/358/wiki/page/1681#2"
              >参见文档</a>
            </div>
          </Tooltip>
        </FormItem>
        <FormItem label="机器人地址">
          <Input placeholder="企微机器人hook地址" v-model="database.editData.webhook" style="width:300px" />
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

<script type="text/jsx">
/** @format */

import moment from 'moment'
import * as Alarm from 'src/api/alarm'
import toolTip from 'src/components/toolTip/index.vue'

export default {
  components: {
    toolTip: toolTip
  },
  props: {
    dataList: {
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
        tipContent: '报警后如果未恢复正常，间隔多久重新发一次报警（最低为60s）',
        rangContent: '最近x秒',
        filterContent: '填写的错误字段不会触发报警',
        callbackContent: '发生报警会通过POST方式向该接口地址发送请求，并携带报错信息。携带的数据格式',
        countContent: '监控范围内，错误数量达到指定阈值时，触发报警。为‘0’时不会触发报警',
        summaryContent: `汇总值：不区分页面，所有页面的错误总量超过阈值时触发报警，回传的错误数据为所有页面的错误数据；\n
非汇总值：区分页面，只有某（几）个页面的报错数量达到阈值时触发报警，回传的错误数据为这（几）个页面中的错误数据；\n
页面：Host + Path`,
        pageContent: '监控特定页面的报错，支持正则。仅当报错页面URL匹配表达式时，才会报警',
        waveContent: '与上一个监控范围内错误数的环比值，最大为100%。为‘0’时不会触发报警'
      },
      database: {
        errorNameList: [],
        editFilterList: [],
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
                  <div>
                    <p> 监控范围 </p>
                    <p>(最近x秒)</p>
                  </div>
                )
              }
            },
            {
              title: '错误数达到x以上',
              key: 'max_error_count',
              align: 'center',
              renderHeader: (h, params) => {
                return (
                  <div>
                    <p> 报警条件 </p>
                    <p>(错误数 > x)</p>
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
                    <span> 沉默时间 </span>
                    <tool-tip
                      content={this.CONSTANT.tipContent}
                      placement="right"
                      type="md-help-circle"></tool-tip>
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
              title: '更新时间',
              key: 'update_time',
              align: 'center',
              render: (h, params) => {
                const { update_time } = params.row
                if (!update_time) return ''
                return <span>{moment.unix(update_time).format('YYYY-MM-DD HH:mm')}</span>
              }
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
    async addAlarm(params) {
      if (params.alarm_interval_s < 60) {
        params.alarm_interval_s = 60
      }
      const res = await Alarm.add({
        type: 'error',
        errorType: 8,
        url: params.url,
        errorFilterList: params.error_filter_list.join(','),
        errorName: params.error_name || '*',
        timeRange: params.time_range_s,
        maxErrorCount: params.max_error_count,
        alarmInterval: params.alarm_interval_s,
        isEnable: 1,
        note: params.note,
        waveMotion: params.wave_motion,
        callback: params.callback,
        isSummary: params.is_summary,
        webhook: params.webhook
      })
      this.$Message.info(res.msg)
    },
    // 更新接口
    async updateAlarm(params) {
      if (params.alarm_interval_s < 60) {
        params.alarm_interval_s = 60
      }
      if (Array.isArray(params.error_filter_list)) {
        params.error_filter_list = params.error_filter_list.join(',')
      }
      const result = await Alarm.update({
        id: params.id,
        errorType: 8,
        url: params.url,
        errorFilterList: params.error_filter_list,
        errorName: params.error_name,
        timeRange: params.time_range_s,
        maxErrorCount: params.max_error_count,
        alarmInterval: params.alarm_interval_s,
        isEnable: params.is_enable,
        note: params.note,
        waveMotion: params.wave_motion,
        callback: params.callback,
        isSummary: params.is_summary,
        webhook: params.webhook
      })
      this.$Message.info(result.msg)
    },
    // 获取err_name
    async getAlarmErrorNameList() {
      let result = await Alarm.getAlarmErrorNameList()
      result = result.data.filter((item) => item['error_count'] >= 5)
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
    async handleDelete(params) {
      const result = await Alarm.remove({
        id: params.row.id
      })
      this.$Message.info(result.msg)
      this.getAlarmList()
    },
    // 新增回调
    async handleAdd() {
      await this.getAlarmErrorNameList()
      this.status.isShow.edit = true
      this.status.isEditStatus.add = true
      this.database.editData = {
        error_name: this.database.errorNameList[0]['label'],
        time_range_s: 0,
        max_error_count: 0,
        alarm_interval_s: 60,
        is_summary: 1,
        note: '',
        error_filter_list: [],
        wave_motion: 0,
        webhook: ''
      }
    },
    // 修改配置
    handleModify(param) {
      this.status.isShow.edit = true
      this.status.isEditStatus.modify = true
      const { row } = param
      const data = { ...row }
      if ('string' !== typeof data.error_filter_list) {
        data.error_filter_list = ''
      }
      data.error_filter_list = data.error_filter_list.split(',')
      this.database.editFilterList = [...data.error_filter_list]
      this.database.editData = { ...data }
      this.getAlarmErrorNameList()
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
    },
    getAlarmList(params) {
      this.$emit('updateData', params)
    },
    filterErrorDes(e) {
      this.database.editFilterList = [e, ...this.database.editData.error_filter_list]
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
<style lang="less">
/** @format */

.select-error-name {
  width: 300px !important;
  left: 0 !important;
}
</style>

