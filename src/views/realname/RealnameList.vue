<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><User /></el-icon>
            <span style="margin-left: 8px;">实名人员</span>
          </div>
          <div>
            <el-select
              v-model="scanStatusFilter"
              placeholder="扫脸便捷性"
              style="width: 140px; margin-right: 10px;"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="不能扫脸" :value="1" />
              <el-option label="方便扫脸" :value="2" />
              <el-option label="较难扫脸" :value="3" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索姓名/手机号"
              style="width: 220px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
              @input="handleFilterChange"
            />
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('realname:list:add')">
              新增实名人员
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredList" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="department" label="所属部门" width="140" />
        <el-table-column label="扫脸便捷性" width="130">
          <template #default="{ row }">
            <el-tag :type="scanStatusType(row.scanStatus)">{{ scanStatusText(row.scanStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small"
              v-if="userStore.hasPermission('realname:list:edit')"
              @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small"
              v-if="userStore.hasPermission('realname:list:delete')"
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-input v-model="form.department" placeholder="请输入所属部门" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="扫脸便捷性">
              <el-select v-model="form.scanStatus" style="width: 100%;">
                <el-option label="不能扫脸" :value="1" />
                <el-option label="方便扫脸" :value="2" />
                <el-option label="较难扫脸" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
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
import { User, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const searchKeyword = ref('')
const scanStatusFilter = ref(null)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增实名人员')
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null, realName: '', phone: '',
  department: '', scanStatus: 2, remark: ''
})
const form = ref(defaultForm())

const rules = {
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }]
}

const scanStatusText = (val) => {
  if (val === 1) return '不能扫脸'
  if (val === 2) return '方便扫脸'
  if (val === 3) return '较难扫脸'
  return '-'
}

const scanStatusType = (val) => {
  if (val === 1) return 'danger'
  if (val === 2) return 'success'
  if (val === 3) return 'warning'
  return 'info'
}

const mockList = [
  { id: 1, realName: '张三', phone: '13800138001', department: '销售部', scanStatus: 2, remark: '销售代表', createTime: '2024-01-10 09:30:00' },
  { id: 2, realName: '李四', phone: '13800138002', department: '技术部', scanStatus: 2, remark: '后端工程师', createTime: '2024-02-15 14:00:00' },
  { id: 3, realName: '王五', phone: '13800138003', department: '运营部', scanStatus: 1, remark: '无法识别人脸', createTime: '2024-03-20 10:15:00' },
  { id: 4, realName: '赵六', phone: '13800138004', department: '客服部', scanStatus: 3, remark: '需多次识别', createTime: '2024-04-05 11:20:00' }
]

const listData = ref([])

const filteredList = computed(() => {
  const kw = searchKeyword.value.toLowerCase().trim()
  const statusVal = scanStatusFilter.value
  return listData.value.filter(item => {
    const matchKw = !kw ||
      (item.realName || '').toLowerCase().includes(kw) ||
      (item.phone || '').toLowerCase().includes(kw)
    const matchStatus = statusVal === null || statusVal === undefined || statusVal === '' ||
      item.scanStatus === statusVal
    return matchKw && matchStatus
  })
})

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    listData.value = [...mockList]
    loading.value = false
  }, 300)
})

function handleFilterChange() {
  page.value = 1
}

function handleAdd() {
  dialogTitle.value = '新增实名人员'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑实名人员'
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  setTimeout(() => {
    const idx = listData.value.findIndex(i => i.id === form.value.id)
    if (idx !== -1) {
      listData.value[idx] = { ...form.value }
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
  await ElMessageBox.confirm(`确定删除 "${row.realName}" 吗？`, '提示', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
  }).catch(() => { throw new Error('cancel') })
  listData.value = listData.value.filter(i => i.id !== row.id)
  ElMessage.success('删除成功')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
