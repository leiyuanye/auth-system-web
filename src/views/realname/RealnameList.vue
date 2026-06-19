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
              @change="onQuery">
              <el-option label="不能扫脸" :value="1" />
              <el-option label="方便扫脸" :value="2" />
              <el-option label="较难扫脸" :value="3" />
            </el-select>
            <el-select
              v-model="colleagueStatusFilter"
              placeholder="同事状态"
              style="width: 140px;"
              clearable
              @change="onQuery">
              <el-option
                v-for="d in colleagueStatusDict"
                :key="d.dictKey"
                :label="d.dictValue"
                :value="d.dictKey" />
            </el-select>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索姓名/同事姓名"
              style="width: 240px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="onQuery" />
            <el-dropdown trigger="click" style="margin-left: 8px;" v-if="userStore.hasPermission('realname:list:add')">
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
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('realname:list:add')">
              新增实名人员
            </el-button>
            <!-- 隐藏的文件上传input -->
            <input type="file" ref="fileInput" accept=".xlsx,.xls" style="display: none;" @change="handleFileChange" />
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading" element-loading-text="加载中...">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="realName" label="姓名" width="120" />
        <el-table-column label="同事状态" width="110">
          <template #default="{ row }">
            <el-tag v-if="colleagueStatusText(row.colleagueStatus)"
              :type="colleagueStatusTagType(row.colleagueStatus)" size="small">
              {{ colleagueStatusText(row.colleagueStatus) }}
            </el-tag>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="colleagueName" label="同事姓名" width="140">
          <template #default="{ row }">{{ row.colleagueName || '-' }}</template>
        </el-table-column>
        <el-table-column label="扫脸便捷性" width="130">
          <template #default="{ row }">
            <el-tag :type="scanStatusType(row.scanStatus)">{{ scanStatusText(row.scanStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
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
          @current-change="onPageChange" />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" @close="dialogClosed">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="同事状态" prop="colleagueStatus">
              <el-select v-model="form.colleagueStatus" placeholder="请选择同事状态" style="width: 100%;">
                <el-option
                  v-for="d in colleagueStatusDict"
                  :key="d.dictKey"
                  :label="d.dictValue"
                  :value="d.dictKey" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="同事姓名">
              <el-input v-model="form.colleagueName" placeholder="请输入同事姓名" />
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="实名人员详情" width="900px" destroy-on-close>
      <div v-loading="detailLoading" element-loading-text="加载中...">
        <!-- 基本信息 -->
        <el-descriptions :column="3" border title="基本信息">
          <el-descriptions-item label="姓名">{{ detailData.realName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="同事状态">
            <el-tag :type="colleagueStatusTagType(detailData.colleagueStatus)" size="small">
              {{ colleagueStatusText(detailData.colleagueStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="同事姓名">{{ detailData.colleagueName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="扫脸便捷性">
            <el-tag :type="scanStatusType(detailData.scanStatus)" size="small">
              {{ scanStatusText(detailData.scanStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 统计卡片 -->
        <div class="stat-cards" style="margin: 20px 0;">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-card shadow="hover" :body-style="{ padding: '16px', textAlign: 'center' }">
                <div style="font-size: 28px; font-weight: bold; color: #409EFF;">{{ relatedPhoneCards.length }}</div>
                <div style="font-size: 14px; color: #606266; margin-top: 8px;">关联手机卡</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" :body-style="{ padding: '16px', textAlign: 'center' }">
                <div style="font-size: 28px; font-weight: bold; color: #67C23A;">{{ relatedWechatAccounts.length }}</div>
                <div style="font-size: 14px; color: #606266; margin-top: 8px;">企微账号</div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" :body-style="{ padding: '16px', textAlign: 'center' }">
                <div style="font-size: 28px; font-weight: bold; color: #E6A23C;">{{ relatedWxAccounts.length }}</div>
                <div style="font-size: 14px; color: #606266; margin-top: 8px;">微信账号</div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 关联手机卡 -->
        <div v-if="relatedPhoneCards.length > 0" class="section">
          <div class="section-title">
            <el-icon><Iphone /></el-icon>
            <span>关联手机卡（{{ relatedPhoneCards.length }}张）</span>
          </div>
          <el-table :data="relatedPhoneCards" size="small" stripe border>
            <el-table-column prop="phoneNumber" label="手机号" width="130" />
            <el-table-column prop="iccid" label="ICCID" width="180" show-overflow-tooltip />
            <el-table-column prop="operatorType" label="运营商" width="100">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">{{ row.operatorType || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="usageStatus" label="使用状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.usageStatus === 1 ? 'success' : 'info'" size="small">
                  {{ row.usageStatus === 1 ? '在用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="realName" label="实名人" width="100" />
            <el-table-column prop="agentName" label="代理商" width="120" show-overflow-tooltip />
            <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
          </el-table>
        </div>
        <el-empty v-else description="暂无关联手机卡" :image-size="80" style="margin: 20px 0;" />

        <!-- 企微账号 -->
        <div v-if="relatedWechatAccounts.length > 0" class="section">
          <div class="section-title">
            <el-icon><ChatDotRound /></el-icon>
            <span>企业微信账号（{{ relatedWechatAccounts.length }}个）</span>
          </div>
          <el-table :data="relatedWechatAccounts" size="small" stripe border>
            <el-table-column prop="deviceCode" label="设备编码" width="140" />
            <el-table-column prop="wechatNickname" label="对外昵称" width="140" show-overflow-tooltip />
            <el-table-column prop="wechatPhone" label="手机号" width="120" />
            <el-table-column prop="entityName" label="主体简称" width="140" show-overflow-tooltip />
            <el-table-column prop="wechatStatus" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.wechatStatus === 1 ? 'success' : 'danger'" size="small">
                  {{ row.wechatStatus === 1 ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="wechatUsage" label="用途" width="100">
              <template #default="{ row }">
                <el-tag type="info" size="small" effect="plain">{{ row.wechatUsage || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="phoneLocation" label="位置" width="100" />
          </el-table>
        </div>
        <el-empty v-else description="暂无企微账号" :image-size="80" style="margin: 20px 0;" />

        <!-- 微信账号 -->
        <div v-if="relatedWxAccounts.length > 0" class="section">
          <div class="section-title">
            <el-icon><ChatLineRound /></el-icon>
            <span>微信账号（{{ relatedWxAccounts.length }}个）</span>
          </div>
          <el-table :data="relatedWxAccounts" size="small" stripe border>
            <el-table-column prop="deviceCode" label="设备编码" width="140" />
            <el-table-column prop="wxPhone" label="手机号" width="120" />
            <el-table-column prop="wxStatus" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="Number(row.wxStatus) === 1 ? 'success' : 'danger'" size="small">
                  {{ Number(row.wxStatus) === 1 ? '正常' : '异常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="wxUsage" label="用途" width="100">
              <template #default="{ row }">
                <el-tag type="info" size="small" effect="plain">{{ row.wxUsage || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="phoneLocation" label="位置" width="100" />
            <el-table-column prop="useStatus" label="使用状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.useStatus === 1 ? 'success' : 'info'" size="small" effect="plain">
                  {{ row.useStatus === 1 ? '在用' : '备用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-empty v-else description="暂无微信账号" :image-size="80" style="margin: 20px 0;" />
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Search, Plus, Iphone, ChatDotRound, ChatLineRound, Download, Upload, Document } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getRealnameList, addRealname, updateRealname, deleteRealname, exportRealnames, importRealnames } from '@/api/phone'
import { getDeviceGroups } from '@/api/phoneDevice'
import { getDictByType } from '@/api/dict'
import * as XLSX from 'xlsx'

const userStore = useUserStore()
const searchKeyword = ref('')
const scanStatusFilter = ref(null)
const colleagueStatusFilter = ref(null)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const total = ref(0)
const listData = ref([])
const colleagueStatusDict = ref([])
const fileInput = ref(null)

const dialogVisible = ref(false)
const dialogTitle = ref('新增实名人员')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 详情弹窗
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref({})
const relatedPhoneCards = ref([])
const relatedWechatAccounts = ref([])
const relatedWxAccounts = ref([])

const defaultForm = () => ({
  id: null, realName: '',
  colleagueStatus: 'active',
  colleagueName: '',
  scanStatus: 2,
  remark: ''
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

const colleagueStatusText = (val) => {
  if (!val) return ''
  const d = colleagueStatusDict.value.find(i => i.dictKey === val)
  return d ? d.dictValue : val
}

const colleagueStatusTagType = (val) => {
  if (val === 'active') return 'success'
  if (val === 'resigned') return 'danger'
  return 'info'
}

async function loadDicts() {
  try {
    const arr = await getDictByType('colleague_status')
    colleagueStatusDict.value = Array.isArray(arr) ? arr : []
  } catch (e) {
    colleagueStatusDict.value = []
  }
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
    if (colleagueStatusFilter.value && colleagueStatusFilter.value.trim()) {
      params.colleagueStatus = colleagueStatusFilter.value.trim()
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
  if (!form.value.colleagueStatus) form.value.colleagueStatus = 'active'
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
  // 先检查关联数据
  const hasRelations = await checkRealnameRelations(row.realName)
  if (hasRelations) {
    return
  }

  await ElMessageBox.confirm(`确定删除 "${row.realName}" 吗？`, '提示', {
    type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消'
  }).catch(() => {})
  await deleteRealname(row.id)
  ElMessage.success('删除成功')
  loadList()
}

// 检查实名人员是否有关联数据
async function checkRealnameRelations(realName) {
  try {
    // 获取所有设备数据
    const deviceData = await getDeviceGroups({ page: 1, size: 500 })
    const devices = (deviceData && deviceData.list) || (deviceData && deviceData.records) || (Array.isArray(deviceData) ? deviceData : [])

    const wechatAccounts = []
    const wxAccounts = []

    for (const device of devices) {
      // 检查主号
      if (device.wechatPerson === realName) {
        wechatAccounts.push({ type: '企微', deviceCode: device.deviceCode })
      }
      if (device.wxRealname === realName) {
        wxAccounts.push({ type: '微信', deviceCode: device.deviceCode })
      }

      // 检查子账号
      if (device.subAccounts && Array.isArray(device.subAccounts)) {
        for (const sub of device.subAccounts) {
          if (sub.wechatPerson === realName) {
            wechatAccounts.push({ type: '企微', deviceCode: device.deviceCode + '-' + (sub.accountIndex || '') })
          }
          if (sub.wxRealname === realName) {
            wxAccounts.push({ type: '微信', deviceCode: device.deviceCode + '-' + (sub.accountIndex || '') })
          }
        }
      }
    }

    const totalRelations = wechatAccounts.length + wxAccounts.length

    if (totalRelations > 0) {
      let message = `该实名人员关联了 ${totalRelations} 个账号，无法删除。\n\n`
      if (wechatAccounts.length > 0) {
        message += `企微账号：${wechatAccounts.length} 个\n`
      }
      if (wxAccounts.length > 0) {
        message += `微信账号：${wxAccounts.length} 个\n`
      }
      message += '\n请先解除关联后再删除。'

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

// 查看详情
async function handleViewDetail(row) {
  detailData.value = { ...row }
  detailVisible.value = true
  detailLoading.value = true

  try {
    // 获取所有设备数据
    const deviceData = await getDeviceGroups({ page: 1, size: 500 })
    const devices = (deviceData && deviceData.list) || (deviceData && deviceData.records) || (Array.isArray(deviceData) ? deviceData : [])

    const phoneCards = []
    const wechatAccounts = []
    const wxAccounts = []

    // 遍历所有设备，查找关联的账号
    for (const device of devices) {
      // 检查主号的实名人
      if (device.wechatPerson === row.realName) {
        // 关联企微
        wechatAccounts.push({
          deviceCode: device.deviceCode,
          wechatNickname: device.wechatNickname,
          wechatPhone: device.wechatPhone,
          entityName: device.entityName,
          wechatStatus: device.wechatStatus,
          wechatUsage: device.wechatUsage,
          phoneLocation: device.phoneLocation
        })
        // 关联微信
        if (device.wxRealname === row.realName) {
          wxAccounts.push({
            deviceCode: device.deviceCode,
            wxPhone: device.wxPhone,
            wxStatus: device.wxStatus,
            wxUsage: device.wxUsage,
            phoneLocation: device.phoneLocation,
            useStatus: device.useStatus
          })
        }
      }

      // 检查子账号
      if (device.subAccounts && Array.isArray(device.subAccounts)) {
        for (const sub of device.subAccounts) {
          if (sub.wechatPerson === row.realName) {
            wechatAccounts.push({
              deviceCode: device.deviceCode + '-' + (sub.accountIndex || ''),
              wechatNickname: sub.wechatNickname,
              wechatPhone: sub.wechatPhone,
              entityName: sub.entityName,
              wechatStatus: sub.wechatStatus,
              wechatUsage: sub.wechatUsage,
              phoneLocation: device.phoneLocation
            })
          }
          if (sub.wxRealname === row.realName) {
            wxAccounts.push({
              deviceCode: device.deviceCode + '-' + (sub.accountIndex || ''),
              wxPhone: sub.wxPhone,
              wxStatus: sub.wxStatus,
              wxUsage: sub.wxUsage,
              phoneLocation: device.phoneLocation,
              useStatus: sub.useStatus
            })
          }
        }
      }
    }

    relatedWechatAccounts.value = wechatAccounts
    relatedWxAccounts.value = wxAccounts

    // 手机卡数据需要通过其他接口获取，这里先留空
    // 如果有手机卡接口，可以在这里调用
    relatedPhoneCards.value = []

  } catch (e) {
    console.error('加载详情数据失败', e)
    ElMessage.error('加载关联数据失败')
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  loadDicts()
  loadList()
})

// ==================== 导入导出功能 ====================

// 下载模板（使用中文表头，与后端 IMPORT_HEADERS 顺序一致）
async function handleDownloadTemplate() {
  try {
    const data = [
      ['真实姓名', '同事状态', '同事姓名', '扫脸便捷性', '备注'],
      ['张三', '在职', '李四', '方便扫脸', '示例数据'],
      ['王五', '已离职', '-', '不能扫脸', '已离职']
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '实名人员导入模板')
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '实名人员导入模板.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (e) {
    console.error('模板下载失败:', e)
    ElMessage.error(e?.message || '模板下载失败')
  }
}

// 导出（前端生成，获取全部数据）
async function handleExport() {
  try {
    const { utils, write } = await import('xlsx')
    
    // 获取全部数据（不分页）
    const params = { page: 1, size: 10000 }
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (scanStatusFilter.value !== null && scanStatusFilter.value !== undefined && scanStatusFilter.value !== '') {
      params.scanStatus = scanStatusFilter.value
    }
    if (colleagueStatusFilter.value && colleagueStatusFilter.value.trim()) {
      params.colleagueStatus = colleagueStatusFilter.value.trim()
    }
    
    const res = await getRealnameList(params)
    const data = (res && typeof res === 'object') ? res : {}
    const allData = Array.isArray(data.list) ? data.list : (Array.isArray(data.records) ? data.records : (Array.isArray(data.rows) ? data.rows : []))
    
    if (allData.length === 0) {
      ElMessage.warning('没有数据可导出')
      return
    }
    
    const headers = ['ID', '姓名', '同事状态', '同事姓名', '扫脸便捷性', '备注', '创建时间']
    
    const exportData = allData.map(row => [
      row.id,
      row.realName || '-',
      colleagueStatusText(row.colleagueStatus) || '-',
      row.colleagueName || '-',
      scanStatusText(row.scanStatus) || '-',
      row.remark || '-',
      row.createTime || '-'
    ])
    
    exportData.unshift(headers)
    
    const ws = utils.aoa_to_sheet(exportData)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, '实名人员数据')
    
    const buffer = write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '实名人员数据_' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '.xlsx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
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
    const result = await importRealnames(file)
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
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
.page-header { display: flex; align-items: center; justify-content: space-between; }
.filters { display: flex; gap: 10px; align-items: center; }
.pagination { margin-top: 16px; text-align: right; }

.section {
  margin-top: 20px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}
.stat-cards {
  margin: 20px 0;
}
</style>
