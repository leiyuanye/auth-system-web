<template>
  <div class="page-container">
    <el-card class="page-card" v-loading="pageLoading" element-loading-text="加载中...">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><Goods /></el-icon>
            <span style="margin-left: 8px;">商标管理</span>
          </div>
          <div class="filters">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索商标名称/商标号/小类/所属公司"
              style="width: 320px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="onQuery"
            />
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增商标</el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border>
        <el-table-column label="序号" type="index" width="70" align="center" />
        <el-table-column prop="trademarkName" label="商标名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="trademarkNo" label="商标号" width="140" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="subCategory" label="小类名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="validDate" label="有效期" width="130" />
        <el-table-column prop="companyName" label="所属公司" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="商标名称" prop="trademarkName">
          <el-input v-model="form.trademarkName" placeholder="请输入商标名称" />
        </el-form-item>
        <el-form-item label="商标号">
          <el-input v-model="form.trademarkNo" placeholder="请输入商标号" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类">
              <el-input v-model="form.category" placeholder="如：第25类" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="小类名称">
              <el-input v-model="form.subCategory" placeholder="如：服装鞋帽" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="form.validDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择有效期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="所属公司">
          <el-input v-model="form.companyName" placeholder="请输入所属公司全称" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
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
import { Search, Plus, Goods } from '@element-plus/icons-vue'
import {
  getTrademarkList,
  addTrademark,
  updateTrademark,
  deleteTrademark
} from '@/api/trademark'

const searchKeyword = ref('')
const page = ref(1)
const pageSize = ref(10)
const pageLoading = ref(false)
const total = ref(0)
const listData = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('新增商标')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const defaultForm = () => ({
  id: null,
  trademarkName: '',
  trademarkNo: '',
  category: '',
  subCategory: '',
  validDate: '',
  companyName: '',
  remark: ''
})
const form = ref(defaultForm())
const rules = {
  trademarkName: [{ required: true, message: '请输入商标名称', trigger: 'blur' }]
}

async function loadList() {
  pageLoading.value = true
  try {
    const params = { page: page.value, size: pageSize.value }
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    const res = await getTrademarkList(params)
    listData.value = Array.isArray(res.list) ? res.list
      : (Array.isArray(res.records) ? res.records
        : (Array.isArray(res.rows) ? res.rows : []))
    total.value = Number(res.total != null ? res.total : listData.value.length)
  } catch (e) {
    listData.value = []
    total.value = 0
  } finally {
    pageLoading.value = false
  }
}

function onQuery() { page.value = 1; loadList() }
function onPageChange() { loadList() }

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增商标'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑商标'
  form.value = {
    id: row.id,
    trademarkName: (row.trademarkName != null) ? row.trademarkName : '',
    trademarkNo: (row.trademarkNo != null) ? row.trademarkNo : '',
    category: (row.category != null) ? row.category : '',
    subCategory: (row.subCategory != null) ? row.subCategory : '',
    validDate: (row.validDate != null) ? row.validDate : '',
    companyName: (row.companyName != null) ? row.companyName : '',
    remark: (row.remark != null) ? row.remark : ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateTrademark(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addTrademark(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  const display = row.trademarkName || String(row.id)
  await ElMessageBox.confirm(`确定删除「${display}」吗？`, '提示', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
  }).catch(() => {})
  await deleteTrademark(row.id)
  ElMessage.success('删除成功')
  loadList()
}

function dialogClosed() {
  form.value = defaultForm()
  if (formRef.value) formRef.value.clearValidate()
}

onMounted(() => { loadList() })
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.page-header .title { display: flex; align-items: center; }
.filters { display: flex; gap: 10px; align-items: center; }
.pagination { margin-top: 16px; text-align: right; }
</style>
