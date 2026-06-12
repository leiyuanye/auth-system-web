<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Cpu /></el-icon>
            <span style="margin-left: 8px;">在用服务器</span>
          </div>
          <div>
            <el-input v-model="searchKeyword" placeholder="搜索服务器名/IP" style="width: 240px; margin-right: 10px;" clearable :prefix-icon="Search" />
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('server:active:add')">
              新增服务器
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="serverName" label="服务器名称" width="180" />
        <el-table-column prop="ipAddress" label="IP地址" width="150" />
        <el-table-column prop="serverType" label="类型" width="110">
          <template #default="{ row }">
            <el-tag type="success" v-if="row.serverType === '腾讯云'">腾讯云</el-tag>
            <el-tag type="warning" v-else-if="row.serverType === '阿里云'">阿里云</el-tag>
            <el-tag type="danger" v-else-if="row.serverType === '华为云'">华为云</el-tag>
            <el-tag v-else>{{ row.serverType || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="所在地区" width="110" />
        <el-table-column prop="specs" label="所在分组" width="130" />
        <el-table-column prop="mfaKey" label="MFA密钥" width="180" show-overflow-tooltip />
        <el-table-column label="运行状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.serverStatus)">{{ statusText(row.serverStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="最近修改时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" v-if="userStore.hasPermission('server:active:edit')" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" v-if="userStore.hasPermission('server:active:delete')" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="服务器名称" prop="serverName">
              <el-input v-model="form.serverName" placeholder="请输入服务器名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="IP地址" prop="ipAddress">
              <el-input v-model="form.ipAddress" placeholder="如 10.0.1.100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="类型" prop="serverType">
              <el-select v-model="form.serverType" placeholder="请选择类型" style="width: 100%;">
                <el-option label="腾讯云" value="腾讯云" />
                <el-option label="阿里云" value="阿里云" />
                <el-option label="华为云" value="华为云" />
                <el-option label="物理服务器" value="物理服务器" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所在地区" prop="location">
              <el-select v-model="form.location" placeholder="请选择地区" style="width: 100%;">
                <el-option label="广州" value="广州" />
                <el-option label="杭州" value="杭州" />
                <el-option label="北京" value="北京" />
                <el-option label="上海" value="上海" />
                <el-option label="成都" value="成都" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所在分组" prop="specs">
              <el-select v-model="form.specs" placeholder="请选择分组" style="width: 100%;">
                <el-option label="数据库组" value="数据库组" />
                <el-option label="应用组" value="应用组" />
                <el-option label="缓存组" value="缓存组" />
                <el-option label="备份组" value="备份组" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运行状态" prop="serverStatus">
              <el-select v-model="form.serverStatus" style="width: 100%;">
                <el-option label="运行中" :value="1" />
                <el-option label="维护中" :value="2" />
                <el-option label="已下线" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="MFA密钥" prop="mfaKey">
          <el-input v-model="form.mfaKey" placeholder="请输入MFA密钥" show-password clearable />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
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
import { Cpu, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getServerList, addServer, updateServer, deleteServer } from '@/api/server'

const userStore = useUserStore()
const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const listData = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增在用服务器')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const defaultForm = () => ({
  id: null, serverName: '', ipAddress: '', serverType: '', location: '',
  specs: '', mfaKey: '', serverStatus: 1, stockStatus: '', cardType: 1, remark: ''
})
const form = ref(defaultForm())
const rules = {
  serverName: [{ required: true, message: '请输入服务器名称', trigger: 'blur' }],
  ipAddress: [{ required: true, message: '请输入IP地址', trigger: 'blur' }]
}

const statusText = (val) => {
  if (val === 1) return '运行中'
  if (val === 2) return '维护中'
  if (val === 3) return '已下线'
  return '-'
}
const statusTagType = (val) => {
  if (val === 1) return 'success'
  if (val === 2) return 'warning'
  if (val === 3) return 'danger'
  return 'info'
}

function formatTime(t) {
  if (!t) return '-'
  if (typeof t === 'string') return t
  try { return new Date(t).toLocaleString() } catch (e) { return String(t) }
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      cardType: 1,
      page: page.value,
      size: pageSize.value
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const res = await getServerList(params)
    const data = res || {}
    listData.value = data.records || data.list || data.rows || []
    total.value = Number(data.total) || 0
  } catch (e) {
    listData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => loadList())

function handlePageChange(val) { page.value = val; loadList() }

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增在用服务器'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑在用服务器'
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateServer(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      form.value.cardType = 1
      await addServer(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除 "${row.serverName}" 吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).catch(() => { throw new Error('cancel') })
  try {
    await deleteServer(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    ElMessage.error(e?.message || '删除失败')
  }
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
