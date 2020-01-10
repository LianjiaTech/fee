<!-- @format -->

<template>
  <Layout style="height: 100%" class="main">
    <Sider hide-trigger collapsible :width="200" :collapsed-width="64" v-model="collapsed" class="left-sider" :style="{ overflow: 'hidden' }">
      <side-menu accordion ref="sideMenu" :active-name="$route.name" :collapsed="collapsed" @on-select="turnToPage" :menu-list="menuList">
        <div class="logo-con">
          <router-link :to="{ path: `/project/${getProjectId()}/home` }">
            <img v-show="!collapsed" :src="maxLogo" key="max-logo" />
          </router-link>
        </div>
      </side-menu>
    </Sider>
    <Layout>
      <Header class="header-con">
        <header-bar :collapsed="collapsed" @on-coll-change="handleCollapsedChange">
          <user />
          <a href="#" target="_blank"
            >文档
            <toolTip content="产品文档" type="md-help-circle" style></toolTip>
          </a>
          <dropdownList></dropdownList>
        </header-bar>
      </Header>
      <Content class="main-content-con">
        <Layout class="main-layout-con">
          <Content class="content-wrapper">
            <keep-alive :include="cacheList">
              <router-view v-if="rendering" />
            </keep-alive>
          </Content>
        </Layout>
      </Content>
    </Layout>
  </Layout>
</template>
<script>
  import SideMenu from './components/side-menu'
  import HeaderBar from './components/header-bar'
  import User from './components/user'
  import dropdownList from './components/dropdownList'
  import { mapActions, mapMutations } from 'vuex'
  import { getNewTagList, getNextName, getProjectId } from 'src/libs/util'
  import minLogo from 'src/assets/images/logo-min.jpg'
  import maxLogo from 'src/assets/images/logo.png'
  import './main.less'
  import ToolTip from 'src/components/toolTip'

  export default {
    name: 'Main',
    components: {
      SideMenu,
      HeaderBar,
      User,
      dropdownList,
      ToolTip
    },
    data() {
      return {
        collapsed: false,
        minLogo,
        maxLogo,
        isFullscreen: false,
        rendering: true,
        userAvatar: '',
        userNickname: '',
        registerType: ''
      }
    },
    computed: {
      tagNavList() {
        return this.$store.state.app.tagNavList
      },
      tagRouter() {
        return this.$store.state.app.tagRouter
      },
      cacheList() {
        return this.tagNavList.length ? this.tagNavList.filter((item) => !(item.meta && item.meta.notCache)).map((item) => item.name) : []
      },
      menuList() {
        return this.$store.getters.menuList
      }
    },
    methods: {
      ...mapMutations(['setBreadCrumb', 'setTagNavList', 'addTag']),
      ...mapActions(['handleLogin', 'getProjectList']),
      turnToPage(name) {
        if (name.indexOf('isTurnByHref_') > -1) {
          window.open(name.split('_')[1])
          return
        }
        this.$router.push({
          name: name,
          params: {
            id: getProjectId()
          }
        })
      },
      handleCollapsedChange(state) {
        this.collapsed = state
      },
      handleCloseTag(res, type, name) {
        const nextName = getNextName(this.tagNavList, name)
        this.setTagNavList(res)
        let openName = ''
        if (type === 'all') {
          this.turnToPage('home')
          openName = 'home'
        } else if (this.$route.name === name) {
          this.turnToPage(nextName)
          openName = nextName
        }
        this.$refs.sideMenu.updateOpenName(openName)
      },
      handleClick(item) {
        this.turnToPage(item.name)
      },
      getProjectId
    },
    watch: {
      $route(newRoute) {
        this.setBreadCrumb(newRoute.matched)
        this.setTagNavList(getNewTagList(this.tagNavList, newRoute))
      }
    },
    mounted() {
      /**
       * @description 初始化设置面包屑导航和标签导航
       */
      this.setTagNavList()
      this.addTag(this.$store.state.app.homeRoute)
      this.setBreadCrumb(this.$route.matched)
      // 设置初始语言
      this.$bus.$on('render', (rendering) => {
        this.rendering = rendering
      })
    }
  }
</script>
