<!-- @format -->

<template>
  <div>
    <Card :bordered="false" v-show="!pageState.applyFinish" shadow class="info-card-wrapper">
      <h3>灯塔项目接入申请</h3>
      <br />
      <Form ref="formValidate" :model="formValidate" :rules="ruleValidate" :label-width="80">
        <FormItem label="项目名称" prop="display_name">
          <Input v-model="formValidate.display_name" placeholder="请输入接入项目名称 中文，50字以内,例如：灯塔项目"></Input>
        </FormItem>

        <FormItem label="项目pid" prop="project_name">
          <Input v-model="formValidate.project_name" placeholder="请输入接入项目名称 项目代号(pid),只允许数字&字母&下划线,50字以内,例如:plat_fee"></Input>
        </FormItem>

        <FormItem label="负责人" prop="owner_ucid">
          <Select v-model="formValidate.owner_ucid" filterable remote :loading="pageState.isLoading" :remote-method="filterUser" placeholder="请输入负责人邮箱前缀并选中">
            <Option v-for="item in users.userList" :value="item.ucid" :key="item.ucid">{{ item.account }}</Option>
          </Select>
        </FormItem>

        <Row>
          <Col span="8">
            <FormItem label="姓名" prop="c_desc">
              <Input v-model="formValidate.c_desc" placeholder="项目负责人姓名" :disabled="true" style="width:250px"></Input>
            </FormItem>
          </Col>
          <Col span="4"> </Col>
          <Col span="8">
            <FormItem label="邮箱" prop="mail">
              <Input v-model="formValidate.mail" placeholder="项目负责人邮箱" :disabled="true" style="width:250px"></Input>
            </FormItem>
          </Col>
        </Row>
        <FormItem label="每日pv" prop="pv">
          <Input v-model="formValidate.pv" placeholder="请输入每日得pv数量  项目日均pv:例如:10000(只能填数字)"></Input>
        </FormItem>

        <FormItem label="首页" prop="home_page">
          <Input v-model="formValidate.home_page" placeholder="请输入项目首页地址 项目首页例如:http://arms.lianjia.com,如果没有首页可以填相关地址"></Input>
        </FormItem>

        <FormItem label="备注" prop="apply_desc">
          <Input v-model="formValidate.apply_desc" type="textarea" :autosize="{ minRows: 2, maxRows: 5 }" placeholder="填写备注 （审核人员可以看到）"></Input>
        </FormItem>
        <FormItem>
          <Button type="primary" :loading="pageState.submitLoading" @click="handleSubmit('formValidate')">提交申请</Button>
          <Button :loading="pageState.submitLoading" @click="handleReset('formValidate')" style="margin-left: 8px">
            重置数据
          </Button>
        </FormItem>
      </Form>
    </Card>
    <div class="apply_finish" v-show="pageState.applyFinish">您提交的"{{ formValidate.display_name }}"已经开始审核，请注意查收邮件</div>
  </div>
