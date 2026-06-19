<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><Iphone /></el-icon>
            <span style="margin-left: 8px;">手机卡管理</span>
          </div>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索手机号/代理商/实名人"
              style="width: 220px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="handleFilterChange"
            />
            <el-button @click="showFilters = !showFilters" :type="hasActiveFilters ? 'primary' : 'default'">
              <el-icon style="margin-right: 4px;"><Filter /></el-icon>
              筛选{{ hasActiveFilters ? ` (${activeFilterCount})` : '' }}
            </el-button>
            <el-button type="primary" @click="handleFilterChange">查询</el-button>
            <el-dropdown trigger="click" style="margin-left: 8px;" v-if="userStore.hasPermission('phone:list:add')">
              <el-button>
                <el-icon style="margin-right: 4px;"><Download /></el-icon>
                导入导出
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleDownloadTemplate">
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
            <el-button type="primary" :icon="Plus" @click="handleAdd" v-if="userStore.hasPermission('phone:list:add')">新增卡</el-button>
            <!-- 隐藏的文件上传input -->
            <input type="file" ref="fileInput" accept=".xlsx,.xls" style="display: none;" @change="handleFileChange" />
          </div>
        </div>
        <!-- 折叠筛选区域 -->
        <transition name="slide">
          <div v-show="showFilters" class="filter-panel">
            <div class="filter-row">
              <div class="filter-item">
                <span class="filter-label">运营商</span>
                <el-select v-model="operatorTypeFilter" placeholder="全部" style="width: 120px;" clearable @change="handleFilterChange">
                  <el-option v-for="item in operatorOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
                </el-select>
              </div>
              <div class="filter-item">
                <span class="filter-label">使用状态</span>
                <el-select v-model="usageStatusFilter" placeholder="全部" style="width: 120px;" clearable @change="handleFilterChange">
                  <el-option v-for="item in usageStatusOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
                </el-select>
              </div>
              <div class="filter-item">
                <span class="filter-label">状态</span>
                <el-select v-model="statusFilter" placeholder="全部" style="width: 120px;" clearable @change="handleFilterChange">
                  <el-option v-for="item in cardStatusOptions" :key="item.dictKey" :label="item.dictValue" :value="Number(item.dictKey)" />
                </el-select>
              </div>
              <div class="filter-item">
                <span class="filter-label">分组</span>
                <el-select v-model="groupBy" placeholder="不分组" style="width: 140px;" clearable @change="handleFilterChange">
                  <el-option label="按运营商" value="operatorType" />
                  <el-option label="按使用状态" value="usageStatus" />
                  <el-option label="按代理商" value="agentName" />
                  <el-option label="按实名人" value="realnameName" />
                  <el-option label="按状态" value="cardStatus" />
                </el-select>
              </div>
              <el-button text type="primary" @click="clearFilters" v-if="hasActiveFilters">清除筛选</el-button>
            </div>
          </div>
        </transition>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading" element-loading-text="加载中..." empty-text="暂无数据">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column v-if="groupBy" label="分组" width="150">
          <template #default="{ row }">{{ groupLabel(row) }}</template>
        </el-table-column>
<!--        <el-table-column prop="iccd" label="ICCID" width="180" show-overflow-tooltip />-->
        <el-table-column label="运营商" width="100">
          <template #default="{ row }">
            <el-tag type="primary">{{ dictLabel(operatorOptions, row.operatorType) }}</el-tag>
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
        <el-table-column prop="updateTime" label="最近修改时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
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
            <el-form-item label="ICCID" prop="iccd">
              <el-input v-model="form.iccd" placeholder="请输入ICCID" />
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
              <el-select v-model="form.agentName" placeholder="选择代理商" style="width: 100%;" clearable filterable @change="handleAgentChange">
                <el-option v-for="agent in agentOptions" :key="agent.dictKey" :label="agent.dictValue" :value="agent.dictKey" />
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
                <el-option v-for="item in realnameList" :key="item.id" :label="item.realName" :value="item.id" />
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Iphone, Search, Plus, Filter, Download, Upload, Document } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  getPhoneCardList,
  addPhoneCard,
  updatePhoneCard,
  deletePhoneCard,
  getAllRealnames,
  downloadPhoneCardTemplate,
  exportPhoneCards,
  importPhoneCards
} from '@/api/phone'
import { getDeviceGroups } from '@/api/phoneDevice'
import { getDictByType } from '@/api/dict'
import * as XLSX from 'xlsx'
import { dictLabelToKey, dictKeyToLabel } from '@/utils/dictConverter'

