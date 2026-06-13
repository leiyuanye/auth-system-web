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

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span>运营商实名卡片分布</span>
              <span style="font-size:13px;color:#909399;">
                已实名总数：<strong style="color:#409eff;font-size:18px;">{{ stats.totalRealnameCards }}</strong> 张
              </span>
            </div>
          </template>
          <div ref="barChartRef" style="height: 320px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span>实名人 × 运营商 明细</span>
              <span style="font-size:13px;color:#909399;">
                共 <strong style="color:#409eff;">{{ realnameTable.length }}</strong> 位实名人
              </span>
            </div>
          </template>
          <el-table
            :data="realnameTable"
            border
            stripe
            empty-text="暂无已实名手机卡"
            style="width: 100%;"
          >
            <el-table-column type="index" label="序号" width="70" align="center" />
            <el-table-column prop="realnameName" label="实名人" min-width="120" />
            <el-table-column label="移动" align="center" min-width="90">
              <template #default="scope">
                <el-tag v-if="scope.row.mobileCount > 0" type="primary" effect="light">
                  {{ scope.row.mobileCount }} 张
                </el-tag>
                <span v-else style="color:#c0c4cc;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="联通" align="center" min-width="90">
              <template #default="scope">
                <el-tag v-if="scope.row.unicomCount > 0" type="success" effect="light">
                  {{ scope.row.unicomCount }} 张
                </el-tag>
                <span v-else style="color:#c0c4cc;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="电信" align="center" min-width="90">
              <template #default="scope">
                <el-tag v-if="scope.row.telecomCount > 0" type="warning" effect="light">
                  {{ scope.row.telecomCount }} 张
                </el-tag>
                <span v-else style="color:#c0c4cc;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="其他" align="center" min-width="90">
              <template #default="scope">
                <el-tag v-if="scope.row.otherCount > 0" type="info" effect="light">
                  {{ scope.row.otherCount }} 张
                </el-tag>
                <span v-else style="color:#c0c4cc;">—</span>
              </template>
            </el-table-column>
            <el-table-column label="合计" width="110" align="center">
              <template #default="scope">
                <strong style="color:#409eff;font-size:15px;">{{ scope.row.totalCount }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="占比" width="120" align="center">
              <template #default="scope">
                <el-progress
                  :percentage="calcPercentage(scope.row.totalCount, stats.totalRealnameCards)"
                  :stroke-width="10"
                  :show-text="true"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick, onBeforeUnmount } from 'vue'
import { Iphone, CircleCheck, Tickets, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getPhoneOverviewStats } from '@/api/stats'
import { getDictByType } from '@/api/dict'

const pieChartRef = ref(null)
const statusChartRef = ref(null)
const barChartRef = ref(null)
let pieChartInstance = null
let statusChartInstance = null
let barChartInstance = null

const stats = reactive({
  totalCards: 0,
  activeCards: 0,
  backupCards: 0,
  warningCards: 0,
  totalRealnameCards: 0
})
const statusOptions = ref([])
const realnameTable = ref([])
const loading = ref(false)

function pickNum(obj, key1, key2, fallback) {
  if (obj == null) return fallback == null ? 0 : fallback
  if (obj[key1] != null) return Number(obj[key1]) || 0
  if (obj[key2] != null) return Number(obj[key2]) || 0
  if (fallback != null) return Number(fallback) || 0
  return 0
}

function pickStr(obj, key1, key2, fallback) {
  if (obj == null) return fallback == null ? '' : fallback
  if (obj[key1] != null && obj[key1] !== '') return String(obj[key1])
  if (obj[key2] != null && obj[key2] !== '') return String(obj[key2])
  return fallback == null ? '' : fallback
}

