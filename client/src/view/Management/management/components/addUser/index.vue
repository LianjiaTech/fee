<!-- @format -->

<template>
  <div>
    <Button type="primary" class="btn_add" @click="popUpWin">新增</Button>
    <Modal
      title="新增用户"
      v-model="projectShowWin"
      okText="添加"
      class-name="vertical-center-modal"
      @on-ok="addOk"
      @on-cancel="addCancel"
    >
      <Form :model="addUser" label-position="left" :label-width="100">
        <FormItem label="用户账号">
          <Select
            multiple
            v-model="addUser.ucidList"
            filterable
            remote
            :loading="isLoading"
            :remote-method="filterUser"
            style="width:300px"
            placeholder="请输入账号(邮箱前缀)"
            ref="select"
          >
            <Option v-for="item in addUser.userList" :value="item.ucid" :key="item.ucid"
              >{{ item.name }}({{ item.account }})</Option
            >
          </Select>
        </FormItem>
        <FormItem label="用户角色">
          <Select v-model="addUser.role" style="width:300px" :placeholder="dev">
            <Option v-for="item in roleList" :value="item.value" :key="item.value">{{
              item.label
            }}</Option>
          </Select>
        </FormItem>
        <FormItem label="加入项目">
          <Select
            multiple
            filterable
            v-model="addUser.pidList"
            :loading="isLoading"
            style="width:300px"
            placeholder="可将成员加入多个项目"
            ref="select"
          >
            <Option v-for="item in projectList" :value="item.id" :key="item.id">{{
              item.display_name
            }}</Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script>
  import { getMemberAdd } from 'src/api/member'
  import { getUserSearch } from 'src/api/user'
  import _ from 'lodash'

  const ROLE_DEV = 'dev'
  const ROLE_OWNER = 'owner'

  export default {
    name: 'AddUser',
    props: {},
    data() {
      return {
        projectShowWin: false,
        addUser: {
          ucidList: [],
          role: ROLE_DEV,
          user: [],
          pidList: []
        },
        roleList: [
          {
            value: ROLE_DEV,
            label: 'dev'
          },
          {
            value: ROLE_OWNER,
            label: 'owner'
          }
        ],
        addMsg: false,
        dev: ROLE_DEV,
        isLoading: false,
        isShow: false
      }
    },
    computed: {
      projectList() {
        return this.$store.state.app.projectList
      }
    },
    methods: {
      // 弹窗
      popUpWin() {
        this.projectShowWin = true
        this.$refs['select'].$data.query = ''
      },
      init() {
        this.addUser = {
          ucidList: [],
          role: ROLE_DEV,
          user: [],
          pidList: []
        }
      },
      // 账号发送，获取ucid,保存添加的用户，刷新用户列表
      async addOk() {
        if (_.isEmpty(this.addUser.ucidList)) {
          this.$Message.info('添加失败，请选择要添加的账号')
          return
        }
        if (_.isEmpty(this.addUser.pidList)) {
          this.$Message.info('添加失败，请选择要加入的项目')
          return
        }
        await this.getMemberAdd(this.addUser)
        this.$Message.info(this.addMsg)
        this.$emit('listenAdd')
        this.init()
      },
      // 取消添加
      addCancel() {
        this.$Message.info('取消添加')
        this.init()
      },
      // 添加用户接口
      async getMemberAdd(params = {}) {
        const res = await getMemberAdd({
          ucid_list: params.ucidList,
          role: params.role,
          pids: params.pidList
        })
        this.addMsg = res.msg
      },
      // 获取用户ucid
      async getUserSearch(param) {
        if (!param) return
        const res = await getUserSearch({
          account: param,
          st: new Date()
        })
        let data = _.get(res, ['data'], []).filter((item) => item.account)
        this.$set(this.addUser, 'userList', data)
      },
      filterUser(e) {
        if (e !== '') {
          this.isLoading = true
          let that = this
          _.throttle(function() {
            that.isLoading = false
            that.getUserSearch(e)
          }, 100)()
        } else {
          this.addUser.userList = []
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  .btn_add {
    position: absolute;
    top: 10px;
    right: 10px;
  }
</style>
