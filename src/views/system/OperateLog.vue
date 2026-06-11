<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Document /></el-icon>
            <span style="margin-left: 8px;">日志管理</span>
          </div>
          <div>
            <el-select v-model="moduleFilter" placeholder="操作模块" style="width: 160px; margin-right: 10px;" clearable @change="handleFilterChange">
              <el-option v-for="m in moduleOptions" :key="m" :label="m" :value="m" />
            </el-select>
            <el-select v-model="typeFilter" placeholder="操作类型" style="width: 120px; margin-right: 10px;" clearable @change="handleFilterChange">
              <el-option label="编辑" value="编辑" />
              <el-option label="删除" value="删除" />
            </el-select>
            <el-input v-model="operatorFilter" placeholder="操作人" style="width: 180px; margin-right: 10px;" clearable :prefix-icon="User" @input="handleFilterChange" />
          </div>
        </div>
      </template>

      <el-table :data="filteredList" style="width: 100%;" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="moduleName" label="操作模块" width="130" />
        <el-table-column prop="operateType" label="操作类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.operateType === '删除' ? 'danger' : 'primary'">
              {{ row.operateType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataId" label="数据ID" width="90" />
        <el-table-column prop="dataName" label="数据名称" width="180" show-overflow-tooltip />
        <el-table-column prop="fieldChanged" label="变更字段" width="220" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="110" />
        <el-table-column prop="operateTime" label="操作时间" width="180" />
        <el-table-column prop="remark" label="备注" min-width="260" show-overflow-tooltip />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="filteredList.length" layout="total, prev, pager, next" />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="日志详情" width="720px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="日志ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ detail.moduleName }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="detail.operateType === '删除' ? 'danger' : 'primary'">{{ detail.operateType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.operator }}</el-descriptions-item>
        <el-descriptions-item label="数据ID">{{ detail.dataId }}</el-descriptions-item>
        <el-descriptions-item label="数据名称">{{ detail.dataName }}</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ detail.operateTime }}</el-descriptions-item>
        <el-descriptions-item label="变更字段" :span="2">{{ detail.fieldChanged || '—' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '—' }}</el-descriptions-item>
        <el-descriptions-item label="修改前" :span="2">
          <pre style="margin: 0; white-space: pre-wrap; max-height: 200px; overflow: auto;">{{ detail.oldValue || '—' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="修改后" :span="2">
          <pre style="margin: 0; white-space: pre-wrap; max-height: 200px; overflow: auto;">{{ detail.newValue || '—' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Document, User } from '@element-plus/icons-vue'

const searchKeyword = ref('')
const moduleFilter = ref(null)
const typeFilter = ref(null)
const operatorFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const detailVisible = ref(false)
const detail = ref(null)

// mock数据
const mockList = [
  { id: 1, moduleName: '在用手机卡', operateType: '编辑', dataId: 3, dataName: '卡片-13800000003', fieldChanged: 'cardStatus, department', operator: 'admin', operateTime: '2025-06-01 10:22:30', remark: '将欠费状态改为正常，部门由运营部调整为市场部', oldValue: '{"cardStatus":3,"department":"运营部"}', newValue: '{"cardStatus":1,"department":"市场部"}' },
  { id: 2, moduleName: '备用手机卡', operateType: '删除', dataId: 12, dataName: '卡片-13800000012', fieldChanged: '整行删除', operator: 'admin', operateTime: '2025-06-02 14:05:12', remark: '清理已报废备用卡', oldValue: '{"cardNumber":"13800000012","agent":"XX代理商","status":"库存"}', newValue: '' },
  { id: 3, moduleName: '用户管理', operateType: '编辑', dataId: 5, dataName: '张三', fieldChanged: 'realName, phone', operator: 'operator', operateTime: '2025-06-05 09:11:48', remark: '更正手机号与姓名', oldValue: '{"realName":"张山","phone":"13800000000"}', newValue: '{"realName":"张三","phone":"13800138001"}' },
  { id: 4, moduleName: '代理商管理', operateType: '编辑', dataId: 2, dataName: 'YY通信服务中心', fieldChanged: 'contact', operator: 'admin', operateTime: '2025-06-08 16:40:20', remark: '更新联系人', oldValue: '{"contact":"李主任"}', newValue: '{"contact":"李经理"}' },
  { id: 5, moduleName: '角色管理', operateType: '编辑', dataId: 2, dataName: '运营员', fieldChanged: 'description', operator: 'admin', operateTime: '2025-06-10 11:00:00', remark: '补充角色描述信息', oldValue: '{"description":"运营员"}', newValue: '{"description":"负责手机卡/服务器日常运营"}' }
]

const listData = ref([])

const moduleOptions = computed(() => {
  const set = new Set(listData.value.map(i => i.moduleName).filter(Boolean))
  return Array.from(set)
})

const filteredList = computed(() => {
  return listData.value.filter(item => {
    if (moduleFilter.value && item.moduleName !== moduleFilter.value) return false
    if (typeFilter.value && item.operateType !== typeFilter.value) return false
    if (operatorFilter.value && !(item.operator || '').includes(operatorFilter.value)) return false
    return true
  })
})

onMounted(() => {
  loading.value = true
  setTimeout(() => { listData.value = [...mockList]; loading.value = false }, 200)
})

function handleFilterChange() { page.value = 1 }

function handleView(row) {
  detail.value = row
  detailVisible.value = true
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
