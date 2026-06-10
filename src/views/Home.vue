<template>
  <div class="home-page">
    <el-row :gutter="16">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon :size="20" color="#409EFF"><House /></el-icon>
              <span>欢迎信息</span>
            </div>
          </template>
          <div class="welcome-content">
            <h2>欢迎回来，{{ userStore.userInfo?.realName || '用户' }}！</h2>
            <p>今天是 {{ currentDate }}，祝您工作愉快。</p>
            <el-descriptions :column="2" border size="small" style="margin-top: 20px;">
              <el-descriptions-item label="用户名">{{ userStore.userInfo?.username || '-' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ userStore.userInfo?.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="角色">
                <el-tag v-for="(role, idx) in userStore.userInfo?.roles || []" :key="idx" style="margin-right: 5px;">
                  {{ role }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="登录状态">
                <el-tag type="success">已登录</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="12">
        <el-card>
          <template #header>用户访问量（示例）</template>
          <v-chart :option="barOption" style="height: 300px;" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>系统模块占比（示例）</template>
          <v-chart :option="pieOption" style="height: 300px;" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon :size="20" color="#409EFF"><Key /></el-icon>
              <span>您拥有的权限标识</span>
            </div>
          </template>
          <div class="permissions-box">
            <el-tag
              v-for="(perm, idx) in userStore.permissions"
              :key="idx"
              size="large"
              :type="getPermType(perm)"
              style="margin: 5px;"
            >
              {{ perm }}
            </el-tag>
            <el-tag v-if="!userStore.permissions || userStore.permissions.length === 0" type="info">
              暂无权限数据
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { House, Key } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

use([CanvasRenderer, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const userStore = useUserStore()
const currentDate = ref('')

onMounted(() => {
  const now = new Date()
  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

const barOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '访问量',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110, 130],
      itemStyle: { color: '#409EFF' }
    }
  ]
}))

const pieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, left: 'center' },
  series: [
    {
      name: '模块',
      type: 'pie',
      radius: '60%',
      data: [
        { value: 1048, name: '系统管理' },
        { value: 735, name: '手机卡' },
        { value: 580, name: '运营中心' },
        { value: 484, name: '首页' }
      ],
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
      }
    }
  ]
}))

function getPermType(perm) {
  if (perm.startsWith('system')) return 'primary'
  if (perm.startsWith('phone')) return 'success'
  if (perm.startsWith('operation')) return 'warning'
  return 'info'
}
</script>

<style scoped>
.home-page {
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.welcome-content h2 {
  margin: 0 0 10px;
  color: #303133;
}

.welcome-content p {
  color: #909399;
  margin: 0;
}

.permissions-box {
  padding: 10px 0;
}
</style>
