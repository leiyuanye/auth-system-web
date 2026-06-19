<template>
  <div class="page-container">
    <el-skeleton v-if="loading" :rows="6" animated style="margin-bottom: 16px;" />

    <transition name="fade-slide" mode="out-in">
      <div v-show="!loading" key="server-content">
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
                <div class="stat-value">{{ stats.runningServers }}</div>
                <div class="stat-label">使用中</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-icon" style="background: #e6a23c;"><el-icon :size="28"><EditPen /></el-icon></div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.maintenanceServers }}</div>
                <div class="stat-label">备用中</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-icon" style="background: #f56c6c;"><el-icon :size="28"><Warning /></el-icon></div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.expiredServers }}</div>
                <div class="stat-label">异常(已到期)</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

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
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick, onBeforeUnmount } from 'vue'
import { Monitor, CircleCheck, Warning, EditPen } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import { getServerOverviewStats } from '@/api/stats'

const pieChartRef = ref(null)
const lineChartRef = ref(null)
let pieChartInstance = null
let lineChartInstance = null

const loading = ref(false)

const stats = reactive({
  totalServers: 0,
  runningServers: 0,
  maintenanceServers: 0,
  offlineServers: 0,
  expiredServers: 0
})

// 兼容驼峰和下划线字段名
function pickNum(obj, key1, key2, fallback = 0) {
  if (obj == null) return fallback
  if (obj[key1] != null) return Number(obj[key1]) || 0
  if (obj[key2] != null) return Number(obj[key2]) || 0
  return fallback
}

async function loadStats() {
  loading.value = true
  try {
    const data = await getServerOverviewStats()
    console.log('[ServerOverview] API返回数据:', data) // 调试日志
    
    // 兼容驼峰和下划线字段名
    stats.totalServers = pickNum(data, 'totalServers', 'total_servers', 0)
    stats.runningServers = pickNum(data, 'runningServers', 'running_servers', 0)
    stats.maintenanceServers = pickNum(data, 'maintenanceServers', 'maintenance_servers', 0)
    stats.offlineServers = pickNum(data, 'offlineServers', 'offline_servers', 0)
    stats.expiredServers = pickNum(data, 'expiredServers', 'expired_servers', pickNum(data, 'warningServers', 'warning_servers', 0))

    const typeDistribution = data?.typeDistribution || data?.type_distribution || []
    const typeData = typeDistribution.map((item) => ({
      name: item.serverType || item.server_type || '未知',
      value: Number(item.count) || 0
    }))

    loading.value = false
    await nextTick()
    setTimeout(() => renderCharts(typeData), 50)
  } catch (e) {
    loading.value = false
    await nextTick()
    setTimeout(() => renderCharts([]), 50)
  }
}

function renderCharts(typeData) {
  if (pieChartInstance) { try { pieChartInstance.dispose() } catch (e) {} }
  if (lineChartInstance) { try { lineChartInstance.dispose() } catch (e) {} }
  pieChartInstance = lineChartInstance = null

  if (pieChartRef.value) {
    pieChartInstance = echarts.init(pieChartRef.value)
    pieChartInstance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
      animationDuration: 800,
      animationEasing: 'cubicOut',
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        label: { formatter: '{b}: {d}%' },
        data: typeData.length ? typeData : [{ name: '暂无数据', value: 0 }]
      }]
    })
  }

  if (lineChartRef.value) {
    const now = new Date()
    const hours = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000)
      hours.push(String(d.getHours()).padStart(2, '0') + ':00')
    }
    const cpuData = hours.map(() => Math.round(30 + Math.random() * 40))
    lineChartInstance = echarts.init(lineChartRef.value)
    lineChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['CPU 使用率'], bottom: 0 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours
      },
      yAxis: { type: 'value', name: 'CPU %', max: 100 },
      animationDuration: 800,
      animationEasing: 'cubicOut',
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

function handleResize() {
  if (pieChartInstance) { try { pieChartInstance.resize() } catch (e) {} }
  if (lineChartInstance) { try { lineChartInstance.resize() } catch (e) {} }
}

onMounted(() => loadStats())
onBeforeUnmount(() => {
  if (pieChartInstance) { try { pieChartInstance.dispose() } catch (e) {} }
  if (lineChartInstance) { try { lineChartInstance.dispose() } catch (e) {} }
  window.removeEventListener('resize', handleResize)
})

window.addEventListener('resize', handleResize)
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
