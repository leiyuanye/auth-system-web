<template>
  <div class="home-page">
    <!-- 顶部统计 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon primary"><el-icon><Iphone /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.devices }}</div>
            <div class="stat-label">设备总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon success"><el-icon><UserFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.accounts }}</div>
            <div class="stat-label">账号总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon warning"><el-icon><Files /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.multiAccount }}</div>
            <div class="stat-label">多账号设备</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon info"><el-icon><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <div class="stat-num">{{ stats.activeAccounts }}</div>
            <div class="stat-label">在用账号</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选 + 操作 -->
    <el-card class="filter-card">
      <div class="filter-top">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索：设备编码 / 昵称 / 位置 / 实名人"
          style="width: 320px"
          clearable
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="showFilters = !showFilters">
          <el-icon><Filter /></el-icon>
          高级筛选
          <el-badge v-if="hasActiveFilters" is-dot class="filter-badge" />
        </el-button>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span style="margin-left: 4px">新增账号</span>
        </el-button>
      </div>

      <div v-if="showFilters" class="filter-panel">
        <el-form :inline="true" :model="filters" size="default">
          <el-form-item label="实名人">
            <el-select
              v-model="filters.wechatPerson"
              placeholder="全部"
              clearable
              filterable
              remote
              :remote-method="searchRealname"
              :loading="realnameLoading"
              style="width: 180px"
            >
              <el-option v-for="name in realnameOptions" :key="name" :label="name" :value="name" />
            </el-select>
          </el-form-item>
          <el-form-item label="企微状态">
            <el-select v-model="filters.wechatStatus" placeholder="全部" clearable style="width: 160px">
              <el-option
                v-for="item in wechatStatusOptions"
                :key="item.dictKey"
                :label="item.dictValue"
                :value="Number(item.dictKey)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="手机位置">
            <el-select v-model="filters.phoneLocation" placeholder="全部" clearable filterable style="width: 180px">
              <el-option v-for="loc in locationOptions" :key="loc" :label="loc" :value="loc" />
            </el-select>
          </el-form-item>
          <el-form-item label="手机类型">
            <el-select v-model="filters.phoneType" placeholder="全部" clearable style="width: 160px">
              <el-option
                v-for="item in phoneTypeOptions"
                :key="item.dictKey"
                :label="item.dictValue"
                :value="Number(item.dictKey)"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button plain @click="clearFilters">重置筛选</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 设备列表：按设备编码分组，展开显示账号 -->
    <el-card class="device-card" shadow="never">
      <el-empty v-if="!loading && deviceGroups.length === 0" description="暂无设备数据" />
      <div v-else class="device-list">
        <div
          v-for="(group, idx) in deviceGroups"
          :key="group.deviceCode"
          class="device-group"
          :class="{ 'device-group-expanded': expandedSet.has(group.deviceCode) }"
        >
          <!-- 设备头部 -->
          <div
            class="device-header"
            :class="{ 'has-multi': group.accounts.length > 1 }"
            @click="toggleGroup(group.deviceCode)"
          >
            <div class="device-expand">
              <el-icon
                class="expand-icon"
                :class="{ 'is-expanded': expandedSet.has(group.deviceCode) }"
                v-if="group.accounts.length > 1"
              >
                <ArrowRight />
              </el-icon>
              <span class="device-idx">#{{ idx + 1 }}</span>
            </div>

            <div class="device-main">
              <div class="device-code">
                <span class="code-text">{{ group.deviceCode }}</span>
                <el-tag
                  v-if="group.accounts.length > 1"
                  type="warning"
                  size="small"
                  effect="light"
                  class="multi-tag"
                >
                  {{ group.accounts.length }} 个账号
                </el-tag>
                <el-tag
                  v-else
                  type="info"
                  size="small"
                  effect="plain"
                  class="multi-tag"
                >
                  单账号
                </el-tag>
              </div>
              <div class="device-meta">
                <el-tag size="small" effect="plain" class="meta-tag" v-if="dictLabel(phoneTypeOptions, group.phoneType)">
                  <el-icon style="margin-right: 3px"><Mobile /></el-icon>
                  {{ dictLabel(phoneTypeOptions, group.phoneType) }}
                </el-tag>
                <el-tag size="small" effect="plain" class="meta-tag" v-if="group.phoneLocation">
                  <el-icon style="margin-right: 3px"><Location /></el-icon>
                  {{ group.phoneLocation }}
                </el-tag>
                <el-tag
                  v-for="(name, ni) in parseMulti(group.entityName).slice(0, 3)"
                  :key="ni"
                  size="small"
                  type="success"
                  effect="plain"
                  class="meta-tag"
                >
                  {{ name }}
                </el-tag>
                <span v-if="parseMulti(group.entityName).length === 0" class="meta-tag-dash">—</span>
              </div>
            </div>

            <div class="device-status">
              <span class="status-sum" v-if="group.activeCount > 0">
                <el-icon color="#67C23A"><CircleCheck /></el-icon>
                <span>{{ group.activeCount }}</span>
              </span>
              <span class="status-sum" v-if="group.inactiveCount > 0">
                <el-icon color="#909399"><Warning /></el-icon>
                <span>{{ group.inactiveCount }}</span>
              </span>
            </div>

            <div class="device-update">
              <span class="update-text">{{ formatDateTime(group.latestUpdate) }}</span>
            </div>

            <div class="device-actions" @click.stop>
              <el-button text type="primary" size="small" @click="handleAddToDevice(group.deviceCode)">
                <el-icon><Plus /></el-icon> 添加账号
              </el-button>
            </div>
          </div>

          <!-- 账号表格（展开才渲染） -->
          <div v-if="expandedSet.has(group.deviceCode) || group.accounts.length === 1" class="device-accounts">
            <el-table :data="group.accounts" style="width: 100%" size="default" :border="group.accounts.length > 1">
              <el-table-column label="槽位" width="90" align="center">
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
              <el-table-column prop="phoneNo" label="完整编号" width="130" show-overflow-tooltip />
              <el-table-column prop="wechatNickname" label="企微昵称" min-width="150" show-overflow-tooltip />
              <el-table-column label="主体简称" min-width="200">
                <template #default="{ row }">
                  <el-tag
                    v-for="(name, ni) in parseMulti(row.entityName).slice(0, 3)"
                    :key="ni"
                    type="warning"
                    size="small"
                    effect="plain"
                    style="margin-right: 4px; margin-bottom: 2px"
                  >
                    {{ name }}
                  </el-tag>
                  <span v-if="parseMulti(row.entityName).length > 3" style="font-size: 12px; color: #909399">
                    +{{ parseMulti(row.entityName).length - 3 }}
                  </span>
                  <span v-if="parseMulti(row.entityName).length === 0">—</span>
                </template>
              </el-table-column>
              <el-table-column prop="wechatPerson" label="实名人" min-width="100" show-overflow-tooltip />
              <el-table-column prop="wechatPhone" label="企微手机号" min-width="130" />
              <el-table-column label="企微状态" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="wechatStatusTagType(row.wechatStatus)" size="small">
                    {{ dictLabel(wechatStatusOptions, row.wechatStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="使用状态" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="useStatusTagType(row.useStatus)" size="small" effect="plain">
                    {{ dictLabel(useStatusOptions, row.useStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" width="175">
                <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handleView(row)">查看详情</el-button>
                  <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
                  <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-block">
        <el-icon :size="24" class="is-loading"><Loading /></el-icon>
        <span style="margin-left: 8px; color: #909399">加载中...</span>
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detail.visible" title="账号详情" width="900px" destroy-on-close>
      <el-descriptions v-if="detail.data" :column="2" border>
        <el-descriptions-item label="物理设备">{{ detail.data.deviceCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账号槽位">
          <el-tag :type="detail.data.accountIndex === '主' ? 'danger' : 'primary'" size="small" effect="plain">
            {{ detail.data.accountIndex || '-' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="完整编号">{{ detail.data.phoneNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机类型">
          <el-tag type="success" size="small" effect="plain">
            {{ dictLabel(phoneTypeOptions, detail.data.phoneType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="手机位置" :span="2">{{ detail.data.phoneLocation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用状态">
          <el-tag :type="useStatusTagType(detail.data.useStatus)" size="small" effect="plain">
            {{ dictLabel(useStatusOptions, detail.data.useStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用部门">
          <el-tag type="primary" size="small" effect="plain">
            {{ dictLabel(deptOptions, detail.data.dept) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="主体简称" :span="2">
          <el-tag
            v-for="(name, idx) in parseMulti(detail.data.entityName)"
            :key="idx"
            type="warning"
            size="small"
            effect="plain"
            style="margin: 2px"
          >{{ name }}</el-tag>
          <span v-if="parseMulti(detail.data.entityName).length === 0">—</span>
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
          <span style="letter-spacing: 1px">{{ detail.showPassword ? (detail.data.wxPassword || '') : maskText(detail.data.wxPassword) }}</span>
          <el-button link type="primary" size="small" style="margin-left: 10px" @click="detail.showPassword = !detail.showPassword">
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

    <!-- 新增 / 编辑 弹窗 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.mode === 'add' ? '新增账号' : '编辑账号'"
      width="900px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="form" ref="formRef" label-width="110px" label-position="right">
        <el-divider content-position="left">设备信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编码" required>
              <el-input v-model="form.deviceCode" placeholder="如 MT101 或 P2024-001" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号槽位" required>
              <el-select v-model="form.accountIndex" placeholder="主 / 1 / 2 / 3..." style="width: 100%">
                <el-option label="主账号" value="主" />
                <el-option v-for="n in 10" :key="n" :label="`副账号 ${n}`" :value="String(n)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="完整编号">
              <el-input v-model="form.phoneNo" :placeholder="form.deviceCode + (form.accountIndex === '主' ? '主' : (form.accountIndex ? '-' + form.accountIndex : ''))" maxlength="128">
                <template #append>
                  <el-button @click="buildPhoneNo">自动生成</el-button>
                </template>
              </el-input>
              <div style="font-size: 12px; color: #909399; margin-top: 4px">
                规则：设备编码 MT101 + 槽位"主" → MT101主；设备编码 MT101 + 槽位"1" → MT101-1
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机类型" required>
              <el-select v-model="form.phoneType" placeholder="请选择" style="width: 100%">
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
              <el-select v-model="form.useStatus" placeholder="请选择" style="width: 100%">
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
              <el-select v-model="form.dept" placeholder="请选择" style="width: 100%">
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
              <el-input v-model="form.phoneLocation" placeholder="如 A机房-1排001" maxlength="128" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">企微账号</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="对外昵称">
              <el-input v-model="form.wechatNickname" placeholder="企微对外展示的昵称" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体简称">
              <el-select v-model="form.entityNameList" multiple filterable placeholder="可多选" style="width: 100%">
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
              <el-select v-model="form.wechatPerson" filterable remote :remote-method="searchRealname" placeholder="输入或选择实名人" style="width: 100%">
                <el-option v-for="name in realnameOptions" :key="name" :label="name" :value="name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微手机号">
              <el-select v-model="form.wechatPhone" filterable remote :remote-method="searchPhone" placeholder="输入或选择手机号" style="width: 100%">
                <el-option v-for="p in phoneNumberOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微状态" required>
              <el-select v-model="form.wechatStatus" placeholder="请选择" style="width: 100%">
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
              <el-select v-model="form.wechatUsage" placeholder="请选择" style="width: 100%">
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
              <el-select v-model="form.wxRealname" filterable remote :remote-method="searchRealname" placeholder="输入或选择实名人" style="width: 100%">
                <el-option v-for="name in realnameOptions" :key="name" :label="name" :value="name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信手机号">
              <el-select v-model="form.wxPhone" filterable remote :remote-method="searchPhone" placeholder="输入或选择手机号" style="width: 100%">
                <el-option v-for="p in phoneNumberOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信状态" required>
              <el-select v-model="form.wxStatus" placeholder="请选择" style="width: 100%">
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
              <el-select v-model="form.wxUsage" placeholder="请选择" style="width: 100%">
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
              <el-input v-model="form.wxPassword" show-password placeholder="账号登录密码" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" maxlength="512" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.submitting" @click="handleSubmit">
          {{ dialog.mode === 'add' ? '新增' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Iphone, Search, Plus, Filter, ArrowRight, Mobile, Location,
  CircleCheck, Warning, Loading, UserFilled, Files
} from '@element-plus/icons-vue'
import { getDictByType } from '@/api/dict'
import {
  getPhoneDeviceList, addPhoneDevice, updatePhoneDevice, deletePhoneDevice,
  getRealnameOptions, getPhoneNumberOptions
} from '@/api/phoneDevice'

// ---------- 基础状态 ----------
const loading = ref(false)
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
  return filters.wechatPerson || filters.wechatStatus != null ||
         filters.phoneLocation || filters.phoneType != null
})

// ---------- 字典数据 ----------
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

// ---------- 原始行 + 分组 ----------
const rawRows = ref([])
const expandedSet = ref(new Set())

// 按 deviceCode 分组后的结构（用于渲染）
const deviceGroups = computed(() => {
  const map = new Map()
  for (const row of rawRows.value) {
    // 兼容旧数据：如果后端没有 device_code，前端从 phoneNo 解析
    const code = row.deviceCode || parseDeviceCodeFromPhoneNo(row.phoneNo)
    const idx = row.accountIndex || parseAccountIndexFromPhoneNo(row.phoneNo)
    const normRow = { ...row, deviceCode: code, accountIndex: idx }

    if (!map.has(code)) {
      map.set(code, {
        deviceCode: code,
        accounts: [],
        phoneType: null,
        phoneLocation: '',
        entityName: '',
        latestUpdate: null,
        activeCount: 0,
        inactiveCount: 0
      })
    }
    const g = map.get(code)
    g.accounts.push(normRow)
    // 取第一账号的手机类型作为整组类型
    if (!g.phoneType && normRow.phoneType != null) g.phoneType = normRow.phoneType
    // 取第一账号非空位置 / 主体
    if (!g.phoneLocation && normRow.phoneLocation) g.phoneLocation = normRow.phoneLocation
    if (!g.entityName && normRow.entityName) g.entityName = normRow.entityName
    if (normRow.updateTime) {
      const t = new Date(normRow.updateTime).getTime()
      if (!g.latestUpdate || t > g.latestUpdate) g.latestUpdate = normRow.updateTime
    }
  }

  // 对每组内部按 accountIndex 排序（主 -> 1 -> 2 -> ...）
  const result = [...map.values()]
  for (const g of result) {
    g.accounts.sort((a, b) => compareAccountIndex(a.accountIndex, b.accountIndex))
    g.activeCount = g.accounts.filter(a => [1, '1'].includes(a.useStatus) || Number(a.useStatus) === 1).length
    g.inactiveCount = g.accounts.length - g.activeCount
  }
  // 整体按设备编码排序（字母顺序），并让多账号设备靠前
  result.sort((a, b) => {
    if (a.accounts.length !== b.accounts.length) return b.accounts.length - a.accounts.length
    return (a.deviceCode || '').localeCompare(b.deviceCode || '')
  })
  return result
})

// 位置筛选选项（取自当前数据）
const locationOptions = computed(() => {
  const set = new Set()
  for (const r of rawRows.value) {
    if (r.phoneLocation) set.add(r.phoneLocation)
  }
  return [...set]
})

// 统计数据
const stats = computed(() => {
  const groups = deviceGroups.value
  let accounts = 0
  let multi = 0
  let active = 0
  for (const g of groups) {
    accounts += g.accounts.length
    if (g.accounts.length > 1) multi++
    for (const a of g.accounts) {
      const s = Number(a.wechatStatus)
      if (s === 1 || s === 0) active++
    }
  }
  return {
    devices: groups.length,
    accounts,
    multiAccount: multi,
    activeAccounts: active
  }
})

// ---------- 弹窗状态 ----------
const detail = reactive({ visible: false, data: null, showPassword: false })
const dialog = reactive({ visible: false, mode: 'add', submitting: false })
const formRef = ref(null)

const form = reactive({
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

function resetForm() {
  form.id = null
  form.phoneNo = ''
  form.deviceCode = ''
  form.accountIndex = '主'
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

// ---------- 工具函数 ----------
function dictLabel(list, value) {
  if (value === null || value === undefined || value === '') return '-'
  if (!list || list.length === 0) return String(value)
  const item = list.find(i => Number(i.dictKey) === Number(value) || String(i.dictKey) === String(value))
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

// 从 phoneNo 解析设备编码（前端兜底逻辑）
function parseDeviceCodeFromPhoneNo(phoneNo) {
  if (!phoneNo) return ''
  const s = String(phoneNo).trim()
  // 规则1: XX数字主
  const m1 = s.match(/^([A-Za-z]{2,}\d+)主$/)
  if (m1) return m1[1]
  // 规则2: XX数字-1位或2位数字
  const m2 = s.match(/^([A-Za-z]{2,}\d+)-(\d{1,2})$/)
  if (m2) return m2[1]
  return s
}

function parseAccountIndexFromPhoneNo(phoneNo) {
  if (!phoneNo) return '主'
  const s = String(phoneNo).trim()
  const m1 = s.match(/^[A-Za-z]{2,}\d+(主)$/)
  if (m1) return m1[1]
  const m2 = s.match(/^[A-Za-z]{2,}\d+-(\d{1,2})$/)
  if (m2) return m2[1]
  return '主'
}

// 账号槽位排序：主 < 1 < 2 < 3 ... < 10 < ...
function compareAccountIndex(a, b) {
  const na = (a == null || a === '') ? '主' : String(a)
  const nb = (b == null || b === '') ? '主' : String(b)
  const isMainA = na === '主'
  const isMainB = nb === '主'
  if (isMainA && isMainB) return 0
  if (isMainA) return -1
  if (isMainB) return 1
  const ia = /^\d+$/.test(na) ? parseInt(na, 10) : 9999
  const ib = /^\d+$/.test(nb) ? parseInt(nb, 10) : 9999
  if (ia !== ib) return ia - ib
  return na.localeCompare(nb)
}

// ---------- 交互逻辑 ----------
function toggleGroup(code) {
  const set = new Set(expandedSet.value)
  if (set.has(code)) set.delete(code)
  else set.add(code)
  expandedSet.value = set
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
    const params = { page: 1, size: 500 }
    if (searchKeyword.value && searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    if (filters.wechatPerson) params.wechatPerson = filters.wechatPerson
    if (filters.wechatStatus != null) params.wechatStatus = filters.wechatStatus
    if (filters.phoneLocation) params.phoneLocation = filters.phoneLocation
    if (filters.phoneType != null) params.phoneType = filters.phoneType

    const res = await getPhoneDeviceList(params)
    const rows = (res && res.list) || (res && res.records) || (Array.isArray(res) ? res : [])
    rawRows.value = rows

    // 首次加载时，自动展开第一个多账号设备
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
    ElMessage.error('加载设备数据失败')
    rawRows.value = []
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
  if (!query) { realnameOptions.value = []; return }
  realnameLoading.value = true
  try {
    const res = await getRealnameOptions()
    const all = Array.isArray(res) ? res : []
    realnameOptions.value = all.filter(n => n && String(n).toLowerCase().includes(String(query).toLowerCase()))
  } catch (e) {
    realnameOptions.value = []
  } finally {
    realnameLoading.value = false
  }
}

async function searchPhone(query) {
  if (!query) { phoneNumberOptions.value = []; return }
  try {
    const res = await getPhoneNumberOptions()
    const all = Array.isArray(res) ? res : []
    phoneNumberOptions.value = all.filter(p => p && String(p).includes(String(query)))
  } catch (e) {
    phoneNumberOptions.value = []
  }
}

// --- 查看 / 编辑 / 删除 / 新增 ---
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

// 在指定设备下新增一个账号（自动带设备编码）
function handleAddToDevice(deviceCode) {
  resetForm()
  dialog.mode = 'add'
  form.deviceCode = deviceCode
  form.accountIndex = '主'
  dialog.visible = true
}

function handleEdit(row) {
  resetForm()
  dialog.mode = 'edit'
  form.id = row.id
  form.phoneNo = row.phoneNo || ''
  form.deviceCode = row.deviceCode || parseDeviceCodeFromPhoneNo(row.phoneNo)
  form.accountIndex = row.accountIndex || parseAccountIndexFromPhoneNo(row.phoneNo)
  form.wechatNickname = row.wechatNickname || ''
  form.entityNameList = parseMulti(row.entityName)
  form.wechatPerson = row.wechatPerson || ''
  form.wechatPhone = row.wechatPhone || ''
  form.phoneLocation = row.phoneLocation || ''
  form.wechatStatus = row.wechatStatus != null ? Number(row.wechatStatus) : 1
  form.useStatus = row.useStatus != null ? Number(row.useStatus) : 1
  form.dept = row.dept != null ? Number(row.dept) : 1
  form.wechatUsage = row.wechatUsage != null ? Number(row.wechatUsage) : 1
  form.wxStatus = row.wxStatus != null ? Number(row.wxStatus) : 1
  form.wxUsage = row.wxUsage != null ? Number(row.wxUsage) : 1
  form.phoneType = row.phoneType != null ? Number(row.phoneType) : 1
  form.wxRealname = row.wxRealname || ''
  form.wxPhone = row.wxPhone || ''
  form.wxPassword = row.wxPassword || ''
  form.remark = row.remark || ''
  dialog.visible = true
}

// 根据设备编码和账号槽位，自动生成完整 phoneNo
function buildPhoneNo() {
  if (!form.deviceCode) {
    ElMessage.warning('请先填写设备编码')
    return
  }
  const idx = form.accountIndex
  if (idx === '主') {
    form.phoneNo = form.deviceCode + '主'
  } else if (idx && /^\d{1,2}$/.test(String(idx))) {
    form.phoneNo = form.deviceCode + '-' + idx
  } else {
    form.phoneNo = form.deviceCode
  }
}

async function handleSubmit() {
  // 校验必填
  if (!form.deviceCode) { ElMessage.warning('设备编码不能为空'); return }
  if (!form.accountIndex) { ElMessage.warning('账号槽位不能为空'); return }
  // 如果用户没填 phoneNo，自动生成
  if (!form.phoneNo) {
    if (form.accountIndex === '主') form.phoneNo = form.deviceCode + '主'
    else form.phoneNo = form.deviceCode + '-' + form.accountIndex
  }
  dialog.submitting = true
  try {
    const entityName = (form.entityNameList && form.entityNameList.length > 0)
      ? form.entityNameList.join(',') : ''
    const payload = {
      phoneNo: form.phoneNo.trim(),
      deviceCode: form.deviceCode.trim(),
      accountIndex: form.accountIndex,
      wechatNickname: form.wechatNickname ? form.wechatNickname.trim() : '',
      entityName: entityName,
      wechatPerson: form.wechatPerson || '',
      wechatPhone: form.wechatPhone || '',
      phoneLocation: form.phoneLocation ? form.phoneLocation.trim() : '',
      wechatStatus: form.wechatStatus != null ? Number(form.wechatStatus) : 1,
      useStatus: form.useStatus != null ? Number(form.useStatus) : 1,
      dept: form.dept != null ? Number(form.dept) : 1,
      wechatUsage: form.wechatUsage != null ? Number(form.wechatUsage) : 1,
      wxStatus: form.wxStatus != null ? Number(form.wxStatus) : 1,
      wxUsage: form.wxUsage != null ? Number(form.wxUsage) : 1,
      phoneType: form.phoneType != null ? Number(form.phoneType) : 1,
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
    await ElMessageBox.confirm(
      '确定删除账号「' + row.phoneNo + '」吗？删除后不可恢复。',
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

onMounted(async () => {
  await loadDicts()
  loadData()
})
</script>

<style scoped>
.home-page {
  padding: 16px;
  background: #f5f7fa;
  min-height: 100vh;
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

.filter-card {
  margin-bottom: 16px;
  border-radius: 8px;
}
.filter-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.filter-panel {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed #e4e7ed;
}
.filter-badge { position: relative; top: -4px; right: -4px; }

.device-card {
  border-radius: 8px;
  background: #fff;
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
  transition: box-shadow 0.2s;
}
.device-group:hover {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
}
.device-group-expanded {
  border-color: #409EFF;
}

.device-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: #fafafa;
  gap: 16px;
  cursor: pointer;
  transition: background 0.15s;
}
.device-header:hover {
  background: #f0f5ff;
}
.device-group-expanded .device-header,
.device-header.has-multi {
  background: linear-gradient(90deg, #ecf5ff 0%, #fafafa 100%);
}

.device-expand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 70px;
}
.expand-icon {
  font-size: 14px;
  color: #909399;
  transition: transform 0.25s;
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
.device-code {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.code-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  letter-spacing: 0.5px;
}
.multi-tag {
  font-weight: 500;
}
.device-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.meta-tag {
  display: inline-flex;
  align-items: center;
}
.meta-tag-dash {
  color: #c0c4cc;
  font-size: 13px;
}

.device-status {
  display: flex;
  gap: 14px;
  min-width: 100px;
  justify-content: flex-end;
}
.status-sum {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 14px;
}

.device-update {
  min-width: 175px;
  text-align: right;
}
.update-text {
  color: #909399;
  font-size: 13px;
}

.device-actions {
  min-width: 110px;
  text-align: right;
}

.device-accounts {
  border-top: 1px solid #ebeef5;
  padding: 0;
  background: #fff;
}

.loading-block {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
</style>
