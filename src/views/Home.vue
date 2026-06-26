<template>
  <div class="home-page">
    <!-- 顶部：统计卡片 + 搜索/筛选/新增按钮（同一行，统计靠左，控制靠右） -->
    <div class="top-bar">
      <div class="stat-group">
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
          <span class="stat-label">多开设备</span>
        </div>
        <div class="stat-card">
          <el-icon :size="16" color="#909399"><CircleCheck /></el-icon>
          <span class="stat-num">{{ activeCount }}</span>
          <span class="stat-label">在用</span>
        </div>
      </div>
      <div class="control-group">
        <el-input
            v-model="searchKeyword"
            placeholder="搜索：设备编码 / 昵称 / 位置 / 实名人"
            size="small"
            style="width: 240px"
            clearable
            :prefix-icon="Search"
        />
        <el-button size="small" type="primary" @click="showFilter = !showFilter">
          <el-icon><Filter /></el-icon>
          <span style="margin-left: 4px">筛选</span>
          <el-badge v-if="hasActiveFilter" is-dot style="margin-left: 4px" />
        </el-button>
        <el-dropdown trigger="click" style="margin-right: 8px;">
          <el-button size="small" plain>
            <el-icon><Download /></el-icon>
            <span style="margin-left: 4px">导入导出</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleDownloadTemplate">
                <el-icon><Document /></el-icon>下载模板
              </el-dropdown-item>
              <el-dropdown-item divided>
                <el-upload
                    ref="importUploadRef"
                    action="#"
                    :auto-upload="false"
                    :show-file-list="false"
                    accept=".xlsx,.xls"
                    :on-change="handleImportFile"
                    style="display: inline;"
                >
                  <span style="display: flex; align-items: center;">
                    <el-icon><Upload /></el-icon>导入数据
                  </span>
                </el-upload>
              </el-dropdown-item>
              <el-dropdown-item @click="handleExport" divided>
                <el-icon><Download /></el-icon>导出数据
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" type="primary" @click="handleAddMain">
          <el-icon><Plus /></el-icon>
          <span style="margin-left: 4px">新增主号</span>
        </el-button>
        <el-button size="small" type="success" @click="handleAddSub">
          <el-icon><Plus /></el-icon>
          <span style="margin-left: 4px">新增子号</span>
        </el-button>
      </div>
    </div>

    <!-- 筛选展开区 -->
    <div v-if="showFilter" class="filter-panel">
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
            <el-button
                v-if="group.phoneType === 3"
                text type="primary" size="small" class="device-btn"
                @click.stop="handleAddSubToDevice(group.deviceCode)"
            >
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
              <el-table-column label="编号" width="130">
                <template #default="{ row }">
                  {{ row._isMain ? row.deviceCode : (row.deviceCode + '-' + row._accountIndex) }}
                </template>
              </el-table-column>
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
              <el-table-column prop="phoneLocation" label="手机位置" width="120" show-overflow-tooltip />
              <el-table-column label="使用部门" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ dictLabel(deptOptions, row.dept) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="更新时间" width="130">
                <template #default="{ row }">
                  <span>{{ shortTime(row.updateTime) }}</span>
                </template>
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
        <el-descriptions-item label="设备编码">{{ detailData._isMain ? detailData.deviceCode : (detailData.deviceCode + '-' + detailData._accountIndex) }}</el-descriptions-item>
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
          <!-- 左：新增=账号类型 / 编辑主号=手机类型 / 编辑子号=账号槽位（避免设备编码独占一行） -->
          <el-col :span="12" v-if="formMode === 'add'">
            <el-form-item label="账号类型" required>
              <el-select v-model="formData._kind" placeholder="请选择账号类型" style="width: 100%" @change="onKindChange">
                <el-option label="主号（新设备）" value="main" />
                <el-option label="子号（挂到已有设备）" value="sub" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-else-if="formData._isMain">
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
          <el-col :span="12" v-else>
            <el-form-item label="账号槽位" required>
              <el-select v-model="formData.accountIndex" placeholder="请选择" style="width: 100%">
                <el-option v-for="n in availableSlots" :key="n" :label="`槽位 ${n}`" :value="String(n)" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 右：设备编码（始终在第一行右侧）—— 编辑模式下也可改，后端做唯一性校验 -->
          <el-col :span="12">
            <el-form-item label="设备编码" required>
              <el-input
                  v-if="formData._kind === 'main' || formMode !== 'add'"
                  v-model="formData.deviceCode"
                  :placeholder="formData.phoneType === 3 ? '摩托罗拉：MT601、MT602 ...' : '如 MT101'"
                  maxlength="64"
              />
              <el-select
                  v-else
                  v-model="formData.deviceCode"
                  placeholder="选择摩托罗拉设备"
                  filterable
                  style="width: 100%"
              >
                <el-option
                    v-for="code in motorolaDeviceCodeOptions"
                    :key="code"
                    :label="code"
                    :value="code"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <!-- 新增主号：左=手机类型 / 新增子号：左=账号槽位 -->
          <el-col :span="12" v-if="formMode === 'add' && formData._kind === 'main'">
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
          <el-col :span="12" v-else-if="formMode === 'add' && formData._kind === 'sub'">
            <el-form-item label="账号槽位" required>
              <el-select v-model="formData.accountIndex" placeholder="请选择" style="width: 100%">
                <el-option v-for="n in availableSlots" :key="n" :label="`槽位 ${n}`" :value="String(n)" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 右：使用状态（主/子号都可编辑） -->
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
        </el-row>
        <el-row :gutter="20">
          <!-- 左：使用部门（主/子号都可编辑，账号维度） -->
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
          <!-- 右：手机位置 → 主号：字典下拉；子号：与主号同步，只读 -->
          <el-col :span="12">
            <el-form-item label="手机位置">
              <el-input
                  v-if="formData._kind === 'sub' || (formMode === 'edit' && !formData._isMain)"
                  :model-value="getMainDevicePhoneLocation()"
                  disabled
                  placeholder="与主号手机位置同步"
                  maxlength="64"
              />
              <el-select
                  v-else
                  v-model="formData.phoneLocation"
                  placeholder="请选择"
                  filterable
                  style="width: 100%"
              >
                <el-option
                    v-for="item in phoneDevicePhoneLocationOptions"
                    :key="item.dictKey"
                    :label="item.dictValue"
                    :value="item.dictValue"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <!-- 主体简称（占整行） -->
          <el-col :span="24">
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
                  allow-create
                  default-first-option
                  clearable
                  placeholder="选填，输入搜索或新增"
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
                  default-first-option
                  clearable
                  placeholder="选填，从手机卡选择"
                  style="width: 100%"
              >
                <el-option v-for="p in phoneNumberOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企微状态" required>
              <el-select v-model="formData.wechatStatus" placeholder="请选择" style="width: 100%" @change="handleWechatStatusChange">
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
              <el-select v-model="formData.wechatUsage" placeholder="请选择" style="width: 100%" :disabled="!isStatusEnabled(wechatStatusOptions, formData.wechatStatus)">
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
              <el-select v-model="formData.wxStatus" placeholder="请选择" style="width: 100%" @change="handleWxStatusChange">
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
              <el-select v-model="formData.wxUsage" placeholder="请选择" style="width: 100%" :disabled="!isStatusEnabled(wxStatusOptions, formData.wxStatus)">
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
              <el-select
                  v-model="formData.wxRealname"
                  filterable
                  allow-create
                  default-first-option
                  clearable
                  placeholder="选填，输入搜索或新增"
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
                  default-first-option
                  clearable
                  placeholder="选填，从手机卡选择"
                  style="width: 100%"
              >
                <el-option v-for="p in phoneNumberOptions" :key="p" :label="p" :value="p" />
              </el-select>
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
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Iphone, Search, Plus, Filter, ArrowRight, Location,
  CircleCheck, Warning, UserFilled, Files, Upload, Download, Document
} from '@element-plus/icons-vue'
import { useDictStore } from '@/store/dict'
import * as XLSX from 'xlsx'
import { dictLabelToKey, getDictKeyByLabel, isDictMatch } from '@/utils/dictConverter'
import {
  getDeviceGroups,
  addDevice, updateDevice, deleteDevice,
  addSubAccount, updateSubAccount, deleteSubAccount,
  getRealnameOptions, getDeviceCodeOptions, getMotorolaDeviceCodeOptions,
  getPhoneNumberOptions,
  downloadDeviceTemplate, exportDeviceList, importDeviceList
} from '@/api/phoneDevice'

