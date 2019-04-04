<template>
  <div class="user-avator-dropdown">
    <Dropdown @on-click="handleClick">
      <span style='color: #2D8cF0;'>{{userForm.nickname}}</span>
      <DropdownMenu slot="list">
        <DropdownItem name="message"
                      v-if="userForm.registerType === 'site'">修改信息</DropdownItem>
        <DropdownItem name="password"
                      v-if="userForm.registerType === 'site'">修改密码</DropdownItem>
        <DropdownItem name="destroy"
                      v-if="userForm.registerType === 'site'">注销账号</DropdownItem>
        <DropdownItem name="logout">退出登录</DropdownItem>
      </DropdownMenu>
    </Dropdown>
    <Modal v-model="isEditMessage"
           title="编辑信息"
           @on-ok="handleMessageOk"
           @on-cancel="handleCancel"
           width="300">
      <Form :model="userForm"
            :rules="rules.messageRules"
            ref="message">
        <FormItem prop="nickname"
                  :rules="rules.messageRules.nickname">昵称
          <Input type="text"
                 v-model="userForm.nickname"
                 :placeholder="nicknamePlaceholder">
          <Icon type="ios-person"
                slot="prepend"></Icon>
          </Input>
        </FormItem>
      </Form>
    </Modal>
    <Modal v-model="isEditPassword"
           title="修改密码"
           @on-ok="handlePasswordOk"
           @on-cancel="handleCancel">
      <Form :model="passwordForm"
            :rules="rules.passwordRules"
            ref="password">
        <FormItem prop="oldPassword"
                  :rules="rules.passwordRules.oldPassword">
          <Input type="password"
                 v-model="passwordForm.oldPassword"
                 placeholder="旧密码">
          <Icon type="ios-lock"
                slot="prepend"></Icon>
          </Input>
        </FormItem>
        <FormItem prop="password"
                  :rules="rules.passwordRules.password">
          <Input type="password"
                 v-model="passwordForm.password"
                 placeholder="新密码">
          <Icon type="ios-lock"
                slot="prepend"></Icon>
          </Input>
        </FormItem>
        <FormItem prop="confirmPassword"
                  :rules="rules.passwordRules.confirmPassword">
          <Input type="password"
                 v-model="passwordForm.confirmPassword"
                 placeholder="确认密码">
          <Icon type="ios-lock"
                slot="prepend"></Icon>
          </Input>
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<script>
import './user.less'
import { mapActions } from 'vuex'
import {
  modifyPassword,
  modifyMessage,
  getLoginUserInfo,
  destroyAccount as apiDestroyAccount
} from 'src/api/user'
export default {
  name: 'User',
  mounted () {
    this.getLoginUserData()
  },
  data () {
    const checkNickname = (rule, value, next) => {
      if (value === '') {
        next(new Error('昵称不能为空'))
      } else if (value === this.nicknamePlaceholder) {
        next(new Error('昵称未修改'))
      } else {
        next()
      }
    }
    const checkOldPassword = (rule, value, next) => {
      if (value === '') {
        next(new Error('密码不能为空'))
      } else {
        next()
      }
    }
    const checkPassword = (rule, value, next) => {
      if (value === '') {
        next(new Error('密码不能为空'))
      } else if (value === this.passwordForm.oldPassword) {
        next(new Error('新旧密码不能相同'))
      } else {
        next()
      }
    }
    const checkConfirmPassword = (rule, value, next) => {
      if (value === '') {
        next(new Error('密码不能为空'))
      } else if (value !== this.passwordForm.password) {
        next(new Error('两次密码不相同'))
      } else {
        next()
      }
    }
    return {
      userForm: {
        userAvator: '',
        password: '',
        nickname: '',
        registerType: ''
      },
      passwordForm: {
        oldPassword: '',
        password: '',
        confirmPassword: ''
      },
      nicknamePlaceholder: '',
      isEditMessage: false,
      isEditPassword: false,
      rules: {
        messageRules: {
          nickname: [{ validator: checkNickname, trigger: 'blur' }]
        },
        passwordRules: {
          oldPassword: [{ validator: checkOldPassword, trigger: 'blur' }],
          password: [{ validator: checkPassword, trigger: 'blur' }],
          confirmPassword: [
            { validator: checkConfirmPassword, trigger: 'blur' }
          ]
        }
      }
    }
  },
  methods: {
    ...mapActions(['handleLogOut']),
    handleClick (name) {
      switch (name) {
        case 'logout':
          this.handleLogOut().then(() => {
            this.$router.push({
              name: 'login'
            })
          })
          break
        case 'message':
          this.isEditMessage = true
          break
        case 'password':
          this.isEditPassword = true
          break
        case 'destroy':
          this.handelDestroyAccount()
          break
      }
    },
    async getLoginUserData () {
      const res = await getLoginUserInfo()
      this.userForm.userAvator = res.data.avatar_url
      this.userForm.nickname = res.data.nickname
      this.nicknamePlaceholder = res.data.nickname
      this.userForm.registerType = res.data.register_type
    },
    handelDestroyAccount () {
      this.$Modal.confirm({
        title: '确认注销此账号？',
        onOk: () => {
          this.destroyAccount()
        },
        onCancel: () => { }
      })
    },
    async destroyAccount () {
      const result = await apiCancelAccount()
      this.$Message.info(result.msg)
      if (result.action === 'success') {
        this.$nextTick(() => {
          this.$router.push({
            name: 'login'
          })
        })
      }
    },
    async handleMessageOk () {
      this.$refs['message'].validate(async valid => {
        if (valid) {
          if (this.userForm.nickname === '') {
            this.$Message.info('昵称不能为空')
            this.$nextTick(() => {
              this.isEditMessage = true
            })
            return
          }
          const result = await modifyMessage({
            nickname: this.userForm.nickname
          })
          this.$Message.info(result.msg)
          if (result.action === 'success') {
            await this.getLoginUserData()
            this.userForm.nickname = ''
          }
        } else {
          this.$Message.error('修改失败,请仔细阅读提示')
        }
      })
    },
    async handlePasswordOk () {
      this.$refs['password'].validate(async valid => {
        if (valid) {
          if (
            this.passwordForm.oldPassword === '' ||
            this.passwordForm.password === '' ||
            this.passwordForm.confirmPassword === ''
          ) {
            this.$Message.info('密码输入异常，请重试')
            this.$nextTick(() => {
              this.isEditPassword = true
            })
          }
          const result = await modifyPassword({
            oldPassword: this.passwordForm.oldPassword,
            password: this.passwordForm.password,
            confirmPassword: this.passwordForm.confirmPassword
          })
          if (result.action === 'success') {
            this.passwordForm = {
              oldPassword: '',
              password: '',
              confirmPassword: ''
            }
          } else {
            this.$nextTick(() => {
              this.isEditPassword = true
            })
          }
          this.$Message.info(result.msg)
        } else {
          this.$Message.error('修改失败,请仔细阅读提示')
        }
      })
    },
    handleCancel () {
      this.passwordForm = {
        oldPassword: '',
        password: '',
        confirmPassword: ''
      }
      this.userForm.nickname = ''
    }
  }
}
</script>
<style lang="less" scoped>
.user-avator-dropdown {
  display: inline-block;
  margin-left: 10px;
}
</style>