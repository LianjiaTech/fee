<template>
  <div>
    <Button type="primary"
            class='btn_add'
            @click='popUpWin'>新增
    </Button>
    <Modal title="新增用户"
           v-model="projectShowWin"
           okText='添加'
           class-name="vertical-center-modal"
           @on-ok='addOk'
           @on-cancel='addCancel'>
      <Form :model="addUser"
            label-position="left"
            :label-width="100">
        <FormItem label="用户账号">
          <Select multiple
                  v-model="addUser.ucidList"
                  filterable
                  remote
                  :loading="isLoading"
                  :remote-method='filterUser'
                  style="width:300px"
                  placeholder='请输入账号(邮箱前缀)'
                  ref='select'>
            <Option v-for="item in addUser.userList"
                    :value="item.ucid"
                    :key="item.ucid">{{ item.account }}</Option>
          </Select>
        </FormItem>
        <FormItem label="用户角色">
          <Select v-model="addUser.role"
                  style="width:300px"
                  :placeholder='dev'>
            <Option v-for="item in roleList"
                    :value="item.value"
                    :key="item.value">{{ item.label }}</Option>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script>
import { getMemberAdd } from '@/api/member'
import { getUserSearch } from '@/api/user'
import _ from 'lodash'

const ROLE_DEV = 'dev'
const ROLE_OWNER = 'owner'

export default {
  name: 'AddUser',
  props: {},
  data () {
    return {
      projectShowWin: false,
      addUser: {
        ucidList: [],
        role: ROLE_DEV,
        user: []
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
  methods: {
    // 弹窗
    popUpWin () {
      this.projectShowWin = true
      this.$refs['select'].$data.query = ''
    },
    init () {
      this.addUser = {
        ucidList: [],
        role: ROLE_DEV,
        user: []
      }
    },
    // 账号发送，获取ucid,保存添加的用户，刷新用户列表
    async addOk () {
      if (_.isEmpty(this.addUser.ucidList) === false) {
        await this.getMemberAdd(this.addUser)
        this.$Message.info(this.addMsg)
        this.$emit('listenAdd')
      } else {
        this.$Message.info('添加失败，请检查账号')
      }
      this.init()
    },
    // 取消添加
    addCancel () {
      this.$Message.info('取消添加')
      this.init()
    },
    // 添加用户接口
    async getMemberAdd (params = {}) {
      const res = await getMemberAdd({
        ucid_list: params.ucidList,
        role: params.role
      })
      this.addMsg = res.msg
    },
    // 获取用户ucid
    async getUserSearch (param) {
      const res = await getUserSearch({
        account: param,
        st: new Date()
      })
      this.$set(this.addUser, 'userList', res.data)
    },
    filterUser (e) {
      if (e !== '') {
        this.isLoading = true
        let that = this
        _.throttle(function () {
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

<style lang='less' scoped>
.btn_add {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
