<template>
<div>
    <RadioGroup
        v-model="radioValue"
        @on-change="handleRadioChange"
        type="button"
    >
        <Radio
        label="today"
        :disabled="disabledToday"
        >今天</Radio>
        <Radio
        label="yesterday"
        :disabled="disabledYesterday"
        >昨天</Radio>
        <Radio
        label="sevenDays"
        :disabled="disabledSeven"
        >最近七天</Radio>
    </RadioGroup>
    <DatePicker
    v-model="nowDate"
    type="daterange"
    placeholder="Select date"
    style="width: 200px"
    @on-change="handleDateChange"
    :options="{disabledDate:isDateDisabled}"
    ></DatePicker>
</div>
</template>
<script>
import moment from 'moment'
export default {
    name: 'quickTimebar',
    props: {
        disabledToday: {
            type: Boolean,
            default: false
        },
        disabledYesterday: {
            type: Boolean,
            default: false
        },
        disabledSeven: {
            type: Boolean,
            default: false
        },
        disabledThirty: {
            type: Boolean,
            default: false
        },
        disabledDatePicker: {
            type: Boolean,
            default: false
        },
        isDateDisabled: {
            type: Function,
            default: () => {return false}
        }
    },
    data(){
        return {
            radioValue: 'today',
            nowDate: [moment().format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')]
        }
    },
    methods: {
        handleRadioChange(value){
            let timeRange = []
            switch(value){
                case 'today':
                    timeRange[0] = moment().startOf('day').unix()
                    timeRange[1] = moment().unix()
                    break;
                case 'yesterday':
                    let oneDayAgoMoment = moment().subtract(1, 'day')
                    timeRange[0] = oneDayAgoMoment.clone().startOf('day').unix()
                    timeRange[1] = oneDayAgoMoment.clone().endOf('day').unix()
                    break;
                case 'sevenDays':
                    let sevenDaysAgoMoment = moment().subtract(7, 'day')
                    timeRange[0] = sevenDaysAgoMoment.startOf('day').unix()
                    timeRange[1] = moment().unix()
                    break;
                default: 
                    return []
            }
            this.nowDate = [moment.unix(timeRange[0]).format('YYYY-MM-DD'), moment.unix(timeRange[1]).format('YYYY-MM-DD')]
            this.$emit('dateChange', timeRange)
        },
        handleDateChange(value){
            let timeRange = []
            if(value[0] === ''){
                this.radioValue = 'today'
                timeRange = [moment().startOf('day').unix(), moment().unix()]
            }else{
                this.radioValue = ''
                timeRange[0] = moment(value[0]).unix()
                timeRange[1] = moment(value[1], 'YYYY-MM-DD').endOf('day').unix()
            }
            this.$emit('dateChange', timeRange)
        }
    }
}
</script>