const userStore = useUserStore()
const showFilters = ref(false)
const searchKeyword = ref('')
const statusFilter = ref(null)
const operatorTypeFilter = ref(null)
const usageStatusFilter = ref(null)
const groupBy = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const listData = ref([])
const agentOptions = ref([])
const realnameList = ref([])
const operatorOptions = ref([])
const usageStatusOptions = ref([])
const cardStatusOptions = ref([])

// 筛选状态计算
const hasActiveFilters = computed(() => {
  return statusFilter.value != null || operatorTypeFilter.value != null || usageStatusFilter.value != null || groupBy.value
})
const activeFilterCount = computed(() => {
  let count = 0
  if (statusFilter.value != null) count++
  if (operatorTypeFilter.value != null) count++
  if (usageStatusFilter.value != null) count++
  if (groupBy.value) count++
  return count
})
function clearFilters() {
  statusFilter.value = null
  operatorTypeFilter.value = null
  usageStatusFilter.value = null
  groupBy.value = ''
  handleFilterChange()
}

const dialogVisible = ref(false)
const dialogTitle = ref('新增手机卡')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const fileInput = ref(null)

const defaultForm = () => ({
  id: null, iccd: '', agentName: '', phoneNumber: '',
  realnameId: null, realnameName: '',
  usageStatus: 1, cardStatus: 1, operatorType: 1, remark: ''
})
const form = ref(defaultForm())

const rules = {
  realnameName: [{ required: true, message: '请输入实名人', trigger: 'blur' }],
  operatorType: [{ required: true, message: '请选择运营商', trigger: 'change' }],
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
  if (groupBy.value === 'operatorType') return dictLabel(operatorOptions, row.operatorType)
  if (groupBy.value === 'usageStatus') return dictLabel(usageStatusOptions, row.usageStatus)
  if (groupBy.value === 'cardStatus') return dictLabel(cardStatusOptions, row.cardStatus)
  if (groupBy.value === 'agentName') return row.agentName || '未设置代理商'
  if (groupBy.value === 'realnameName') return row.realnameName || '未设置实名人'
  return '-'
}

// 加载动画阈值：只有加载时间超过500ms才显示动画
const LOADING_THRESHOLD = 500

async function loadList() {
  const startTime = Date.now()
  
  try {
    const params = { page: page.value, size: pageSize.value }
    if (searchKeyword.value) params.keyword = searchKeyword.value.trim()
    if (statusFilter.value != null) params.cardStatus = statusFilter.value
    if (operatorTypeFilter.value != null) params.operatorType = operatorTypeFilter.value
    if (usageStatusFilter.value != null) params.usageStatus = usageStatusFilter.value
    if (groupBy.value) params.groupBy = groupBy.value
    const res = await getPhoneCardList(params)
    const data = (res && typeof res === 'object') ? res : {}
    listData.value = Array.isArray(data.list) ? data.list : (Array.isArray(data.records) ? data.records : (Array.isArray(data.rows) ? data.rows : []))
    total.value = Number(data.total ?? 0)
  } catch (e) {
    listData.value = []
    total.value = 0
  }
  
  const elapsed = Date.now() - startTime
  // 只有加载时间超过阈值才显示动画
  if (elapsed >= LOADING_THRESHOLD) {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    loading.value = false
  }
}

