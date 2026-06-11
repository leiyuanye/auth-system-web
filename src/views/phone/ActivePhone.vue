<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Connection /></el-icon>
            <span style="margin-left: 8px;">在用手机卡</span>
          </div>
          <div>
            <el-select v-model="statusFilter" placeholder="状态" style="width: 140px; margin-right: 10px;" clearable @change="handleFilterChange">
              <el-option label="正常" :value="1" />
              <el-option label="二次实名" :value="2" />
              <el-option label="欠费" :value="3" />
            </el-select>
            <el-input v-model="searchKeyword" placeholder="搜索卡号/代理商/实名人" style="width: 240px; margin-right: 10px;" clearable :prefix-icon="Search" />
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('phone:active:add')">新增卡</el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredList" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="cardNumber" label="卡号" width="160" />
        <el-table-column prop="agentName" label="代理商" width="140">
          <template #default="{ row }">
            <el-tag>{{ row.agentName || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phoneNumber" label="手机号" width="140" />
        <el-table-column prop="realnameName" label="实名人" width="120" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="package_" label="套餐" width="120" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.cardStatus)">{{ statusText(row.cardStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="入库时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" v-if="userStore.hasPermission('phone:active:edit')" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" v-if="userStore.hasPermission('phone:active:delete')" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination v-model:current-page="page" :page-size="pageSize" :total="filteredList.length" layout="total, prev, pager, next" />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="卡号" prop="cardNumber">
              <el-input v-model="form.cardNumber" placeholder="请输入卡号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="代理商" prop="agentId">
              <el-select v-model="form.agentId" placeholder="选择代理商" style="width: 100%;" filterable @change="handleAgentChange">
                <el-option v-for="agent in agentList" :key="agent.id" :label="agent.agentName" :value="agent.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="form.phoneNumber" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实名人" prop="realnameId">
              <el-select v-model="form.realnameId" placeholder="选择实名人" style="width: 100%;" filterable @change="handleRealnameChange">
                <el-option v-for="item in realnameList" :key="item.id" :label="item.realName + '（' + (item.department || '') + '）'" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="部门">
              <el-input v-model="form.department" placeholder="请输入部门" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="套餐">
              <el-input v-model="form.package_" placeholder="如 59元/月" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.cardStatus" style="width: 100%;">
                <el-option label="正常" :value="1" />
                <el-option label="二次实名" :value="2" />
                <el-option label="欠费" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const searchKeyword = ref('')
const statusFilter = ref(null)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增在用手机卡')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null, cardNumber: '', agentId: null, agentName: '', phoneNumber: '',
  realnameId: null, realnameName: '', department: '', package_: '',
  cardStatus: 1, cardType: 1, remark: ''
})
const form = ref(defaultForm())

const rules = {
  cardNumber: [{ required: true, message: '请输入卡号', trigger: 'blur' }]
}

// 代理商列表（模拟，实际应从 API 获取）
const agentList = ref([
  { id: 1, agentName: 'XX科技有限公司' },
  { id: 2, agentName: 'YY通信服务中心' },
  { id: 3, agentName: 'ZZ网络科技' }
])

// 实名人员列表（模拟，实际应从 API 获取）
const realnameList = ref([
  { id: 1, realName: '张三', department: '销售部' },
  { id: 2, realName: '李四', department: '技术部' },
  { id: 3, realName: '王五', department: '运营部' },
  { id: 4, realName: '赵六', department: '客服部' },
  { id: 5, realName: '孙七', department: '市场部' }
])

const mockList = [
  { id: 1, cardNumber: '89860123456789001', agentId: 1, agentName: 'XX科技有限公司', phoneNumber: '13800138001', realnameId: 1, realnameName: '张三', department: '销售部', package_: '59元/月', cardStatus: 1, cardType: 1, remark: '销售部在用', createTime: '2024-01-15 10:30:00' },
  { id: 2, cardNumber: '89860123456789002', agentId: 2, agentName: 'YY通信服务中心', phoneNumber: '13800138002', realnameId: 2, realnameName: '李四', department: '技术部', package_: '79元/月', cardStatus: 1, cardType: 1, remark: '技术部在用', createTime: '2024-01-16 11:00:00' },
  { id: 3, cardNumber: '89860123456789003', agentId: 3, agentName: 'ZZ网络科技', phoneNumber: '13800138003', realnameId: 3, realnameName: '王五', department: '运营部', package_: '99元/月', cardStatus: 2, cardType: 1, remark: '需二次实名', createTime: '2024-01-17 09:00:00' },
  { id: 4, cardNumber: '89860123456789004', agentId: 1, agentName: 'XX科技有限公司', phoneNumber: '13800138004', realnameId: 4, realnameName: '赵六', department: '客服部', package_: '59元/月', cardStatus: 3, cardType: 1, remark: '欠费待处理', createTime: '2024-01-18 14:00:00' },
  { id: 5, cardNumber: '89860123456789005', agentId: 2, agentName: 'YY通信服务中心', phoneNumber: '13800138005', realnameId: 5, realnameName: '孙七', department: '市场部', package_: '49元/月', cardStatus: 1, cardType: 1, remark: '市场部在用', createTime: '2024-01-19 16:30:00' }
]

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

const filteredList = computed(() => {
  const kw = searchKeyword.value.toLowerCase()
  const sv = statusFilter.value
  return listData.value.filter(item => {
    const matchKw = !kw ||
      (item.cardNumber || '').toLowerCase().includes(kw) ||
      (item.agentName || '').toLowerCase().includes(kw) ||
      (item.realnameName || '').toLowerCase().includes(kw)
    const matchStatus = sv === null || sv === undefined || sv === '' || item.cardStatus === sv
    return matchKw && matchStatus
  })
})

onMounted(() => {
  loading.value = true
  setTimeout(() => { listData.value = [...mockList]; loading.value = false }, 300)
})

function handleFilterChange() { page.value = 1 }

function handleAgentChange(id) {
  const agent = agentList.value.find(a => a.id === id)
  form.value.agentName = agent ? agent.agentName : ''
}

function handleRealnameChange(id) {
  const item = realnameList.value.find(r => r.id === id)
  form.value.realnameName = item ? item.realName : ''
  if (item && item.department) form.value.department = item.department
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增在用手机卡'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑在用手机卡'
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  setTimeout(() => {
    if (isEdit.value) {
      const idx = listData.value.findIndex(i => i.id === form.value.id)
      if (idx !== -1) listData.value[idx] = { ...form.value }
      ElMessage.success('更新成功')
    } else {
      form.value.id = Date.now()
      form.value.createTime = new Date().toLocaleString()
      listData.value.unshift({ ...form.value })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    submitting.value = false
  }, 300)
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除卡号 "${row.cardNumber}" 吗？`, '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }).catch(() => { throw new Error('cancel') })
  listData.value = listData.value.filter(i => i.id !== row.id)
  ElMessage.success('删除成功')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
