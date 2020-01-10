<!-- @format -->

<template>
  <Row class="pg-manage_project">
    <Form ref="formValidate" :model="formValidate" :rules="ruleValidate" :label-width="80">
      <Form-item label="项目名" prop="pname">
        <Input v-model="formValidate.pname" placeholder="项目名称" style="width: 300px;"></Input>
      </Form-item>
      <Form-item label="项目ID" prop="pid">
        <Input
          :disabled="!pageState.changePidEnable"
          v-model="formValidate.pid"
          style="width: 300px;"
        ></Input>
        <Tooltip content="仅项目Owner和管理员可以修改此项">
          <i-switch size="small" :disabled="!canEditAll" v-model="pageState.changePidEnable"></i-switch>
        </Tooltip>
      </Form-item>
      <Form-item label="项目主页" prop="homePage">
        <Input v-model="formValidate.homePage" style="width: 300px;"></Input>
      </Form-item>
      <Form-item label="负责人" prop="ucid">
        <Select
          remote
          filterable
          clearable
          label-in-value
          :value="formValidate.ucid"
          :loading="pageState.searchingUser"
          :remote-method="filterUser"
          @on-change="handlePeopleInChargeChange"
          placeholder="请输入负责人邮箱前缀并选中"
          style="width: 300px;"
        >
          <Option
            v-for="item in users"
            :value="item.ucid"
            :key="item.ucid"
            :label="`${item.name}(${item.email})`"
          ></Option>
        </Select>
      </Form-item>
      <Form-item>
        <Button :loading="pageState.submiting" type="primary" @click="handleSubmit('formValidate')">
          <span v-if="!pageState.submiting">提交</span>
          <span v-else>处理中...</span>
        </Button>
        <Button :disabled="!canEditAll" @click="handleOffline()" style="margin-left: 8px">下线</Button>
      </Form-item>
    </Form>
  </Row>
</template>
<script>
  import _ from 'lodash-es'
  import { getUserSearch } from 'src/api/user'
  import { getProjectInfo, updateProjectInfo, deleteProject } from 'src/api/project/index'
  import user from 'src/store/module/user'

  export default {
    data() {
      return {
        users: [],
        pageState: {
          searchingUser: false,
          changePidEnable: false,
          submiting: false
        },
        formValidate: {
          pname: '',
          pid: '',
          homePage: '',
          ucid: '',
          delete: 0
        },
        projectInfo: {},
        ruleValidate: {
          pname: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }],
          pid: [{ required: true, message: '项目ID不能为空', trigger: 'blur' }],
          ucid: [
            {
              type: 'number',
              required: true,
              message: '项目负责人不能为空',
              trigger: 'blur'
            }
          ],
          homePage: [{ required: true, message: '项目主页不能为空', trigger: 'blur' }]
        }
      }
    },
    mounted() {
      this.getProjectData()
    },
    computed: {
      canEditAll() {
        let access = _.get(this.$store, ['state', 'user', 'access'], ['dev'])
        return access.includes('owner') || _.get(this.$store, ['state', 'user', 'sysRole'], 'dev') === 'admin'
      },
      projectId() {
        return _.get(this.$route, ['params', 'id'], 0)
      }
    },
    methods: {
      async getProjectData() {
        let res = await getProjectInfo(this.projectId).catch((e) => {
          this.$Message.error(e.message || e.stack || e)
          return {}
        })
        let { data: info } = res
        let account = _.get(info, 'mail', '').split('@')[0]
        let ucid = ''
        let mail = ''
        let uname = ''

        if (account) {
          let userInfo = await getUserSearch({
            account: account,
            st: new Date()
          })
          let userInfoList = _.get(userInfo, ['data'], [])
          let users = userInfoList.filter((user) => user.email === info.mail)
          ucid = _.get(users, [0, 'ucid'], '')
          mail = _.get(users, [0, 'email'], '')
          uname = _.get(users, [0, 'name'], '')
          this.users = users
        }
        this.formValidate = {
          id: this.projectId,
          pname: info.display_name,
          pid: info.project_name,
          homePage: info.home_page,
          desc: `负责人:${uname}`,
          mail,
          ucid
        }
        // 存档
        this.projectInfo = {
          ...this.formValidate
        }
      },
      // 筛选user
      async getUserSearch(param) {
        const res = await getUserSearch({
          account: param,
          st: new Date()
        })
        this.users = _.get(res, ['data'], []).filter((item) => item.account)
      },
      // 负责人
      handlePeopleInChargeChange(option) {
        if (option) {
          let { label, value } = option
          let [val, name, mail] = label.match(/(.*)\((.*)\)/)
          this.formValidate = {
            ...this.formValidate,
            desc: `负责人:${name}`,
            mail,
            ucid: value
          }
        }
      },
      // 查询用户
      filterUser: _.throttle(function(e) {
        e && this.getUserSearch(e)
      }, 800),
      // 提交
      handleSubmit(name) {
        this.$refs[name].validate((valid) => {
          if (valid) return this.submit()
          this.$Message.error('表单验证失败!')
        })
      },
      handleOffline() {
        if (!this.canEditAll) return
        this.$Modal.confirm({
          title: '确定要下线该项目吗？',
          content: '项目下线后将不再采集该项目的数据，若想要恢复上线，请联系管理员处理！',
          onOk: async () => {
            let params = {
              id: this.projectId,
              delete: 1
            }
            let res = await deleteProject(params).catch((e) => false)
            if (res) {
              this.$Message.info(res.msg)
              this.$router.push({
                name: 'base'
              })
            }
          },
          onCancel: () => {}
        })
      },
      async submit() {
        this.pageState.submiting = true
        if (!this.canEditAll || !this.pageState.changePidEnable) {
          delete this.formValidate.pid
        }
        let res = await updateProjectInfo(this.formValidate).catch((e) => false)
        res && this.$Message.info(res.msg)
        this.getProjectData()
        this.pageState.submiting = false
      }
    }
  }
</script>
<style lang="less" scoped>
  .pg-manage_project {
    padding: 30px;
    background-color: #fff;
  }
</style>
