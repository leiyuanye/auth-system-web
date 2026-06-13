<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Document /></el-icon>
            <span style="margin-left: 8px;">数据字典管理</span>
          </div>
          <div>
            <el-select v-model="filterType" placeholder="筛选字典类型" style="width: 200px; margin-right: 10px;" clearable @change="loadList">
              <el-option v-for="t in typeMeta" :key="t.type" :label="t.label" :value="t.type" />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增字典项</el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredList" style="width: 100%;" stripe border @cell-dblclick="handleCellDblclick">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="字典类型" width="180">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.dictType)">{{ typeLabel(row.dictType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dictKey" label="字典键" width="200" />
        <el-table-column prop="dictValue" label="字典值（显示文本）" width="260" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="字典类型" prop="dictType">
          <el-select v-model="form.dictType" placeholder="请选择字典类型" style="width: 100%;">
            <el-option v-for="t in typeMeta" :key="t.type" :label="t.label" :value="t.type" />
          </el-select>
        </el-form-item>
        <el-form-item label="字典键" prop="dictKey">
          <el-input v-model="form.dictKey" placeholder="存数据库的值，如 1/腾讯云" />
        </el-form-item>
        <el-form-item label="字典值" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="显示文本，如 运行中/腾讯云" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Plus } from '@element-plus/icons-vue'
import { getDictByType, addDict, updateDict, deleteDict } from '@/api/dict'

const typeMeta = [
  { type: 'server_type', label: '服务器类型', tag: 'success' },
  { type: 'server_group', label: '服务器分组', tag: 'primary' },
  { type: 'server_status', label: '服务器状态', tag: 'warning' },
  { type: 'stock_status', label: '库存状态', tag: 'info' },
  { type: 'phone_card_type', label: '手机卡类型', tag: 'success' },
  { type: 'phone_usage_status', label: '手机卡使用状态', tag: 'primary' },
  { type: 'phone_card_status', label: '手机卡状态', tag: 'warning' }
]

const filterType = ref('')
const listData = ref([])
const filteredList = computed(() => {
  if (!filterType.value) return listData.value
  return listData.value.filter(i => i.dictType === filterType.value)
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增字典项')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const defaultForm = () => ({
  id: null, dictType: 'server_type', dictKey: '', dictValue: '', sortOrder: 0
})
const form = ref(defaultForm())
const rules = {
  dictType: [{ required: true, message: '请选择字典类型', trigger: 'change' }],
  dictKey: [{ required: true, message: '请输入字典键', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }]
}

function typeLabel(t) {
  const found = typeMeta.find(m => m.type === t)
  return found ? found.label : t
}
function typeTagType(t) {
  const found = typeMeta.find(m => m.type === t)
  return found ? found.tag : ''
}

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

async function loadList() {
  try {
    const all = await Promise.all(typeMeta.map(t => getDictByType(t.type)))
    const merged = []
    all.forEach((arr, idx) => {
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (!item.dictType) item.dictType = typeMeta[idx].type
          merged.push(item)
        })
      }
    })
    merged.sort((a, b) => {
      if (a.dictType !== b.dictType) return a.dictType.localeCompare(b.dictType)
      return (a.sortOrder || 0) - (b.sortOrder || 0)
    })
    listData.value = merged
  } catch (e) {
    ElMessage.error('加载字典数据失败')
  }
}

onMounted(() => loadList())

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增字典项'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑字典项'
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
      await updateDict(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addDict(form.value)
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
  await ElMessageBox.confirm(
    `确定删除字典项 "${row.dictValue}" 吗？\n若服务器记录仍在使用此选项，下拉将不再显示。`,
    '提示',
    { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
  ).catch(() => { throw new Error('cancel') })
  try {
    await deleteDict(row.id)
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