</template>
<script>
  import _ from 'lodash-es'
  import { getUserSearch } from 'src/api/user'
  import { projectApplyAdd } from 'src/api/project_apply'

  export default {
    data() {
      return {
        pageState: {
          isLoading: false,
          applyFinish: false,
          submitLoading: false
        },
        users: {
          userList: []
        },
        formValidate: {
          display_name: '', //项目名称
          project_name: '', //项目Pid
          c_desc: '', //备注  会被转化为负责人姓名
          mail: '', //负责人邮箱 会被自动转化
          rate: 10000, //数据抽样比
          pv: '', // PV数据
          home_page: '', // 项目首页地址
          owner_ucid: '', // ucid
          apply_desc: '', // 申请备注
          apply_ucid: '', //申请人的ucid
          apply_nick_name: '', //申请人的名字
          apply_mail: '' //申请人的邮箱
        },
        ruleValidate: {
          display_name: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }],
          project_name: [
            { required: true, message: '项目pid不能为空', trigger: 'blur' },
            { validator: this.validatorPid, trigger: 'blur' }
          ],
          pv: [
            { required: true, message: '必须填写pv', trigger: 'blur' },
            { validator: this.validatorNumber, trigger: 'blur' }
          ],
          home_page: [
            { required: true, message: '必须填写项目主页', trigger: 'blur' },
            { validator: this.validatorHomePage, trigger: 'blur' }
          ],
          c_desc: [{ required: true, message: '负责人姓名不能为空', trigger: 'blur' }],
          mail: [
            { required: true, message: '邮箱不能为空', trigger: 'blur' },
            { type: 'email', message: '邮箱地址必须符合邮箱格式', trigger: 'blur' }
          ],
          owner_ucid: [{ required: true, validator: this.validatorUcid, trigger: 'blur' }]
        }
      }
    },
    watch: {
      'formValidate.owner_ucid'(ucid) {
        const userDetail = this.users.userList.find((userDetail) => userDetail.ucid === ucid)
        const { name, email } = userDetail
        this.formValidate.mail = email
        this.formValidate.c_desc = `负责人:${name}`
      },
      'formValidate.pv'(pv) {
        const num = parseInt(pv)
        if (num > 10000000) {
          //大于1000万 1%
          this.formValidate.rate = 100
        } else if (num > 1000000) {
          //大于100万 10%
          this.formValidate.rate = 1000
        } else {
          //其他 100%
          this.formValidate.rate = 10000
        }
      }
    },
    methods: {
      validatorHomePage(rule, value, callback) {
        if (!/^https*:\/\//.test(value)) {
          callback(new Error('必须是已http://或https://开头的网站'))
        }
        callback()
      },
      validatorNumber(rule, value, callback) {
        if (!/^\d+$/.test(value)) {
          callback(new Error('pv必须是一个数字'))
        }
        callback()
      },
      validatorPid(rule, value, callback) {
        // 校验pid是否重复
        // 专门出个接口校验pid 是否存在

        callback()
      },
      validatorUcid(rule, value, callback) {
        if (!_.isNumber(value)) {
          callback(new Error('请选择负责人'))
        }
        callback()
      },
      // 筛选user
      async getUserSearch(param) {
        const res = await getUserSearch({
          account: param,
          st: new Date()
        })
        let data = _.get(res, ['data'], []).filter((item) => item.account)
        this.$set(this.users, 'userList', data)
      },
      filterUser(e) {
        if (e !== '') {
          this.pageState.isLoading = true
          _.throttle(() => {
            this.pageState.isLoading = false
            this.getUserSearch(e)
          }, 100)()
        } else {
          this.users.userList = []
        }
      },
      async handleSubmit(name) {
        const valid = await new Promise((resolve) => this.$refs[name].validate((valid) => resolve(valid)))
        if (!valid) {
          return this.$Message.error('申请表单校验出错')
        }
        const userData = _.get(this.$store.state, ['user'], {})
        const { mail, ucid, userName } = userData
        if (!mail || !ucid || !userName) {
          return this.$Message.error('用户信息不全请重新登录')
        }
        this.formValidate.apply_ucid = ucid
        this.formValidate.apply_nick_name = userName
        this.formValidate.apply_mail = mail
        // this.pageState.submitLoading = true
        const result = await projectApplyAdd(this.formValidate)
        this.pageState.submitLoading = false
        if (result) {
          this.$Message.success('接入申请提交成功，请等待邮件回复')
          this.pageState.applyFinish = true
        }
      },
      handleReset(name) {
        this.$refs[name].resetFields()
      }
    }
  }
</script>

<style lang="less" scoped>
  .info {
    font-size: 10px;
    color: #828282;
    text-indent: 25px;
    padding: 14px;
  }

  .apply_finish {
    text-align: center;
    justify-content: center;
    display: flex;
    min-height: 300px;
    align-items: center;
    font-size: 28px;
    color: #448ce9;
  }
</style>
