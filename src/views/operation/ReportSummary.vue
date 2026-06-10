<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="6" v-for="(card, idx) in statCards" :key="idx">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-inner">
            <div class="stat-info">
              <div class="stat-title">{{ card.title }}</div>
              <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
              <div class="stat-desc">{{ card.desc }}</div>
            </div>
            <div class="stat-icon" :style="{ background: card.bg }">
              <el-icon :size="28" color="#fff">
                <component :is="card.icon" />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>每日访问量与新增用户（示例数据）</span>
              <el-button
                type="primary"
                :icon="Download"
                v-if="userStore.hasPermission('operation:summary:export')"
                @click="handleExport"
              >
                导出数据
              </el-button>
            </div>
          </template>
          <v-chart :option="barOption" style="height: 350px;" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  User,
  View,
  DataAnalysis,
  Download
} from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useUserStore } from '@/store/user'

use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const userStore = useUserStore()

const statCards = [
  { title: '用户总数', value: '10,248', desc: '较昨日 +1.2%', color: '#409EFF', bg: '#409EFF', icon: 'UserFilled' },
  { title: '今日新增', value: '128', desc: '较昨日 +3.5%', color: '#67C23A', bg: '#67C23A', icon: 'User' },
  { title: '访问量', value: '85,321', desc: '较昨日 -0.8%', color: '#E6A23C', bg: '#E6A23C', icon: 'View' },
  { title: '手机卡数', value: '1,048', desc: '在用量 1048', color: '#F56C6C', bg: '#F56C6C', icon: 'DataAnalysis' }
]

const barOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['访问量', '新增用户'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: { type: 'value' },
  series: [
    { name: '访问量', type: 'bar', data: [1200, 2000, 1500, 800, 700, 1100, 1300], itemStyle: { color: '#409EFF' } },
    { name: '新增用户', type: 'bar', data: [120, 200, 150, 80, 70, 110, 130], itemStyle: { color: '#67C23A' } }
  ]
}))

function handleExport() {
  ElMessage.success('数据导出（功能演示，后端未实现）')
}
</script>

<style scoped>
.page-container {
  padding: 16px;
}

.stat-card {
  margin-bottom: 16px;
}

.stat-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin: 10px 0;
}

.stat-desc {
  font-size: 12px;
  color: #c0c4cc;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.85;
}
</style>