// ===== 基础状态 =====
const dictStore = useDictStore()
const loading = ref(false)
const searchKeyword = ref('')
const showFilter = ref(false)
const allGroups = ref([])
const deviceCodeOptions = ref([])
const motorolaDeviceCodeOptions = ref([])
const importUploadRef = ref(null)

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
const phoneDevicePhoneLocationOptions = ref([])  // 手机位置字典（机房一号架/二号架...）
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
const formMode = ref('add') // 'add' | 'edit'
const submitting = ref(false)
// formData._isMain = true 表示主号，false 表示子号
// formData._kind = 'main' | 'sub'（仅新增时用）
const formData = reactive({
  id: null,
  deviceCode: '',
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

function isStatusEnabled(list, value) {
  if (value === null || value === undefined || value === '') return false
  return dictLabel(list, value) !== '无'
}

function getNoneKey(list) {
  const noneItem = list.find(item => item.dictValue === '无')
  return noneItem ? Number(noneItem.dictKey) : 0
}

function handleWechatStatusChange() {
  if (!isStatusEnabled(wechatStatusOptions, formData.wechatStatus)) {
    formData.wechatUsage = getNoneKey(wechatUsageOptions)
  }
}

function handleWxStatusChange() {
  if (!isStatusEnabled(wxStatusOptions, formData.wxStatus)) {
    formData.wxUsage = getNoneKey(wxUsageOptions)
  }
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === ''
}

function validateAccountFields(data) {
  if (isStatusEnabled(wechatStatusOptions, data.wechatStatus)) {
    if (isBlank(data.wechatPhone)) {
      ElMessage.warning('企微状态不是“无”时，请选择企微手机号')
      return false
    }
    if (data.wechatUsage === null || data.wechatUsage === undefined || data.wechatUsage === '') {
      ElMessage.warning('企微状态不是“无”时，请选择企微用途')
      return false
    }
  }

  if (isStatusEnabled(wxStatusOptions, data.wxStatus)) {
    if (isBlank(data.wxPhone)) {
      ElMessage.warning('微信状态不是“无”时，请选择微信手机号')
      return false
    }
    if (data.wxUsage === null || data.wxUsage === undefined || data.wxUsage === '') {
      ElMessage.warning('微信状态不是“无”时，请选择微信用途')
      return false
    }
    if (isBlank(data.wxPassword)) {
      ElMessage.warning('微信状态不是“无”时，请填写微信密码')
      return false
    }
  }

  return true
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

// 表格内使用的短时间格式，避免行高不一致
function shortTime(val) {
  if (!val) return '-'
  const s = String(val)
  const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T ](\d{1,2}):(\d{1,2}):(\d{1,2})/)
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')} ${m[4].padStart(2, '0')}:${m[5].padStart(2, '0')}`
  }
  const m2 = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m2) return `${m2[1]}-${m2[2].padStart(2, '0')}-${m2[3].padStart(2, '0')}`
  return s.substring(0, 16)
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
          row.deviceCode, row.wechatNickname, row.wechatPerson,
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
  // 从字典获取"在用"状态的key值，避免硬编码
  let inUseKey = getDictKeyByLabel(useStatusOptions.value, '在用')
  // 如果字典未加载或找不到"在用"，使用备用值1
  if (inUseKey === null) inUseKey = 1
  
  return deviceGroups.value.reduce((sum, g) => {
    let c = 0
    if (Number(g.useStatus) === inUseKey) c++
    if (g.subAccounts) {
      for (const s of g.subAccounts) {
        if (Number(s.useStatus) === inUseKey) c++
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

function buildDeviceQuery() {
  const params = {}
  if (searchKeyword.value && searchKeyword.value.trim()) params.keyword = searchKeyword.value.trim()
  if (filter.wechatPerson) params.wechatPerson = filter.wechatPerson
  if (filter.wechatStatus !== null && filter.wechatStatus !== undefined) params.wechatStatus = filter.wechatStatus
  if (filter.phoneLocation) params.phoneLocation = filter.phoneLocation
  if (filter.phoneType !== null && filter.phoneType !== undefined) params.phoneType = filter.phoneType
  return params
}

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

async function handleDownloadTemplate() {
  const blob = await downloadDeviceTemplate()
  saveBlob(blob, '手机设备导入模板.xlsx')
}

async function handleExport() {
  const blob = await exportDeviceList(buildDeviceQuery())
  saveBlob(blob, `手机设备数据_${Date.now()}.xlsx`)
}

async function handleImportFile(file) {
  const rawFile = file && file.raw ? file.raw : file
  if (!rawFile) return
  try {
    const convertedFile = await processImportFile(rawFile)
    const result = await importDeviceList(convertedFile)
    const successCount = result?.successCount || 0
    const failCount = result?.failCount || 0
    if (failCount > 0) {
      ElMessage.warning(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条。${result?.message || ''}`)
    } else {
      ElMessage.success(`导入成功：${successCount} 条`)
    }
    await loadData()
    await loadDeviceCodeOptions()
  } finally {
    importUploadRef.value?.clearFiles?.()
  }
}

async function processImportFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      for (const row of jsonData) {
        if (row['企微状态'] !== undefined) {
          row['企微状态'] = dictLabelToKey(wechatStatusOptions.value, row['企微状态'])
        }
        if (row['企微用途'] !== undefined) {
          row['企微用途'] = dictLabelToKey(wechatUsageOptions.value, row['企微用途'])
        }
        if (row['微信状态'] !== undefined) {
          row['微信状态'] = dictLabelToKey(wxStatusOptions.value, row['微信状态'])
        }
        if (row['微信用途'] !== undefined) {
          row['微信用途'] = dictLabelToKey(wxUsageOptions.value, row['微信用途'])
        }
        if (row['使用状态'] !== undefined) {
          row['使用状态'] = dictLabelToKey(useStatusOptions.value, row['使用状态'])
        }
        if (row['所属部门'] !== undefined) {
          row['所属部门'] = dictLabelToKey(deptOptions.value, row['所属部门'])
        }
        if (row['手机类型'] !== undefined) {
          row['手机类型'] = dictLabelToKey(phoneTypeOptions.value, row['手机类型'])
        }
        if (row['手机位置'] !== undefined) {
          row['手机位置'] = dictLabelToKey(phoneDevicePhoneLocationOptions.value, row['手机位置'])
        }
      }

      const newWorkbook = XLSX.utils.book_new()
      const newWorksheet = XLSX.utils.json_to_sheet(jsonData)
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName)
      const newData = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' })
      const blob = new Blob([newData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const convertedFile = new File([blob], file.name, { type: file.type })
      resolve(convertedFile)
    }
    reader.readAsArrayBuffer(file)
  })
}

// ===== 数据加载 =====
// 加载动画阈值：只有加载时间超过500ms才显示动画
const LOADING_THRESHOLD = 500

async function loadData() {
  const startTime = Date.now()
  
  try {
    const data = await getDeviceGroups({ page: 1, size: 500 })
    // getDeviceGroups 返回 result.data 被 axios 拦截器解开
    const list = (data && data.list) || (data && data.records) || (Array.isArray(data) ? data : [])
    allGroups.value = list
    // 默认全部折叠，不自动展开
  } catch (e) {
    console.error('加载设备数据失败', e)
    allGroups.value = []
  }
  
  const elapsed = Date.now() - startTime
  // 只有加载时间超过阈值才显示动画
  if (elapsed >= LOADING_THRESHOLD) {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  loading.value = false
}

async function loadDicts() {
  const types = [
    'phone_device_wechat_status',
    'phone_device_use_status',
    'phone_device_dept',
    'phone_device_wechat_usage',
    'phone_device_wx_status',
    'phone_device_wx_usage',
    'phone_device_phone_type',
    'phone_device_phone_location',
    'we_corp_subject_short'
  ]
  const results = await dictStore.getDictBatch(types)
  wechatStatusOptions.value = results['phone_device_wechat_status'] || []
  useStatusOptions.value = results['phone_device_use_status'] || []
  deptOptions.value = results['phone_device_dept'] || []
  wechatUsageOptions.value = results['phone_device_wechat_usage'] || []
  wxStatusOptions.value = results['phone_device_wx_status'] || []
  wxUsageOptions.value = results['phone_device_wx_usage'] || []
  phoneTypeOptions.value = results['phone_device_phone_type'] || []
  phoneDevicePhoneLocationOptions.value = results['phone_device_phone_location'] || []
  entityNameOptions.value = results['we_corp_subject_short'] || []
}

// 监听字典缓存变更（其他页面修改字典后自动刷新）
watch(() => dictStore.lastCleared, () => {
  loadDicts()
})

async function loadRealnameOptions() {
  try {
    const data = await getRealnameOptions()
    if (Array.isArray(data)) realnameOptions.value = data
  } catch (e) {
    realnameOptions.value = []
  }
}

async function loadPhoneNumberOptions() {
  try {
    const data = await getPhoneNumberOptions()
    phoneNumberOptions.value = Array.isArray(data) ? data : []
  } catch (e) {
    phoneNumberOptions.value = []
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

async function loadMotorolaDeviceCodeOptions() {
  try {
    const data = await getMotorolaDeviceCodeOptions()
    if (Array.isArray(data)) motorolaDeviceCodeOptions.value = data
  } catch (e) {
    motorolaDeviceCodeOptions.value = []
  }
}

// ===== 新增 / 编辑 =====
function resetForm() {
  formData.id = null
  formData.deviceCode = ''
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

// 获取主号的手机位置（子号用——与主号同步)
function getMainDevicePhoneLocation() {
  const g = allGroups.value.find(g => g.deviceCode === formData.deviceCode)
  return g ? (g.phoneLocation || '') : ''
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
  // 加载摩托罗拉设备编码（只有摩托罗拉可以挂子号）
  loadMotorolaDeviceCodeOptions()
  formVisible.value = true
}

// 在某个设备下直接新增子号（预设 deviceCode）
function handleAddSubToDevice(deviceCode) {
  resetForm()
  formMode.value = 'add'
  formData._kind = 'sub'
  formData._isMain = false
  formData.deviceCode = deviceCode
  loadMotorolaDeviceCodeOptions()
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
  } else {
    formData._isMain = false
    // 子号模式：加载摩托罗拉设备编码列表
    loadMotorolaDeviceCodeOptions()
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
  if (!validateAccountFields(formData)) return

  const entityName = formData.entityNameList.length > 0 ? formData.entityNameList.join(',') : ''
  const payload = {
    deviceCode: formData.deviceCode.trim(),
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
    // 新增主号如果是摩托罗拉类型，也要刷新摩托罗拉下拉列表
    if (formMode.value === 'add') {
      if (formData._kind === 'main' && Number(formData.phoneType) === 3) {
        loadMotorolaDeviceCodeOptions()
      }
      if (formData._kind === 'sub') {
        loadMotorolaDeviceCodeOptions()
      }
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
  const no = isMain ? row.deviceCode : (row.deviceCode + '-' + row._accountIndex)
  let msg
  if (isMain) {
    const subCount = (row.subAccounts && row.subAccounts.length) || 0
    msg = subCount > 0
        ? `确定删除主号「${no}」吗？该主号下的 ${subCount} 个子号也会被一并删除，删除后不可恢复。`
        : `确定删除主号「${no}」吗？删除后不可恢复。`
  } else {
    msg = `确定删除子号「${no}」吗？删除后不可恢复。`
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
  await loadPhoneNumberOptions()
  loadData()
})
</script>

<style scoped>
.home-page {
  padding: 12px;
  background: #f5f7fa;
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.stat-group {
  display: flex;
  align-items: center;
  gap: 8px;
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
.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.filter-panel {
  background: #fff;
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 10px;
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
