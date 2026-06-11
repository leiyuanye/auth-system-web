<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><OfficeBuilding /></el-icon>
            <span style="margin-left: 8px;">代理商管理</span>
          </div>
          <div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索代理商名称/联系人"
              style="width: 240px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
            />
            <el-select v-model="statusFilter" placeholder="全部状态" style="width: 120px; margin-right: 10px;" clearable>
              <el-option label="启用" value="启用" />
              <el-option label="禁用" value="禁用" />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('phone:agent:add')">
              新增代理商
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredList" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="agentName" label="代理商名称" width="200" />
        <el-table-column prop="contactName" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="160" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'danger'">
              {{ row.status || '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small"
              v-if="userStore.hasPermission('phone:agent:edit')"
              @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small"
              v-if="userStore.hasPermission('phone:agent:delete')"
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="代理商名称" prop="agentName">
              <el-input v-model="form.agentName" placeholder="请输入代理商名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="form.contactName" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="地址">
              <el-input v-model="form.address" placeholder="请输入地址" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option label="启用" value="启用" />
                <el-option label="禁用" value="禁用" />
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
import { OfficeBuilding, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const searchKeyword = ref('')
const statusFilter = ref('')
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增代理商')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null, agentName: '', contactName: '', contactPhone: '',
  address: '', status: '启用', remark: ''
})
const form = ref(defaultForm())

const rules = {
  agentName: [{ required: true, message: '请输入代理商名称', trigger: 'blur' }]
}

const mockList = [
  { id: 1, agentName: 'XX科技有限公司', contactName: '张经理', contactPhone: '13800138001', address: '北京市朝阳区建国路88号', status: '启用', remark: '主要代理商', createTime: '2024-01-10 09:30:00' },
  { id: 2, agentName: 'YY通信服务中心', contactName: '李主管', contactPhone: '13800138002', address: '上海市浦东新区世纪大道100号', status: '启用', remark: '长期合作伙伴', createTime: '2024-02-15 14:00:00' },
  { id: 3, agentName: 'ZZ网络科技', contactName: '王总', contactPhone: '13800138003', address: '广州市天河区珠江新城5号', status: '禁用', remark: '暂停合作', createTime: '2024-03-20 10:15:00' }
]

const listData = ref([])

const filteredList = computed(() => {
  const kw = searchKeyword.value.toLowerCase()
  return listData.value.filter(item => {
    const matchKw = !kw ||
      (item.agentName || '').toLowerCase().includes(kw) ||
      (item.contactName || '').toLowerCase().includes(kw)
    const matchStatus = !statusFilter.value || item.status === statusFilter.value
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

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增代理商'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑代理商'
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
  await ElMessageBox.confirm(`确定删除代理商 "${row.agentName}" 吗？`, '提示', { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }).catch(() => { throw new Error('cancel') })
  listData.value = listData.value.filter(i => i.id !== row.id)
  ElMessage.success('删除成功')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
