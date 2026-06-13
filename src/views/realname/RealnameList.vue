<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><User /></el-icon>
            <span style="margin-left: 8px;">实名人员</span>
          </div>
          <div class="filters">
            <el-select
              v-model="scanStatusFilter"
              placeholder="扫脸便捷性"
              style="width: 140px;"
              clearable
              @change="onQuery"
            >
              <el-option label="不能扫脸" :value="1" />
              <el-option label="方便扫脸" :value="2" />
              <el-option label="较难扫脸" :value="3" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索姓名/手机号"
              style="width: 240px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="onQuery"
            />
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('realname:list:add')">
              新增实名人员
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading" @cell-dblclick="handleCellDblclick">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="department" label="部门" width="140">
          <template #default="{ row }">{{ row.department || '-' }}</template>
        </el-table-column>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" @close="dialogClosed">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入姓名" />
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
            <el-form-item label="部门">
              <el-input v-model="form.department" placeholder="请输入部门" />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getRealnameList, addRealname, updateRealname, deleteRealname } from '@/api/phone'

const userStore = useUserStore()
const searchKeyword = ref('')
const scanStatusFilter = ref(null)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const total = ref(0)
const listData = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增实名人员')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null, realName: '', phone: '',
  department: '', scanStatus: 2, remark: ''
})
const form = ref(defaultForm())

const rules = {
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
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
    if (scanStatusFilter.value !== null && scanStatusFilter.value !== undefined && scanStatusFilter.value !== '') {
      params.scanStatus = scanStatusFilter.value
    }
    const res = await getRealnameList(params)
    const data = (res && typeof res === 'object') ? res : {}
    listData.value = Array.isArray(data.list) ? data.list : (Array.isArray(data.records) ? data.records : (Array.isArray(data.rows) ? data.rows : []))
    total.value = Number(data.total ?? listData.value.length)
  } catch (e) {
    console.warn('实名人员列表加载失败', e)
    listData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onQuery() { page.value = 1; loadList() }
function onPageChange() { loadList() }

function handleCellDblclick(row, column, cell, event) {
  let text = ''
  if (cell && cell.innerText !== undefined) text = cell.innerText
  if (!text || text.trim() === '') return
  text = text.trim()
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => { ElMessage.success('已复制：' + text) }).catch(() => {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy'); ElMessage.success('已复制：' + text) } catch (e) { ElMessage.warning('复制失败') }
      document.body.removeChild(ta)
    })
  } else {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select()
    try { document.execCommand('copy'); ElMessage.success('已复制：' + text) } catch (e) { ElMessage.warning('复制失败') }
    document.body.removeChild(ta)
  }
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增实名人员'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑实名人员'
  form.value = { ...row }
  if (form.value.scanStatus == null) form.value.scanStatus = 2
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateRealname(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addRealname(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除 "${row.realName}" 吗？`, '提示', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
  }).catch(() => { throw new Error('cancel') })
  await deleteRealname(row.id)
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
