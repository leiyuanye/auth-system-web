<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409eff;">
            <el-icon :size="28"><Iphone /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalCards }}</div>
            <div class="stat-label">手机卡总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67c23a;">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.activeCards }}</div>
            <div class="stat-label">在用中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6a23c;">
            <el-icon :size="28"><Tickets /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.backupCards }}</div>
            <div class="stat-label">备用库存</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f56c6c;">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.warningCards }}</div>
            <div class="stat-label">异常卡(欠费/停机)</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区 -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>运营商分布</span>
          </template>
          <div ref="pieChartRef" style="height: 280px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>月度新增趋势</span>
          </template>
          <div ref="barChartRef" style="height: 280px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { Iphone, CircleCheck, Tickets, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

const pieChartRef = ref(null)
const barChartRef = ref(null)

const stats = reactive({
  totalCards: 45,
  activeCards: 32,
  backupCards: 8,
  warningCards: 5
})

onMounted(() => {
  // 饼图：运营商分布
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
          { value: 20, name: '中国移动' },
          { value: 15, name: '中国联通' },
          { value: 10, name: '中国电信' }
        ]
      }]
    })
  }

  // 柱状图：月度新增
  if (barChartRef.value) {
    const barChart = echarts.init(barChartRef.value)
    barChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
      yAxis: { type: 'value', name: '新增数' },
      series: [{
        type: 'bar',
        data: [5, 8, 6, 10, 9, 7],
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
        barWidth: '50%'
      }]
    })
  }
})
</script>

<style scoped>
.page-container { padding: 16px; }
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: default;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}
.stat-content { flex: 1; }
.stat-value { font-size: 28px; font-weight: bold; color: #303133; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
