<template>
  <div class="home-page">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon primary"><el-icon><Iphone /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ deviceCount }}</div>
            <div class="stat-label">设备总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon success"><el-icon><UserFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ accountCount }}</div>
            <div class="stat-label">账号总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon warning"><el-icon><Files /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ multiCount }}</div>
            <div class="stat-label">多账号设备</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon info"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ activeCount }}</div>
            <div class="stat-label">在用账号</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选区 -->
    <el-card class="action-card" shadow="never">
      <div class="action-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索：设备编码 / 昵称 / 位置 / 实名人"
          style="width: 340px"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="showFilter = !showFilter">
          <el-icon><Filter /></el-icon>
          <span style="margin-left: 4px">高级筛选</span>
          <el-badge v-if="hasActiveFilter" is-dot style="margin-left: 4px" />
        </el-button>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span style="margin-left: 4px">新增账号</span>
        </el-button>
      </div>
      <div v-if="showFilter" class="filter-row">
        <el-form :inline="true" size="default">
          <el-form-item label="实名人">
            <el-select
              v-model="filter.wechatPerson"
              placeholder="全部"
              clearable
              filterable
              remote
              :remote-method="loadRealnameOptions"
              :loading="realnameLoading"
              style="width: 180px"
            >
              <el-option v-for="n in realnameOptions" :key="n" :label="n" :value="n" />
            </el-select>
          </el-form-item>
          <el-form-item label="企微状态">
            <el-select v-model="filter.wechatStatus" placeholder="全部" clearable style="width: 160px">
              <el-option
                v-for="item in wechatStatusOptions"
                :key="item.dictKey"
                :label="item.dictValue"
                :value="Number(item.dictKey)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="手机位置">
            <el-select v-model="filter.phoneLocation" placeholder="全部" clearable filterable style="width: 180px">
              <el-option v-for="loc in locationOptions" :key="loc" :label="loc" :value="loc" />
            </el-select>
          </el-form-item>
          <el-form-item label="手机类型">
            <el-select v-model="filter.phoneType" placeholder="全部" clearable style="width: 160px">
              <el-option
                v-for="item in phoneTypeOptions"
                :key="item.dictKey"
                :label="item.dictValue"
                :value="Number(item.dictKey)"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button plain @click="handleClearFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

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
            :class="{ 'clickable': group.accounts.length > 1 }"
            @click="toggleGroup(group.deviceCode)"
          >
            <div class="device-expand">
              <el-icon
                v-if="group.accounts.length > 1"
                class="expand-icon"
                :class="{ 'is-expanded': expandedSet.has(group.deviceCode) }"
              >
                <ArrowRight />
              </el-icon>
              <span class="device-idx">#{{ idx + 1 }}</span>
            </div>

            <div class="device-main">
              <div class="device-code-row">
                <span class="device-code-text">{{ group.deviceCode }}</span>
                <el-tag
                  v-if="group.accounts.length > 1"
                  type="warning"
                  size="small"
                  effect="light"
                  style="margin-left: 8px"
                >
                  {{ group.accounts.length }} 个账号
                </el-tag>
                <el-tag v-else size="small" effect="plain" style="margin-left: 8px">单账号</el-tag>
              </div>
              <div class="device-meta">
                <el-tag
                  v-if="getPhoneTypeLabel(group.phoneType)"
                  size="small"
                  effect="plain"
                  type="success"
                >
                  <el-icon style="margin-right: 3px"><Mobile /></el-icon>
                  {{ getPhoneTypeLabel(group.phoneType) }}
                </el-tag>
                <el-tag v-if="group.phoneLocation" size="small" effect="plain">
                  <el-icon style="margin-right: 3px"><Location /></el-icon>
                  {{ group.phoneLocation }}
                </el-tag>
                <el-tag
                  v-for="(name, ni) in getEntityNames(group.entityName).slice(0, 3)"
                  :key="ni"
                  size="small"
                  effect="plain"
                >
                  {{ name }}
                </el-tag>
                <span
                  v-if="getEntityNames(group.entityName).length > 3"
                  style="font-size: 12px; color: #909399"
                >
                  +{{ getEntityNames(group.entityName).length - 3 }}
                </span>
                <span v-if="getEntityNames(group.entityName).length === 0 && !group.phoneLocation && !getPhoneTypeLabel(group.phoneType)" style="font-size: 12px; color: #c0c4cc">—</span>
              </div>
            </div>

            <div class="device-status">
              <span v-if="group.active > 0" class="status-num status-active">
                <el-icon color="#67C23A"><CircleCheck /></el-icon>
                <span>{{ group.active }}</span>
              </span>
              <span v-if="group.inactive > 0" class="status-num status-inactive">
                <el-icon color="#909399"><Warning /></el-icon>
                <span>{{ group.inactive }}</span>
              </span>
            </div>

            <div class="device-update">
              <span style="color: #909399; font-size: 13px">{{ formatTime(group.latestUpdate) }}</span>
            </div>

            <div class="device-action" @click.stop>
              <el-button text type="primary" size="small" @click="handleAddOnDevice(group.deviceCode)">
                <el-icon><Plus /></el-icon>
                添加账号
              </el-button>
            </div>
          </div>

          <!-- 账号表格 -->
          <div
            v-if="expandedSet.has(group.deviceCode) || group.accounts.length === 1"
            class="device-accounts"
          >
            <el-table :data="group.accounts" size="default" border style="width: 100%">
              <el-table-column label="槽位" width="100" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="row.accountIndex === '主' ? 'danger' : 'primary'"
                    size="small"
                    effect="plain"
                  >
                    {{ row.accountIndex || '-' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="phoneNo" label="完整编号" width="140" />
              <el-table-column prop="wechatNickname" label="企微昵称" min-width="140" show-overflow-tooltip />
              <el-table-column label="主体简称" min-width="220">
                <template #default="{ row }">
                  <el-tag
                    v-for="(name, ni) in getEntityNames(row.entityName).slice(0, 3)"
                    :key="ni"
                    type="warning"
                    size="small"
                    effect="plain"
                    style="margin-right: 4px; margin-bottom: 2px"
                  >
                    {{ name }}
                  </el-tag>
                  <span
                    v-if="getEntityNames(row.entityName).length > 3"
                    style="font-size: 12px; color: #909399"
                  >
                    +{{ getEntityNames(row.entityName).length - 3 }}
                  </span>
                  <span v-if="getEntityNames(row.entityName).length === 0" style="color: #c0c4cc">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="wechatPerson" label="实名人" min-width="110" show-overflow-tooltip />
              <el-table-column prop="wechatPhone" label="企微手机号" min-width="130" />
              <el-table-column label="企微状态" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="getWechatStatusTag(row.wechatStatus)" size="small">
                    {{ dictLabel(wechatStatusOptions, row.wechatStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="使用状态" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="getUseStatusTag(row.useStatus)" size="small" effect="plain">
                    {{ dictLabel(useStatusOptions, row.useStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" width="180">
                <template #default="{ row }">{{ formatTime(row.updateTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right" align="center">
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
    <el-dialog v-model="detailVisible" title="账号详情" width="920px" destroy-on-close>
      <el-descriptions v-if="detailData" :column="2" border>
        <el-descriptions-item label="物理设备">{{ detailData.deviceCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账号槽位">
          <el-tag :type="detailData.accountIndex === '主' ? 'danger' : 'primary'" size="small" effect="plain">
            {{ detailData.accountIndex || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="完整编号">{{ detailData.phoneNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机类型">
          <el-tag type="success" size="small" effect="plain">
            {{ dictLabel(phoneTypeOptions, detailData.phoneType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机位置" :span="2">{{ detailData.phoneLocation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用状态">
          <el-tag :type="getUseStatusTag(detailData.useStatus)" size="small" effect="plain">
            {{ dictLabel(useStatusOptions, detailData.useStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用部门">
          <el-tag type="primary" size="small" effect="plain">
            {{ dictLabel(deptOptions, detailData.dept) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="主体简称" :span="2">
          <el-tag
            v-for="(name, idx) in getEntityNames(detailData.entityName)"
            :key="idx"
            type="warning"
            size="small"
            effect="plain"
            style="margin: 2px"
          >{{ name }}</el-tag>
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
      :title="formMode === 'add' ? '新增账号' : '编辑账号'"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="formData" label-width="110px" label-position="right">
        <el-divider content-position="left">设备信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编码" required>
              <el-input v-model="formData.deviceCode" placeholder="如 MT101" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号槽位" required>
              <el-select v-model="formData.accountIndex" placeholder="主 / 1 / 2 / 3..." style="width: 100%">
                <el-option label="主账号" value="主" />
                <el-option v-for="n in 10" :key="n" :label="`副账号 ${n}`" :value="String(n)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="完整编号">
              <el-input
                v-model="formData.phoneNo"
                :placeholder="formData.deviceCode + (formData.accountIndex === '主' ? '主' : (formData.accountIndex ? '-' + formData.accountIndex : ''))"
                maxlength="128"
              >
                <template #append>
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
          <el-col :span="24">
            <el-form-item label="手机位置">
              <el-input v-model="formData.phoneLocation" placeholder="如 A机房-1排001" maxlength="128" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">企微账号</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="对外昵称">
              <el-input v-model="formData.wechatNickname" placeholder="企微对外展示的昵称" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体简称">
              <el-select v-model="formData.entityNameList" multiple filterable placeholder="可多选" style="width: 100%">
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
              <el-select
                v-model="formData.wechatPerson"
                filterable
                remote
                :remote-method="loadRealnameOptions"
                placeholder="输入或选择实名人"
                style="width: 100%"
              >
                <el-option v-for="n in realnameOptions" :key="n" :label="n" :value="n" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微手机号">
              <el-select
                v-model="formData.wechatPhone"
                filterable
                remote
                :remote-method="loadPhoneOptions"
                placeholder="输入或选择手机号"
                style="width: 100%"
              >
                <el-option v-for="p in phoneNumberOptions" :key="p" :label="p" :value="p" />
              </el-select>
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
            <el-form-item label="微信实名人">
              <el-select
                v-model="formData.wxRealname"
                filterable
                remote
                :remote-method="loadRealnameOptions"
                placeholder="输入或选择实名人"
                style="width: 100%"
              >
                <el-option v-for="n in realnameOptions" :key="n" :label="n" :value="n" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信手机号">
              <el-select
                v-model="formData.wxPhone"
                filterable
                remote
                :remote-method="loadPhoneOptions"
                placeholder="输入或选择手机号"
                style="width: 100%"
              >
                <el-option v-for="p in phoneNumberOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
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
            <el-form-item label="微信密码">
              <el-input v-model="formData.wxPassword" show-password placeholder="账号登录密码" maxlength="128" />
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
  Iphone, Search, Plus, Filter, ArrowRight, Mobile, Location,
  CircleCheck, Warning, UserFilled, Files
} from '@element-plus/icons-vue'
import { getDictByType } from '@/api/dict'
import {
  getPhoneDeviceList, addPhoneDevice, updatePhoneDevice, deletePhoneDevice,
  getRealnameOptions, getPhoneNumberOptions
} from '@/api/phoneDevice'

// ===== 基础状态 =====
const loading = ref(false)
const searchKeyword = ref('')
const showFilter = ref(false)
const realnameLoading = ref(false)
const allRows = ref([])

const filter = reactive({
  wechatPerson: null,
  wechatStatus: null,
  phoneLocation: null,
  phoneType: null
})

const hasActiveFilter = computed(() => {
  return !!(filter.wechatPerson ||
    filter.wechatStatus !== null && filter.wechatStatus !== undefined && filter.wechatStatus !== '' ||
    filter.phoneLocation ||
    filter.phoneType !== null && filter.phoneType !== undefined && filter.phoneType !== '')
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
const phoneNumberOptions = ref([])

// ===== 展开状态 =====
const expandedSet = ref(new Set())

// ===== 详情弹窗 =====
const detailVisible = ref(false)
const detailData = ref(null)
const showPassword = ref(false)

// ===== 表单弹窗 =====
const formVisible = ref(false)
const formMode = ref('add')
const submitting = ref(false)
const formData = reactive({
  id: null,
  phoneNo: '',
  deviceCode: '',
  accountIndex: '主',
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

// ===== 辅助函数 =====
function dictLabel(list, value) {
  if (value === null || value === undefined || value === '') return '-'
  if (!list || list.length === 0) return String(value)
  const item = list.find(i => Number(i.dictKey) === Number(value) || String(i.dictKey) === String(value))
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

// 从 phoneNo 解析设备编码
function parseDeviceCode(phoneNo) {
  if (!phoneNo) return '未分类'
  const s = String(phoneNo).trim()
  const m1 = s.match(/^([A-Za-z]{2,}\d+)主$/)
  if (m1) return m1[1]
  const m2 = s.match(/^([A-Za-z]{2,}\d+)-(\d{1,2})$/)
  if (m2) return m2[1]
  return s
}

function parseAccountIdx(phoneNo) {
  if (!phoneNo) return '主'
  const s = String(phoneNo).trim()
  const m1 = s.match(/^[A-Za-z]{2,}\d+(主)$/)
  if (m1) return m1[1]
  const m2 = s.match(/^[A-Za-z]{2,}\d+-(\d{1,2})$/)
  if (m2) return m2[1]
  return '主'
}

// 账号槽位排序
function compareAccountIdx(a, b) {
  const na = (a == null || a === '') ? '主' : String(a)
  const nb = (b == null || b === '') ? '主' : String(b)
  if (na === '主' && nb !== '主') return -1
  if (na !== '主' && nb === '主') return 1
  const ia = /^\d+$/.test(na) ? parseInt(na, 10) : 9999
  const ib = /^\d+$/.test(nb) ? parseInt(nb, 10) : 9999
  if (ia !== ib) return ia - ib
  return na.localeCompare(nb)
}

// ===== 计算属性：过滤后的数据 + 分组 =====
const filteredRows = computed(() => {
  const kw = searchKeyword.value && searchKeyword.value.trim() ? searchKeyword.value.trim().toLowerCase() : ''
  return allRows.value.filter(row => {
    if (kw) {
      const hay = [
        row.deviceCode, row.phoneNo, row.wechatNickname, row.wechatPerson,
        row.phoneLocation, row.wxRealname, row.wxPhone
      ].filter(v => v).map(v => String(v).toLowerCase()).join(' ')
      if (!hay.includes(kw)) return false
    }
    if (filter.wechatPerson && row.wechatPerson !== filter.wechatPerson) return false
    if (filter.wechatStatus !== null && filter.wechatStatus !== undefined && filter.wechatStatus !== '') {
      if (Number(row.wechatStatus) !== Number(filter.wechatStatus)) return false
    }
    if (filter.phoneLocation && row.phoneLocation !== filter.phoneLocation) return false
    if (filter.phoneType !== null && filter.phoneType !== undefined && filter.phoneType !== '') {
      if (Number(row.phoneType) !== Number(filter.phoneType)) return false
    }
    return true
  })
})

const deviceGroups = computed(() => {
  const groups = new Map()
  for (const row of filteredRows.value) {
    const code = row.deviceCode || parseDeviceCode(row.phoneNo)
    const idx = row.accountIndex || parseAccountIdx(row.phoneNo)
    const normRow = { ...row, deviceCode: code, accountIndex: idx }

    if (!groups.has(code)) {
      groups.set(code, {
        deviceCode: code,
        accounts: [],
        phoneType: null,
        phoneLocation: '',
        entityName: '',
        latestUpdate: null,
        active: 0,
        inactive: 0
      })
    }
    const g = groups.get(code)
    g.accounts.push(normRow)
    if (!g.phoneType && normRow.phoneType != null) g.phoneType = normRow.phoneType
    if (!g.phoneLocation && normRow.phoneLocation) g.phoneLocation = normRow.phoneLocation
    if (!g.entityName && normRow.entityName) g.entityName = normRow.entityName
    if (normRow.updateTime) {
      const t = new Date(normRow.updateTime).getTime()
      if (!isNaN(t)) {
        if (!g.latestUpdate || t > new Date(g.latestUpdate).getTime()) {
          g.latestUpdate = normRow.updateTime
        }
      }
    }
  }
  const result = [...groups.values()]
  for (const g of result) {
    g.accounts.sort((a, b) => compareAccountIdx(a.accountIndex, b.accountIndex))
    g.active = g.accounts.filter(a => Number(a.useStatus) === 1).length
    g.inactive = g.accounts.length - g.active
  }
  // 多账号设备靠前，然后按设备编码排序
  result.sort((a, b) => {
    if (a.accounts.length !== b.accounts.length) return b.accounts.length - a.accounts.length
    return (a.deviceCode || '').localeCompare(b.deviceCode || '')
  })
  return result
})

const deviceCount = computed(() => deviceGroups.value.length)
const accountCount = computed(() => filteredRows.value.length)
const multiCount = computed(() => deviceGroups.value.filter(g => g.accounts.length > 1).length)
const activeCount = computed(() => {
  return deviceGroups.value.reduce((sum, g) => sum + g.active, 0)
})

// 位置选项（从数据中提取）
const locationOptions = computed(() => {
  const set = new Set()
  for (const r of allRows.value) {
    if (r.phoneLocation) set.add(r.phoneLocation)
  }
  return [...set]
})

// ===== 交互函数 =====
function toggleGroup(code) {
  const set = new Set(expandedSet.value)
  if (set.has(code)) {
    set.delete(code)
  } else {
    set.add(code)
  }
  expandedSet.value = set
}

function handleSearch() {
  // 搜索是客户端过滤，不需要重新加载
}

function handleClearFilter() {
  filter.wechatPerson = null
  filter.wechatStatus = null
  filter.phoneLocation = null
  filter.phoneType = null
}

async function loadData() {
  loading.value = true
  try {
    const data = await getPhoneDeviceList({ page: 1, size: 500 })
    const rows = (data && data.list) || (data && data.records) || (Array.isArray(data) ? data : [])
    allRows.value = rows
    // 自动展开第一个多账号设备
    if (expandedSet.value.size === 0) {
      const firstMulti = deviceGroups.value.find(g => g.accounts.length > 1)
      if (firstMulti) {
        const set = new Set(expandedSet.value)
        set.add(firstMulti.deviceCode)
        expandedSet.value = set
      }
    }
  } catch (e) {
    console.error('加载设备数据失败', e)
    allRows.value = []
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

async function loadRealnameOptions(query) {
  realnameLoading.value = true
  try {
    const data = await getRealnameOptions()
    const all = Array.isArray(data) ? data : []
    if (query) {
      realnameOptions.value = all.filter(n => n && String(n).toLowerCase().includes(String(query).toLowerCase()))
    } else {
      realnameOptions.value = all
    }
  } catch (e) {
    realnameOptions.value = []
  } finally {
    realnameLoading.value = false
  }
}

async function loadPhoneOptions(query) {
  try {
    const data = await getPhoneNumberOptions()
    const all = Array.isArray(data) ? data : []
    if (query) {
      phoneNumberOptions.value = all.filter(p => p && String(p).includes(String(query)))
    } else {
      phoneNumberOptions.value = all
    }
  } catch (e) {
    phoneNumberOptions.value = []
  }
}

// ===== 新增 / 编辑 =====
function resetForm() {
  formData.id = null
  formData.phoneNo = ''
  formData.deviceCode = ''
  formData.accountIndex = '主'
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

function handleAdd() {
  resetForm()
  formMode.value = 'add'
  formVisible.value = true
}

function handleAddOnDevice(deviceCode) {
  resetForm()
  formMode.value = 'add'
  formData.deviceCode = deviceCode
  formData.accountIndex = '主'
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
  formData.id = row.id
  formData.phoneNo = row.phoneNo || ''
  formData.deviceCode = row.deviceCode || parseDeviceCode(row.phoneNo)
  formData.accountIndex = row.accountIndex || parseAccountIdx(row.phoneNo)
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

function autoGeneratePhoneNo() {
  if (!formData.deviceCode) {
    ElMessage.warning('请先填写设备编码')
    return
  }
  if (formData.accountIndex === '主') {
    formData.phoneNo = formData.deviceCode + '主'
  } else if (formData.accountIndex && /^\d+$/.test(String(formData.accountIndex))) {
    formData.phoneNo = formData.deviceCode + '-' + formData.accountIndex
  } else {
    formData.phoneNo = formData.deviceCode
  }
}

async function handleSubmit() {
  if (!formData.deviceCode) {
    ElMessage.warning('设备编码不能为空')
    return
  }
  if (!formData.accountIndex) {
    ElMessage.warning('账号槽位不能为空')
    return
  }
  if (!formData.phoneNo) {
    autoGeneratePhoneNo()
  }
  submitting.value = true
  try {
    const entityName = formData.entityNameList.length > 0 ? formData.entityNameList.join(',') : ''
    const payload = {
      phoneNo: formData.phoneNo.trim(),
      deviceCode: formData.deviceCode.trim(),
      accountIndex: formData.accountIndex,
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
    if (formMode.value === 'add') {
      await addPhoneDevice(payload)
      ElMessage.success('新增成功')
    } else {
      await updatePhoneDevice(formData.id, payload)
      ElMessage.success('编辑成功')
    }
    formVisible.value = false
    loadData()
  } catch (e) {
    console.error('提交失败', e)
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除账号「${row.phoneNo}」吗？删除后不可恢复。`,
      '提示',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
    await deletePhoneDevice(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (e) {
    // 用户取消
  }
}

// ===== 初始化 =====
onMounted(async () => {
  await loadDicts()
  loadData()
})
</script>

<style scoped>
.home-page {
  padding: 16px;
  background: #f5f7fa;
  min-height: calc(100vh - 32px);
}
.stat-row {
  margin-bottom: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 8px;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  margin-right: 14px;
}
.stat-icon.primary { background: linear-gradient(135deg, #409EFF, #2E85FF); }
.stat-icon.success { background: linear-gradient(135deg, #67C23A, #4D9F27); }
.stat-icon.warning { background: linear-gradient(135deg, #E6A23C, #D18A1E); }
.stat-icon.info { background: linear-gradient(135deg, #909399, #6A6A6A); }
.stat-num { font-size: 26px; font-weight: 600; color: #303133; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; margin-top: 3px; }

.action-card {
  margin-bottom: 16px;
  border-radius: 8px;
}
.action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.filter-row {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #e4e7ed;
}

.empty-block {
  padding: 60px 0;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.device-group {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}
.device-group.is-expanded {
  border-color: #409EFF;
}

.device-header {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  gap: 16px;
}
.device-header.clickable {
  cursor: pointer;
  background: #fafafa;
}
.device-header.clickable:hover {
  background: #f0f5ff;
}

.device-expand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 60px;
}
.expand-icon {
  color: #909399;
  transition: transform 0.25s;
  font-size: 14px;
}
.expand-icon.is-expanded {
  transform: rotate(90deg);
  color: #409EFF;
}
.device-idx {
  color: #c0c4cc;
  font-size: 13px;
}

.device-main {
  flex: 1;
  min-width: 0;
}
.device-code-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}
.device-code-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.5px;
}
.device-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.device-status {
  display: flex;
  gap: 14px;
  min-width: 100px;
  justify-content: flex-end;
}
.status-num {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #606266;
}

.device-update {
  min-width: 180px;
  text-align: right;
}

.device-action {
  min-width: 110px;
  text-align: right;
}

.device-accounts {
  border-top: 1px solid #ebeef5;
  background: #fff;
}
</style>
