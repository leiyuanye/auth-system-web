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
              <span>手机卡分布与异常处理（真实统计）</span>
            </div>
          </template>
          <div ref="chartRef" style="height: 360px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, reactive } from 'vue'
import {
  UserFilled,
  User,
  View,
  DataAnalysis
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getHomeStats } from '@/api/stats'

const chartRef = ref(null)

const statCards = reactive([
  { title: '用户总数', value: '加载中...', desc: '合计', color: '#409EFF', bg: '#409EFF', icon: 'UserFilled' },
  { title: '今日新增', value: '加载中...', desc: '合计', color: '#67C23A', bg: '#67C23A', icon: 'User' },
  { title: '访问量', value: '加载中...', desc: '合计', color: '#E6A23C', bg: '#E6A23C', icon: 'View' },
  { title: '手机卡数', value: '加载中...', desc: '合计', color: '#F56C6C', bg: '#F56C6C', icon: 'DataAnalysis' }
])

async function loadStats() {
  try {
    const data = await getHomeStats()
    statCards[3].value = (data?.totalCards ?? 0).toLocaleString()

    await nextTick()
    renderChart(data)
  } catch (e) {
    // 错误已由拦截器处理
    statCards[0].value = '0'
    statCards[1].value = '0'
    statCards[2].value = '0'
    statCards[3].value = '0'
    renderChart(null)
  }
}

function renderChart(data) {
  if (!chartRef.value) return
  const chart = echarts.init(chartRef.value)
  const totalCards = data?.totalCards ?? 0
  const warnCards = data?.warningCards ?? 0
  const totalServers = data?.totalServers ?? 0
  const warnServers = data?.warningServers ?? 0

  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['手机卡总数', '手机卡异常', '服务器总数', '服务器异常'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['当前']
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      { name: '手机卡总数', type: 'bar', data: [totalCards], itemStyle: { color: '#409EFF' }, barWidth: 30 },
      { name: '手机卡异常', type: 'bar', data: [warnCards], itemStyle: { color: '#E6A23C' }, barWidth: 30 },
      { name: '服务器总数', type: 'bar', data: [totalServers], itemStyle: { color: '#67C23A' }, barWidth: 30 },
      { name: '服务器异常', type: 'bar', data: [warnServers], itemStyle: { color: '#F56C6C' }, barWidth: 30 }
    ]
  })
}

onMounted(() => loadStats())

window.addEventListener('resize', () => {
  if (chartRef.value) {
    const ins = echarts.getInstanceByDom(chartRef.value)
    if (ins) ins.resize()
  }
})
</script>

<style scoped>
.page-container { padding: 16px; }
.stat-card { margin-bottom: 16px; }
.stat-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.stat-info { flex: 1; min-width: 0; }
.stat-title { font-size: 14px; color: #909399; }
.stat-value { font-size: 26px; font-weight: bold; margin: 8px 0; }
.stat-desc { font-size: 12px; color: #c0c4cc; }
.stat-icon {
  width: 56px; height: 56px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}
</style>
