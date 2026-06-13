<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><Iphone /></el-icon>
            <span style="margin-left: 8px;">手机卡管理</span>
          </div>
          <div class="filters">
            <el-select v-model="cardTypeFilter" placeholder="卡类型" style="width: 130px;" clearable @change="handleFilterChange">
              <el-option v-for="item in cardTypeOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
            </el-select>
            <el-select v-model="usageStatusFilter" placeholder="使用状态" style="width: 130px;" clearable @change="handleFilterChange">
              <el-option v-for="item in usageStatusOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
            </el-select>
            <el-select v-model="statusFilter" placeholder="状态" style="width: 130px;" clearable @change="handleFilterChange">
              <el-option v-for="item in cardStatusOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
            </el-select>
            <el-select v-model="groupBy" placeholder="分组字段" style="width: 150px;" clearable @change="handleFilterChange">
              <el-option label="按卡类型分组" value="cardType" />
              <el-option label="按使用状态分组" value="usageStatus" />
              <el-option label="按代理商分组" value="agentName" />
              <el-option label="按实名人分组" value="realnameName" />
              <el-option label="按状态分组" value="cardStatus" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索卡号/代理商/实名人"
              style="width: 220px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="handleFilterChange"
            />
            <el-button type="primary" @click="handleFilterChange">查询</el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('phone:list:add')">新增卡</el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading" empty-text="暂无数据" @cell-dblclick="handleCellDblclick">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column v-if="groupBy" label="分组" width="150">
          <template #default="{ row }">{{ groupLabel(row) }}</template>
        </el-table-column>
        <el-table-column prop="cardNumber" label="卡号" width="170" show-overflow-tooltip />
        <el-table-column label="卡类型" width="90">
          <template #default="{ row }">
            <el-tag>{{ dictLabel(cardTypeOptions, row.cardType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用状态" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.usageStatus) === 2 ? 'info' : 'success'">{{ dictLabel(usageStatusOptions, row.usageStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="agentName" label="代理商" width="150" show-overflow-tooltip />
        <el-table-column prop="phoneNumber" label="手机号" width="140" />
        <el-table-column prop="realnameName" label="实名人" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.cardStatus)">{{ dictLabel(cardStatusOptions, row.cardStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="登记时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" v-if="userStore.hasPermission('phone:list:edit')" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" v-if="userStore.hasPermission('phone:list:delete')" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" @close="dialogClosed">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="卡号" prop="cardNumber">
              <el-input v-model="form.cardNumber" placeholder="请输入卡号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="卡类型" prop="cardType">
              <el-select v-model="form.cardType" placeholder="请选择卡类型" style="width: 100%;">
                <el-option v-for="item in cardTypeOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="代理商" prop="agentId">
              <el-select v-model="form.agentId" placeholder="选择代理商" style="width: 100%;" clearable filterable @change="handleAgentChange">
                <el-option v-for="agent in agentList" :key="agent.id" :label="agent.agentName" :value="agent.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="form.phoneNumber" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="实名人" prop="realnameId">
              <el-select v-model="form.realnameId" placeholder="选择实名人" style="width: 100%;" clearable filterable @change="handleRealnameChange">
                <el-option v-for="item in realnameList" :key="item.id" :label="item.realName + '（' + (item.department || '') + '）'" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用状态" prop="usageStatus">
              <el-select v-model="form.usageStatus" placeholder="请选择使用状态" style="width: 100%;">
                <el-option v-for="item in usageStatusOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.cardStatus" style="width: 100%;">
                <el-option v-for="item in cardStatusOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Iphone, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  getPhoneCardList,
  addPhoneCard,
  updatePhoneCard,
  deletePhoneCard,
  getAllAgents,
  getAllRealnames
} from '@/api/phone'
import { getDictByType } from '@/api/dict'

const userStore = useUserStore()
const searchKeyword = ref('')
const statusFilter = ref(null)
const cardTypeFilter = ref(null)
const usageStatusFilter = ref(null)
const groupBy = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const listData = ref([])
const agentList = ref([])
const realnameList = ref([])
const cardTypeOptions = ref([])
const usageStatusOptions = ref([])
const cardStatusOptions = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增手机卡')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null, cardNumber: '', agentId: null, agentName: '', phoneNumber: '',
  realnameId: null, realnameName: '',
  usageStatus: 1, cardStatus: 1, cardType: 1, remark: ''
})
const form = ref(defaultForm())

const rules = {
  cardNumber: [{ required: true, message: '请输入卡号', trigger: 'blur' }],
  cardType: [{ required: true, message: '请选择卡类型', trigger: 'change' }],
  usageStatus: [{ required: true, message: '请选择使用状态', trigger: 'change' }]
}

function toArray(options) {
  if (Array.isArray(options)) return options
  if (options && typeof options === 'object') {
    if (Array.isArray(options.value)) return options.value
    if (Array.isArray(options.list)) return options.list
    if (Array.isArray(options.records)) return options.records
    if (Array.isArray(options.rows)) return options.rows
    if (Array.isArray(options.data)) return options.data
  }
  return []
}

const dictLabel = (options, val) => {
  const arr = toArray(options)
  const found = arr.find(item => Number(item.dictKey) === Number(val))
  return found ? found.dictValue : '-'
}

const statusTagType = (val) => {
  if (Number(val) === 1) return 'success'
  if (Number(val) === 2) return 'warning'
  if (Number(val) === 3) return 'danger'
  return 'info'
}

function formatDateTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function groupLabel(row) {
  if (groupBy.value === 'cardType') return dictLabel(cardTypeOptions, row.cardType)
  if (groupBy.value === 'usageStatus') return dictLabel(usageStatusOptions, row.usageStatus)
  if (groupBy.value === 'cardStatus') return dictLabel(cardStatusOptions, row.cardStatus)
  if (groupBy.value === 'agentName') return row.agentName || '未设置代理商'
  if (groupBy.value === 'realnameName') return row.realnameName || '未设置实名人'
  return '-'
}

async function loadList() {
  loading.value = true
  try {
    const params = { page: page.value, size: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value.trim()
    if (statusFilter.value != null) params.cardStatus = statusFilter.value
    if (cardTypeFilter.value != null) params.cardType = cardTypeFilter.value
    if (usageStatusFilter.value != null) params.usageStatus = usageStatusFilter.value
    if (groupBy.value) params.groupBy = groupBy.value
    const res = await getPhoneCardList(params)
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

async function loadDictionaries() {
  try {
    const [agentRes, realnameRes, cardTypeRes, usageStatusRes, cardStatusRes] = await Promise.all([
      getAllAgents(),
      getAllRealnames(),
      getDictByType('phone_card_type'),
      getDictByType('phone_usage_status'),
      getDictByType('phone_card_status')
    ])
    agentList.value = Array.isArray(agentRes) ? agentRes : (agentRes?.list || agentRes?.records || agentRes?.rows || [])
    realnameList.value = Array.isArray(realnameRes) ? realnameRes : (realnameRes?.list || realnameRes?.records || realnameRes?.rows || [])
    cardTypeOptions.value = Array.isArray(cardTypeRes) ? cardTypeRes : []
    usageStatusOptions.value = Array.isArray(usageStatusRes) ? usageStatusRes : []
    cardStatusOptions.value = Array.isArray(cardStatusRes) ? cardStatusRes : []
  } catch (e) {
    ElMessage.error(e?.message || '加载下拉数据失败')
  }
}

function handleFilterChange() {
  page.value = 1
  loadList()
}

function handlePageChange(val) {
  page.value = val
  loadList()
}

function handleSizeChange(val) {
  pageSize.value = val
  page.value = 1
  loadList()
}

function handleAgentChange(id) {
  const list = agentList.value || []
  const agent = list.find(a => a.id === id)
  form.value.agentName = agent ? agent.agentName : ''
}

function handleRealnameChange(id) {
  const list = realnameList.value || []
  const item = list.find(r => r.id === id)
  form.value.realnameName = item ? item.realName : ''
}

function handleCellDblclick(row, column, cell, event) {
  const text = (cell?.innerText || event?.target?.innerText || '').trim()
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制：' + text)
  }).catch(() => {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      ElMessage.success('已复制：' + text)
    } finally {
      document.body.removeChild(ta)
    }
  })
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增手机卡'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑手机卡'
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
      await updatePhoneCard(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addPhoneCard(form.value)
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
  await ElMessageBox.confirm(`确定删除卡号 "${row.cardNumber}" 吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).catch(() => { throw new Error('cancel') })
  try {
    await deletePhoneCard(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    ElMessage.error(e?.message || '删除失败')
  }
}

function dialogClosed() {
  form.value = defaultForm()
  if (formRef.value) formRef.value.clearValidate()
}

onMounted(() => {
  loadList()
  loadDictionaries()
})
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.title { display: flex; align-items: center; }
.filters { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 16px; text-align: right; }
</style>
