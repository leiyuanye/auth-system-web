<template>
  <div class="home-page">
    <!-- 顶部统计卡片 -->
    <div class="stat-row">
      <div class="stat-card">
        <el-icon :size="16" color="#409EFF"><Iphone /></el-icon>
        <span class="stat-num">{{ deviceCount }}</span>
        <span class="stat-label">设备</span>
      </div>
      <div class="stat-card">
        <el-icon :size="16" color="#67C23A"><UserFilled /></el-icon>
        <span class="stat-num">{{ mainAccountCount + subAccountCount }}</span>
        <span class="stat-label">账号</span>
      </div>
      <div class="stat-card">
        <el-icon :size="16" color="#E6A23C"><Files /></el-icon>
        <span class="stat-num">{{ multiCount }}</span>
        <span class="stat-label">多账号</span>
      </div>
      <div class="stat-card">
        <el-icon :size="16" color="#909399"><CircleCheck /></el-icon>
        <span class="stat-num">{{ activeCount }}</span>
        <span class="stat-label">在用</span>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="action-card">
      <div class="action-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索：设备编码 / 昵称 / 位置 / 实名人"
          size="small"
          style="width: 260px"
          clearable
          :prefix-icon="Search"
        />
        <el-button size="small" type="primary" @click="showFilter = !showFilter">
          <el-icon><Filter /></el-icon>
          <span style="margin-left: 4px">筛选</span>
          <el-badge v-if="hasActiveFilter" is-dot style="margin-left: 4px" />
        </el-button>
        <el-button size="small" type="primary" @click="handleAddMain">
          <el-icon><Plus /></el-icon>
          <span style="margin-left: 4px">新增主号</span>
        </el-button>
        <el-button size="small" type="success" @click="handleAddSub">
          <el-icon><Plus /></el-icon>
          <span style="margin-left: 4px">新增子号</span>
        </el-button>
      </div>
      <div v-if="showFilter" class="filter-row">
        <el-form :inline="true" size="small">
          <el-form-item label="实名人">
            <el-select
              v-model="filter.wechatPerson"
              placeholder="全部"
              clearable
              filterable
              style="width: 140px"
            >
              <el-option v-for="n in realnameOptions" :key="n" :label="n" :value="n" />
            </el-select>
          </el-form-item>
          <el-form-item label="企微状态">
            <el-select v-model="filter.wechatStatus" placeholder="全部" clearable style="width: 120px">
              <el-option
                v-for="item in wechatStatusOptions"
                :key="item.dictKey"
                :label="item.dictValue"
                :value="Number(item.dictKey)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="手机位置">
            <el-select v-model="filter.phoneLocation" placeholder="全部" clearable filterable style="width: 140px">
              <el-option v-for="loc in locationOptions" :key="loc" :label="loc" :value="loc" />
            </el-select>
          </el-form-item>
          <el-form-item label="手机类型">
            <el-select v-model="filter.phoneType" placeholder="全部" clearable style="width: 120px">
              <el-option
                v-for="item in phoneTypeOptions"
                :key="item.dictKey"
                :label="item.dictValue"
                :value="Number(item.dictKey)"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button size="small" plain @click="handleClearFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 设备分组列表 -->
    <div v-loading="loading" element-loading-text="加载中..." class="device-list">
      <el-empty
        v-if="!loading && deviceGroups.length === 0"
        description="暂无设备数据"
        class="empty-block"
      />
      <div v-else>
        <div
          v-for="(group, idx) in deviceGroups"
          :key="group.deviceCode"
          class="device-group"
          :class="{ 'is-expanded': expandedSet.has(group.deviceCode) }"
        >
          <!-- 设备头部 -->
          <div
            class="device-header"
            :class="{ 'clickable': group.subAccounts && group.subAccounts.length > 0 }"
            @click="toggleGroup(group.deviceCode)"
          >
            <el-icon
              v-if="group.subAccounts && group.subAccounts.length > 0"
              class="expand-icon"
              :class="{ 'is-expanded': expandedSet.has(group.deviceCode) }"
            >
              <ArrowRight />
            </el-icon>
            <span class="device-code-text">{{ group.deviceCode }}</span>
            <el-tag
              v-if="group.subAccounts && group.subAccounts.length > 0"
              type="warning"
              size="small"
              effect="light"
              class="device-tag"
            >
              主号 + {{ group.subAccounts.length }}子号
            </el-tag>
            <el-tag v-else size="small" effect="plain" class="device-tag">单账号</el-tag>
            <el-tag
              v-if="getPhoneTypeLabel(group.phoneType)"
              size="small"
              effect="plain"
              type="success"
              class="device-tag"
            >
              <el-icon style="margin-right: 2px"><Iphone /></el-icon>
              {{ getPhoneTypeLabel(group.phoneType) }}
            </el-tag>
            <el-tag v-if="group.phoneLocation" size="small" effect="plain" class="device-tag">
              <el-icon style="margin-right: 2px"><Location /></el-icon>
              {{ group.phoneLocation }}
            </el-tag>
            <el-tag
              v-for="(name, ni) in getEntityNames(group.entityName).slice(0, 2)"
              :key="ni"
              size="small"
              effect="plain"
              class="device-tag"
            >{{ name }}</el-tag>
            <span
              v-if="getEntityNames(group.entityName).length > 2"
              class="device-more"
            >+{{ getEntityNames(group.entityName).length - 2 }}</span>
            <span class="device-spacer"></span>
            <el-button text type="primary" size="small" class="device-btn" @click.stop="handleAddSubToDevice(group.deviceCode)">
              <el-icon><Plus /></el-icon>
              <span style="margin-left: 2px">子号</span>
            </el-button>
          </div>

          <!-- 账号表格 -->
          <div
            v-if="expandedSet.has(group.deviceCode) || !(group.subAccounts && group.subAccounts.length > 0)"
            class="device-accounts"
          >
            <el-table :data="buildAccountRows(group)" size="small" border style="width: 100%">
              <el-table-column label="槽位" width="80" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="row._isMain ? 'primary' : 'info'"
                    size="small"
                    effect="plain"
                  >{{ row._accountIndex }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="phoneNo" label="完整编号" width="130" />
              <el-table-column prop="wechatNickname" label="企微昵称" min-width="120" show-overflow-tooltip />
              <el-table-column label="主体简称" width="150">
                <template #default="{ row }">
                  <el-tag
                    v-for="(name, ni) in getEntityNames(row.entityName).slice(0, 2)"
                    :key="ni"
                    type="warning"
                    size="small"
                    effect="plain"
                    style="margin-right: 4px; margin-bottom: 2px"
                  >{{ name }}</el-tag>
                  <span
                    v-if="getEntityNames(row.entityName).length > 2"
                    style="font-size: 12px; color: #909399"
                  >+{{ getEntityNames(row.entityName).length - 2 }}</span>
                  <span v-if="getEntityNames(row.entityName).length === 0" style="color: #c0c4cc">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="wechatPerson" label="实名人" width="100" show-overflow-tooltip />
              <el-table-column prop="wechatPhone" label="企微手机号" width="130" />
              <el-table-column label="企微状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="getWechatStatusTag(row.wechatStatus)" size="small">
                    {{ dictLabel(wechatStatusOptions, row.wechatStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="使用状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="getUseStatusTag(row.useStatus)" size="small" effect="plain">
                    {{ dictLabel(useStatusOptions, row.useStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" width="150">
                <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
                  <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="账号详情"
      width="780px"
      destroy-on-close
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="槽位">{{ detailData._accountIndex || '-' }}</el-descriptions-item>
        <el-descriptions-item label="设备编码">{{ detailData.deviceCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完整编号" :span="2">{{ detailData.phoneNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机类型">
          <el-tag size="small" effect="plain" type="success">{{ getPhoneTypeLabel(detailData.phoneType) || '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用部门">
          <el-tag size="small">{{ dictLabel(deptOptions, detailData.dept) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机位置">{{ detailData.phoneLocation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用状态">
          <el-tag :type="getUseStatusTag(detailData.useStatus)" size="small" effect="plain">
            {{ dictLabel(useStatusOptions, detailData.useStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="主体简称" :span="2">
          <el-tag
            v-for="(name, ni) in getEntityNames(detailData.entityName).slice(0, 3)"
            :key="ni"
            type="warning"
            size="small"
            effect="plain"
            style="margin: 2px"
          >{{ name }}</el-tag>
          <span v-if="getEntityNames(detailData.entityName).length > 3" style="font-size: 12px; color: #909399">
            +{{ getEntityNames(detailData.entityName).length - 3 }}
          </span>
          <span v-if="getEntityNames(detailData.entityName).length === 0">—</span>
        </el-descriptions-item>
        <el-descriptions-item label="企微对外昵称" :span="2">{{ detailData.wechatNickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微实名人">{{ detailData.wechatPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微手机号">{{ detailData.wechatPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="企微状态">
          <el-tag :type="getWechatStatusTag(detailData.wechatStatus)" size="small">
            {{ dictLabel(wechatStatusOptions, detailData.wechatStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="企微用途">
          <el-tag type="info" size="small">{{ dictLabel(wechatUsageOptions, detailData.wechatUsage) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信实名人">{{ detailData.wxRealname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信手机号">{{ detailData.wxPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信状态">
          <el-tag :type="Number(detailData.wxStatus) === 2 ? 'danger' : 'success'" size="small">
            {{ dictLabel(wxStatusOptions, detailData.wxStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信用途">
          <el-tag size="small" effect="plain">{{ dictLabel(wxUsageOptions, detailData.wxUsage) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信密码" :span="2">
          <span style="letter-spacing: 1px">{{ showPassword ? (detailData.wxPassword || '无') : maskPwd(detailData.wxPassword) }}</span>
          <el-button link type="primary" size="small" style="margin-left: 10px" @click="showPassword = !showPassword">
            {{ showPassword ? '隐藏' : '显示' }}
          </el-button>
        </el-descriptions-item>
        <el-descriptions-item label="最近修改时间">{{ formatTime(detailData.updateTime) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(detailData.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="formTitle"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="formData" label-width="110px" label-position="right">
        <el-divider content-position="left">设备信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号类型" required v-if="formMode === 'add'">
              <el-select v-model="formData._kind" placeholder="请选择账号类型" style="width: 100%" @change="onKindChange">
                <el-option label="主号（新设备）" value="main" />
                <el-option label="子号（挂到已有设备）" value="sub" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备编码" required>
              <el-input
                v-if="formData._kind === 'main' || formMode !== 'add'"
                v-model="formData.deviceCode"
                :disabled="formMode === 'edit'"
                placeholder="如 MT101"
                maxlength="64"
              />
              <el-select
                v-else
                v-model="formData.deviceCode"
                placeholder="选择已有设备"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="code in deviceCodeOptions"
                  :key="code"
                  :label="code"
                  :value="code"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData._kind === 'sub' || (formMode === 'edit' && !formData._isMain)">
            <el-form-item label="账号槽位" required>
              <el-select v-model="formData.accountIndex" placeholder="请选择" style="width: 100%">
                <el-option v-for="n in availableSlots" :key="n" :label="`槽位 ${n}`" :value="String(n)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="完整编号">
              <el-input
                v-model="formData.phoneNo"
                :placeholder="formData.deviceCode + (formData._kind === 'sub' ? '-' + (formData.accountIndex || '') : '主')"
                maxlength="128"
              >
                <template #append v-if="formMode === 'add'">
                  <el-button @click="autoGeneratePhoneNo">自动生成</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机类型" required>
              <el-select v-model="formData.phoneType" placeholder="请选择" style="width: 100%">
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
              <el-select v-model="formData.useStatus" placeholder="请选择" style="width: 100%">
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
              <el-select v-model="formData.dept" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in deptOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="Number(item.dictKey)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机位置">
              <el-input v-model="formData.phoneLocation" placeholder="如 办公室 / 家里" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体简称">
              <el-select
                v-model="formData.entityNameList"
                multiple
                filterable
                placeholder="选择或输入主体简称，多个可多选"
                style="width: 100%"
              >
                <el-option
                  v-for="item in entityNameOptions"
                  :key="item.dictKey"
                  :label="item.dictValue"
                  :value="item.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">企微账号</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="企微对外昵称">
              <el-input v-model="formData.wechatNickname" maxlength="64" placeholder="选填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微实名人">
              <el-select
                v-model="formData.wechatPerson"
                filterable
                placeholder="选填"
                style="width: 100%"
              >
                <el-option v-for="n in realnameOptions" :key="n" :label="n" :value="n" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微手机号">
              <el-input v-model="formData.wechatPhone" placeholder="选填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微状态" required>
              <el-select v-model="formData.wechatStatus" placeholder="请选择" style="width: 100%">
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
              <el-select v-model="formData.wechatUsage" placeholder="请选择" style="width: 100%">
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

        <el-divider content-position="left">微信账号</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="微信状态" required>
              <el-select v-model="formData.wxStatus" placeholder="请选择" style="width: 100%">
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
              <el-select v-model="formData.wxUsage" placeholder="请选择" style="width: 100%">
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
            <el-form-item label="微信实名人">
              <el-input v-model="formData.wxRealname" placeholder="选填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信手机号">
              <el-input v-model="formData.wxPhone" placeholder="选填" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信密码">
              <el-input v-model="formData.wxPassword" show-password placeholder="选填" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="选填" maxlength="512" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ formMode === 'add' ? '新增' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Iphone, Search, Plus, Filter, ArrowRight, Location,
  CircleCheck, Warning, UserFilled, Files
} from '@element-plus/icons-vue'
import { getDictByType } from '@/api/dict'
import {
  getDeviceGroups,
  addDevice, updateDevice, deleteDevice,
  addSubAccount, updateSubAccount, deleteSubAccount,
  getRealnameOptions, getDeviceCodeOptions,
  getPhoneDeviceList
} from '@/api/phoneDevice'

// ===== 基础状态 =====
const loading = ref(false)
const searchKeyword = ref('')
const showFilter = ref(false)
const allGroups = ref([])
const deviceCodeOptions = ref([])

const filter = reactive({
  wechatPerson: null,
  wechatStatus: null,
  phoneLocation: null,
  phoneType: null
})

const hasActiveFilter = computed(() => {
  return !!(filter.wechatPerson ||
    (filter.wechatStatus !== null && filter.wechatStatus !== undefined) ||
    filter.phoneLocation ||
    (filter.phoneType !== null && filter.phoneType !== undefined))
})

// ===== 字典数据 =====
const wechatStatusOptions = ref([])
const useStatusOptions = ref([])
const deptOptions = ref([])
const wechatUsageOptions = ref([])
const wxStatusOptions = ref([])
const wxUsageOptions = ref([])
const phoneTypeOptions = ref([])
const entityNameOptions = ref([])
const realnameOptions = ref([])

// ===== 展开状态 =====
const expandedSet = ref(new Set())

// ===== 详情弹窗 =====
const detailVisible = ref(false)
const detailData = ref(null)
const showPassword = ref(false)

// ===== 表单弹窗 =====
const formVisible = ref(false)
const formMode = ref('add') // 'add' | 'edit'
const submitting = ref(false)
// formData._isMain = true 表示主号，false 表示子号
// formData._kind = 'main' | 'sub'（仅新增时用）
const formData = reactive({
  id: null,
  deviceCode: '',
  phoneNo: '',
  _isMain: true,
  _kind: 'main',
  accountIndex: '',
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

const formTitle = computed(() => {
  if (formMode.value === 'add') {
    if (formData._kind === 'main') return '新增主号'
    return '新增子号'
  }
  if (formData._isMain) return '编辑主号'
  return '编辑子号'
})

// 子账号可选槽位（1-5），去掉已占用的槽位
const availableSlots = computed(() => {
  const used = new Set()
  if (formData.deviceCode) {
    const group = allGroups.value.find(g => g.deviceCode === formData.deviceCode)
    if (group && group.subAccounts) {
      for (const sub of group.subAccounts) {
        // 编辑自己时，自己的槽位不视为已占用
        if (formMode.value === 'edit' && sub.id === formData.id) continue
        used.add(String(sub.accountIndex))
      }
    }
  }
  const slots = []
  for (let i = 1; i <= 5; i++) {
    if (!used.has(String(i))) slots.push(i)
  }
  return slots
})

// ===== 辅助函数 =====
function dictLabel(list, value) {
  if (value === null || value === undefined || value === '') return '-'
  const arr = Array.isArray(list) ? list : (list && list.value ? list.value : [])
  if (!arr || arr.length === 0) return String(value)
  const item = arr.find(i => Number(i.dictKey) === Number(value) || String(i.dictKey) === String(value))
  return item ? item.dictValue : String(value)
}

function getEntityNames(str) {
  if (!str) return []
  return String(str).split(',').map(s => s.trim()).filter(v => v)
}

function getPhoneTypeLabel(val) {
  if (val === null || val === undefined || val === '') return ''
  return dictLabel(phoneTypeOptions, val)
}

function maskPwd(val) {
  if (!val) return '-'
  const s = String(val)
  if (s.length <= 2) return s.substring(0, 1) + '*'
  return s.substring(0, 2) + '*'.repeat(Math.min(s.length - 2, 10))
}

function getWechatStatusTag(status) {
  const s = Number(status)
  if (s === 1) return 'success'
  if (s === 2) return 'info'
  if (s === 3) return 'danger'
  if (s === 4) return 'warning'
  return 'info'
}

function getUseStatusTag(status) {
  const s = Number(status)
  if (s === 1) return 'success'
  if (s === 2) return 'warning'
  if (s === 4) return 'info'
  return 'info'
}

function formatTime(val) {
  if (!val) return '-'
  if (val instanceof Date) {
    const pad = n => String(n).padStart(2, '0')
    return `${val.getFullYear()}年${pad(val.getMonth() + 1)}月${pad(val.getDate())}日 ${pad(val.getHours())}:${pad(val.getMinutes())}:${pad(val.getSeconds())}`
  }
  const s = String(val)
  const m1 = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T ](\d{1,2}):(\d{1,2}):(\d{1,2})/)
  if (m1) {
    return `${m1[1]}年${m1[2].padStart(2, '0')}月${m1[3].padStart(2, '0')}日 ${m1[4].padStart(2, '0')}:${m1[5].padStart(2, '0')}:${m1[6].padStart(2, '0')}`
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

// 构建一个设备下的账号行（主号 + 子账号），用于表格展示
function buildAccountRows(group) {
  const rows = []
  // 主账号行
  rows.push({
    ...group,
    _isMain: true,
    _accountIndex: '主'
  })
  // 子账号行
  if (group.subAccounts && group.subAccounts.length > 0) {
    for (const sub of group.subAccounts) {
      rows.push({
        ...sub,
        _isMain: false,
        _accountIndex: sub.accountIndex || ''
      })
    }
  }
  return rows
}

// ===== 计算属性：过滤 + 分组 =====
const deviceGroups = computed(() => {
  const kw = searchKeyword.value && searchKeyword.value.trim() ? searchKeyword.value.trim().toLowerCase() : ''
  return allGroups.value.filter(group => {
    // 检查主账号 + 所有子账号：有任何一个匹配，就保留整个分组
    const allAccounts = buildAccountRows(group)
    let match = true
    if (kw) {
      match = allAccounts.some(row => {
        const hay = [
          row.deviceCode, row.phoneNo, row.wechatNickname, row.wechatPerson,
          row.phoneLocation, row.wxRealname, row.wxPhone
        ].filter(v => v).map(v => String(v).toLowerCase()).join(' ')
        return hay.includes(kw)
      })
      if (!match) return false
    }
    // 其他筛选条件：任一行匹配都算
    if (filter.wechatPerson) {
      if (!allAccounts.some(r => r.wechatPerson === filter.wechatPerson)) return false
    }
    if (filter.wechatStatus !== null && filter.wechatStatus !== undefined) {
      if (!allAccounts.some(r => Number(r.wechatStatus) === Number(filter.wechatStatus))) return false
    }
    if (filter.phoneLocation) {
      if (!allAccounts.some(r => r.phoneLocation === filter.phoneLocation)) return false
    }
    if (filter.phoneType !== null && filter.phoneType !== undefined) {
      if (!allAccounts.some(r => Number(r.phoneType) === Number(filter.phoneType))) return false
    }
    return true
  }).sort((a, b) => {
    // 多账号的靠前，然后按设备编码排序
    const al = (a.subAccounts && a.subAccounts.length) || 0
    const bl = (b.subAccounts && b.subAccounts.length) || 0
    if (al !== bl) return bl - al
    return (a.deviceCode || '').localeCompare(b.deviceCode || '')
  })
})

const deviceCount = computed(() => deviceGroups.value.length)
const mainAccountCount = computed(() => deviceGroups.value.length)
const subAccountCount = computed(() =>
  deviceGroups.value.reduce((sum, g) => sum + ((g.subAccounts && g.subAccounts.length) || 0), 0)
)
const multiCount = computed(() => deviceGroups.value.filter(g => g.subAccounts && g.subAccounts.length > 0).length)
const activeCount = computed(() => {
  return deviceGroups.value.reduce((sum, g) => {
    let c = 0
    if (Number(g.useStatus) === 1) c++
    if (g.subAccounts) {
      for (const s of g.subAccounts) {
        if (Number(s.useStatus) === 1) c++
      }
    }
    return sum + c
  }, 0)
})

// 位置选项（从数据中提取）
const locationOptions = computed(() => {
  const set = new Set()
  for (const g of allGroups.value) {
    if (g.phoneLocation) set.add(g.phoneLocation)
    if (g.subAccounts) {
      for (const s of g.subAccounts) {
        if (s.phoneLocation) set.add(s.phoneLocation)
      }
    }
  }
  return [...set]
})

// ===== 交互函数 =====
function toggleGroup(code) {
  const set = new Set(expandedSet.value)
  if (set.has(code)) set.delete(code)
  else set.add(code)
  expandedSet.value = set
}

function handleClearFilter() {
  filter.wechatPerson = null
  filter.wechatStatus = null
  filter.phoneLocation = null
  filter.phoneType = null
}

// ===== 数据加载 =====
async function loadData() {
  loading.value = true
  try {
    const data = await getDeviceGroups({ page: 1, size: 500 })
    // getDeviceGroups 返回 result.data 被 axios 拦截器解开
    const list = (data && data.list) || (data && data.records) || (Array.isArray(data) ? data : [])
    allGroups.value = list
    // 默认展开第一个多账号设备
    if (expandedSet.value.size === 0) {
      const firstMulti = deviceGroups.value.find(g => g.subAccounts && g.subAccounts.length > 0)
      if (firstMulti) {
        const set = new Set(expandedSet.value)
        set.add(firstMulti.deviceCode)
        expandedSet.value = set
      }
    }
  } catch (e) {
    console.error('加载设备数据失败', e)
    allGroups.value = []
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
      console.warn('字典加载失败', type, e)
    }
  }
}

async function loadRealnameOptions() {
  try {
    const data = await getRealnameOptions()
    if (Array.isArray(data)) realnameOptions.value = data
  } catch (e) {
    realnameOptions.value = []
  }
}

async function loadDeviceCodeOptions() {
  try {
    const data = await getDeviceCodeOptions()
    if (Array.isArray(data)) deviceCodeOptions.value = data
  } catch (e) {
    deviceCodeOptions.value = []
  }
}

// ===== 新增 / 编辑 =====
function resetForm() {
  formData.id = null
  formData.deviceCode = ''
  formData.phoneNo = ''
  formData._isMain = true
  formData._kind = 'main'
  formData.accountIndex = ''
  formData.wechatNickname = ''
  formData.entityNameList = []
  formData.wechatPerson = ''
  formData.wechatPhone = ''
  formData.phoneLocation = ''
  formData.wechatStatus = 1
  formData.useStatus = 1
  formData.dept = 1
  formData.wechatUsage = 1
  formData.wxStatus = 1
  formData.wxUsage = 1
  formData.phoneType = 1
  formData.wxRealname = ''
  formData.wxPhone = ''
  formData.wxPassword = ''
  formData.remark = ''
}

// 新增主号
function handleAddMain() {
  resetForm()
  formMode.value = 'add'
  formData._kind = 'main'
  formData._isMain = true
  formVisible.value = true
}

// 新增子号（下拉选择设备）
function handleAddSub() {
  resetForm()
  formMode.value = 'add'
  formData._kind = 'sub'
  formData._isMain = false
  // 加载设备编码下拉选项
  loadDeviceCodeOptions()
  formVisible.value = true
}

// 在某个设备下直接新增子号（预设 deviceCode）
function handleAddSubToDevice(deviceCode) {
  resetForm()
  formMode.value = 'add'
  formData._kind = 'sub'
  formData._isMain = false
  formData.deviceCode = deviceCode
  loadDeviceCodeOptions()
  formVisible.value = true
}

function handleView(row) {
  detailData.value = row
  showPassword.value = false
  detailVisible.value = true
}

function handleEditFromDetail() {
  const row = detailData.value
  detailVisible.value = false
  handleEdit(row)
}

function handleEdit(row) {
  resetForm()
  formMode.value = 'edit'
  formData._isMain = !!row._isMain
  formData.id = row.id
  formData.deviceCode = row.deviceCode || ''
  formData.phoneNo = row.phoneNo || ''
  formData.accountIndex = row._accountIndex || row.accountIndex || ''
  formData.wechatNickname = row.wechatNickname || ''
  formData.entityNameList = getEntityNames(row.entityName)
  formData.wechatPerson = row.wechatPerson || ''
  formData.wechatPhone = row.wechatPhone || ''
  formData.phoneLocation = row.phoneLocation || ''
  formData.wechatStatus = row.wechatStatus != null ? Number(row.wechatStatus) : 1
  formData.useStatus = row.useStatus != null ? Number(row.useStatus) : 1
  formData.dept = row.dept != null ? Number(row.dept) : 1
  formData.wechatUsage = row.wechatUsage != null ? Number(row.wechatUsage) : 1
  formData.wxStatus = row.wxStatus != null ? Number(row.wxStatus) : 1
  formData.wxUsage = row.wxUsage != null ? Number(row.wxUsage) : 1
  formData.phoneType = row.phoneType != null ? Number(row.phoneType) : 1
  formData.wxRealname = row.wxRealname || ''
  formData.wxPhone = row.wxPhone || ''
  formData.wxPassword = row.wxPassword || ''
  formData.remark = row.remark || ''
  formVisible.value = true
}

// 选择账号类型时重置相关字段
function onKindChange(val) {
  if (val === 'main') {
    formData._isMain = true
    formData.accountIndex = ''
    // 如果是主号模式，允许用户手动填写 deviceCode
  } else {
    formData._isMain = false
    // 子号模式：加载设备编码列表
    loadDeviceCodeOptions()
  }
}

function autoGeneratePhoneNo() {
  if (formData._kind === 'main') {
    formData.phoneNo = formData.deviceCode + '主'
  } else {
    formData.phoneNo = formData.deviceCode + '-' + (formData.accountIndex || '')
  }
}

// ===== 提交 =====
async function handleSubmit() {
  // 基础校验
  if (formMode.value === 'add') {
    if (formData._kind === 'main') {
      if (!formData.deviceCode || !formData.deviceCode.trim()) {
        ElMessage.warning('请填写设备编码')
        return
      }
    } else {
      if (!formData.deviceCode || !formData.deviceCode.trim()) {
        ElMessage.warning('请选择设备')
        return
      }
      if (!formData.accountIndex) {
        ElMessage.warning('请选择账号槽位')
        return
      }
    }
  }

  const entityName = formData.entityNameList.length > 0 ? formData.entityNameList.join(',') : ''
  const payload = {
    deviceCode: formData.deviceCode.trim(),
    phoneNo: formData.phoneNo.trim(),
    wechatNickname: formData.wechatNickname ? formData.wechatNickname.trim() : '',
    entityName: entityName,
    wechatPerson: formData.wechatPerson || '',
    wechatPhone: formData.wechatPhone || '',
    phoneLocation: formData.phoneLocation ? formData.phoneLocation.trim() : '',
    wechatStatus: formData.wechatStatus != null ? Number(formData.wechatStatus) : 1,
    useStatus: formData.useStatus != null ? Number(formData.useStatus) : 1,
    dept: formData.dept != null ? Number(formData.dept) : 1,
    wechatUsage: formData.wechatUsage != null ? Number(formData.wechatUsage) : 1,
    wxStatus: formData.wxStatus != null ? Number(formData.wxStatus) : 1,
    wxUsage: formData.wxUsage != null ? Number(formData.wxUsage) : 1,
    phoneType: formData.phoneType != null ? Number(formData.phoneType) : 1,
    wxRealname: formData.wxRealname || '',
    wxPhone: formData.wxPhone || '',
    wxPassword: formData.wxPassword || '',
    remark: formData.remark || ''
  }

  submitting.value = true
  try {
    if (formMode.value === 'edit') {
      // 编辑：判断是主号还是子号
      if (formData._isMain) {
        await updateDevice(formData.id, payload)
        ElMessage.success('主号已更新')
      } else {
        const subPayload = { ...payload, accountIndex: formData.accountIndex }
        await updateSubAccount(formData.id, subPayload)
        ElMessage.success('子号已更新')
      }
    } else {
      // 新增
      if (formData._kind === 'main') {
        await addDevice(payload)
        ElMessage.success('主号已新增')
      } else {
        const subPayload = { ...payload, accountIndex: formData.accountIndex }
        await addSubAccount(subPayload)
        ElMessage.success('子号已新增')
      }
    }
    formVisible.value = false
    await loadData()
    // 刷新下拉
    if (formData._kind === 'sub') {
      loadDeviceCodeOptions()
    }
  } catch (e) {
    console.error('提交失败', e)
    if (e && e.message) ElMessage.error(e.message)
  } finally {
    submitting.value = false
  }
}

// ===== 删除 =====
async function handleDelete(row) {
  const isMain = !!row._isMain
  const no = row.phoneNo || row.deviceCode || ''
  let msg
  if (isMain) {
    const subCount = (row.subAccounts && row.subAccounts.length) || 0
    msg = subCount > 0
      ? `确定删除主号「${no}」吗？该主号下的 ${subCount} 个子号也会被一并删除，删除后不可恢复。`
      : `确定删除主号「${no}」吗？删除后不可恢复。`
  } else {
    msg = `确定删除子号「${row.phoneNo || row.deviceCode + '-' + row._accountIndex}」吗？删除后不可恢复。`
  }
  try {
    await ElMessageBox.confirm(msg, '提示', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    if (isMain) {
      await deleteDevice(row.id)
    } else {
      await deleteSubAccount(row.id)
    }
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    // 用户取消
  }
}

// ===== 初始化 =====
onMounted(async () => {
  await loadDicts()
  await loadRealnameOptions()
  loadData()
})
</script>

<style scoped>
.home-page {
  padding: 12px;
  background: #f5f7fa;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.stat-card {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}
.stat-num {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.stat-label {
  font-size: 13px;
  color: #909399;
}

.action-card {
  background: #fff;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 10px;
}
.action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
}

.empty-block {
  padding: 40px 0;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.device-group {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}
.device-group.is-expanded {
  border-color: #409EFF;
}

.device-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  flex-wrap: wrap;
}
.device-header.clickable {
  cursor: pointer;
  background: #fafafa;
}
.device-header.clickable:hover {
  background: #f0f5ff;
}

.expand-icon {
  color: #909399;
  transition: transform 0.25s;
  font-size: 12px;
}
.expand-icon.is-expanded {
  transform: rotate(90deg);
  color: #409EFF;
}

.device-code-text {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
.device-tag {
  margin: 0;
}
.device-more {
  font-size: 12px;
  color: #909399;
}
.device-spacer {
  flex: 1;
}
.device-btn {
  padding: 0 4px;
}

.device-accounts {
  border-top: 1px solid #ebeef5;
  background: #fff;
}
</style>
