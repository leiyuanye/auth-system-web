<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Box /></el-icon>
            <span style="margin-left: 8px;">备用服务器</span>
          </div>
          <div>
            <el-input v-model="searchKeyword" placeholder="搜索服务器名/IP" style="width: 240px; margin-right: 10px;" clearable :prefix-icon="Search" />
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('server:backup:add')">
              新增备用服务器
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="serverName" label="服务器名称" width="180" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="150" />
        <el-table-column prop="serverType" label="类型" width="120">
          <template #default="{ row }">{{ row.serverType || '-' }}</template>
        </el-table-column>
        <el-table-column prop="location" label="所在地区" width="110" />

        <el-table-column prop="mfaKey" label="MFA密钥" width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="stockStatusTagType(row.stockStatus)">{{ row.stockStatus || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column prop="expireTime" label="到期时间" width="180">
        <template #default="{ row }">{{ formatTime(row.expireTime) }}</template>
      </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" v-if="userStore.hasPermission('server:backup:edit')" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" v-if="userStore.hasPermission('server:backup:delete')" @click="handleDelete(row)">删除</el-button>
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
              <el-input v-model="form.ipAddress" placeholder="如 10.0.2.100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="类型" prop="serverType">
              <el-select v-model="form.serverType" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in typeOptions" :key="item.dictKey" :label="item.dictValue" :value="item.dictKey" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所在地区" prop="location">
              <el-input v-model="form.location" placeholder="请输入地区" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="所在分组" prop="specs">
              <el-select v-model="form.specs" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in groupOptions" :key="item.dictKey" :label="item.dictValue" :value="item.dictKey" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存状态" prop="stockStatus">
              <el-select v-model="form.stockStatus" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in stockStatusOptions" :key="item.dictKey" :label="item.dictValue" :value="item.dictKey" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="MFA密钥" prop="mfaKey">
          <el-input v-model="form.mfaKey" placeholder="请输入MFA密钥" show-password clearable />
        </el-form-item>
        <el-form-item label="到期时间" prop="expireTime">
          <el-date-picker
            v-model="form.expireTime"
            type="datetime"
            placeholder="请选择到期时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
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
import { Box, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getServerList, addServer, updateServer, deleteServer } from '@/api/server'
import { getDictByType } from '@/api/dict'

const userStore = useUserStore()
const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const listData = ref([])

const typeOptions = ref([])
const groupOptions = ref([])
const stockStatusOptions = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增备用服务器')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const defaultForm = () => ({
  id: null, serverName: '', ipAddress: '', serverType: '', location: '',
  specs: '', mfaKey: '', serverStatus: null, stockStatus: '', cardType: 2,
  expireTime: '', remark: ''
})
const form = ref(defaultForm())
const rules = {
  serverName: [{ required: true, message: '请输入服务器名称', trigger: 'blur' }]
}

function stockStatusTagType(s) {
  if (s === '库存') return 'success'
  if (s === '已借出') return 'warning'
  if (s === '报废') return 'danger'
  return 'info'
}

function formatTime(t) {
  if (!t) return '-'
  if (typeof t === 'string') return t
  try { return new Date(t).toLocaleString() } catch (e) { return String(t) }
}

async function loadDict() {
  try {
    const [types, groups, stockStatuses] = await Promise.all([
      getDictByType('server_type'),
      getDictByType('server_group'),
      getDictByType('stock_status')
    ])
    typeOptions.value = types || []
    groupOptions.value = groups || []
    stockStatusOptions.value = stockStatuses || []
  } catch (e) {
    typeOptions.value = []
    groupOptions.value = []
    stockStatusOptions.value = []
  }
}

async function loadList() {
  loading.value = true
  try {
    const params = { page: page.value, size: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const res = await getServerList(params)
    const data = (res && typeof res === 'object') ? res : {}
    listData.value = Array.isArray(data.list) ? data.list : (Array.isArray(data.records) ? data.records : (Array.isArray(data.rows) ? data.rows : []))
    total.value = Number(data.total ?? 0)
  } catch (e) {
    listData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDict()
  loadList()
})

function handlePageChange(val) { page.value = val; loadList() }

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增备用服务器'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑备用服务器'
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
  try {
    await ElMessageBox.confirm(`确定删除 "${row.serverName}" 吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteServer(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    if (e !== 'cancel' && e?.message !== 'cancel') {
      ElMessage.error(e?.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
