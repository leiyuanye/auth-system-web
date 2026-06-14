<template>
  <div class="home-page">
    <el-card class="home-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="18" color="#409EFF"><Iphone /></el-icon>
            <span class="title-text">设备信息</span>
            <el-tag size="small" type="info" effect="plain">共 {{ total }} 台</el-tag>
          </div>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索编号 / 昵称 / 位置"
              style="width: 200px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="handleSearch"
            />
            <el-button @click="showFilters = !showFilters">
              <el-icon style="margin-right: 4px;"><Filter /></el-icon>
              筛选
              <el-badge v-if="hasActiveFilters" is-dot class="filter-badge" />
            </el-button>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              <span style="margin-left: 4px;">新增</span>
            </el-button>
          </div>
        </div>

        <div v-if="showFilters" class="filter-panel">
          <div class="filter-row">
            <div class="filter-item">
              <span class="filter-label">实名人</span>
              <el-select
                v-model="filters.wechatPerson"
                placeholder="全部"
                clearable
                filterable
                remote
                :remote-method="searchRealname"
                :loading="realnameLoading"
                style="width: 150px;"
              >
                <el-option v-for="name in realnameOptions" :key="name" :label="name" :value="name" />
              </el-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">企微状态</span>
              <el-select v-model="filters.wechatStatus" placeholder="全部" clearable style="width: 140px;">
                <el-option
                  v-for="item in wechatStatusOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">手机位置</span>
              <el-select v-model="filters.phoneLocation" placeholder="全部" clearable filterable style="width: 160px;">
                <el-option
                  v-for="loc in locationOptions"
                  :key="loc"
                  :label="loc"
                  :value="loc"
                />
              </el-select>
            </div>
            <div class="filter-item">
              <span class="filter-label">手机类型</span>
              <el-select v-model="filters.phoneType" placeholder="全部" clearable style="width: 140px;">
                <el-option
                  v-for="item in phoneTypeOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </div>
            <el-button text type="primary" @click="clearFilters" v-if="hasActiveFilters">清除筛选</el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%;" stripe border v-loading="loading" empty-text="暂无数据">
        <el-table-column prop="phoneNo" label="手机编号" min-width="130" fixed="left" />
        <el-table-column label="手机类型" width="110">
          <template #default="{ row }">
            <el-tag type="success" size="small" effect="plain">
              {{ dictLabel(phoneTypeOptions, row.phoneType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="wechatNickname" label="企微昵称" min-width="150" show-overflow-tooltip />
        <el-table-column label="主体简称" min-width="200">
          <template #default="{ row }">
            <span class="entity-cell">
              <el-tag
                v-for="(name, idx) in parseMulti(row.entityName).slice(0, 2)"
                :key="idx"
                type="warning"
                size="small"
                effect="plain"
                class="entity-tag-inline"
              >{{ name }}</el-tag>
              <span v-if="parseMulti(row.entityName).length > 2" class="entity-more">
                +{{ parseMulti(row.entityName).length - 2 }}
              </span>
              <span v-if="parseMulti(row.entityName).length === 0">-</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="wechatPerson" label="实名人" min-width="110" show-overflow-tooltip />
        <el-table-column prop="wechatPhone" label="企微手机号" min-width="130" />
        <el-table-column prop="phoneLocation" label="手机位置" min-width="160" show-overflow-tooltip />
        <el-table-column label="企微状态" width="100">
          <template #default="{ row }">
            <el-tag :type="wechatStatusTagType(row.wechatStatus)" size="small">
              {{ dictLabel(wechatStatusOptions, row.wechatStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用状态" width="100">
          <template #default="{ row }">
            <el-tag :type="useStatusTagType(row.useStatus)" size="small" effect="plain">
              {{ dictLabel(useStatusOptions, row.useStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="175">
          <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看详情</el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detail.visible" title="设备详情" width="960px" destroy-on-close>
      <el-descriptions v-if="detail.data" :column="2" border>
        <el-descriptions-item label="手机编号">{{ detail.data.phoneNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机类型">
          <el-tag type="success" size="small" effect="plain">{{ dictLabel(phoneTypeOptions, detail.data.phoneType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机位置" :span="2">{{ detail.data.phoneLocation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用状态">
          <el-tag :type="useStatusTagType(detail.data.useStatus)" size="small" effect="plain">
            {{ dictLabel(useStatusOptions, detail.data.useStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用部门">
          <el-tag type="primary" size="small" effect="plain">{{ dictLabel(deptOptions, detail.data.dept) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="主体简称" :span="2">
          <el-tag
            v-for="(name, idx) in parseMulti(detail.data.entityName)"
            :key="idx"
            type="warning"
            size="small"
            effect="plain"
            style="margin: 2px;"
          >{{ name }}</el-tag>
          <span v-if="parseMulti(detail.data.entityName).length === 0">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="企微对外昵称" :span="2">{{ detail.data.wechatNickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微实名人">{{ detail.data.wechatPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微手机号">{{ detail.data.wechatPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微状态">
          <el-tag :type="wechatStatusTagType(detail.data.wechatStatus)" size="small">
            {{ dictLabel(wechatStatusOptions, detail.data.wechatStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="企微用途">
          <el-tag type="info" size="small">{{ dictLabel(wechatUsageOptions, detail.data.wechatUsage) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信实名人">{{ detail.data.wxRealname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信手机号">{{ detail.data.wxPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信状态">
          <el-tag :type="Number(detail.data.wxStatus) === 2 ? 'danger' : 'success'" size="small">
            {{ dictLabel(wxStatusOptions, detail.data.wxStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信用途">
          <el-tag size="small" effect="plain">{{ dictLabel(wxUsageOptions, detail.data.wxUsage) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信密码" :span="2">
          <span style="letter-spacing: 1px;">{{ detail.showPassword ? (detail.data.wxPassword || '') : maskText(detail.data.wxPassword) }}</span>
          <el-button link type="primary" size="small" style="margin-left: 10px;" @click="detail.showPassword = !detail.showPassword">
            {{ detail.showPassword ? '隐藏' : '显示' }}
          </el-button>
        </el-descriptions-item>
        <el-descriptions-item label="最近修改时间">{{ formatDateTime(detail.data.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(detail.data.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.data.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detail.visible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dialog.visible"
      :title="dialog.mode === 'add' ? '新增设备' : '编辑设备'"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" ref="formRef" label-width="110px" label-position="right">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机编号" required>
              <el-input v-model="form.phoneNo" placeholder="如 P2024-001" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机位置">
              <el-input v-model="form.phoneLocation" placeholder="如 A机房-1排001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机类型" required>
              <el-select v-model="form.phoneType" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="item in phoneTypeOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用状态" required>
              <el-select v-model="form.useStatus" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="item in useStatusOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用部门" required>
              <el-select v-model="form.dept" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="item in deptOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">企微账号信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="对外昵称">
              <el-input v-model="form.wechatNickname" placeholder="企微对外展示的昵称" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体简称">
              <el-select v-model="form.entityNameList" multiple filterable placeholder="可多选" style="width: 100%;">
                <el-option
                  v-for="item in entityNameOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="item.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微实名人">
              <el-select v-model="form.wechatPerson" filterable remote :remote-method="searchRealname" placeholder="输入或选择实名人" style="width: 100%;">
                <el-option v-for="name in realnameOptions" :key="name" :label="name" :value="name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微手机号">
              <el-select v-model="form.wechatPhone" filterable remote :remote-method="searchPhone" placeholder="输入或选择手机号" style="width: 100%;">
                <el-option v-for="p in phoneNumberOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微状态" required>
              <el-select v-model="form.wechatStatus" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="item in wechatStatusOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微用途" required>
              <el-select v-model="form.wechatUsage" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="item in wechatUsageOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">微信账号信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="微信实名人">
              <el-select v-model="form.wxRealname" filterable remote :remote-method="searchRealname" placeholder="输入或选择实名人" style="width: 100%;">
                <el-option v-for="name in realnameOptions" :key="name" :label="name" :value="name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信手机号">
              <el-select v-model="form.wxPhone" filterable remote :remote-method="searchPhone" placeholder="输入或选择手机号" style="width: 100%;">
                <el-option v-for="p in phoneNumberOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信状态" required>
              <el-select v-model="form.wxStatus" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="item in wxStatusOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信用途" required>
              <el-select v-model="form.wxUsage" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="item in wxUsageOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信密码">
              <el-input v-model="form.wxPassword" show-password placeholder="账号登录密码" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.submitting" @click="handleSubmit">{{ dialog.mode === 'add' ? '新增' : '保存' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Iphone, Search, Plus, Filter } from '@element-plus/icons-vue'
import { getDictByType } from '@/api/dict'
import { getPhoneDeviceList, addPhoneDevice, updatePhoneDevice, deletePhoneDevice, getRealnameOptions, getPhoneNumberOptions } from '@/api/phoneDevice'

const loading = ref(false)
const listData = ref([])
const total = ref(0)
const searchKeyword = ref('')
const showFilters = ref(false)
const realnameLoading = ref(false)

const filters = reactive({
  wechatPerson: null,
  wechatStatus: null,
  phoneLocation: null,
  phoneType: null
})

const hasActiveFilters = computed(() => {
  return filters.wechatPerson !== null || filters.wechatStatus !== null ||
         filters.phoneLocation !== null || filters.phoneType !== null
})

const locationOptions = computed(() => {
  const locs = listData.value.map(r => r.phoneLocation).filter(Boolean)
  return [...new Set(locs)]
})

const wechatStatusOptions = ref([])
const useStatusOptions = ref([])
const deptOptions = ref([])
const wechatUsageOptions = ref([])
const wxStatusOptions = ref([])
const wxUsageOptions = ref([])
const phoneTypeOptions = ref([])
const entityNameOptions = ref([])
const realnameOptions = ref([])
const phoneNumberOptions = ref([])

const detail = reactive({
  visible: false,
  data: null,
  showPassword: false
})

const dialog = reactive({
  visible: false,
  mode: 'add',
  submitting: false
})

const formRef = ref(null)
const form = reactive({
  id: null,
  phoneNo: '',
  wechatNickname: '',
  entityNameList: [],
  wechatPerson: '',
  wechatPhone: '',
  phoneLocation: '',
  wechatStatus: 1,
  useStatus: 1,
  dept: 1,
  wechatUsage: 1,
  wxStatus: 1,
  wxUsage: 1,
  phoneType: 1,
  wxRealname: '',
  wxPhone: '',
  wxPassword: '',
  remark: ''
})

function resetForm() {
  form.id = null
  form.phoneNo = ''
  form.wechatNickname = ''
  form.entityNameList = []
  form.wechatPerson = ''
  form.wechatPhone = ''
  form.phoneLocation = ''
  form.wechatStatus = 1
  form.useStatus = 1
  form.dept = 1
  form.wechatUsage = 1
  form.wxStatus = 1
  form.wxUsage = 1
  form.phoneType = 1
  form.wxRealname = ''
  form.wxPhone = ''
  form.wxPassword = ''
  form.remark = ''
}

function dictLabel(list, value) {
  if (value === null || value === undefined || !list) return '-'
  const item = list.find(i => String(i.dictKey) === String(value))
  return item ? item.dictValue : String(value)
}

function parseMulti(str) {
  if (!str) return []
  return String(str).split(',').map(s => s.trim()).filter(Boolean)
}

function maskText(val) {
  if (!val) return '-'
  const s = String(val)
  if (s.length <= 2) return s.substring(0, 1) + '*'
  return s.substring(0, 2) + '*'.repeat(Math.min(s.length - 2, 10))
}

function wechatStatusTagType(status) {
  const s = Number(status)
  if (s === 1) return 'success'
  if (s === 2) return 'info'
  if (s === 3) return 'danger'
  if (s === 4) return 'warning'
  return 'info'
}

function useStatusTagType(status) {
  const s = Number(status)
  if (s === 1) return 'success'
  if (s === 2) return 'warning'
  if (s === 4) return 'info'
  return 'info'
}

function formatDateTime(val) {
  if (!val) return '-'
  if (val instanceof Date) {
    const pad = n => String(n).padStart(2, '0')
    return `${val.getFullYear()}年${pad(val.getMonth() + 1)}月${pad(val.getDate())}日 ${pad(val.getHours())}:${pad(val.getMinutes())}:${pad(val.getSeconds())}`
  }
  const s = String(val)
  const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T ](\d{1,2}):(\d{1,2}):(\d{1,2})/)
  if (m) {
    return `${m[1]}年${m[2].padStart(2, '0')}月${m[3].padStart(2, '0')}日 ${m[4].padStart(2, '0')}:${m[5].padStart(2, '0')}:${m[6].padStart(2, '0')}`
  }
  const m2 = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m2) {
    return `${m2[1]}年${m2[2].padStart(2, '0')}月${m2[3].padStart(2, '0')}日 00:00:00`
  }
  try {
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    }
  } catch (e) {}
  return s
}

function handleSearch() {
  loadData()
}

function clearFilters() {
  filters.wechatPerson = null
  filters.wechatStatus = null
  filters.phoneLocation = null
  filters.phoneType = null
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params = { page: 1, size: 100 }
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (filters.wechatPerson) params.wechatPerson = filters.wechatPerson
    if (filters.wechatStatus != null) params.wechatStatus = filters.wechatStatus
    if (filters.phoneLocation) params.phoneLocation = filters.phoneLocation
    if (filters.phoneType != null) params.phoneType = filters.phoneType

    const data = await getPhoneDeviceList(params)
    listData.value = (data && data.list) || (data && data.records) || []
    total.value = (data && data.total) || 0
  } catch (e) {
    console.error('加载设备数据失败', e)
    listData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadDicts() {
  const types = [
    ['phone_device_wechat_status', wechatStatusOptions],
    ['phone_device_use_status', useStatusOptions],
    ['phone_device_dept', deptOptions],
    ['phone_device_wechat_usage', wechatUsageOptions],
    ['phone_device_wx_status', wxStatusOptions],
    ['phone_device_wx_usage', wxUsageOptions],
    ['phone_device_phone_type', phoneTypeOptions],
    ['we_corp_subject_short', entityNameOptions]
  ]
  for (const [type, target] of types) {
    try {
      const res = await getDictByType(type)
      if (Array.isArray(res)) target.value = res
    } catch (e) {
      console.warn('字典 ' + type + ' 加载失败', e)
    }
  }
}

async function searchRealname(query) {
  if (!query) {
    realnameOptions.value = []
    return
  }
  realnameLoading.value = true
  try {
    const data = await getRealnameOptions()
    const all = Array.isArray(data) ? data : []
    realnameOptions.value = all.filter(n => n.toLowerCase().includes(query.toLowerCase()))
  } catch (e) {
    realnameOptions.value = []
  } finally {
    realnameLoading.value = false
  }
}

async function searchPhone(query) {
  if (!query) {
    phoneNumberOptions.value = []
    return
  }
  try {
    const data = await getPhoneNumberOptions()
    const all = Array.isArray(data) ? data : []
    phoneNumberOptions.value = all.filter(p => p.includes(query))
  } catch (e) {
    phoneNumberOptions.value = []
  }
}

function handleView(row) {
  detail.data = row
  detail.showPassword = false
  detail.visible = true
}

function handleEditFromDetail() {
  const row = detail.data
  detail.visible = false
  handleEdit(row)
}

function handleAdd() {
  resetForm()
  dialog.mode = 'add'
  dialog.visible = true
}

function handleEdit(row) {
  resetForm()
  dialog.mode = 'edit'
  form.id = row.id
  form.phoneNo = row.phoneNo || ''
  form.wechatNickname = row.wechatNickname || ''
  form.entityNameList = parseMulti(row.entityName)
  form.wechatPerson = row.wechatPerson || ''
  form.wechatPhone = row.wechatPhone || ''
  form.phoneLocation = row.phoneLocation || ''
  form.wechatStatus = row.wechatStatus || 1
  form.useStatus = row.useStatus || 1
  form.dept = row.dept || 1
  form.wechatUsage = row.wechatUsage || 1
  form.wxStatus = row.wxStatus || 1
  form.wxUsage = row.wxUsage || 1
  form.phoneType = row.phoneType || 1
  form.wxRealname = row.wxRealname || ''
  form.wxPhone = row.wxPhone || ''
  form.wxPassword = row.wxPassword || ''
  form.remark = row.remark || ''
  dialog.visible = true
}

async function handleSubmit() {
  if (!form.phoneNo || !form.phoneNo.trim()) {
    ElMessage.warning('手机编号不能为空')
    return
  }
  dialog.submitting = true
  try {
    const entityName = (form.entityNameList && form.entityNameList.length > 0)
      ? form.entityNameList.join(',') : ''
    const payload = {
      phoneNo: form.phoneNo.trim(),
      wechatNickname: form.wechatNickname ? form.wechatNickname.trim() : '',
      entityName: entityName,
      wechatPerson: form.wechatPerson || '',
      wechatPhone: form.wechatPhone || '',
      phoneLocation: form.phoneLocation ? form.phoneLocation.trim() : '',
      wechatStatus: form.wechatStatus != null ? form.wechatStatus : 1,
      useStatus: form.useStatus != null ? form.useStatus : 1,
      dept: form.dept != null ? form.dept : 1,
      wechatUsage: form.wechatUsage != null ? form.wechatUsage : 1,
      wxStatus: form.wxStatus != null ? form.wxStatus : 1,
      wxUsage: form.wxUsage != null ? form.wxUsage : 1,
      phoneType: form.phoneType != null ? form.phoneType : 1,
      wxRealname: form.wxRealname || '',
      wxPhone: form.wxPhone || '',
      wxPassword: form.wxPassword || '',
      remark: form.remark || ''
    }
    if (dialog.mode === 'add') {
      await addPhoneDevice(payload)
      ElMessage.success('新增成功')
    } else {
      await updatePhoneDevice(form.id, payload)
      ElMessage.success('编辑成功')
    }
    dialog.visible = false
    loadData()
  } catch (e) {
    console.error('提交失败', e)
  } finally {
    dialog.submitting = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除设备「' + row.phoneNo + '」吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deletePhoneDevice(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    // 用户取消时不处理
  }
}

onMounted(async () => {
  await loadDicts()
  loadData()
})
</script>

<style scoped>
.home-page {
  padding: 0;
}
.home-card {
  background: #fff;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.filter-panel {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f8f9fc;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}
.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.filter-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}
.filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
}
.entity-cell {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  max-width: 100%;
  overflow: hidden;
}
.entity-tag-inline {
  margin-right: 4px;
  flex-shrink: 0;
}
.entity-more {
  display: inline-block;
  padding: 0 8px;
  height: 22px;
  line-height: 20px;
  background: #303133;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
