<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Iphone /></el-icon>
            <span style="margin-left: 8px;">手机卡管理</span>
          </div>
          <div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索卡号"
              style="width: 220px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
            />
            <el-button type="primary" @click="loadList">查询</el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading" empty-text="暂无数据">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="cardNumber" label="卡号" width="200" />
        <el-table-column prop="agentName" label="代理商" width="160" />
        <el-table-column prop="phoneNumber" label="手机号" width="160" />
        <el-table-column prop="realnameName" label="实名人" width="140" />
        <el-table-column prop="package_" label="套餐" width="160" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.cardStatus)">{{ statusText(row.cardStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Iphone, Search } from '@element-plus/icons-vue'
import { getPhoneCardList } from '@/api/phone'

const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const listData = ref([])

const statusText = (val) => {
  if (val === 1) return '正常'
  if (val === 2) return '二次实名'
  if (val === 3) return '欠费'
  return '-'
}
const statusTagType = (val) => {
  if (val === 1) return 'success'
  if (val === 2) return 'warning'
  if (val === 3) return 'danger'
  return 'info'
}

async function loadList() {
  loading.value = true
  try {
    const params = { page: page.value, size: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const res = await getPhoneCardList(params)
    listData.value = res?.records || res?.list || res?.rows || []
    total.value = Number(res?.total || 0)
  } catch (e) {
    listData.value = []
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
