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
          <div ref="pieChartRef" style="height: 280px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>CPU 使用率监控</span></template>
          <div ref="lineChartRef" style="height: 280px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { Monitor, CircleCheck, Box, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const pieChartRef = ref(null)
const lineChartRef = ref(null)

const stats = reactive({
  totalServers: 28,
  activeServers: 20,
  backupServers: 5,
  warningServers: 3
})

onMounted(() => {
  if (pieChartRef.value) {
    const pieChart = echarts.init(pieChartRef.value)
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      color: ['#409eff', '#67c23a', '#e6a23c'],
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        label: { formatter: '{b}: {d}%' },
        data: [
          { value: 15, name: '物理服务器' },
          { value: 8, name: '云服务器' },
          { value: 5, name: '虚拟服务器' }
        ]
      }]
    })
  }

  if (lineChartRef.value) {
    const lineChart = echarts.init(lineChartRef.value)
    lineChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['DB-Server', 'APP-Server', 'Cache-Server'], bottom: 0 },
      xAxis: { type: 'category', boundaryGap: false, data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
      yAxis: { type: 'value', name: 'CPU %', max: 100 },
      series: [
        { name: 'DB-Server', type: 'line', smooth: true, data: [25, 22, 45, 78, 65, 48, 30], areaStyle: { opacity: 0.1 }, lineStyle: { color: '#409eff' } },
        { name: 'APP-Server', type: 'line', smooth: true, data: [15, 18, 35, 65, 55, 42, 28], areaStyle: { opacity: 0.1 }, lineStyle: { color: '#67c23a' } },
        { name: 'Cache-Server', type: 'line', smooth: true, data: [35, 30, 55, 82, 72, 58, 40], areaStyle: { opacity: 0.1 }, lineStyle: { color: '#e6a23c' } }
      ]
    })
  }
})
</script>

<style scoped>
.page-container { padding: 16px; }
.stat-card { display: flex; align-items: center; gap: 16px; cursor: default; }
.stat-icon { width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.stat-content { flex: 1; }
.stat-value { font-size: 28px; font-weight: bold; color: #303133; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