async function loadDictionaries() {
  try {
    const [agentRes, realnameRes, operatorRes, usageStatusRes, cardStatusRes] = await Promise.all([
      getDictByType('phone_agent'),
      getAllRealnames(),
      getDictByType('phone_operator'),
      getDictByType('phone_usage_status'),
      getDictByType('phone_card_status')
    ])
    agentOptions.value = Array.isArray(agentRes) ? agentRes : []
    realnameList.value = Array.isArray(realnameRes) ? realnameRes : (realnameRes?.list || realnameRes?.records || realnameRes?.rows || [])
    operatorOptions.value = Array.isArray(operatorRes) ? operatorRes : []
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

function handleAgentChange(val) {
  form.value.agentName = val || ''
}

function handleRealnameChange(id) {
  const list = realnameList.value || []
  const item = list.find(r => r.id === id)
  form.value.realnameName = item ? item.realName : ''
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
  // 检查是否有关联数据
  const hasRelations = await checkPhoneCardRelations(row.phoneNumber)
  if (hasRelations) {
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除手机号 "${row.phoneNumber}" 吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deletePhoneCard(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    // 用户点击取消时，Element Plus 抛出字符串 'cancel'，静默处理
    if (e !== 'cancel') ElMessage.error(e?.message || '删除失败')
  }
}

// 检查手机卡是否被设备使用
async function checkPhoneCardRelations(phoneNumber) {
  if (!phoneNumber) return false

  try {
    // 获取所有设备数据
    const deviceData = await getDeviceGroups({ page: 1, size: 500 })
    const devices = (deviceData && deviceData.list) || (deviceData && deviceData.records) || (Array.isArray(deviceData) ? deviceData : [])

    const relatedDevices = []

    for (const device of devices) {
      // 检查主号是否使用该手机号
      if (device.wechatPhone === phoneNumber || device.wxPhone === phoneNumber) {
        relatedDevices.push({
          deviceCode: device.deviceCode,
          type: device.wechatPhone === phoneNumber ? '企微手机号' : '微信手机号'
        })
      }

      // 检查子账号
      if (device.subAccounts && Array.isArray(device.subAccounts)) {
        for (const sub of device.subAccounts) {
          if (sub.wechatPhone === phoneNumber || sub.wxPhone === phoneNumber) {
            relatedDevices.push({
              deviceCode: device.deviceCode + '-' + (sub.accountIndex || ''),
              type: sub.wechatPhone === phoneNumber ? '企微手机号' : '微信手机号'
            })
          }
        }
      }
    }

    if (relatedDevices.length > 0) {
      let message = `该手机号已被 ${relatedDevices.length} 个设备使用，无法删除。\n\n`
      relatedDevices.forEach(item => {
        message += `设备：${item.deviceCode}（${item.type}）\n`
      })
      message += '\n请先解除设备关联后再删除。'

      ElMessageBox.alert(message, '无法删除', {
        confirmButtonText: '确定',
        type: 'warning'
      })
      return true
    }

    return false
  } catch (e) {
    console.error('检查关联数据失败', e)
    ElMessage.error('检查关联数据失败，请稍后重试')
    return true
  }
}

function dialogClosed() {
  form.value = defaultForm()
  if (formRef.value) formRef.value.clearValidate()
}

// ==================== 导入导出功能 ====================

function getToken() {
  return localStorage.getItem('token') || ''
}

// 下载模板（使用中文表头，与后端 IMPORT_HEADERS 顺序一致）
async function handleDownloadTemplate() {
  try {
    const data = [
      ['ICCID', '运营商', '使用状态', '卡状态', '代理商', '手机号', '实名人', '备注'],
      ['89860012345678901234', '移动', '在用', '正常', 'XX科技有限公司', '13800000000', '张三', '示例数据'],
      ['', '联通', '备用', '二次实名', '', '13900000000', '李四', '']
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '手机卡导入模板')
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '手机卡导入模板.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (e) {
    console.error('模板下载失败:', e)
    ElMessage.error(e?.message || '下载失败')
  }
}

// 导出（前端生成，获取全部数据）
async function handleExport() {
  try {
    // 获取全部数据（不分页）
    const params = { page: 1, size: 10000 }
    if (searchKeyword.value) params.keyword = searchKeyword.value.trim()
    if (statusFilter.value != null) params.cardStatus = statusFilter.value
    if (operatorTypeFilter.value != null) params.operatorType = operatorTypeFilter.value
    if (usageStatusFilter.value != null) params.usageStatus = usageStatusFilter.value
    if (groupBy.value) params.groupBy = groupBy.value
    
    const res = await getPhoneCardList(params)
    const data = (res && typeof res === 'object') ? res : {}
    const allData = Array.isArray(data.list) ? data.list : (Array.isArray(data.records) ? data.records : (Array.isArray(data.rows) ? data.rows : []))
    
    if (allData.length === 0) {
      ElMessage.warning('没有数据可导出')
      return
    }
    
    const headers = ['ID', '手机号', '运营商', 'ICCID', '使用状态', '卡状态', '实名人', '代理商', '备注', '创建时间']
    
    const exportData = allData.map(row => {
      // 字典转换，如果字典未加载则使用备用映射
      const operatorLabel = dictKeyToLabel(operatorOptions.value, row.operatorType)
      const usageLabel = dictKeyToLabel(usageStatusOptions.value, row.usageStatus)
      const cardLabel = dictKeyToLabel(cardStatusOptions.value, row.cardStatus)
      const agentLabel = dictKeyToLabel(agentOptions.value, row.agentName)
      
      // 备用映射
      const usageFallback = { 1: '在用', 2: '停用' }
      const cardFallback = { 1: '正常', 2: '冻结' }
      
      return [
        row.id,
        row.phoneNumber || '-',
        operatorLabel || row.operatorType || '-',
        row.iccid || '-',
        usageLabel || usageFallback[Number(row.usageStatus)] || '-',
        cardLabel || cardFallback[Number(row.cardStatus)] || '-',
        row.realName || '-',
        agentLabel || row.agentName || '-',
        row.remark || '-',
        row.createTime || '-'
      ]
    })
    
    exportData.unshift(headers)
    
    const ws = XLSX.utils.aoa_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '手机卡数据')
    
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    a.download = `手机卡数据_${dateStr}.xlsx`
    a.href = url
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    ElMessage.success(`导出成功，共 ${allData.length} 条数据`)
  } catch (e) {
    console.error('导出失败:', e)
    ElMessage.error(e?.message || '导出失败')
  }
}

// 点击导入按钮
function handleImport() {
  if (fileInput.value) {
    fileInput.value.value = '' // 清空之前选择的文件
    fileInput.value.click()
  }
}

// 文件选择变化
async function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
  if (!isExcel) {
    ElMessage.error('请选择Excel文件(.xlsx或.xls格式)')
    return
  }

  try {
    ElMessage.info('正在导入，请稍候...')
    const convertedFile = await processImportFile(file)
    const result = await importPhoneCards(convertedFile)
    // 兼容两种返回格式：{ successCount, failCount } 或直接是数字
    const successCount = typeof result === 'number' ? result : (result?.successCount ?? result?.data)
    if (successCount !== undefined && successCount !== null) {
      ElMessage.success(`导入成功：共 ${successCount} 条`)
      loadList() // 刷新列表
    } else {
      ElMessage.success('导入成功')
      loadList()
    }
  } catch (e) {
    ElMessage.error(e?.message || '导入失败')
  }
}

// 后端按列索引读取，自动解析枚举值（支持中文或数字），直接传递原始文件
async function processImportFile(file) {
  return file
}

onMounted(() => {
  loadList()
  loadDictionaries()
})
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
.pagination { margin-top: 16px; text-align: right; }
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
