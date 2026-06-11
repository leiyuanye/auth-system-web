<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><OfficeBuilding /></el-icon>
            <span style="margin-left: 8px;">代理商管理</span>
          </div>
          <div class="filters">
            <el-select v-model="statusFilter" placeholder="全部状态" style="width: 120px;" clearable @change="onQuery">
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索代理商名称/联系人"
              style="width: 240px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="onQuery"
            />
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('phone:agent:add')">
              新增代理商
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="agentName" label="代理商名称" width="200" />
        <el-table-column prop="contact" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="160" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
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

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="onPageChange"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" @close="dialogClosed">
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
              <el-input v-model="form.contact" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
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
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { OfficeBuilding, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getAgentList, addAgent, updateAgent, deleteAgent } from '@/api/phone'

const userStore = useUserStore()
const searchKeyword = ref('')
const statusFilter = ref(null)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const total = ref(0)
const listData = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增代理商')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null, agentName: '', contact: '', phone: '',
  address: '', status: 1, remark: ''
})
const form = ref(defaultForm())

const rules = {
  agentName: [{ required: true, message: '请输入代理商名称', trigger: 'blur' }]
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize.value
    }
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (statusFilter.value !== null && statusFilter.value !== undefined && statusFilter.value !== '') {
      params.status = statusFilter.value
    }
    const res = await getAgentList(params)
    listData.value = (res && res.records) || (res && res.list) || (Array.isArray(res) ? res : [])
    total.value = Number(res && res.total) || listData.value.length
  } catch (e) {
    console.warn('代理商列表加载失败', e)
    listData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onQuery() { page.value = 1; loadList() }
function onPageChange() { loadList() }

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
  if (form.value.status == null) form.value.status = 1
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateAgent(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addAgent(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除代理商 "${row.agentName}" 吗？`, '提示', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
  }).catch(() => { throw new Error('cancel') })
  await deleteAgent(row.id)
  ElMessage.success('删除成功')
  loadList()
}

function dialogClosed() {
  form.value = defaultForm()
  if (formRef.value) formRef.value.clearValidate()
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-header .title { display: flex; align-items: center; }
.filters { display: flex; gap: 10px; align-items: center; }
.pagination { margin-top: 16px; text-align: right; }
</style>
