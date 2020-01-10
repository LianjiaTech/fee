<template>
  <span class="pg_dot_tags">
    <Dropdown trigger="custom" placement="bottom-start" :visible="visible" style="margin-left: 20px" @on-clickoutside="visible=false">
      <Button icon="ios-bookmark" @click="visible=!visible">管理标签</Button>
      <DropdownMenu slot="list">
        <div style="overflow: hidden;">
          <div class="tags-drop_scoll">
            <DropdownItem v-for="(tag, index) in tags" :key="index" >
              <div class="tag-wrap" @click="handleEdit(tag)">
                <span class="tag-name">
                  <i class="tag-dot" :style="{'background-color': tag.color || 'rgba(45,140,240,1)'}"></i>
                  {{tag.name}}
                </span>
                <Icon type="ios-create"  size="18"/>
              </div>
            </DropdownItem>
          </div>
        </div>
        <DropdownItem divided>
          <Button type="primary" size="small" @click="handleAdd">添加标签</Button>
          <strong>（共{{tags.length}}个）</strong>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
    <Modal
      width="300"
      class-name="pg-dot_modal"
      :closable="false"
      v-model="modalVisible"
      @on-visible-change="handleVisibleChange">
      <Form ref="tagProp" :model="tagProp" :label-width="60">
        <FormItem label="名称" prop="name" :rules="{required: true, message: '不能为空', trigger: 'blur'}">
          <Input type="text" v-model="tagProp.name"/>
        </FormItem>
        <FormItem label="颜色" prop="color" :rules="{required: true, message: '不能为空', trigger: 'blur'}">
          <ColorPicker format="rgb" v-model="tagProp.color" :colors="colors" />
        </FormItem>
      </Form>
      <section slot="footer">
        <Button @click="modalVisible = false">取消</Button>
        <Button type="primary" @click="handleOk">确定</Button>
      </section>
    </Modal>
  </span>
</template>
<script>
import * as ApiDot from 'src/api/dot'
export default {
  props: {
    tags: {
      type: Array,
      default: []
    }
  },
  data() {
    return {
      visible: false,
      modalVisible: false,
      _cache: {
        color: 'rgba(45,140,240,1)',
        name: ''
      },
      tagProp: {
        color: 'rgba(45,140,240,1)',
        name: ''
      },
      colors: ['rgba(45,140,240,1)', 'rgba(25,190,107,1)', 'rgba(237,64,20,1)', 'rgba(255,153,0,1)', 'rgba(247,247,247,1)']
    }
  },
  methods: {
    handleAdd() {
      this._cache = {
        color: 'rgba(45,140,240,1)',
        name: ''
      }
      this.modalVisible = true
    },
    handleEdit(tag) {
      this.modalVisible = true
      this.tagProp = tag
      this._cache = _.cloneDeep(tag)
    },
    handleVisibleChange(val) {
      this.$refs['tagProp'].resetFields()
      this.tagProp = _.cloneDeep(this._cache)
    },
    handleOk() {
      this.$refs['tagProp'].validate(async (valid) => {
				if (!valid) return
        await ApiDot.addTag(this.tagProp)  
        this.$Message.success('成功!')
        this.modalVisible = false
        this.$emit('on-ok')
			})
    }
  }
}
</script>

<style lang="less" scoped>
.tags-drop_scoll{
  max-height: 178px;
  overflow-y: scroll;
  overflow-x: hidden;
  margin-right: -15px;
  .tag-wrap{
    display: inline-flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    .tag-name{
      max-width: 150px;
      margin-right: 20px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tag-dot{
      margin-right: 10px;
      display: inline-block;
      height: 10px;
      width: 10px;
      border-radius: 50%;
    }
  }
}
</style>

