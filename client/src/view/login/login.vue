<template>
  <div class="login">
    <div class="login-con">
      <Card>
        <p slot="title">
          <Icon type="ios-ionitron-outline"></Icon>
          欢迎
        </p>
        <a href="#" slot="extra" @click.prevent="changeModel">
          {{ showTip }}
        </a>
        <login-form @on-success-valid="login" v-if="isLogin"></login-form>
        <register-form @on-success-valid="register" v-else-if="!isLogin"></register-form>
      </Card>
    </div>
  </div>
</template>

<script>
  import config from 'src/config'
  import JSEncrypt from 'jsencrypt'
  import { mapActions } from 'vuex'
  import LoginForm from '_c/login-form'
  import RegisterForm from '_c/register-form'
  import { register } from '@/api/user'

  const publicKey = config.publicKey

  const encrypt = new JSEncrypt()
  encrypt.setPublicKey(publicKey)

  export default {
    components: {
      LoginForm,
      RegisterForm
    },
    data() {
      return {
        showTip: '去注册',
        isLogin: true,
        loginType: 'uc'
      }
    },
    methods: {
      ...mapActions(['handleLogin', 'getUserInfo']),
      login({ account, password, loginType }) {
        this.handleLogin({ account, password: encrypt.encrypt(password), loginType }).then((res) => {
          this.$router.push({
            name: 'home',
            params: {
              id: 1
            }
          })
        })
      },
      async register({ account, password, nickname }) {
        const result = await register({
          account,
          password: encrypt.encrypt(password),
          nickname
        })
        this.$Message.info(result.msg)
        if (result.action === 'success') {
          this.changeModel()
        }
      },
      changeModel() {
        this.isLogin = !this.isLogin
        if (this.isLogin) {
          this.showTip = '去注册'
        } else {
          this.showTip = '去登录'
        }
      }
    }
  }
</script>
<style lang="less" scoped>
  @import './login.less';
</style>
