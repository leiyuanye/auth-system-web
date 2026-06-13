<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><Connection /></el-icon>
            <span style="margin-left: 8px;">在用手机卡</span>
          </div>
          <div class="header-actions">
            <el-input v-model="searchKeyword" placeholder="搜索卡号/代理商/实名人" style="width: 220px;" clearable :prefix-icon="Search" @keyup.enter="handleFilterChange" />
            <el-button @click="showFilters = !showFilters" :type="statusFilter ? 'primary' : 'default'">
              <el-icon style="margin-right: 4px;"><Filter /></el-icon>
              筛选{{ statusFilter ? ' (1)' : '' }}
            </el-button>
            <el-button type="primary" @click="handleFilterChange">查询</el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('phone:active:add')">新增卡</el-button>
          </div>
        </div>
        <!-- 折叠筛选区域 -->
        <transition name="slide">
          <div v-show="showFilters" class="filter-panel">
            <div class="filter-row">
              <div class="filter-item">
                <span class="filter-label">状态</span>
                <el-select v-model="statusFilter" placeholder="全部" style="width: 120px;" clearable @change="handleFilterChange">
                  <el-option label="正常" :value="1" />
                  <el-option label="二次实名" :value="2" />
                  <el-option label="欠费" :value="3" />
                </el-select>
              </div>
              <el-button text type="primary" @click="statusFilter = null; handleFilterChange()" v-if="statusFilter">清除筛选</el-button>
            </div>
          </div>
        </transition>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading" @cell-dblclick="handleCellDblclick">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="cardNumber" label="卡号" width="160" />
        <el-table-column label="运营商" width="100">
          <template #default="{ row }">
            <el-tag type="primary">{{ dictLabel(operatorOptions, row.operatorType) }}</el-tag>
          </template>
        </el-table-column>
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
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
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
            <el-form-item label="运营商" prop="operatorType">
              <el-select v-model="form.operatorType" placeholder="请选择运营商" style="width: 100%;">
                <el-option v-for="item in operatorOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="代理商" prop="agentName">
              <el-select v-model="form.agentName" placeholder="选择代理商" style="width: 100%;" filterable @change="handleAgentChange">
                <el-option v-for="agent in agentOptions" :key="agent.dictKey" :label="agent.dictValue" :value="agent.dictKey" />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, Search, Plus, Filter } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  getPhoneCardList,
  addPhoneCard,
  updatePhoneCard,
  deletePhoneCard,
  getAllRealnames
} from '@/api/phone'
import { getDictByType } from '@/api/dict'

const userStore = useUserStore()
const showFilters = ref(false)
const searchKeyword = ref('')
const statusFilter = ref(null)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增在用手机卡')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null, cardNumber: '', agentName: '', phoneNumber: '',
  realnameId: null, realnameName: '', department: '', package_: '',
  cardStatus: 1, cardType: 1, operatorType: 1, remark: ''
})
const form = ref(defaultForm())

const rules = {
  cardNumber: [{ required: true, message: '请输入卡号', trigger: 'blur' }]
}

const agentOptions = ref([])
const operatorOptions = ref([])
const realnameList = ref([])
const listData = ref([])

const dictLabel = (options, val) => {
  if (!Array.isArray(options)) return '-'
  const found = options.find(item => Number(item.dictKey) === Number(val))
  return found ? found.dictValue : '-'
}

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

async function loadList() {
  loading.value = true
  try {
    const params = {
      cardType: 1,
      page: page.value,
      size: pageSize.value
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (statusFilter.value) params.cardStatus = statusFilter.value
    const res = await getPhoneCardList(params)
    const data = (res && typeof res === 'object') ? res : {}
    listData.value = Array.isArray(data.list) ? data.list : (Array.isArray(data.records) ? data.records : (Array.isArray(data.rows) ? data.rows : []))
    total.value = Number(data.total ?? data.totalCount ?? 0)
  } catch (e) {
    listData.value = []
    total.value = 0
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function loadDictionaries() {
  try {
    const [agentRes, operatorRes, realnameRes] = await Promise.all([
      getDictByType('phone_agent'),
      getDictByType('phone_operator'),
      getAllRealnames()
    ])
    function extractList(r) {
      if (Array.isArray(r)) return r
      if (r && typeof r === 'object') {
        if (Array.isArray(r.list)) return r.list
        if (Array.isArray(r.records)) return r.records
        if (Array.isArray(r.rows)) return r.rows
        if (Array.isArray(r.data)) return r.data
      }
      return []
    }
    agentOptions.value = Array.isArray(agentRes) ? agentRes : []
    operatorOptions.value = Array.isArray(operatorRes) ? operatorRes : []
    realnameList.value = extractList(realnameRes)
  } catch (e) {
    agentOptions.value = []
    operatorOptions.value = []
    realnameList.value = []
    ElMessage.error(e?.message || '加载字典数据失败')
  }
}

onMounted(() => {
  loadList()
  loadDictionaries()
})

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

function handleAgentChange(val) {
  form.value.agentName = val || ''
}

function handleRealnameChange(id) {
  const list = realnameList.value || []
  const item = list.find(r => r.id === id)
  form.value.realnameName = item ? item.realName : ''
  if (item && item.department) form.value.department = item.department
}

function handleCellDblclick(row, column, cell, event) {
  let text = ''
  if (cell && cell.innerText !== undefined) text = cell.innerText
  if (!text || text.trim() === '') return
  text = text.trim()
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('已复制：' + text)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); ElMessage.success('已复制：' + text) } catch (e) { ElMessage.warning('复制失败') }
      document.body.removeChild(ta)
    })
  } else {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy'); ElMessage.success('已复制：' + text) } catch (e) { ElMessage.warning('复制失败') }
    document.body.removeChild(ta)
  }
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
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
.title { display: flex; align-items: center; }
.header-actions { display: flex; gap: 10px; align-items: center; }
.filter-panel { margin-top: 16px; padding: 12px 16px; background: #f5f7fa; border-radius: 6px; }
.filter-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.filter-item { display: flex; align-items: center; gap: 8px; }
.filter-label { font-size: 13px; color: #606266; white-space: nowrap; }
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
