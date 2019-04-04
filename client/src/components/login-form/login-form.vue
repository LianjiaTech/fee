<template>
  <Form ref="loginForm"
        :model="form"
        :rules="rules"
        @keydown.enter.native="handleSubmit">
    <FormItem>
      <RadioGroup v-model="form.loginType">
        <Radio label="normal">
          <span>普通登录</span>
        </Radio>
        <!-- <Radio label="uc">
            <span>UC登录</span>
        </Radio> -->
      </RadioGroup>
    </FormItem>
    <FormItem prop="userName">
      <!-- <div v-if="form.loginType === 'uc'">
        <Input v-model="form.userName" placeholder="请输入用户名">
          <span slot="prepend">
            <Icon :size="16" type="ios-person"></Icon>
          </span>
          <span slot="append">@qq.com</span>
        </Input>
      </div> -->
      <div v-if="form.loginType === 'normal'">
        <div>
          <Input v-model="form.userName"
                 placeholder="请输入邮箱">
          <span slot="prepend">
            <Icon :size="16"
                  type="ios-person"></Icon>
          </span>
          </Input>
        </div>
      </div>
    </FormItem>
    <FormItem prop="password">
      <Input type="password"
             v-model="form.password"
             placeholder="请输入密码">
      <span slot="prepend">
        <Icon :size="14"
              type="md-lock"></Icon>
      </span>
      </Input>
    </FormItem>
    <FormItem>
      <Button @click="handleSubmit"
              type="primary"
              long>登录</Button>
    </FormItem>
  </Form>
</template>
<script>
  export default {
    name: 'LoginForm',
    props: {
      userNameRules: {
        type: Array,
        default: () => {
          return [
            {required: true, message: '账号不能为空', trigger: 'blur'}
          ]
        }
      },
      passwordRules: {
        type: Array,
        default: () => {
          return [
            {required: true, message: '密码不能为空', trigger: 'blur'}
          ]
        }
      }
    },
    data () {
      return {
        form: {
          userName: '',
          password: '',
          loginType: 'normal'
        }
      }
    },
    computed: {
      rules () {
        return {
          userName: this.userNameRules,
          password: this.passwordRules
        }
      }
    },
    methods: {
      handleSubmit () {
        this.$refs.loginForm.validate((valid) => {
          if (valid) {
            this.$emit('on-success-valid', {
              account: this.form.userName,
              password: this.form.password,
              loginType: this.form.loginType
            })
          }
        })
      }
    }
  }
</script>
