<template>
  <div class="page-container">
    <el-card class="page-card">
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
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('wecorp:list:add')">
              新增企微主体
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading">
        <el-table-column label="ID" width="70" prop="id" />
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
        <el-table-column label="企业全称" min-width="200" prop="subjectFull" show-overflow-tooltip />
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
        <el-table-column label="创建时间" width="170" prop="createTime" />
        <el-table-column label="操作" width="160" fixed="right">
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px" @close="dialogClosed">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
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
            <el-form-item label="主体创建人">
              <el-input v-model="form.creator" placeholder="请输入创建人" />
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
            <el-form-item label="外部联系人规模额度">
              <el-input-number
                v-model="form.quotaTotal"
                :min="0"
                :step="100"
                style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="已用外部联系人额度">
              <el-input-number
                v-model="form.quotaUsed"
                :min="0"
                :step="100"
                style="width: 100%;" />
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
import { Collection, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getWeCorpList, addWeCorp, updateWeCorp, deleteWeCorp } from '@/api/wecorp'
import { getDictByType } from '@/api/dict'

const userStore = useUserStore()
const searchKeyword = ref('')
const subjectShortFilter = ref([])
const customerTypeFilter = ref([])
const customerTypeOptions = ref([])
const subjectShortOptions = ref([])
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
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
  remark: ''
})
const form = ref(defaultForm())

const rules = {
  subjectShortArray: [{ required: true, type: 'array', message: '请选择主体简称', trigger: 'change' }]
}

function splitTag (val) {
  if (!val) return []
  return String(val).split(',').map(s => s.trim()).filter(Boolean)
}

function defaultNum (val) {
  return (val === null || val === undefined) ? 0 : Number(val)
}

function formatRemaining (row) {
  return function () {
    return defaultNum(row.quotaTotal) - defaultNum(row.quotaUsed)
  }
}

function calcRemainingPercent (row) {
  const total = defaultNum(row.quotaTotal)
  const used = defaultNum(row.quotaUsed)
  if (!total) return 0
  const left = total - used
  if (left <= 0) return 0
  return Math.min(100, Math.round((left / total) * 100))
}

async function loadDicts () {
  try {
    const [typeList, subjectList] = await Promise.all([
      getDictByType('we_corp_customer_type'),
      getDictByType('we_corp_subject_short')
    ])
    if (Array.isArray(typeList)) {
      customerTypeOptions.value = typeList
    }
    if (Array.isArray(subjectList)) {
      subjectShortOptions.value = subjectList
    }
  } catch (e) {
    // ignore
  }
}

async function loadList () {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize.value
    }
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
    listData.value = Array.isArray(data.list) ? data.list : (Array.isArray(data.records) ? data.records : (Array.isArray(data.rows) ? data.rows : [])))
    total.value = Number(data.total ?? listData.value.length)
  } catch (e) {
    listData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onQuery () { page.value = 1; loadList() }
function onPageChange () { loadList() }

function handleAdd () {
  isEdit.value = false
  dialogTitle.value = '新增企微主体'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit (row) {
  isEdit.value = true
  dialogTitle.value = '编辑企微主体'
  form.value = {
    id: row.id,
    subjectShortArray: splitTag(row.subjectShort),
    subjectFull: row.subjectFull ?? '',
    customerTypeArray: splitTag(row.customerType),
    certExpire: row.certExpire ?? '',
    quotaTotal: row.quotaTotal ?? 0,
    quotaUsed: row.quotaUsed ?? 0,
    contactValidDate: row.contactValidDate ?? '',
    creator: row.creator ?? '',
    phone: row.phone ?? '',
    remark: row.remark ?? ''
  }
  dialogVisible.value = true
}

async function handleSubmit () {
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

async function handleDelete (row) {
  const displayName = row.subjectShort ? String(row.subjectShort).split(',')[0] : String(row.id)
  await ElMessageBox.confirm(`确定删除 "${displayName}" 吗？`, '提示', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
  }).catch(() => { throw new Error('cancel') })
  await deleteWeCorp(row.id)
  ElMessage.success('删除成功')
  loadList()
}

function dialogClosed () {
  form.value = defaultForm()
  if (formRef.value) formRef.value.clearValidate()
}

onMounted (async () => {
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
</style>
