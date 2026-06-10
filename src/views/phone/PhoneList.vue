<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Phone /></el-icon>
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
            <el-button type="primary" :icon="Plus" v-if="userStore.hasPermission('phone:list:add')">
              新增卡号
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredCards" style="width: 100%" stripe border>
        <el-table-column prop="cardNo" label="卡号" width="160" />
        <el-table-column prop="operator" label="运营商" width="120" />
        <el-table-column prop="package" label="套餐" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '在用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额(元)" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              v-if="userStore.hasPermission('phone:list:edit')"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              type="danger"
              link
              size="small"
              v-if="userStore.hasPermission('phone:list:delete')"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Phone, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const searchKeyword = ref('')

const cards = ref([
  { cardNo: '13800138000', operator: '中国移动', package: '99元无限流量套餐', status: 1, balance: 120.50, createTime: '2024-01-01 10:00:00' },
  { cardNo: '13900139000', operator: '中国移动', package: '59元基础套餐', status: 1, balance: 56.80, createTime: '2024-01-02 11:00:00' },
  { cardNo: '18800188000', operator: '中国联通', package: '79元大流量包', status: 1, balance: 89.00, createTime: '2024-01-03 12:00:00' },
  { cardNo: '17700177000', operator: '中国电信', package: '129元尊享套餐', status: 0, balance: 0.00, createTime: '2024-01-04 13:00:00' },
  { cardNo: '15600156000', operator: '中国联通', package: '39元基础套餐', status: 1, balance: 12.30, createTime: '2024-01-05 14:00:00' },
  { cardNo: '18900189000', operator: '中国电信', package: '99元家庭套餐', status: 1, balance: 210.00, createTime: '2024-01-06 15:00:00' }
])

const filteredCards = computed(() => {
  if (!searchKeyword.value) return cards.value
  return cards.value.filter(c => c.cardNo.includes(searchKeyword.value))
})

function handleEdit(row) {
  ElMessage.info('编辑卡号 ' + row.cardNo + '（功能演示，后端未实现）')
}

function handleDelete(row) {
  ElMessage.warning('删除卡号 ' + row.cardNo + '（功能演示，后端未实现）')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