async function loadStats() {
  loading.value = true
  try {
    const [data, dictData] = await Promise.all([
      getPhoneOverviewStats(),
      getDictByType('phone_card_status')
    ])
    statusOptions.value = Array.isArray(dictData) ? dictData : []

    stats.totalCards = pickNum(data, 'totalCards', 'total_cards', 0)
    stats.activeCards = pickNum(data, 'activeCards', 'active_cards', 0)
    stats.backupCards = pickNum(data, 'backupCards', 'backup_cards', 0)
    stats.warningCards = pickNum(data, 'warningCards', 'warning_cards', 0)
    stats.totalRealnameCards = pickNum(data, 'totalRealnameCards', 'total_realname_cards', 0)

    realnameTable.value = (data?.realnameWithOperatorTable || data?.realname_with_operator_table || []).map((row) => ({
      realnameName: pickStr(row, 'realnameName', 'realname_name', '未知'),
      totalCount: pickNum(row, 'totalCount', 'total_count', 0),
      mobileCount: pickNum(row, 'mobileCount', 'mobile_count', 0),
      unicomCount: pickNum(row, 'unicomCount', 'unicom_count', 0),
      telecomCount: pickNum(row, 'telecomCount', 'telecom_count', 0),
      otherCount: pickNum(row, 'otherCount', 'other_count', 0)
    }))

    const realnameList = data?.realnameByOperator || data?.realname_by_operator || []
    const realnameLabels = realnameList.map((m) => pickStr(m, 'operatorLabel', 'operator_label', '未知'))
    const realnameValues = realnameList.map((m) => pickNum(m, 'count', null, 0))

    const statusData = (data?.statusDistribution || data?.status_distribution || []).map((item) => ({
      name: dictLabel(pickNum(item, 'cardStatus', 'card_status', null)),
      value: pickNum(item, 'count', null, 0)
    }))

    const agentData = (data?.agentDistribution || data?.agent_distribution || []).map((item) => ({
      name: pickStr(item, 'agentName', 'agent_name', '未知'),
      value: pickNum(item, 'count', null, 0)
    }))

    await nextTick()
    // 再等一帧，确保DOM完全渲染后再初始化图表
    setTimeout(() => {
      renderCharts(agentData, statusData, { labels: realnameLabels, values: realnameValues })
      loading.value = false
    }, 50)
  } catch (e) {
    loading.value = false
    realnameTable.value = []
    console.error('[PhoneOverview] 加载统计数据失败:', e)
    await nextTick()
    setTimeout(() => renderCharts([], [], { labels: [], values: [] }), 50)
  }
}

function calcPercentage(part, total) {
  if (!total) return 0
  return Math.round((Number(part) / Number(total)) * 100)
}

function dictLabel(value) {
  if (value == null || value === '') return '未知'
  const arr = statusOptions.value || []
  const found = arr.find(item => Number(item.dictKey) === Number(value))
  return found ? found.dictValue : ('状态-' + value)
}

function renderCharts(agentData, statusData, realnameData) {
  // 清理旧实例
  ;[pieChartInstance, statusChartInstance, barChartInstance].forEach((inst) => {
    if (inst) {
      try { inst.dispose() } catch (e) {}
    }
  })
  pieChartInstance = statusChartInstance = barChartInstance = null

  if (pieChartRef.value) {
    pieChartInstance = echarts.init(pieChartRef.value)
    pieChartInstance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'],
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        label: { formatter: '{b}: {d}%' },
        data: Array.isArray(agentData) && agentData.length ? agentData : [{ name: '暂无数据', value: 0 }]
      }]
    })
  }

  if (statusChartRef.value) {
    statusChartInstance = echarts.init(statusChartRef.value)
    statusChartInstance.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      color: ['#67c23a', '#e6a23c', '#f56c6c'],
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        label: { formatter: '{b}: {d}%' },
        data: Array.isArray(statusData) && statusData.length ? statusData : [{ name: '暂无数据', value: 0 }]
      }]
    })
  }

  if (barChartRef.value) {
    barChartInstance = echarts.init(barChartRef.value)
    const labels = realnameData?.labels || []
    const values = realnameData?.values || []
    barChartInstance.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}: {c} 张' },
      grid: { left: 50, right: 30, top: 40, bottom: 50 },
      xAxis: {
        type: 'category',
        data: labels.length ? labels : ['暂无数据'],
        axisLabel: { color: '#606266' }
      },
      yAxis: { type: 'value', name: '实名张数', minInterval: 1, axisLabel: { color: '#606266' } },
      series: [{
        type: 'bar',
        data: values.length ? values : [0],
        itemStyle: { color: '#409eff', borderRadius: [6, 6, 0, 0] },
        label: { show: true, position: 'top', color: '#303133', fontWeight: 'bold' },
        barWidth: '40%'
      }]
    })
  }
}

function handleResize() {
  ;[pieChartInstance, statusChartInstance, barChartInstance].forEach((inst) => {
    if (inst) {
      try { inst.resize() } catch (e) {}
    }
  })
}

onMounted(() => loadStats())
onBeforeUnmount(() => {
  ;[pieChartInstance, statusChartInstance, barChartInstance].forEach((inst) => {
    if (inst) {
      try { inst.dispose() } catch (e) {}
    }
  })
})

window.addEventListener('resize', handleResize)
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
