<template>
  <div class="page-container">
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
            <div class="stat-label">异常卡(欠费/二次实名)</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="12">
        <el-card>
          <template #header><span>代理商分布</span></template>
          <div ref="pieChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>状态分布</span></template>
          <div ref="statusChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="24">
        <el-card>
          <template #header><span>月度异常处理</span></template>
          <div ref="barChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue'
import { Iphone, CircleCheck, Tickets, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getPhoneOverviewStats } from '@/api/stats'
import { getDictByType } from '@/api/dict'

const pieChartRef = ref(null)
const statusChartRef = ref(null)
const barChartRef = ref(null)

const stats = reactive({
  totalCards: 0,
  activeCards: 0,
  backupCards: 0,
  warningCards: 0
})
const statusOptions = ref([])

async function loadStats() {
  try {
    const [data, dictData] = await Promise.all([
      getPhoneOverviewStats(),
      getDictByType('phone_card_status')
    ])
    statusOptions.value = Array.isArray(dictData) ? dictData : []
    stats.totalCards = data?.totalCards ?? 0
    stats.activeCards = data?.activeCards ?? 0
    stats.backupCards = data?.backupCards ?? 0
    stats.warningCards = data?.warningCards ?? 0

    // 代理商分布
    const agentData = (data?.agentDistribution || []).map((item) => ({
      name: item.agentName || '未知',
      value: Number(item.count) || 0
    }))

    const statusData = (data?.statusDistribution || []).map((item) => ({
      name: dictLabel(item.cardStatus),
      value: Number(item.count) || 0
    }))

    // 月度异常处理: monthLabel -> 月份显示, count
    const monthlyList = data?.monthlyExceptionProcess || []
    const monthNames = monthlyList.map((m) => m.monthLabel || '')
    const monthValues = monthlyList.map((m) => Number(m.count) || 0)

    await nextTick()
    renderCharts(agentData, statusData, { months: monthNames, values: monthValues })
  } catch (e) {
    // 错误已由拦截器处理，保持默认空数据展示
    await nextTick()
    renderCharts([], [], { months: [], values: [] })
  }
}

function dictLabel(value) {
  const found = statusOptions.value.find(item => Number(item.dictKey) === Number(value))
  return found ? found.dictValue : ('状态-' + value)
}

function renderCharts(agentData, statusData, monthly) {
  if (pieChartRef.value) {
    const pie = echarts.init(pieChartRef.value)
    pie.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        label: { formatter: '{b}: {d}%' },
        data: agentData.length ? agentData : [{ name: '暂无数据', value: 0 }]
      }]
    })
  }

  if (statusChartRef.value) {
    const statusChart = echarts.init(statusChartRef.value)
    statusChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      color: ['#67c23a', '#e6a23c', '#f56c6c'],
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        label: { formatter: '{b}: {d}%' },
        data: statusData.length ? statusData : [{ name: '暂无数据', value: 0 }]
      }]
    })
  }

  if (barChartRef.value) {
    const barChart = echarts.init(barChartRef.value)
    barChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: monthly.months.length ? monthly.months : ['暂无数据'],
        axisLabel: { rotate: monthly.months.length > 6 ? 30 : 0 }
      },
      yAxis: { type: 'value', name: '处理张数', minInterval: 1 },
      series: [{
        type: 'bar',
        data: monthly.values.length ? monthly.values : [0],
        itemStyle: { color: '#e6a23c', borderRadius: [4, 4, 0, 0] },
        barWidth: '50%'
      }]
    })
  }
}

onMounted(() => loadStats())

window.addEventListener('resize', () => {
  [pieChartRef.value, statusChartRef.value, barChartRef.value].forEach((el) => {
    if (el) {
      const ins = echarts.getInstanceByDom(el)
      if (ins) ins.resize()
    }
  })
})
</script>

<style scoped>
.page-container { padding: 16px; }
.stat-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: default;
  padding: 8px 0;
}
.stat-card :deep(.el-card__body) {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
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
.stat-content { flex: 1; text-align: center; min-width: 0; }
.stat-value { font-size: 28px; font-weight: bold; color: #303133; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
