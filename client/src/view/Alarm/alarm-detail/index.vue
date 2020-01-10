<!-- @format -->

<template>
  <div>
    <h2 v-show="name" class="project-name">{{ name }}（共{{ total }}条）</h2>
    <Scroll
      ref="scroll-container"
      style="-webkit-overflow-scrolling: touch;"
      :on-reach-bottom="handleReachBottom"
      :height="scrollHeight"
      :distance-to-edge="-20"
      loading-text="加载中..."
    >
      <Card shadow :padding="10" :style="styleObj" v-for="(item, index) in database" :key="item.index">
        <p slot="title">
          <Icon type="ios-close-circle" color="red" size="18" />
          <span class="card-title">{{ item.error_name }}</span>
        </p>
        <a href="#" slot="extra" @click.prevent="makeCopy(JSON.stringify(item.ext, null, 2))">复制</a>
        <div class="error-extra_info">
          <pre v-html="syntaxHighlight(JSON.stringify(item.ext, null, 2))"></pre>
        </div>
        <div class="card-foot">
          <Tag color="primary">{{ transTime(item.log_at) }}</Tag>
          <Icon type="ios-alarm" size="24" />
        </div>
      </Card>
    </Scroll>
    <BackTop :style="{ display: display }" @on-click="toTop"></BackTop>
  </div>
</template>

<script>
  import moment from 'moment'
  import { Button } from 'iview'
  import { columnsConfig } from './conf'
  import * as ErrorApi from 'src/api/error'
  import DATE_FORMAT from 'src/constants/date_format'
  import { syntaxHighlight, onEvent, offEvent, scrollTop } from 'src/libs/util'

  export default {
    name: 'error_detail',
    components: {},
    data() {
      return {
        display: 'none',
        scrollHeight: 0,
        name: '',
        loading: true,
        database: [],
        total: 0,
        pageSize: 10,
        currentPage: 1,
        errorLogColumnsConfig: columnsConfig(this),
        styleObj: {
          width: '90%',
          margin: '0 auto 10px auto',
          borderRadius: '3px'
        }
      }
    },
    mounted() {
      this.$Message.config({
        top: 200
      })
      this.scrollHeight = (document.body || document.documentElement).clientHeight - 70
      this.getErrorDetail()
      let scrollDom = document.querySelector('.ivu-scroll-container') || null
      if (scrollDom) {
        onEvent(
          scrollDom,
          'scroll',
          _.throttle(() => {
            if (scrollDom.scrollTop > 400) {
              this.display = 'block'
            } else {
              this.display = 'none'
            }
          }, 500)
        )
      }
    },
    methods: {
      syntaxHighlight(...args) {
        return syntaxHighlight(...args)
      },
      getErrorDetail(page = 1, size = 10) {
        this.pageSize = size
        let { lid, pid } = this.$route.query
        if (!lid || !pid) {
          this.$Notice.open({
            title: '缺少必要参数',
            duration: 0,
            render: (h) =>
              h('span', ['缺少查询相关数据所需的：', h('a', '报警日志ID'), '以及', h('a', '项目ID')])
          })
          this.loading = false
          return
        }
        return ErrorApi.fetchErrorAlarmDetail({ pid, lid, page, size })
          .then((res) => {
            this.loading = false
            let _data = _.get(res, ['data', 'list'], [])
            this.name = _.get(res, ['data', 'name'], '')
            if (!_data.length) {
              return this.$Message.warning({
                content: '没有更多数据了~'
              })
            }
            this.database = [...this.database, ..._data]
            this.total = _.get(res, ['data', 'pager', 'total'], 0)
            this.currentPage = _.get(res, ['data', 'pager', 'currentPage'], 1)
          })
          .catch((err) => {
            this.loading = false
          })
      },
      handleReachBottom() {
        let page = this.currentPage + 1
        return this.getErrorDetail(page)
      },
      makeCopy(value) {
        const input = document.createElement('input')
        input.setAttribute('readonly', 'readonly')
        input.setAttribute('value', value)
        document.body.appendChild(input)
        input.setSelectionRange(0, 99999999)
        if (document.execCommand('copy')) {
          document.execCommand('copy')
          this.$Message.info('复制成功！')
        }
        document.body.removeChild(input)
      },
      toTop() {
        let scrollDom = document.querySelector('.ivu-scroll-container') || null
        scrollDom && scrollTop(scrollDom, scrollDom.scrollTop, 0, 1000)
      },
      transTime(time) {
        return moment.unix(time).format(DATE_FORMAT.DISPLAY_BY_SECOND)
      }
    }
  }
</script>

<style lang="less">
  html,
  body {
    max-width: 100%;
    min-width: 100%;
    background-color: #ededed;
  }
  body {
    padding-top: 0;
    overflow: hidden;
    padding-bottom: 20px;
    .project-name {
      text-align: center;
      margin-bottom: 10px;
      line-height: 50px;
      background: #fff;
      color: #676767;
    }
    .demo-affix {
      display: inline-block;
      color: #fff;
      padding: 10px 30px;
      text-align: center;
      background: rgba(0, 153, 229, 0.9);
    }
    .ivu-table-wrapper {
      margin: 0 auto;
    }
    .the-page_position {
      margin: 30px;
      text-align: center;
    }
    .error-extra_info {
      max-height: 300px;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      pre {
        padding: 5px;
        margin: 5px;
        white-space: pre-wrap;
        word-break: break-all;
        .string {
          color: green;
        }
        .number {
          color: darkorange;
        }
        .boolean {
          color: blue;
        }
        .null {
          color: magenta;
        }
        .key {
          color: red;
        }
      }
    }
    .card-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 250px;
      display: inline-block;
    }
    .card-foot {
      margin-top: 10px;
      border-top: 1px solid #e8eaec;
      padding-top: 10px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  }
</style>
