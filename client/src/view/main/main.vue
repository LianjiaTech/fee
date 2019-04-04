<template>
  <Layout
    style="height: 100%"
    class="main"
  >
    <Sider
      hide-trigger
      collapsible
      :width="200"
      :collapsed-width="64"
      v-model="collapsed"
      class="left-sider"
      :style="{overflow: 'hidden'}"
    >
      <side-menu
        accordion
        ref="sideMenu"
        :active-name="$route.name"
        :collapsed="collapsed"
        @on-select="turnToPage"
        :menu-list="menuList"
      >
        <!-- 需要放在菜单上面的内容，如Logo，写在side-menu标签内部，如下 -->
        <div class="logo-con">
          <router-link :to="{path:`/project/${getProjectId()}/home`}">
            <img
              v-show="!collapsed"
              :src="maxLogo"
              key="max-logo"
            />
          </router-link>

        </div>
      </side-menu>
    </Sider>
    <Layout>
      <Header class="header-con">
        <header-bar
          :collapsed="collapsed"
          @on-coll-change="handleCollapsedChange"
        >
          <user />
          <a href="">
            help
            <toolTip
              content='产品文档'
              type='md-help-circle'
              style=""
            ></toolTip>
          </a>
          <dropdownList></dropdownList>
        </header-bar>
      </Header>
      <Content class="main-content-con">
        <Layout class="main-layout-con">
          <div class="tag-nav-wrapper">
            <tags-nav
              :value="$route"
              @input="handleClick"
              :list="tagNavList"
              @on-close="handleCloseTag"
            />
          </div>
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
  import TagsNav from './components/tags-nav'
  import User from './components/user'
  import dropdownList from './components/dropdownList'
  import { mapActions, mapMutations } from 'vuex'
  import { getNewTagList, getNextName, getProjectId } from '@/libs/util'
  import minLogo from '@/assets/images/logo-min.jpg'
  import maxLogo from '@/assets/images/logo.png'
  import './main.less'
  import { getProjectList } from '@/api/project'
  // import { getLoginUserInfo } from '@/api/user.js'
  import ToolTip from '@/view/components/toolTip'

  export default {
    name: 'Main',
    components: {
      SideMenu,
      HeaderBar,
      TagsNav,
      User,
      dropdownList,
      ToolTip
    },
    data () {
      return {
        collapsed: false,
        minLogo,
        maxLogo,
        isFullscreen: false,
        rendering: true,
        userAvatar: 'http://ww1.sinaimg.cn/large/00749HCsly1fwofq2t1kaj30qn0qnaai.jpg',
        userNickname: '',
        registerType: ''
      }
    },
    computed: {
      tagNavList () {
        return this.$store.state.app.tagNavList
      },
      tagRouter () {
        return this.$store.state.app.tagRouter
      },
      cacheList () {
        return this.tagNavList.length ? this.tagNavList.filter(item => !(item.meta && item.meta.notCache)).map(item => item.name) : []
      },
      menuList () {
        return this.$store.getters.menuList
      },
      local () {
        return this.$store.state.app.local
      }
    },
    methods: {
      ...mapMutations([
        'setBreadCrumb',
        'setTagNavList',
        'addTag',
        'setLocal'
      ]),
      ...mapActions([
        'handleLogin'
      ]),
      turnToPage (name) {
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
      handleCollapsedChange (state) {
        this.collapsed = state
      },
      handleCloseTag (res, type, name) {
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
      handleClick (item) {
        this.turnToPage(item.name)
      },
      async getProjectList () {
        const res = await getProjectList()
        const list = res.data
        let map = {}
        list.map(element => {
          if (!map[element.id]) {
            map[element.id] = element
          }
        })
        if (map[getProjectId()].role === 'owner') {
          this.$store.commit('setAccess', ['owner'])
        } else {
          this.$store.commit('setAccess', ['dev'])
        }
      },
      getProjectId
    },
    watch: {
      '$route' (newRoute) {
        this.setBreadCrumb(newRoute.matched)
        this.setTagNavList(getNewTagList(this.tagNavList, newRoute))
      }
    },
    mounted () {
      /**
       * @description 初始化设置面包屑导航和标签导航
       */
      this.setTagNavList()
      this.addTag(this.$store.state.app.homeRoute)
      this.setBreadCrumb(this.$route.matched)
      // 设置初始语言
      this.setLocal(this.$i18n.locale)
      this.getProjectList()
      this.$bus.$on('render', (rendering) => {
        this.rendering = rendering
      })
    }
  }
</script>
