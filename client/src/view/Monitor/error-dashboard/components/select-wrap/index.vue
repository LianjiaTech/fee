<!-- @format -->

<template>
  <div>
    <el-button
      type="primary"
      size="small"
      style="margin-bottom: 10px;"
      v-show="!resetBtnDisabled"
      @click="handleReset"
    >恢复初始状态</el-button>
    <el-popover trigger="click" v-model="visible" placement="top-start">
      <div class="select-wrap" slot="reference">
        <div class="select-faker">
          <div class="select-tags" ref="select-tags">
            <el-tag
              closable
              size="small"
              style="margin: 2px 5px 2px 0; cursor: pointer"
              v-for="tag in selectedListWithCount"
              @click="handleInverseSelection(tag.error_name, true)"
              @close="handleInverseSelection(tag.error_name)"
              :key="tag.error_name"
            >({{ tag.error_count }}){{ tag.error_name.slice(0, 30) }}</el-tag>
          </div>
        </div>
      </div>
      <div class="select-options_scrollbar">
        <div class="select-options_wrap">
          <el-input clearable type="text" size="medium" v-model="filterTxt" />
          <ul class="select-options">
            <li
              :title="item.error_name"
              :class="{
                'select-options__item': true,
                selected: !!~selectedList.findIndex((name) => item.error_name === name)
              }"
              v-for="item in filterList"
              @click="handleOptionClicked(item.error_name)"
              :value="item.error_name"
              :key="item.error_name"
            >（{{ item.error_count }}）{{ item.error_name.slice(0, 30) }}</li>
          </ul>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script>
/** @format */

export default {
  name: 'SelectWrap',
  props: {
    originSelectedList: {
      type: Array,
      default: []
    },
    optionsList: {
      type: Array,
      default: []
    },
    selectedList: {
      type: Array,
      default: []
    },
    selectedTopCount: {
      type: Number,
      default: 10
    }
  },
  data() {
    return {
      // 下拉列表是否展示
      visible: false,
      filterTxt: ''
    }
  },
  computed: {
    filterList() {
      return this.filterTxt
        ? this.optionsList.filter(
            (item) => item.error_name.toLowerCase().indexOf(this.filterTxt.toLowerCase()) > -1
          )
        : this.optionsList
    },
    selectedListWithCount() {
      return this.optionsList.filter((option) => this.selectedList.indexOf(option.error_name) > -1)
    },
    resetBtnDisabled() {
      let a = this.originSelectedList
      let b = this.selectedList
      let res = a.concat(b).filter((v) => !a.includes(v) || !b.includes(v))
      return !res.length
    }
  },
  methods: {
    handleInverseSelection(tag, closeOthers = false) {
      this.visible = false
      let list = this.selectedList.slice()
      list = closeOthers ? list.filter((item) => item === tag) : list.filter((item) => item !== tag)
      this.$emit('change', list)
    },
    handleOptionClicked(name) {
      let selectedList = this.selectedList.slice()
      let index = selectedList.findIndex((item) => item === name)
      index > -1 ? selectedList.splice(index, 1) : selectedList.push(name)
      this.$emit('change', selectedList)
    },
    handleReset() {
      this.$emit('reset', this.originSelectedList)
    }
  },
  watch: {
    selectedList(val) {
      this.$emit('change', val)
    },
    selectedTopCount(val) {
      if (!val) return
      let maxLen = this.optionsList.length
      if (val > maxLen) return
      let list = _.cloneDeep(this.optionsList)
      let selectedList = list.slice(0, val).map((item) => item.error_name)
      this.$emit('change', selectedList)
    }
  }
}
</script>

<style lang="less" scoped>
/** @format */

.select-wrap {
  .select-faker {
    position: relative;
    width: 100%;
    min-height: 40px;
    max-height: 118px;
    overflow: auto;
    padding: 2px 5px;
    position: relative;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    .select-tags {
      padding-right: 30px;
      position: relative;
    }
    .select-input {
      .el-input {
        display: block;
        opacity: 0;
        pointer-events: none;
      }
      .el-input__inner {
        border: none !important;
      }
    }
  }
}
</style>
<style lang="less">
/** @format */

.select-options_scrollbar {
  overflow: hidden;
  width: 450px;
  max-width: 450px;
  .select-options_wrap {
    overflow: hidden;
    margin-right: -27px;
    .el-input {
      width: 90%;
      margin-bottom: 10px;
    }
    .select-options {
      max-height: 500px;
      overflow-y: scroll;
      list-style-type: none;
      .select-options__item {
        position: relative;
        font-size: 14px;
        padding-left: 10px;
        padding-right: 30px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #606266;
        height: 34px;
        line-height: 34px;
        box-sizing: border-box;
        cursor: pointer;
        &:hover {
          background-color: #f5f7fa;
        }
      }
      .selected {
        color: #409eff;
        font-weight: 700;
        &:after {
          position: absolute;
          right: 30px;
          font-family: element-icons;
          content: '\E611';
          font-size: 12px;
          font-weight: 700;
          -webkit-font-smoothing: antialiased;
        }
      }
    }
  }
}
</style>
