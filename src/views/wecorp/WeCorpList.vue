<template>
  <div class="page-container">
    <el-card class="page-card" v-loading="pageLoading" element-loading-text="加载中...">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><Collection /></el-icon>
            <span style="margin-left: 8px;">企微主体</span>
          </div>
          <div class="filters">
            <el-select
              v-model="subjectShortFilter"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="主体简称"
              style="width: 180px;"
              clearable
              @change="onQuery">
              <el-option
                v-for="item in subjectShortOptions"
                :key="item.dictKey"
                :label="item.dictValue"
                :value="item.dictKey" />
            </el-select>
            <el-select
              v-model="customerTypeFilter"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="客户类型"
              style="width: 180px;"
              clearable
              @change="onQuery">
              <el-option
                v-for="item in customerTypeOptions"
                :key="item.dictKey"
                :label="item.dictValue"
                :value="item.dictKey" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索企业全称/手机号/创建人"
              style="width: 260px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="onQuery"
            />
            <el-dropdown trigger="click" style="margin-left: 8px;" v-if="userStore.hasPermission('wecorp:list:add')">
              <el-button>
                <el-icon style="margin-right: 4px;"><Download /></el-icon>
                导入导出
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleTemplate">
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
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('wecorp:list:add')">
              新增企微主体
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border>
        <el-table-column label="序号" type="index" width="70" align="center" />
        <el-table-column label="主体简称" min-width="160">
          <template #default="{ row }">
            <el-tag
              v-for="(t, idx) in splitTag(row.subjectShort)"
              :key="idx"
              type="primary"
              effect="light"
              style="margin-right: 4px; margin-bottom: 4px;">{{ t }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="企业全称" min-width="240">
          <template #default="{ row }">
            <span
              class="clickable-link"
              @click="goToDetail(row)">
              {{ row.subjectFull || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="客户类型" min-width="160">
          <template #default="{ row }">
            <el-tag
              v-for="(t, idx) in splitTag(row.customerType)"
              :key="idx"
              type="success"
              effect="light"
              style="margin-right: 4px; margin-bottom: 4px;">{{ t }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="主体状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(getCorpStatus(row))" effect="light" size="small">
              {{ statusLabel(getCorpStatus(row)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="企业认证到期" width="140" prop="certExpire" />
        <el-table-column label="规模额度" width="110" align="right">
          <template #default="{ row }">{{ defaultNum(row.quotaTotal) }}</template>
        </el-table-column>
        <el-table-column label="已用额度" width="110" align="right">
          <template #default="{ row }">{{ defaultNum(row.quotaUsed) }}</template>
        </el-table-column>
        <el-table-column label="剩余额度" width="130">
          <template #default="{ row }">
            <el-progress
              :percentage="calcRemainingPercent(row)"
              :stroke-width="12"
              :show-text="true"
              :format="formatRemaining(row)" />
          </template>
        </el-table-column>
        <el-table-column label="外部联系人有效期" width="170" prop="contactValidDate" />
        <el-table-column label="主体创建人" width="120" prop="creator" />
        <el-table-column label="手机号码" width="140" prop="phone" />
        <el-table-column label="备注" min-width="160" prop="remark" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small"
              v-if="userStore.hasPermission('wecorp:list:edit')"
              @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small"
              v-if="userStore.hasPermission('wecorp:list:delete')"
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="780px" @close="dialogClosed">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="130px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="主体简称" prop="subjectShortArray">
              <el-select
                v-model="form.subjectShortArray"
                multiple
                placeholder="请选择主体简称"
                style="width: 100%;">
                <el-option
                  v-for="item in subjectShortOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="item.dictKey" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号码">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="企业全称" prop="subjectFull">
              <el-input v-model="form.subjectFull" placeholder="请输入企业全称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="客户类型">
              <el-select
                v-model="form.customerTypeArray"
                multiple
                placeholder="请选择客户类型"
                style="width: 100%;">
                <el-option
                  v-for="item in customerTypeOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="item.dictKey" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体状态">
              <el-select
                v-model="form.corpStatus"
                placeholder="请选择主体状态"
                style="width: 100%;">
                <el-option
                  v-for="item in statusOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="item.dictKey" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="企业认证到期">
              <el-date-picker
                v-model="form.certExpire"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="外部联系人有效期">
              <el-date-picker
                v-model="form.contactValidDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="规模额度">
              <el-input-number
                v-model="form.quotaTotal"
                :min="0"
                :step="100"
                style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="已用额度">
              <el-input-number
                v-model="form.quotaUsed"
                :min="0"
                :step="100"
                style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="主体创建人">
              <el-input v-model="form.creator" placeholder="请输入创建人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="form.remark" placeholder="请输入备注" />
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Collection, Search, Plus, Download, Upload, Document } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getWeCorpList, addWeCorp, updateWeCorp, deleteWeCorp, importWeCorps } from '@/api/wecorp'
import { getDictByType } from '@/api/dict'
import * as XLSX from 'xlsx'
import { dictLabelToKey } from '@/utils/dictConverter'


const router = useRouter()
const userStore = useUserStore()
const searchKeyword = ref('')
const subjectShortFilter = ref([])
const customerTypeFilter = ref([])
const customerTypeOptions = ref([])
const subjectShortOptions = ref([])
const statusOptions = ref([])
const page = ref(1)
const pageSize = ref(10)
const pageLoading = ref(false)
const total = ref(0)
const listData = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增企微主体')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null,
  subjectShortArray: [],
  subjectFull: '',
  customerTypeArray: [],
  certExpire: '',
  quotaTotal: 0,
  quotaUsed: 0,
  contactValidDate: '',
  creator: '',
  phone: '',
  remark: '',
  corpStatus: 'active'
})
const form = ref(defaultForm())

const rules = {
  subjectShortArray: [{ required: true, type: 'array', message: '请选择主体简称', trigger: 'change' }]
}

function splitTag(v) {
  if (!v) return []
  return String(v).split(',').map(s => s.trim()).filter(Boolean)
}
function defaultNum(v) {
  return (v == null || v === '') ? 0 : Number(v)
}
function calcTotal(row) { return defaultNum(row.quotaTotal) }
function calcUsed(row) { return defaultNum(row.quotaUsed) }

function calcRemainingPercent(row) {
  const total = calcTotal(row)
  const used = calcUsed(row)
  if (!total) return 0
  const left = total - used
  if (left <= 0) return 0
  return Math.min(100, Math.round((left / total) * 100))
}
function formatRemaining(row) {
  return function () { return calcTotal(row) - calcUsed(row) }
}

function getCorpStatus(row) {
  if (!row) return ''
  if (row.corpStatus !== undefined && row.corpStatus !== null && String(row.corpStatus).trim() !== '') {
    return row.corpStatus
  }
  if (row.corp_status !== undefined && row.corp_status !== null && String(row.corp_status).trim() !== '') {
    return row.corp_status
  }
  return ''
}
function statusLabel(key) {
  if (key == null || key === undefined || String(key).trim() === '') {
    return '未设置'
  }
  const o = statusOptions.value.find(item => item.dictKey === key)
  if (o && o.dictValue) return o.dictValue
  // 字典未加载时的硬编码兜底
  const fallback = { active: '正常', cancelled: '已注销', frozen: '已冻结' }
  return fallback[key] || key
}
function statusTagType(key) {
  if (key == null || key === undefined || String(key).trim() === '') {
    return 'info'
  }
  switch (key) {
    case 'active': return 'success'
    case 'cancelled': return 'info'
    case 'frozen': return 'danger'
    default: return 'primary'
  }
}

async function loadDicts() {
  try {
    const [customerList, subjectList, statusList] = await Promise.all([
      getDictByType('we_corp_customer_type'),
      getDictByType('we_corp_subject_short'),
      getDictByType('we_corp_status')
    ])
    customerTypeOptions.value = Array.isArray(customerList) ? customerList : []
    subjectShortOptions.value = Array.isArray(subjectList) ? subjectList : []
    statusOptions.value = Array.isArray(statusList) ? statusList : []
  } catch (e) {}
}

function toCamel(s) {
  return String(s).replace(/_([a-z])/gi, function (m, c) {
    return c.toUpperCase()
  })
}
function normalizeCorpRow(row) {
  if (!row || typeof row !== 'object') return row
  // 全面兜底：把 row 里所有的下划线键都拷贝到驼峰键
  Object.keys(row).forEach(function (key) {
    if (key.indexOf('_') !== -1) {
      const camel = toCamel(key)
      if (camel !== key && (row[camel] === undefined || row[camel] === null)) {
        row[camel] = row[key]
      }
    }
  })
  return row
}

async function loadList() {
  pageLoading.value = true
  try {
    const params = { page: page.value, size: pageSize.value }
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (Array.isArray(subjectShortFilter.value) && subjectShortFilter.value.length > 0) {
      params.subjectShorts = subjectShortFilter.value.join(',')
    }
    if (Array.isArray(customerTypeFilter.value) && customerTypeFilter.value.length > 0) {
      params.customerTypes = customerTypeFilter.value.join(',')
    }
    const res = await getWeCorpList(params)
    const data = (res && typeof res === 'object') ? res : {}
    const list = Array.isArray(data.list) ? data.list
      : (Array.isArray(data.records) ? data.records
        : (Array.isArray(data.rows) ? data.rows : []))
    // 对每条记录做下划线→驼峰字段合并，避免后端命名策略导致的字段丢失
    if (Array.isArray(list)) list.forEach(normalizeCorpRow)
    listData.value = list
    total.value = Number(data.total != null ? data.total : list.length)
  } catch (e) {
    listData.value = []
    total.value = 0
  } finally {
    pageLoading.value = false
  }
}

function onQuery() { page.value = 1; loadList() }
function onPageChange() { loadList() }

function goToDetail(row) {
  if (!row || !row.id) return
  router.push(`/wecorp/detail/${row.id}`)
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增企微主体'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑企微主体'
  form.value = {
    id: row.id,
    subjectShortArray: splitTag(row.subjectShort),
    subjectFull: (row.subjectFull != null) ? row.subjectFull : '',
    customerTypeArray: splitTag(row.customerType),
    certExpire: (row.certExpire != null) ? row.certExpire : '',
    quotaTotal: (row.quotaTotal != null) ? Number(row.quotaTotal) : 0,
    quotaUsed: (row.quotaUsed != null) ? Number(row.quotaUsed) : 0,
    contactValidDate: (row.contactValidDate != null) ? row.contactValidDate : '',
    creator: (row.creator != null) ? row.creator : '',
    phone: (row.phone != null) ? row.phone : '',
    remark: (row.remark != null) ? row.remark : '',
    corpStatus: (function () { const v = getCorpStatus(row); return (v != null && v !== '') ? v : 'active' })()
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = {
      subjectShort: Array.isArray(form.value.subjectShortArray) ? form.value.subjectShortArray.join(',') : '',
      subjectFull: form.value.subjectFull,
      customerType: Array.isArray(form.value.customerTypeArray) ? form.value.customerTypeArray.join(',') : '',
      certExpire: form.value.certExpire || null,
      quotaTotal: Number(form.value.quotaTotal) || 0,
      quotaUsed: Number(form.value.quotaUsed) || 0,
      contactValidDate: form.value.contactValidDate || null,
      creator: form.value.creator,
      phone: form.value.phone,
      corpStatus: form.value.corpStatus,
      remark: form.value.remark
    }
    if (isEdit.value) {
      await updateWeCorp(form.value.id, payload)
      ElMessage.success('更新成功')
    } else {
      await addWeCorp(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  const display = row.subjectFull || row.subjectShort || String(row.id)
  await ElMessageBox.confirm(`确定删除「${display}」吗？`, '提示', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
  }).catch(() => {})
  await deleteWeCorp(row.id)
  ElMessage.success('删除成功')
  loadList()
}

function dialogClosed() {
  form.value = defaultForm()
  if (formRef.value) formRef.value.clearValidate()
}

// ========== 导入/导出 ==========

// 导出数据（前端生成）
async function handleExport() {
  try {
    const headers = ['主体简称', '企业全称', '客户类型', '主体状态', '企业认证到期', '规模额度', '已用额度', '额度预警', '法人姓名', '联系电话', '备注']
    
    const data = listData.value.map(row => [
      row.subjectShort || '-',
      row.subjectFull || '-',
      row.customerType || '-',
      statusLabel(getCorpStatus(row)) || '-',
      row.certExpire || '-',
      defaultNum(row.quotaTotal),
      defaultNum(row.quotaUsed),
      row.quotaWarn ? '是' : '否',
      row.legalPerson || '-',
      row.contactPhone || '-',
      row.remark || '-'
    ])
    
    data.unshift(headers)
    
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '企微主体数据')
    
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const filename = '企微主体数据_' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '.xlsx'
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('导出失败:', e)
    ElMessage.error('导出失败')
  }
}

// 下载模板（前端生成，使用数据库字段名）
async function handleTemplate() {
  try {
    const data = [
      ['subject_short', 'subject_full', 'customer_type', 'legal_person', 'contact_phone', 'cert_expire', 'remark'],
      ['主体A', '某某有限公司', '客户', '张三', '13800138000', '2025-12-31', '示例数据']
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '企微主体导入模板')
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '企微主体导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    ElMessage.success('模板下载成功')
  } catch (e) {
    console.error('模板下载失败:', e)
    ElMessage.error('模板下载失败')
  }
}

function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const convertedFile = await processImportFile(file)
      const formData = new FormData()
      formData.append('file', convertedFile)
      const result = await importWeCorps(formData)
      // 兼容两种返回格式：{ successCount, failCount } 或直接是数字
      const successCount = typeof result === 'number' ? result : (result?.successCount ?? result?.data)
      if (successCount !== undefined && successCount !== null) {
        ElMessage.success(`导入成功：共 ${successCount} 条`)
        loadList()
      } else {
        ElMessage.success('导入成功')
        loadList()
      }
    } catch (err) {
      ElMessage.error('导入失败：' + (err.message || '未知错误'))
    }
  }
  input.click()
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
        if (row['主体简称'] !== undefined) {
          row['主体简称'] = dictLabelToKey(subjectShortOptions.value, row['主体简称'])
        }
        if (row['客户类型'] !== undefined) {
          row['客户类型'] = dictLabelToKey(customerTypeOptions.value, row['客户类型'])
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

onMounted(async () => {
  await loadDicts()
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

.clickable-link {
  color: #409eff;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s;
}
.clickable-link:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>
