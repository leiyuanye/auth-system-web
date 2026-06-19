<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Monitor /></el-icon>
            <span style="margin-left: 8px;">服务器管理</span>
          </div>
          <div>
            <el-select v-model="searchStatus" placeholder="按状态筛选" clearable style="width: 140px; margin-right: 10px;" @change="handlePageChange(1)">
              <el-option v-for="item in statusOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
            </el-select>
            <el-input v-model="searchKeyword" placeholder="搜索服务器名/IP" style="width: 240px; margin-right: 10px;" clearable :prefix-icon="Search" />
            <el-dropdown trigger="click" style="margin-right: 8px;" v-if="userStore.hasPermission('server:active:add')">
              <el-button>
                <el-icon style="margin-right: 4px;"><Download /></el-icon>
                导入导出
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleDownloadTemplate">
                    <el-icon><Document /></el-icon>下载模板
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleImport" divided>
                    <el-icon><Upload /></el-icon>导入数据
                  </el-dropdown-item>
                  <el-dropdown-item @click="handleExport" divided>
                    <el-icon><Download /></el-icon>导出数据
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('server:active:add')">新增服务器</el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading" element-loading-text="加载中..." :row-class-name="serverRowClassName" @sort-change="handleSortChange">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="serverName" label="服务器名称" width="170" show-overflow-tooltip />
        <el-table-column prop="ipAddress" label="IP地址" width="150" />
        <el-table-column prop="serverType" label="类型" width="120">
          <template #default="{ row }">{{ row.serverType || '-' }}</template>
        </el-table-column>
        <el-table-column prop="location" label="所在地区" width="110" />
        <el-table-column prop="specs" label="所在分组" width="120" />
        <el-table-column prop="mfaKey" label="MFA密钥" width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.serverStatus)">{{ statusLabel(row.serverStatus) }}</el-tag>
          </template>
        </el-table-column>
      <el-table-column prop="remoteAccount" label="远程账号" width="130" show-overflow-tooltip />
        <el-table-column prop="remotePwd" label="远程密码" width="130" show-overflow-tooltip />
        <el-table-column prop="backendAccount" label="后台账号" width="130" show-overflow-tooltip />
        <el-table-column prop="backendPwd" label="后台密码" width="130" show-overflow-tooltip />
        <el-table-column prop="expireTime" label="到期时间" width="180" sortable="custom">
          <template #default="{ row }">
            <div :class="['expire-cell', { 'expire-soon': isExpiringSoon(row.expireTime) }]">
              <span>{{ formatDate(row.expireTime) }}</span>
              <el-tag v-if="isExpiringSoon(row.expireTime)" type="danger" size="small" effect="dark">
                {{ expireTip(row.expireTime) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
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
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
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
            <el-form-item label="状态" prop="serverStatus">
              <el-select v-model="form.serverStatus" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in statusOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="远程账号" prop="remoteAccount">
              <el-input v-model="form.remoteAccount" placeholder="如 root" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="远程密码" prop="remotePwd">
              <el-input v-model="form.remotePwd" placeholder="请输入远程密码" show-password clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="后台账号" prop="backendAccount">
              <el-input v-model="form.backendAccount" placeholder="如 admin" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="后台密码" prop="backendPwd">
              <el-input v-model="form.backendPwd" placeholder="请输入后台密码" show-password clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="MFA密钥" prop="mfaKey">
          <el-input v-model="form.mfaKey" placeholder="请输入MFA密钥" show-password clearable />
        </el-form-item>
        <el-form-item label="到期时间" prop="expireTime">
          <el-date-picker
            v-model="form.expireTime"
            type="date"
            placeholder="请选择到期时间"
            value-format="YYYY-MM-DD"
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

    <!-- 导入弹窗 -->
    <el-dialog v-model="uploadVisible" title="导入服务器" width="400px">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        :on-change="handleFileChange"
        :http-request="handleCustomUpload"
        accept=".xlsx,.xls"
        style="text-align: center; padding: 20px;"
      >
        <el-button type="warning">选择 Excel 文件</el-button>
        <template #tip>
          <div style="margin-top: 10px; color: #999; font-size: 12px;">
            支持 .xlsx 和 .xls 格式，请先下载模板填写数据
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="cancelImport">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" :disabled="!selectedFile" @click="confirmImport">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Search, Plus, Upload, Download, Document } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getServerList, addServer, updateServer, deleteServer, importServers } from '@/api/server'
import { getDictByType } from '@/api/dict'
import * as XLSX from 'xlsx'
import { dictLabelToKey } from '@/utils/dictConverter'

const userStore = useUserStore()
const searchKeyword = ref('')
const searchStatus = ref(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const listData = ref([])
const expireSort = ref('')

const typeOptions = ref([])
const groupOptions = ref([])
const statusOptions = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增服务器')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const defaultForm = () => ({
  id: null, serverName: '', ipAddress: '', serverType: '', location: '',
  specs: '', mfaKey: '', serverStatus: null, remoteAccount: '', remotePwd: '',
  backendAccount: '', backendPwd: '', expireTime: '', remark: ''
})
const form = ref(defaultForm())
const rules = {
  serverType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  serverStatus: [{ required: true, message: '请选择状态', trigger: 'change' }],
  remoteAccount: [{ required: true, message: '请输入远程账号', trigger: 'blur' }],
  remotePwd: [{ required: true, message: '请输入远程密码', trigger: 'blur' }],
  backendAccount: [{ required: true, message: '请输入后台账号', trigger: 'blur' }],
  backendPwd: [{ required: true, message: '请输入后台密码', trigger: 'blur' }],
  expireTime: [{ required: true, message: '请选择到期时间', trigger: 'change' }],
  ipAddress: [{ required: true, message: '请输入服务器IP', trigger: 'blur' }]

}

const statusLabel = (val) => {
  if (val == null) return '-'
  const opts = statusOptions.value || []
  const found = opts.find(o => Number(o.dictKey) === Number(val))
  return found ? found.dictValue : String(val)
}
const statusTagType = (val) => {
  if (val === 1 || Number(val) === 1) return 'success'
  if (val === 2 || Number(val) === 2) return 'warning'
  if (val === 3 || Number(val) === 3) return 'info'
  if (val === 4 || Number(val) === 4) return 'danger'
  return ''
}

function formatTime(t) {
  if (!t) return '-'
  if (typeof t === 'string') return t
  try { return new Date(t).toLocaleString() } catch (e) { return String(t) }
}

function formatDate(t) {
  if (!t) return '-'
  try {
    const d = new Date(t)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}/${m}/${day}`
  } catch (e) { return String(t) }
}

function daysUntilExpire(t) {
  if (!t) return null
  const expire = new Date(t)
  if (Number.isNaN(expire.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expire.setHours(0, 0, 0, 0)
  return Math.ceil((expire.getTime() - today.getTime()) / 86400000)
}

function isExpiringSoon(t) {
  const days = daysUntilExpire(t)
  return days !== null && days >= 0 && days <= 7
}

function expireTip(t) {
  const days = daysUntilExpire(t)
  if (days === 0) return '今日到期'
  return `${days}天内到期`
}

function serverRowClassName({ row }) {
  return isExpiringSoon(row.expireTime) ? 'server-expiring-soon-row' : ''
}



async function loadDict() {
  try {
    const [types, groups, statuses] = await Promise.all([
      getDictByType('server_type'),
      getDictByType('server_group'),
      getDictByType('server_status')
    ])
    typeOptions.value = Array.isArray(types) ? types : []
    groupOptions.value = Array.isArray(groups) ? groups : []
    statusOptions.value = Array.isArray(statuses) ? statuses : []
  } catch (e) {
    typeOptions.value = []
    groupOptions.value = []
    statusOptions.value = []
  }
}

async function loadList() {
  loading.value = true
  try {
    const params = { page: page.value, size: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (searchStatus.value != null) params.serverStatus = searchStatus.value
    if (expireSort.value) params.expireSort = expireSort.value
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

function handleSizeChange(val) {
  pageSize.value = val
  page.value = 1
  loadList()
}

function handleSortChange({ prop, order }) {
  if (prop === 'expireTime') {
    expireSort.value = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : ''
    page.value = 1
    loadList()
  }
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增服务器'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑服务器'
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
    // 用户点击取消时，Element Plus 抛出字符串 'cancel'，静默处理
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}

// 导出（前端生成）
async function handleExport() {
  try {
    const headers = ['服务器名称', 'IP地址', '类型', '所在地区', '所在分组', '状态', '到期时间', '备注']
    
    const data = listData.value.map(row => [
      row.serverName || '-',
      row.ipAddress || '-',
      row.serverType || '-',
      row.location || '-',
      row.specs || '-',
      row.serverStatus === 1 ? '正常' : '异常',
      row.expireDate || '-',
      row.remark || '-'
    ])
    
    data.unshift(headers)
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '服务器列表')
    
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const filename = '服务器列表_' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '.xlsx'
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('导出失败:', e)
    ElMessage.error('导出失败')
  }
}

// 下载模板（前端生成，使用驼峰字段名）
async function handleDownloadTemplate() {
  try {
    const data = [
      ['serverName', 'ipAddress', 'serverType', 'location', 'specs', 'serverStatus', 'remoteAccount', 'remotePwd', 'backendAccount', 'backendPwd', 'mfaKey', 'expireTime', 'remark'],
      ['服务器A', '10.0.1.100', '云服务器', '北京', '默认分组', 1, 'root', 'password', 'admin', 'admin123', '', '2025-12-31', '示例数据']
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '服务器导入模板')
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '服务器导入模板.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (e) {
    console.error('模板下载失败:', e)
    ElMessage.error('模板下载失败')
  }
}

// 导入
const uploadRef = ref(null)
const uploadVisible = ref(false)
const uploadLoading = ref(false)
const selectedFile = ref(null)

function handleImport() {
  uploadVisible.value = true
  selectedFile.value = null
}

function cancelImport() {
  uploadVisible.value = false
  selectedFile.value = null
}

function handleFileChange(file) {
  selectedFile.value = file
}

async function confirmImport() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  uploadLoading.value = true
  try {
    const convertedFile = await processImportFile(selectedFile.value.raw)
    const formData = new FormData()
    formData.append('file', convertedFile)
    const result = await importServers(formData)
    // 兼容两种返回格式：{ imported } 或直接是数字
    const importedCount = typeof result === 'number' ? result : (result?.imported ?? result?.successCount ?? result?.data ?? 0)
    ElMessage.success(`导入成功，共导入 ${importedCount} 条`)
    uploadVisible.value = false
    selectedFile.value = null
    loadList()
  } catch (e) {
    ElMessage.error(e?.message || '导入失败')
  } finally {
    uploadLoading.value = false
  }
}

async function processImportFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      for (const row of jsonData) {
        // 使用驼峰字段名进行转换
        if (row['serverStatus'] !== undefined) {
          row['serverStatus'] = dictLabelToKey(statusOptions.value, row['serverStatus'])
        }
        if (row['serverType'] !== undefined) {
          row['serverType'] = dictLabelToKey(typeOptions.value, row['serverType'])
        }
        if (row['specs'] !== undefined) {
          row['specs'] = dictLabelToKey(groupOptions.value, row['specs'])
        }
      }

      const newWorkbook = XLSX.utils.book_new()
      const newWorksheet = XLSX.utils.json_to_sheet(jsonData)
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName)
      const newData = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' })
      const blob = new Blob([newData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const convertedFile = new File([blob], file.name, { type: file.type })
      resolve(convertedFile)
    }
    reader.readAsArrayBuffer(file)
  })
}

function handleCustomUpload() {
  // 保留 http-request 以避免 el-upload 发送默认请求
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
.expire-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.expire-cell.expire-soon {
  color: #d93026;
  font-weight: 700;
}

:deep(.server-expiring-soon-row) {
  --el-table-tr-bg-color: #fff1f0;
}

:deep(.server-expiring-soon-row td) {
  background-color: #fff1f0 !important;
}

:deep(.server-expiring-soon-row:hover td) {
  background-color: #ffe1df !important;
}
</style>
