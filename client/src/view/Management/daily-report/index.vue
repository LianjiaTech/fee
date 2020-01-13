<template>
  <div class="pg-daily-report">
    <Form :label-width="130">
      <FormItem label="订阅的项目">
        <div style="border-bottom: 1px solid #e9e9e9;padding-bottom:6px;margin-bottom:6px;">
          <Checkbox :indeterminate="indeterminate" :value="checkAll" @click.prevent.native="handleCheckAll">全选</Checkbox>
        </div>
        <CheckboxGroup v-model="checkAllGroup" @on-change="checkAllGroupChange">
          <Checkbox v-for="item in projectList" :key="item.id" :label="item.id">{{ item.projectName }}</Checkbox>
        </CheckboxGroup>
      </FormItem>
      <FormItem label="选择发送时间">
        <TimePicker :clearable="false" @on-change="handleSendTimeChange" :steps="[1, 60]" :editable="false" :value="sendTime" format="HH:mm" placeholder="请选择" style="width: 112px"></TimePicker>
        <toolTip type="md-help-circle" content="实际收到邮件时间会有一定延迟"></toolTip>
      </FormItem>
      <FormItem label="回传原始数据">
        <i-switch v-model="needCallback">
          <span slot="open">是</span>
          <span slot="close">否</span>
        </i-switch>
        <toolTip type="md-help-circle" content="日报数据会回传给业务接口"></toolTip>
      </FormItem>
      <FormItem label="回传接口地址" v-show="needCallback">
        <Input v-model="callbackUrl" style="width: 500px;">
          <Select v-model="protocol" slot="prepend" style="width: 80px">
            <Option value="http">http://</Option>
            <Option value="https">https://</Option>
          </Select>
          <Tooltip transfer max-width="200" slot="append">
            <Icon type="md-help-circle"></Icon>
            <div slot="content">
              <span>日报数据会通过POST方式回传给该地址，具体数据格式</span>
              <a style="display: inline-block" href="#">参见文档</a>
            </div>
          </Tooltip>
        </Input>
      </FormItem>
      <FormItem>
        <Button type="primary" @click="handleConfirm">确认</Button>
      </FormItem>
    </Form>
  </div>
</template>

<script>
  import _ from 'lodash'
  import { getAllProject, getSubscribeProject, updateSubscribe } from 'src/api/daily'

  export default {
    data() {
      return {
        needCallback: false,
        callbackUrl: '',
        protocol: 'http',
        projectList: [], // 这里的列表只是该用户下所在项目的列表，也就是该用户是这些项目中的一员不管是owner还是dev，而并不是该用户有权限查看的所有项目列表
        subscribedList: [],
        sendTime: '06:00',
        checkAllGroup: []
      }
    },
    mounted() {
      this.init()
    },
    computed: {
      ucid() {
        return this.$store.state.user.ucid
      },
      mail() {
        return this.$store.state.user.mail
      },
      checkAll() {
        return !this.indeterminate && (this.checkAllGroup.length == this.projectList.length) != 0
      },
      indeterminate() {
        let len = this.checkAllGroup.length
        return len ? len != this.projectList.length : false
      }
    },
    methods: {
      async init() {
        let { projectList } = await this.getAllProject()
        let { subscribedList, sendTime, needCallback, protocol, callbackUrl } = await this.getSubscribeProject()

        this.projectList = projectList
        this.sendTime = sendTime
        ;(this.needCallback = needCallback), (this.protocol = protocol), (this.callbackUrl = callbackUrl), (this.subscribedList = subscribedList)
        this.checkAllGroup = this.subscribedList.map((item) => item.projectId)
      },
      handleCheckAll() {
        this.checkAllGroup = !this.checkAll ? this.projectList.map((item) => item.id) : []
      },
      checkAllGroupChange(data) {
        this.checkAllGroup = data
      },
      handleSendTimeChange(time) {
        this.sendTime = time
      },
      // 获取该用户下的所有项目
      getAllProject() {
        return getAllProject().then((res) => {
          return {
            projectList: _.get(res, ['data'], [])
          }
        })
      },
      // 获取该用户订阅的所有项目
      getSubscribeProject() {
        return getSubscribeProject().then((res) => {
          return {
            subscribedList: _.get(res, ['data', 'data'], []),
            sendTime: _.get(res, ['data', 'sendTime'], '06:00'),
            needCallback: !!_.get(res, ['data', 'needCallback'], 0) || false,
            protocol: _.get(res, ['data', 'protocol'], 'http'),
            callbackUrl: _.get(res, ['data', 'callbackUrl'], '')
          }
        })
      },
      // 组合参数
      getParams() {
        let errorMsg = null
        if (this.needCallback && !this.callbackUrl)
          return {
            errorMsg: '回调接口地址不能为空！'
          }
        let list = this.checkAllGroup.map((id) => {
          let item = _.find(this.projectList, (p) => p.id === id) || {}
          let res = {
            id,
            name: item.projectName
          }
          return res
        })

        return {
          list,
          needCallback: !!this.needCallback,
          callbackUrl: this.callbackUrl,
          protocol: this.protocol,
          ucid: this.ucid,
          mail: this.mail,
          sendTime: this.sendTime
        }
      },
      handleConfirm() {
        let params = this.getParams()
        let { errorMsg } = params
        if (errorMsg) return this.$Message.error(errorMsg)

        updateSubscribe(params).then((res) => {
          this.$Message.info(res.msg || res.data)
        })
      }
    }
  }
</script>

<style></style>
