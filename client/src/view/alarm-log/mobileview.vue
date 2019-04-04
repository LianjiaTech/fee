<template>
  <div>
    <Card style="100%;margin-left:-10px;">
      <p slot="title">最近2天报警次数</p>
      <StackArea :height="300" :data="lineData.dataList" :scale="lineData.scale" :isSpinShow="isLoading.stackArea" :forceFit="true" style="margin-left:-35px;"></StackArea>
    </Card>
    <Card>
      <p slot="title">报警时间轴</p>
      <Card>
        打开详细信息:
        <i-Switch @on-change="handelToggle"/>&nbsp;&nbsp;&nbsp;&nbsp;
        <span>报警总数:&nbsp;<span style="color:red">{{totalLogCount}}</span></span>
      </Card>
      <Card>
        <Timeline>
          <TimelineItem v-for="(alarmLog, index) in alarmLogList" :key="alarmLog.id">
              <p class="time">{{alarmLog.send_at}}</p>
              <p>
                <span style="color:green">错误名字:</span>
                {{alarmLog.error_name}}
              </p>
              <Collapse simple v-model="openMessageIndexList">
                <Panel :name="index.toString()">详细信息
                  <p slot="content">{{alarmLog.message}}</p>
                </Panel>
              </Collapse>
          </TimelineItem>
        </Timeline>
      </Card>
    </Card>
    <p style="width:100%;height:64px"></p>
  </div>
</template>
<script>
import { getAlarmLog, getLineAlarmLog } from "@/api/alarm";
import moment from "moment";
import StackArea from "@/view/components/viser-stack/viser-stack.vue";

export default {
  name: "alarm-log",
  data() {
    return {
      alarmLogList: [],
      openMessageIndexList: [],
      nowDate: new Date(),
      initTimeRange: [moment().format('HH:00'), "23:59"],
      timeRange: ["00:00", moment().format('HH:mm')],
      selectDate: moment().format('YYYY-MM-DD'),
      showDetail: false,
      totalLogCount: 0,
      isLoading: {
        stackArea: true
      },
      lineData: {
        dataList: [],
        scale: [
          {
            dataKey: "value",
            sync: true,
            alias: "次",
            formatter: value => value + " 次"
          },
          {
            dataKey: "index",
            tickCount: 5,
            alias: "日期",
            formatter: (value) => {
              return moment(value, 'YYYY-MM-DD HH:00~HH:59').format('DD HH:00~59')
            }
          }
        ]
      }
    };
  },
  mounted() {
    this.getAlarmLog();
    this.getLineAlarmLog();
  },
  components: {
    StackArea
  },
  methods: {
    async getAlarmLog() {
      const startMoment = moment(this.selectDate + " " + this.timeRange[0]);
      const endMoment = moment(
        moment(this.selectDate + " " + this.timeRange[1]).format(
          "YYYY-MM-DD HH:mm:59"
        )
      );
      const { data: dataList } = await getAlarmLog({
        st: startMoment.unix() * 1000,
        et: endMoment.unix() * 1000
      });
      for (let data of dataList) {
        data["send_at"] = moment
          .unix(data["send_at"])
          .format("YYYY-MM-DD HH:mm:ss");
      }
      this.$set(this, "alarmLogList", dataList);
      this.$set(this, "totalLogCount", dataList.length);
      this.$nextTick(() => {
        this.openMessage();
      });
    },
    async getLineAlarmLog() {
      // 默认七天
      const startMoment = moment(this.selectDate + " " + this.timeRange[0]);
      const endMoment = moment(
        moment(this.selectDate + " " + this.timeRange[1]).format(
          "YYYY-MM-DD HH:mm:59"
        )
      );
      const { data: dataList } = await getLineAlarmLog({
        st: startMoment.unix(),
        et: endMoment.unix()
      });
      this.$set(this.lineData, "dataList", dataList);
      this.$set(this.isLoading, "stackArea", false)
    },
    handelToggle(value) {
      this.showDetail = value;
      this.openMessage();
    },
    openMessage() {
      if (this.showDetail) {
        this.openMessageIndexList = Object.keys(this.alarmLogList);
      } else {
        this.openMessageIndexList = [];
      }
    },
    handleTimeChange(timeRange) {
      this.timeRange = timeRange;
      this.getAlarmLog();
    },
    handleDateChange(date) {
      this.selectDate = date;
      this.getAlarmLog();
    }
  }
};
</script>

