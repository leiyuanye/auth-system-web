<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Document /></el-icon>
            <span style="margin-left: 8px;">日报表</span>
          </div>
          <div>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-right: 10px;"
            />
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button
              :icon="Download"
              v-if="userStore.hasPermission('operation:report:export')"
              @click="handleExport"
              style="margin-left: 8px;"
            >
              导出
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="reports" style="width: 100%" stripe border>
        <el-table-column prop="date" label="日期" width="140" />
        <el-table-column prop="visits" label="访问量" width="120" />
        <el-table-column prop="newUsers" label="新增用户" width="120" />
        <el-table-column prop="activeUsers" label="活跃用户" width="120" />
        <el-table-column prop="revenue" label="收入(元)" width="140" />
        <el-table-column prop="conversion" label="转化率" width="120" />
        <el-table-column prop="remark" label="备注" />
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="10"
          :total="reports.length"
          layout="prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Search, Download } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const dateRange = ref('')
const currentPage = ref(1)

const reports = ref([
  { date: '2024-06-01', visits: 5123, newUsers: 128, activeUsers: 2156, revenue: 12580.00, conversion: '2.5%', remark: '儿童节活动' },
  { date: '2024-06-02', visits: 4872, newUsers: 115, activeUsers: 2034, revenue: 11230.50, conversion: '2.4%', remark: '' },
  { date: '2024-06-03', visits: 6201, newUsers: 189, activeUsers: 2489, revenue: 18940.00, conversion: '3.0%', remark: '促销活动' },
  { date: '2024-06-04', visits: 5568, newUsers: 156, activeUsers: 2267, revenue: 15420.80, conversion: '2.8%', remark: '' },
  { date: '2024-06-05', visits: 5923, newUsers: 168, activeUsers: 2345, revenue: 16890.00, conversion: '2.8%', remark: '' },
  { date: '2024-06-06', visits: 6125, newUsers: 195, activeUsers: 2512, revenue: 19450.30, conversion: '3.2%', remark: '大促' },
  { date: '2024-06-07', visits: 5782, newUsers: 145, activeUsers: 2398, revenue: 14560.00, conversion: '2.5%', remark: '' }
])

function handleSearch() {
  ElMessage.info('查询（功能演示，后端未实现）')
}

function handleExport() {
  ElMessage.success('导出报表（功能演示，后端未实现）')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
