<template>
  <div>
    <div class="layout">
      <Layout>
        <Header :style="{position: 'fixed', width: '100%'}">
          <h1 style="color:#fff;text-align:center">欢迎登录项目列表页</h1>
        </Header>
        <Content :style="{margin: '88px 20px 0', background: '#fff', minHeight: '500px'}">
          <router-view/>
        </Content>
        <Footer class="layout-footer-center"></Footer>
      </Layout>
    </div>
  </div>

</template>
<script>
  export default {
    name: 'ParentView'
  }
</script>
