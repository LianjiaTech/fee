<template>
    <div style="height:100%">
        <Menu mode="horizontal" theme="light" active-name="1" @on-select="handleSelect">
            <Row>
                <Col span="8">
                    <MenuItem name="1">
                        <span  style="font-size:5vw">用户行为</span>
                    </MenuItem>
                </Col>
                <Col span="8">
                    <MenuItem name="2">
                        <span  style="font-size:5vw">异常监控</span>
                    </MenuItem>
                </Col>
                <Col span="8">
                    <MenuItem name="3">
                        <span  style="font-size:5vw">报警监控</span>
                    </MenuItem>
                </Col>
            </Row>
        </Menu>
        <div style="width:100%;height:100%;overflow:scroll" v-if="view === '1'">
            <menucount />
            <homecomponent />
            <onlinetime />
        </div>
        <div style="width:100%;height:100%;overflow:scroll" v-if="view === '2'">
            <performance />
            <error />
        </div>
        <div style="width:100%;height:100%;overflow:scroll" v-if="view === '3'">
            <alarm />
        </div>
    </div>
</template>
<script>
import menucount from '@/view/menu-count/menu-count.vue'
import homecomponent from '@/view/device-detail/mobileview.vue'
import onlinetime from '@/view/online-time/mobileview.vue'
import performance from '@/view/performance/mobileview.vue'
import error from '@/view/error-dashboard/mobileview.vue'
import alarm from '@/view/alarm-log/mobileview.vue'
export default {
    name: 'mobile-view',
    data(){
        return {
            view: 0
        }
    },
    components: {
        menucount,
        homecomponent,
        onlinetime,
        performance,
        error,
        alarm
    },
    methods: {
        handleSelect(name){
            this.view = name.toString()
        }
    },
    mounted(){
        this.$nextTick(() => {
            this.view = '1'
        })
    }
}
</script>
<style scoped>
</style>

