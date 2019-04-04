<template>
  <Form ref="loginForm" :model="form" :rules="rules" @keydown.enter.native="handleSubmit">
    <FormItem prop="account">
      <Input v-model="form.account" placeholder="请输入邮箱">
        <span slot="prepend">
          <Icon :size="16" type="ios-at"></Icon>
        </span>
      </Input>
    </FormItem>
    <FormItem prop="nickname">
      <Input v-model="form.nickname" placeholder="请输入昵称">
        <span slot="prepend">
          <Icon :size="16" type="ios-person"></Icon>
        </span>
      </Input>
    </FormItem>
    <FormItem prop="password">
      <Input type="password" v-model="form.password" placeholder="请输入密码">
        <span slot="prepend">
          <Icon :size="14" type="md-lock"></Icon>
        </span>
      </Input>
    </FormItem>
    <FormItem prop="confirmPassword">
      <Input type="password" v-model="form.confirmPassword" placeholder="再次输入密码">
        <span slot="prepend">
          <Icon :size="14" type="md-lock"></Icon>
        </span>
      </Input>
    </FormItem>
    <FormItem>
      <Button @click="handleSubmit" type="primary" long>注册</Button>
    </FormItem>
  </Form>
</template>
<script>
export default {
  name: "LoginForm",
  props: {
    accountRules: {
      type: Array,
      default: () => {
        return [{ required: true, message: "账号不能为空", trigger: "blur" }];
      }
    },
    passwordRules: {
      type: Array,
      default: () => {
        return [{ required: true, message: "密码不能为空", trigger: "blur" }];
      }
    },
    nicknameRules: {
      type: Array,
      default: () => {
        return [{ required: true, message: "名字不能为空", trigger: "blur" }];
      }
    }
  },
  data() {
    const checkConfirmPassword = (rule, value, callback) => {
      if (value === "") {
        callback(new Error("密码不能为空"));
      } else if (value !== this.form.password) {
        callback(new Error("两次密码不一致"));
      } else {
        callback();
      }
    };
    return {
      form: {
        account: "",
        password: "",
        confirmPassword: "",
        nickname: ""
      },
      checkConfirmPassword
    };
  },
  computed: {
    rules() {
      return {
        account: this.accountRules,
        password: this.passwordRules,
        confirmPassword: [{ validator: this.checkConfirmPassword, trigger: "blur" }],
        nickname: this.nicknameRules
      };
    }
  },
  methods: {
    handleSubmit() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.$emit("on-success-valid", {
            account: this.form.account,
            password: this.form.password,
            nickname: this.form.nickname
          });
        }
      });
    }
  }
};
</script>
