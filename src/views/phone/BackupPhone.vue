<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><Tickets /></el-icon>
            <span style="margin-left: 8px;">备用手机卡</span>
          </div>
          <div class="filters">
            <el-select v-model="statusFilter" placeholder="状态" style="width: 140px;" clearable @change="onQuery">
              <el-option label="正常" :value="1" />
              <el-option label="二次实名" :value="2" />
              <el-option label="欠费" :value="3" />
            </el-select>
            <el-input v-model="searchKeyword" placeholder="搜索卡号/代理商" style="width: 240px;" clearable :prefix-icon="Search" @keyup.enter="onQuery" />
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('phone:backup:add')">新增备用卡</el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading" @cell-dblclick="handleCellDblclick">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="cardNumber" label="卡号" width="160" />
        <el-table-column prop="agentName" label="代理商" width="140">
          <template #default="{ row }">
            <el-tag v-if="row.agentName">{{ row.agentName }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="phoneNumber" label="手机号" width="140" />
        <el-table-column prop="realnameName" label="实名人" width="120">
          <template #default="{ row }">{{ row.realnameName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="package_" label="套餐" width="120">
          <template #default="{ row }">{{ row.package_ || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.cardStatus)">{{ statusText(row.cardStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createTime" label="入库时间" width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" v-if="userStore.hasPermission('phone:backup:edit')" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" v-if="userStore.hasPermission('phone:backup:delete')" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="dialogClosed">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="卡号" prop="cardNumber">
              <el-input v-model="form.cardNumber" placeholder="请输入卡号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="代理商" prop="agentId">
              <el-select v-model="form.agentId" placeholder="选择代理商" style="width: 100%;" filterable @change="handleAgentChange">
                <el-option v-for="agent in agentList" :key="agent.id" :label="agent.agentName" :value="agent.id" />
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
              <el-select v-model="form.realnameId" placeholder="选择实名人" style="width: 100%;" clearable filterable @change="handleRealnameChange">
                <el-option v-for="item in realnameList" :key="item.id" :label="item.realName + '（' + (item.department || '') + '）'" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="套餐">
              <el-input v-model="form.package_" placeholder="如 59元/月" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.cardStatus" style="width: 100%;">
                <el-option label="正常" :value="1" />
                <el-option label="二次实名" :value="2" />
                <el-option label="欠费" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
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
import { Tickets, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getPhoneCardList, addPhoneCard, updatePhoneCard, deletePhoneCard, getAllAgents, getAllRealnames } from '@/api/phone'

const userStore = useUserStore()
const searchKeyword = ref('')
const statusFilter = ref(null)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const total = ref(0)
const listData = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增备用手机卡')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const agentList = ref([])
const realnameList = ref([])

const defaultForm = () => ({
  id: null, cardNumber: '', agentId: null, agentName: '', phoneNumber: '',
  realnameId: null, realnameName: '', department: '', package_: '',
  cardStatus: 1, cardType: 2, remark: ''
})
const form = ref(defaultForm())

const rules = {
  cardNumber: [{ required: true, message: '请输入卡号', trigger: 'blur' }]
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
      page: page.value,
      size: pageSize.value,
      cardType: 2  // 备用手机卡
    }
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (statusFilter.value !== null && statusFilter.value !== undefined && statusFilter.value !== '') {
      params.cardStatus = statusFilter.value
    }
    const res = await getPhoneCardList(params)
    listData.value = (res && res.records) || (res && res.list) || (Array.isArray(res) ? res : [])
    total.value = Number(res && res.total) || listData.value.length
  } catch (e) {
    console.warn('备用手机卡加载失败', e)
    listData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadAgentList() {
  try {
    const res = await getAllAgents()
    agentList.value = (res && (res.records || res.list)) || (Array.isArray(res) ? res : [])
  } catch (e) {
    console.warn('代理商列表加载失败', e)
    agentList.value = []
  }
}

async function loadRealnameList() {
  try {
    const res = await getAllRealnames()
    realnameList.value = (res && (res.records || res.list)) || (Array.isArray(res) ? res : [])
  } catch (e) {
    console.warn('实名人列表加载失败', e)
    realnameList.value = []
  }
}

function onQuery() { page.value = 1; loadList() }
function onPageChange() { loadList() }

function handleAgentChange(id) {
  const agent = agentList.value.find(a => a.id === id)
  form.value.agentName = agent ? agent.agentName : ''
}

function handleRealnameChange(id) {
  if (!id) {
    form.value.realnameName = ''
    return
  }
  const item = realnameList.value.find(r => r.id === id)
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
  dialogTitle.value = '新增备用手机卡'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑备用手机卡'
  form.value = { ...row }
  if (form.value.cardStatus == null) form.value.cardStatus = 1
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
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除 "${row.cardNumber}" 吗？`, '提示', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
  }).catch(() => { throw new Error('cancel') })
  await deletePhoneCard(row.id)
  ElMessage.success('删除成功')
  loadList()
}

function dialogClosed() {
  form.value = defaultForm()
  if (formRef.value) formRef.value.clearValidate()
}

onMounted(async () => {
  await loadAgentList()
  await loadRealnameList()
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
