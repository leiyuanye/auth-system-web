<template>
  <div class="page-container">
    <el-card class="page-card" v-loading="loading">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><Iphone /></el-icon>
            <span style="margin-left: 8px;">手机设备管理</span>
            <el-tag size="small" type="info" style="margin-left: 8px;">企微 & 微信账号信息</el-tag>
          </div>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索手机编号/昵称/实名人/位置"
              style="width: 260px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="handleSearch"
            />
            <el-button @click="showFilters = !showFilters">
              <el-icon style="margin-right: 4px;"><Filter /></el-icon>
              高级筛选
            </el-button>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('phone_device:list:add')">新增设备</el-button>
          </div>
        </div>

        <transition name="slide">
          <div v-show="showFilters" class="filter-panel">
            <div class="filter-row">
              <div class="filter-item">
                <span class="filter-label">企微状态</span>
                <el-select v-model="filters.wechatStatus" placeholder="全部" clearable style="width: 140px;">
                  <el-option v-for="item in dict.wechatStatusOptions" :key="item.dictKey"
                             :label="item.dictValue" :value="Number(item.dictKey)" />
                </el-select>
              </div>
              <div class="filter-item">
                <span class="filter-label">使用状态</span>
                <el-select v-model="filters.useStatus" placeholder="全部" clearable style="width: 140px;">
                  <el-option v-for="item in dict.useStatusOptions" :key="item.dictKey"
                             :label="item.dictValue" :value="Number(item.dictKey)" />
                </el-select>
              </div>
              <div class="filter-item">
                <span class="filter-label">使用部门</span>
                <el-select v-model="filters.dept" placeholder="全部" clearable style="width: 140px;">
                  <el-option v-for="item in dict.deptOptions" :key="item.dictKey"
                             :label="item.dictValue" :value="Number(item.dictKey)" />
                </el-select>
              </div>
              <div class="filter-item">
                <span class="filter-label">微信状态</span>
                <el-select v-model="filters.wxStatus" placeholder="全部" clearable style="width: 140px;">
                  <el-option v-for="item in dict.wxStatusOptions" :key="item.dictKey"
                             :label="item.dictValue" :value="Number(item.dictKey)" />
                </el-select>
              </div>
              <div class="filter-item">
                <span class="filter-label">手机类型</span>
                <el-select v-model="filters.phoneType" placeholder="全部" clearable style="width: 140px;">
                  <el-option v-for="item in dict.phoneTypeOptions" :key="item.dictKey"
                             :label="item.dictValue" :value="Number(item.dictKey)" />
                </el-select>
              </div>
              <div class="filter-item">
                <span class="filter-label">主体简称</span>
                <el-select v-model="filters.entityName" placeholder="全部" clearable style="width: 160px;">
                  <el-option v-for="item in dict.entityNameOptions" :key="item.dictKey"
                             :label="item.dictValue" :value="item.dictValue" />
                </el-select>
              </div>
              <el-button text type="primary" @click="clearFilters" v-if="hasActiveFilters">清除筛选</el-button>
            </div>
          </div>
        </transition>
      </template>

      <el-table :data="listData" style="width: 100%;" stripe border empty-text="暂无数据">
        <el-table-column prop="phoneNo" label="手机编号" width="140" show-overflow-tooltip fixed="left" />
        <el-table-column prop="wechatNickname" label="企微昵称" width="160" show-overflow-tooltip />
        <el-table-column label="主体简称" width="180">
          <template #default="{ row }">
            <el-tooltip effect="light" placement="top" :show-after="200">
              <template #content>
                <div class="entity-tooltip">
                  <span v-for="(name, idx) in parseMulti(row.entityName)" :key="idx" class="entity-tooltip-item">
                    {{ name }}
                  </span>
                </div>
              </template>
              <span class="entity-tags">
                <el-tag
                  v-for="(name, idx) in parseMulti(row.entityName).slice(0, 2)"
                  :key="idx"
                  type="warning"
                  size="small"
                  effect="plain"
                  style="margin-right: 4px; vertical-align: middle;"
                >{{ name }}</el-tag>
                <el-tag
                  v-if="parseMulti(row.entityName).length > 2"
                  size="small"
                  effect="dark"
                  style="vertical-align: middle;"
                >+{{ parseMulti(row.entityName).length - 2 }}</el-tag>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="wechatPerson" label="企微实名人" width="120" />
        <el-table-column prop="wechatPhone" label="企微手机号" width="140" show-overflow-tooltip" />
        <el-table-column prop="phoneLocation" label="手机位置" width="180" show-overflow-tooltip" />
        <el-table-column label="企微状态" width="110">
          <template #default="{ row }">
            <el-tag :type="wechatStatusTagType(row.wechatStatus)" size="small">
              {{ dictLabel(dict.wechatStatusOptions, row.wechatStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用状态" width="100">
          <template #default="{ row }">
            <el-tag :type="useStatusTagType(row.useStatus)" size="small" effect="plain">
              {{ dictLabel(dict.useStatusOptions, row.useStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="最近修改时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看详情</el-button>
            <el-button type="primary" link size="small" v-if="userStore.hasPermission('phone_device:list:edit')" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" v-if="userStore.hasPermission('phone_device:list:delete')" @click="handleDelete(row)">删除</el-button>
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
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detail.visible" title="设备详情" width="960px" destroy-on-close>
      <el-descriptions v-if="detail.data" :column="2" border>
        <el-descriptions-item label="手机编号" :span="1">{{ detail.data.phoneNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机类型" :span="1">
          <el-tag type="success" size="small" effect="plain">{{ dictLabel(dict.phoneTypeOptions, detail.data.phoneType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机位置" :span="2">{{ detail.data.phoneLocation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用状态" :span="1">
          <el-tag :type="useStatusTagType(detail.data.useStatus)" size="small" effect="plain">
            {{ dictLabel(dict.useStatusOptions, detail.data.useStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用部门" :span="1">
          <el-tag type="primary" size="small" effect="plain">{{ dictLabel(dict.deptOptions, detail.data.dept) }}</el-tag>
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
        </el-descriptions-item>
        <el-descriptions-item label="企微对外昵称" :span="2">{{ detail.data.wechatNickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微实名人" :span="1">{{ detail.data.wechatPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微手机号" :span="1">{{ detail.data.wechatPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微状态" :span="1">
          <el-tag :type="wechatStatusTagType(detail.data.wechatStatus)" size="small">
            {{ dictLabel(dict.wechatStatusOptions, detail.data.wechatStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="企微用途" :span="1">
          <el-tag type="info" size="small">{{ dictLabel(dict.wechatUsageOptions, detail.data.wechatUsage) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信实名人" :span="1">{{ detail.data.wxRealname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信手机号" :span="1">{{ detail.data.wxPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信状态" :span="1">
          <el-tag :type="Number(detail.data.wxStatus) === 2 ? 'danger' : 'success'" size="small">
            {{ dictLabel(dict.wxStatusOptions, detail.data.wxStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信用途" :span="1">
          <el-tag size="small" effect="plain">{{ dictLabel(dict.wxUsageOptions, detail.data.wxUsage) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信密码" :span="2">
          <el-input
            :model-value="detail.showPassword ? detail.data.wxPassword : '********'"
            readonly
            :size="'default'"
            style="max-width: 360px;"
          >
            <template #suffix>
              <el-icon class="cursor-pointer" @click="detail.showPassword = !detail.showPassword">
                <View v-if="!detail.showPassword" />
                <Hide v-else />
              </el-icon>
            </template>
          </el-input>
        </el-descriptions-item>
        <el-descriptions-item label="最近修改时间" :span="1">{{ formatDateTime(detail.data.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="1">{{ formatDateTime(detail.data.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.data.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detail.visible = false">关闭</el-button>
        <el-button type="primary" v-if="userStore.hasPermission('phone_device:list:edit')" @click="handleEditFromDetail">编辑</el-button>
      </template>
    </el-dialog>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.mode === 'add' ? '新增设备' : '编辑设备'"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" ref="formRef" label-width="110px" label-position="right">
        <el-divider content-position="left"><el-icon><Iphone /></el-icon> 基本信息</el-divider>
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
                <el-option v-for="item in dict.phoneTypeOptions" :key="item.dictKey"
                           :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用状态" required>
              <el-select v-model="form.useStatus" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in dict.useStatusOptions" :key="item.dictKey"
                           :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用部门" required>
              <el-select v-model="form.dept" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in dict.deptOptions" :key="item.dictKey"
                           :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left"><el-icon><UserFilled /></el-icon> 企微账号信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="对外昵称">
              <el-input v-model="form.wechatNickname" placeholder="企微对外展示的昵称" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体简称">
              <el-select v-model="form.entityNameList" multiple filterable placeholder="可多选" style="width: 100%;">
                <el-option v-for="item in dict.entityNameOptions" :key="item.dictKey"
                           :label="item.dictValue" :value="item.dictValue" />
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
                <el-option v-for="item in dict.wechatStatusOptions" :key="item.dictKey"
                           :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微用途" required>
              <el-select v-model="form.wechatUsage" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in dict.wechatUsageOptions" :key="item.dictKey"
                           :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left"><el-icon><ChatDotRound /></el-icon> 微信账号信息</el-divider>
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
                <el-option v-for="item in dict.wxStatusOptions" :key="item.dictKey"
                           :label="item.dictValue" :value="Number(item.dictKey)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信用途" required>
              <el-select v-model="form.wxUsage" placeholder="请选择" style="width: 100%;">
                <el-option v-for="item in dict.wxUsageOptions" :key="item.dictKey"
                           :label="item.dictValue" :value="Number(item.dictKey)" />
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
        <el-button type="primary" @click="handleSubmit" :loading="dialog.submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Iphone, Search, Filter, Plus, UserFilled, ChatDotRound, View, Hide
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getDictByType } from '@/api/dict'
import {
  getPhoneDeviceList, addPhoneDevice, updatePhoneDevice, deletePhoneDevice,
  getRealnameOptions, getPhoneNumberOptions
} from '@/api/phoneDevice'

const userStore = useUserStore()
const loading = ref(false)
const listData = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const showFilters = ref(false)

const filters = reactive({
  wechatStatus: null,
  useStatus: null,
  dept: null,
  wxStatus: null,
  phoneType: null,
  entityName: ''
})

const hasActiveFilters = computed(() => {
  return filters.wechatStatus !== null || filters.useStatus !== null ||
         filters.dept !== null || filters.wxStatus !== null ||
         filters.phoneType !== null || !!filters.entityName
})

// 字典数据
const dict = reactive({
  wechatStatusOptions: [],
  useStatusOptions: [],
  deptOptions: [],
  wechatUsageOptions: [],
  wxStatusOptions: [],
  wxUsageOptions: [],
  phoneTypeOptions: [],
  entityNameOptions: []
})

// 下拉选项
const realnameOptions = ref([])
const phoneNumberOptions = ref([])

// 详情弹窗
const detail = reactive({
  visible: false,
  data: null,
  showPassword: false
})

// 弹窗
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
  if (value === null || value === undefined || !list) return ''
  const item = list.find(i => String(i.dictKey) === String(value))
  return item ? item.dictValue : String(value)
}

function parseMulti(str) {
  if (!str) return []
  return str.split(',').map(s => s.trim()).filter(Boolean)
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
  if (!val) return ''
  if (typeof val === 'string') return val
  try {
    const d = new Date(val)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  } catch (e) {
    return String(val)
  }
}

function clearFilters() {
  filters.wechatStatus = null
  filters.useStatus = null
  filters.dept = null
  filters.wxStatus = null
  filters.phoneType = null
  filters.entityName = ''
  handleSearch()
}

function handleSearch() {
  page.value = 1
  loadData()
}

function handlePageChange() {
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize.value
    }
    if (searchKeyword.value?.trim()) params.keyword = searchKeyword.value.trim()
    if (filters.wechatStatus != null) params.wechatStatus = filters.wechatStatus
    if (filters.useStatus != null) params.useStatus = filters.useStatus
    if (filters.dept != null) params.dept = filters.dept
    if (filters.wxStatus != null) params.wxStatus = filters.wxStatus
    if (filters.phoneType != null) params.phoneType = filters.phoneType
    if (filters.entityName) params.entityName = filters.entityName

    const data = await getPhoneDeviceList(params)
    listData.value = (data && data.list) || (data && data.records) || []
    total.value = (data && data.total) || 0
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}

async function loadDicts() {
  try {
    const types = [
      ['phone_device_wechat_status', 'wechatStatusOptions'],
      ['phone_device_use_status', 'useStatusOptions'],
      ['phone_device_dept', 'deptOptions'],
      ['phone_device_wechat_usage', 'wechatUsageOptions'],
      ['phone_device_wx_status', 'wxStatusOptions'],
      ['phone_device_wx_usage', 'wxUsageOptions'],
      ['phone_device_phone_type', 'phoneTypeOptions'],
      ['we_corp_subject_short', 'entityNameOptions']
    ]
    for (const [type, field] of types) {
      try {
        const data = await getDictByType(type)
        if (data && Array.isArray(data)) {
          dict[field] = data
        }
      } catch (e) {
        console.warn(`字典 ${type} 加载失败`, e)
      }
    }
  } catch (e) {
    console.error('字典数据加载失败', e)
  }
}

async function searchRealname() {
  try {
    const data = await getRealnameOptions()
    realnameOptions.value = Array.isArray(data) ? data : []
  } catch (e) {
    realnameOptions.value = []
  }
}

async function searchPhone() {
  try {
    const data = await getPhoneNumberOptions()
    phoneNumberOptions.value = Array.isArray(data) ? data : []
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
      wechatNickname: form.wechatNickname?.trim() || '',
      entityName,
      wechatPerson: form.wechatPerson || '',
      wechatPhone: form.wechatPhone || '',
      phoneLocation: form.phoneLocation?.trim() || '',
      wechatStatus: form.wechatStatus ?? 1,
      useStatus: form.useStatus ?? 1,
      dept: form.dept ?? 1,
      wechatUsage: form.wechatUsage ?? 1,
      wxStatus: form.wxStatus ?? 1,
      wxUsage: form.wxUsage ?? 1,
      phoneType: form.phoneType ?? 1,
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
    await ElMessageBox.confirm(`确定删除设备「${row.phoneNo}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deletePhoneDevice(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    // 取消操作
  }
}

onMounted(async () => {
  await loadDicts()
  loadData()
})
</script>

<style scoped>
.page-container { padding: 16px; }
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
}
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.filter-panel {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f8f9fc;
  border-radius: 6px;
  border: 1px dashed #dcdfe6;
}
.filter-row {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-label {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.entity-tags {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
}
.entity-tooltip {
  max-width: 320px;
  line-height: 1.8;
}
.entity-tooltip-item {
  display: inline-block;
  margin-right: 6px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fff7e6;
  color: #c48800;
  margin-bottom: 4px;
  font-size: 12px;
}

.slide-enter-active, .slide-leave-active { transition: all 0.3s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
