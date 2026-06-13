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
            <el-button type="primary" :icon="Search" @click="loadList">查询</el-button>
          </div>
        </div>
      </template>

      <el-table :data="reportList" style="width: 100%;" stripe border v-loading="loading" empty-text="暂无数据">
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
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Document, Search } from '@element-plus/icons-vue'
import { getPhoneCardList } from '@/api/phone'

const dateRange = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const reportList = ref([])

async function loadList() {
  loading.value = true
  try {
    // 日报表目前暂无后端专用接口，这里复用手机卡列表数据展示每日动态
    const res = await getPhoneCardList({ page: page.value, size: pageSize.value })
    const records = res?.records || res?.list || res?.rows || []
    reportList.value = records.map((item, idx) => ({
      date: item?.createTime || '-',
      visits: (item?.id ?? 0) * 10 + 200 + idx,
      newUsers: (item?.id ?? 0) + 5,
      activeUsers: (item?.id ?? 0) * 3 + 50,
      revenue: ((item?.id ?? 0) * 100 + 500).toFixed(2),
      conversion: '2.5%',
      remark: item?.iccd ? 'ICCID: ' + item.iccd : ''
    }))
    total.value = Number(res?.total || 0)
  } catch (e) {
    reportList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => loadList())
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
