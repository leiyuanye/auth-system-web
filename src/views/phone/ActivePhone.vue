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
            <el-input
              v-model="searchKeyword"
              placeholder="搜索卡号/运营商/使用人"
              style="width: 240px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
            />
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('phone:active:add')">
              新增卡
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredList" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="cardNumber" label="卡号" width="160" />
        <el-table-column prop="operator" label="运营商" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.operator || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phoneNumber" label="手机号" width="140" />
        <el-table-column prop="userName" label="使用人" width="120" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="package" label="套餐" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '在用' ? 'success' : row.status === '停机' ? 'danger' : 'warning'">
              {{ row.status || '在用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="入库时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small"
              v-if="userStore.hasPermission('phone:active:edit')"
              @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small"
              v-if="userStore.hasPermission('phone:active:delete')"
              @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="filteredList.length"
          layout="total, prev, pager, next"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="卡号" prop="cardNumber">
              <el-input v-model="form.cardNumber" placeholder="请输入卡号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运营商">
              <el-select v-model="form.operator" placeholder="选择运营商" style="width: 100%;">
                <el-option label="中国移动" value="中国移动" />
                <el-option label="中国联通" value="中国联通" />
                <el-option label="中国电信" value="中国电信" />
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
            <el-form-item label="使用人">
              <el-input v-model="form.userName" placeholder="请输入使用人" />
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
              <el-input v-model="form.package" placeholder="如 59元/月" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option label="在用" value="在用" />
                <el-option label="停机" value="停机" />
                <el-option label="欠费" value="欠费" />
              </el-select>
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
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增在用手机卡')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null, cardNumber: '', operator: '', phoneNumber: '',
  userName: '', department: '', package: '', status: '在用'
})
const form = ref(defaultForm())

const rules = {
  cardNumber: [{ required: true, message: '请输入卡号', trigger: 'blur' }]
}

// Mock 数据
const mockList = [
  { id: 1, cardNumber: '89860123456789001', operator: '中国移动', phoneNumber: '13800138001', userName: '张三', department: '销售部', package: '59元/月', status: '在用', createTime: '2024-01-15 10:30:00' },
  { id: 2, cardNumber: '89860123456789002', operator: '中国联通', phoneNumber: '18600138002', userName: '李四', department: '技术部', package: '79元/月', status: '在用', createTime: '2024-01-16 11:00:00' },
  { id: 3, cardNumber: '89860123456789003', operator: '中国电信', phoneNumber: '13300138003', userName: '王五', department: '市场部', package: '99元/月', status: '停机', createTime: '2024-01-17 09:00:00' },
  { id: 4, cardNumber: '89860123456789004', operator: '中国移动', phoneNumber: '13900138004', userName: '赵六', department: '运营部', package: '59元/月', status: '在用', createTime: '2024-01-18 14:00:00' },
  { id: 5, cardNumber: '89860123456789005', operator: '中国联通', phoneNumber: '18500138005', userName: '孙七', department: '客服部', package: '49元/月', status: '欠费', createTime: '2024-01-19 16:30:00' }
]

const listData = ref([])

const filteredList = computed(() => {
  const kw = searchKeyword.value.toLowerCase()
  if (!kw) return listData.value
  return listData.value.filter(item =>
    (item.cardNumber || '').toLowerCase().includes(kw) ||
    (item.operator || '').toLowerCase().includes(kw) ||
    (item.userName || '').toLowerCase().includes(kw)
  )
})

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    listData.value = [...mockList]
    loading.value = false
  }, 300)
})

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
