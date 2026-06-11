<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409eff;"><el-icon :size="28"><Monitor /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalServers }}</div>
            <div class="stat-label">服务器总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67c23a;"><el-icon :size="28"><CircleCheck /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeServers }}</div>
            <div class="stat-label">运行中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6a23c;"><el-icon :size="28"><Box /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.backupServers }}</div>
            <div class="stat-label">备用库存</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f56c6c;"><el-icon :size="28"><Warning /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.warningServers }}</div>
            <div class="stat-label">异常(维护/下线)</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header><span>服务器类型分布</span></template>
          <div ref="pieChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>CPU 使用率监控</span></template>
          <div ref="lineChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue'
import { Monitor, CircleCheck, Box, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getServerOverviewStats } from '@/api/stats'

const pieChartRef = ref(null)
const lineChartRef = ref(null)

const stats = reactive({
  totalServers: 0,
  activeServers: 0,
  backupServers: 0,
  warningServers: 0
})

async function loadStats() {
  try {
    const data = await getServerOverviewStats()
    stats.totalServers = data?.totalServers ?? 0
    stats.activeServers = data?.activeServers ?? 0
    stats.backupServers = data?.backupServers ?? 0
    stats.warningServers = data?.warningServers ?? 0

    const typeData = (data?.typeDistribution || []).map((item) => ({
      name: item.serverType || '未知',
      value: Number(item.count) || 0
    }))

    await nextTick()
    renderCharts(typeData)
  } catch (e) {
    await nextTick()
    renderCharts([])
  }
}

function renderCharts(typeData) {
  if (pieChartRef.value) {
    const pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        label: { formatter: '{b}: {d}%' },
        data: typeData.length ? typeData : [{ name: '暂无数据', value: 0 }]
      }]
    })
  }

  // CPU 使用率监控：演示用模拟折线（该指标并非数据库可直接提取）
  if (lineChartRef.value) {
    const now = new Date()
    const hours = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000)
      hours.push(
        String(d.getHours()).padStart(2, '0') + ':00'
      )
    }
    const cpuData = hours.map(() => Math.round(30 + Math.random() * 40))
    const lineChart = echarts.init(lineChartRef.value)
    lineChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['CPU 使用率'], bottom: 0 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours
      },
      yAxis: { type: 'value', name: 'CPU %', max: 100 },
      series: [{
        name: 'CPU 使用率',
        type: 'line',
        smooth: true,
        data: cpuData,
        areaStyle: { opacity: 0.1 },
        lineStyle: { color: '#409eff' },
        itemStyle: { color: '#409eff' }
      }]
    })
  }
}

onMounted(() => loadStats())

window.addEventListener('resize', () => {
  [pieChartRef.value, lineChartRef.value].forEach((el) => {
    if (el) {
      const ins = echarts.getInstanceByDom(el)
      if (ins) ins.resize()
    }
  })
})
</script>

<style scoped>
.page-container { padding: 16px; }
.stat-card { display: flex; align-items: center; gap: 16px; cursor: default; }
.stat-card :deep(.el-card__body) {
  display: flex; align-items: center; justify-content: center; gap: 16px;
}
.stat-icon {
  width: 56px; height: 56px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.stat-content { flex: 1; text-align: center; }
.stat-value { font-size: 28px; font-weight: bold; color: #303133; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
