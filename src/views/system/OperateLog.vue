<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <div class="title">
            <el-icon><Document /></el-icon>
            <span>日志管理</span>
          </div>
          <div>
            <el-button :icon="Refresh" size="small" @click="onRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 筛选区：默认不展开 -->
      <div class="filter-panel" v-if="filterVisible">
        <el-form label-position="top" size="small">
          <el-row :gutter="16">
            <el-col :span="24" class="filter-row">
              <el-form-item label="操作模块">
                <div class="checkbox-grid" v-if="moduleOptions.length">
                  <el-checkbox
                    v-model="moduleAllChecked"
                    :indeterminate="moduleIndeterminate"
                    @change="onToggleAllModule"
                  >全选</el-checkbox>
                  <el-checkbox
                    v-for="m in moduleOptions"
                    :key="m"
                    v-model="checkedModulesMap[m]"
                    @change="onModuleChange"
                  >{{ m }}</el-checkbox>
                </div>
                <span v-else class="empty-hint">暂无模块数据，刷新列表后会自动同步</span>
              </el-form-item>
            </el-col>
            <el-col :span="24" class="filter-row">
              <el-form-item label="操作类型">
                <div class="checkbox-grid checkbox-grid--tight">
                  <el-checkbox
                    v-model="typeAllChecked"
                    :indeterminate="typeIndeterminate"
                    @change="onToggleAllType"
                  >全选</el-checkbox>
                  <el-checkbox
                    v-for="t in typeOptions"
                    :key="t"
                    v-model="checkedTypesMap[t]"
                    @change="onTypeChange"
                  >{{ t }}</el-checkbox>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12" class="filter-row">
              <el-form-item label="操作人">
                <el-input
                  v-model="operatorFilter"
                  placeholder="模糊搜索操作人"
                  clearable
                  :prefix-icon="User"
                  @keyup.enter="onQuery"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12" class="filter-row filter-actions">
              <el-button type="primary" size="small" @click="onQuery">查询</el-button>
              <el-button size="small" @click="onReset">重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div class="collapse-bar">
        <el-button link size="small" @click="filterVisible = !filterVisible">
          {{ filterVisible ? '收起筛选' : '展开筛选' }}
          <el-icon style="margin-left: 4px;"><ArrowDown v-if="!filterVisible" /><ArrowUp v-else /></el-icon>
        </el-button>
        <span class="hint">共 {{ total }} 条记录</span>
      </div>

      <el-table :data="list" style="width: 100%;" stripe border v-loading="loading" empty-text="暂无操作日志">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="moduleName" label="操作模块" width="140" show-overflow-tooltip />
        <el-table-column prop="operateType" label="操作类型" width="90">
          <template #default="{ row }">
            <el-tag :type="tagType(row.operateType)" effect="light" v-if="row.operateType">
              {{ row.operateType }}
            </el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="dataId" label="数据ID" width="90" />
        <el-table-column prop="dataName" label="数据名称" width="180" show-overflow-tooltip />
        <el-table-column prop="fieldChanged" label="变更字段" min-width="260" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="120" show-overflow-tooltip />
        <el-table-column prop="operateTime" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.operateTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="260" show-overflow-tooltip />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
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

    <el-dialog v-model="detailVisible" title="日志详情" width="780px" top="6vh" class="log-detail-dialog">
      <div v-if="detail" class="log-detail">
        <!-- 顶部：操作摘要卡片 -->
        <div class="summary-card" :class="summaryCardClass">
          <div class="summary-icon">
            <el-icon :size="22">
              <CirclePlus v-if="detail.operateType === '新增'" />
              <EditPen v-else-if="detail.operateType === '编辑'" />
              <Delete v-else-if="detail.operateType === '删除'" />
              <Document v-else />
            </el-icon>
          </div>
          <div class="summary-main">
            <div class="summary-title">
              <span class="operator-name">{{ detail.operator || '未知' }}</span>
              <span class="summary-action">{{ actionText }}</span>
              <span class="module-name">{{ detail.moduleName || '未知模块' }}</span>
            </div>
            <div class="summary-meta">
              <el-icon><Clock /></el-icon>
              <span>{{ formatTime(detail.operateTime) }}</span>
            </div>
          </div>
          <el-tag v-if="detail.operateType" :type="tagType(detail.operateType)" effect="dark" round size="large">
            {{ detail.operateType }}
          </el-tag>
        </div>

        <!-- 基础信息 -->
        <div class="section">
          <div class="section-title">
            <el-icon><InfoFilled /></el-icon>
            <span>基础信息</span>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">日志ID</div>
              <div class="info-value">{{ detail.id ?? '—' }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">数据ID</div>
              <div class="info-value">{{ detail.dataId ?? '—' }}</div>
            </div>
            <div class="info-item info-item-wide">
              <div class="info-label">数据名称</div>
              <div class="info-value">{{ detail.dataName || '—' }}</div>
            </div>
          </div>
        </div>

        <!-- 字段变更对比 -->
        <div class="section" v-if="hasChanges">
          <div class="section-title">
            <el-icon><Edit /></el-icon>
            <span>字段变更对比</span>
            <span class="section-badge">{{ changesList.length }} 项变更</span>
          </div>

          <div v-if="changesList.length > 0" class="changes-list">
            <div v-for="(item, idx) in changesList" :key="idx" class="change-item">
              <div class="change-header">
                <span class="change-field">{{ item.field }}</span>
                <el-icon class="change-arrow"><Right /></el-icon>
              </div>
              <div class="change-body">
                <div class="change-col change-old">
                  <div class="change-col-label">原值</div>
                  <div class="change-col-value" :class="{ 'is-empty': !item.before }">
                    {{ item.before || '（空）' }}
                  </div>
                </div>
                <div class="change-col change-new">
                  <div class="change-col-label">新值</div>
                  <div class="change-col-value" :class="{ 'is-empty': !item.after }">
                    {{ item.after || '（空）' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="changes-list">
            <div class="change-item">
              <div class="change-body change-body-single">
                <div class="change-col change-new" style="flex: 1;">
                  <div class="change-col-label">值</div>
                  <div class="change-col-value" :class="{ 'is-empty': !fieldChangedText }">
                    {{ fieldChangedText || '（空）' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 备注 -->
        <div class="section" v-if="detail.remark">
          <div class="section-title">
            <el-icon><Memo /></el-icon>
            <span>备注</span>
          </div>
          <div class="remark-box">{{ detail.remark }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, User, Refresh, ArrowDown, ArrowUp, InfoFilled, Edit, Clock, CirclePlus, EditPen, Delete, Right, Memo } from '@element-plus/icons-vue'
import { getLogList, getLogModules } from '@/api/sys'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const operatorFilter = ref('')

// 模块名 + 类型的多选
const moduleOptions = ref([])
const typeOptions = ['新增', '编辑', '删除']
const checkedModulesMap = reactive({})
const checkedTypesMap = reactive({ [typeOptions[0]]: true, [typeOptions[1]]: true, [typeOptions[2]]: true })

// 筛选面板默认不展开
const filterVisible = ref(false)

const moduleAllChecked = computed(() =>
  moduleOptions.value.length > 0 && moduleOptions.value.every(m => checkedModulesMap[m])
)
const moduleIndeterminate = computed(() => {
  const checkedCount = moduleOptions.value.filter(m => checkedModulesMap[m]).length
  return checkedCount > 0 && checkedCount < moduleOptions.value.length
})
const typeAllChecked = computed(() => typeOptions.every(t => checkedTypesMap[t]))
const typeIndeterminate = computed(() => {
  const checkedCount = typeOptions.filter(t => checkedTypesMap[t]).length
  return checkedCount > 0 && checkedCount < typeOptions.length
})

function onToggleAllModule(val) {
  moduleOptions.value.forEach(m => { checkedModulesMap[m] = val })
}
function onToggleAllType(val) {
  typeOptions.forEach(t => { checkedTypesMap[t] = val })
}
function onModuleChange() { /* 仅驱动响应式 */ }
function onTypeChange() { /* 仅驱动响应式 */ }

function tagType(type) {
  if (type === '删除') return 'danger'
  if (type === '新增') return 'success'
  return 'primary'
}

function pad(n) { return n < 10 ? '0' + n : '' + n }
function formatTime(val) {
  if (!val) return '—'
  let d
  if (val instanceof Date) {
    d = val
  } else if (typeof val === 'string') {
    // 兼容 "2025-06-11T10:22:30" 或 "2025-06-11 10:22:30" 等常见格式
    d = new Date(val.replace(/-/g, '/').replace('T', ' '))
  } else if (typeof val === 'number') {
    d = new Date(val)
  } else {
    return String(val)
  }
  if (isNaN(d.getTime())) return String(val)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

function flattenMenuNames(menus, acc = []) {
  if (!menus || !menus.length) return acc
  for (const m of menus) {
    if (!m) continue
    const menuType = m.menuType ?? m.type
    if (menuType === 2 || menuType === 'button') continue
    if (m.name) acc.push(m.name)
    if (m.children && m.children.length) flattenMenuNames(m.children, acc)
  }
  return acc
}

function mergeModuleOptions(backendModules) {
  // 合并：用户菜单 + 后端已记录的模块，保证新增菜单或已有日志都能被筛到
  const menuNames = flattenMenuNames(userStore.menuList || [])
  const set = new Set()
  menuNames.forEach(n => n && set.add(n))
  ;(Array.isArray(backendModules) ? backendModules : []).forEach(n => n && set.add(n))
  const next = Array.from(set).sort()

  // 保留原勾选状态
  const prevChecked = next.filter(n => checkedModulesMap[n])
  Object.keys(checkedModulesMap).forEach(k => { delete checkedModulesMap[k] })
  next.forEach(n => { checkedModulesMap[n] = true })
  prevChecked.forEach(n => { checkedModulesMap[n] = true })

  moduleOptions.value = next
}

async function loadModuleOptions() {
  try {
    const res = await getLogModules()
    const arr = Array.isArray(res) ? res : []
    mergeModuleOptions(arr)
  } catch (e) {
    console.warn('[operate-log] 拉取模块列表失败', e)
    mergeModuleOptions([])
  }
}



async function loadList(resetPage = false) {
  if (resetPage) page.value = 1
  const modules = moduleOptions.value.filter(m => checkedModulesMap[m])
  const types = typeOptions.filter(t => checkedTypesMap[t])

  const params = {
    page: page.value,
    size: pageSize.value
  }
  // 只有选中部分模块/类型时才传参；全选等同于不过滤
  if (moduleOptions.value.length > 0 && modules.length > 0 && modules.length !== moduleOptions.value.length) {
    params.moduleName = modules.join(',')
  }
  if (types.length > 0 && types.length !== typeOptions.length) {
    params.operateType = types.join(',')
  }
  if (operatorFilter.value && operatorFilter.value.trim()) {
    params.operator = operatorFilter.value.trim()
  }

  loading.value = true
  try {
    const res = await getLogList(params)
    // 后端返回结构：{ total, list, page, size }
    if (res && typeof res === 'object' && (res.total !== undefined || res.list !== undefined)) {
      list.value = Array.isArray(res.list) ? res.list : (Array.isArray(res.records) ? res.records : [])
      total.value = Number(res.total) || list.value.length
    } else if (Array.isArray(res)) {
      list.value = res
      total.value = res.length
    } else {
      list.value = []
      total.value = 0
    }
  } catch (e) {
    console.warn('[operate-log] 拉取日志失败', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onQuery() { loadList(true) }
function onPageChange() { loadList(false) }
function onRefresh() {
  loadModuleOptions().then(() => loadList(true))
}

function onReset() {
  operatorFilter.value = ''
  moduleOptions.value.forEach(m => { checkedModulesMap[m] = true })
  typeOptions.forEach(t => { checkedTypesMap[t] = true })
  loadList(true)
}

// 详情弹框
const detailVisible = ref(false)
const detail = ref(null)

// 动作文案
const actionText = computed(() => {
  const t = detail.value?.operateType
  if (t === '新增') return '新增了'
  if (t === '编辑') return '编辑了'
  if (t === '删除') return '删除了'
  return '操作了'
})

// 摘要卡片样式
const summaryCardClass = computed(() => {
  const t = detail.value?.operateType
  if (t === '新增') return 'is-add'
  if (t === '编辑') return 'is-edit'
  if (t === '删除') return 'is-delete'
  return 'is-default'
})

// 字段变更文本（兼容 "字段名" 或 "字段A, 字段B"）
const fieldChangedText = computed(() => {
  const fc = detail.value?.fieldChanged
  if (!fc) return ''
  return String(fc).replace(/[\[\]"']/g, '').trim()
})

// 是否有变更数据
const hasChanges = computed(() => {
  if (!detail.value) return false
  return !!(
    detail.value.fieldChanged ||
    detail.value.oldValue ||
    detail.value.newValue ||
    detail.value.remark
  )
})

/**
 * 解析字段变更列表
 * 兼容多种数据格式：
 * 1. fieldChanged: "姓名, 手机号"  +  oldValue/newValue: JSON 字符串
 * 2. fieldChanged: "姓名: 张三 -> 李四; 手机号: 138 -> 139"
 * 3. 直接提供 changes 数组
 */
const changesList = computed(() => {
  if (!detail.value) return []

  const row = detail.value
  const result = []

  // 优先尝试解析 oldValue/newValue JSON
  let oldObj = null
  let newObj = null
  try {
    if (row.oldValue && typeof row.oldValue === 'string') {
      const trimmed = row.oldValue.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        oldObj = JSON.parse(trimmed)
      }
    }
  } catch (e) { oldObj = null }
  try {
    if (row.newValue && typeof row.newValue === 'string') {
      const trimmed = row.newValue.trim()
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        newObj = JSON.parse(trimmed)
      }
    }
  } catch (e) { newObj = null }

  if (oldObj && newObj && typeof oldObj === 'object' && typeof newObj === 'object' && !Array.isArray(oldObj)) {
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
    for (const k of allKeys) {
      const before = oldObj[k]
      const after = newObj[k]
      const beforeStr = formatValue(before)
      const afterStr = formatValue(after)
      if (beforeStr !== afterStr) {
        result.push({ field: fieldNameMap(k) || k, before: beforeStr, after: afterStr })
      }
    }
    return result
  }

  // 尝试解析 fieldChanged 中的 "字段: 原值 -> 新值" 格式
  const fc = String(row.fieldChanged || '').trim()
  if (fc) {
    // 格式1: "字段A: 旧 -> 新; 字段B: 旧2 -> 新2"
    const parts = fc.split(/[;；]/)
    for (const part of parts) {
      const m = part.match(/^(.+?)[:：]\s*(.+?)\s*->\s*(.+)$/)
      if (m) {
        result.push({ field: m[1].trim(), before: m[2].trim(), after: m[3].trim() })
      }
    }
    if (result.length > 0) return result

    // 格式2: 字段名列表 "字段A, 字段B" + 配合 oldValue/newValue 解析
    const fieldNames = fc.split(/[,，]/).map(s => s.trim()).filter(Boolean)
    if (oldObj && typeof oldObj === 'object') {
      for (const f of fieldNames) {
        const before = formatValue(oldObj[f])
        const after = formatValue(newObj ? newObj[f] : '')
        result.push({ field: fieldNameMap(f) || f, before, after })
      }
      return result
    }

    // 格式3: 仅有字段名列表，没有 oldValue/newValue
    for (const f of fieldNames) {
      result.push({ field: fieldNameMap(f) || f, before: '', after: '' })
    }
    if (result.length > 0) return result
  }

  return result
})

// 字段名映射（英文/拼音 -> 中文友好名称）
const FIELD_NAME_MAP = {
  realName: '真实姓名',
  username: '用户名',
  phone: '手机号',
  email: '邮箱',
  status: '状态',
  roleName: '角色名',
  roleCode: '角色编码',
  serverName: '服务器名称',
  ipAddress: 'IP地址',
  serverType: '服务器类型',
  location: '所在地区',
  specs: '所在分组',
  mfaKey: 'MFA密钥',
  serverStatus: '状态',
  remoteAccount: '远程账号',
  remotePwd: '远程密码',
  backendAccount: '后台账号',
  backendPwd: '后台密码',
  expireTime: '到期时间',
  remark: '备注',
  deviceCode: '设备编码',
  wechatNickname: '企微昵称',
  entityName: '主体简称',
  wechatPerson: '企微实名人',
  wechatPhone: '企微手机号',
  wechatStatus: '企微状态',
  wechatUsage: '企微用途',
  wxStatus: '微信状态',
  wxUsage: '微信用途',
  phoneLocation: '手机位置',
  useStatus: '使用状态',
  dept: '使用部门',
  phoneType: '手机类型',
  wxRealname: '微信实名人',
  wxPhone: '微信手机号',
  wxPassword: '微信密码',
  cardNumber: '卡号',
  operator: '运营商',
  operatorType: '运营商类型',
  usageStatus: '使用状态',
  cardStatus: '卡状态',
  groupBy: '分组'
}

function fieldNameMap(key) {
  return FIELD_NAME_MAP[key] || key
}

// 格式化值：去除 JSON 包裹，转为可读字符串
function formatValue(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch (e) {
      return String(val)
    }
  }
  return String(val)
}

function handleView(row) {
  detail.value = row
  detailVisible.value = true
}

onMounted(async () => {
  // 确保 userStore 菜单已加载
  if (!userStore.menuList || userStore.menuList.length === 0) {
    try { await userStore.getUserInfo() } catch (e) { /* ignore */ }
  }
  await loadModuleOptions()
  await loadList(true)
})

// 当 userStore.menuList 在外部刷新时，同步更新筛选候选
watch(() => userStore.menuList, () => loadModuleOptions(), { deep: true })
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-header .title { display: flex; align-items: center; font-weight: 600; }
.page-header .title span { margin-left: 8px; }

.filter-panel {
  padding: 8px 8px 0;
  margin-bottom: 4px;
  background: #fafbfc;
  border: 1px solid #eef0f3;
  border-radius: 6px;
}
.filter-row .el-form-item { margin-bottom: 12px; }

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 6px 16px;
  padding: 4px 2px;
}
.checkbox-grid--tight {
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
}
.filter-actions { display: flex; align-items: flex-end; justify-content: flex-start; }
.empty-hint { color: #909399; font-size: 12px; }

.collapse-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 10px;
}
.collapse-bar .hint { color: #909399; font-size: 12px; }

.pagination { margin-top: 16px; text-align: right; }

/* ============== 日志详情弹窗 ============== */
:deep(.log-detail-dialog) {
  border-radius: 10px;
  overflow: hidden;
}

:deep(.log-detail-dialog .el-dialog__header) {
  margin: 0;
  padding: 16px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #eef0f3;
}

:deep(.log-detail-dialog .el-dialog__body) {
  padding: 16px 20px;
  max-height: 72vh;
  overflow-y: auto;
}

.log-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 摘要卡片 */
.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 8px;
  background: #f0f7ff;
  border: 1px solid #d6e8ff;
  border-left-width: 4px;
}
.summary-card.is-add {
  background: #f0f9eb;
  border-color: #c2e7b0;
  border-left-color: #67c23a;
}
.summary-card.is-edit {
  background: #fdf6ec;
  border-color: #f3d9a4;
  border-left-color: #e6a23c;
}
.summary-card.is-delete {
  background: #fef0f0;
  border-color: #fbc4c4;
  border-left-color: #f56c6c;
}
.summary-card.is-default {
  background: #f4f4f5;
  border-color: #d9d9d9;
  border-left-color: #909399;
}

.summary-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  color: #409eff;
  flex-shrink: 0;
}
.summary-card.is-add .summary-icon { color: #67c23a; }
.summary-card.is-edit .summary-icon { color: #e6a23c; }
.summary-card.is-delete .summary-icon { color: #f56c6c; }
.summary-card.is-default .summary-icon { color: #909399; }

.summary-main {
  flex: 1;
  min-width: 0;
}
.summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  flex-wrap: wrap;
  line-height: 1.5;
}
.operator-name {
  font-weight: 600;
  color: #303133;
}
.summary-action {
  color: #606266;
}
.module-name {
  font-weight: 600;
  color: #409eff;
}
.summary-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 分区 */
.section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}
.section-title .el-icon {
  color: #409eff;
}
.section-badge {
  margin-left: auto;
  font-size: 12px;
  font-weight: normal;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 基础信息 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 16px;
}
.info-item {
  min-width: 0;
}
.info-item-wide {
  grid-column: span 2;
}
.info-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.info-value {
  font-size: 14px;
  color: #303133;
  word-break: break-all;
  word-wrap: break-word;
  overflow-wrap: anywhere;
}

/* 字段变更对比 */
.changes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.change-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
  background: #fafbfc;
}
.change-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f4f6fa;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
}
.change-field {
  font-weight: 600;
  color: #303133;
}
.change-arrow {
  color: #c0c4cc;
}
.change-body {
  display: flex;
  gap: 0;
}
.change-body-single {
  display: block;
}
.change-col {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border-right: 1px solid #ebeef5;
}
.change-col:last-child {
  border-right: none;
}
.change-old {
  background: #fef5f5;
}
.change-new {
  background: #f0f9eb;
}
.change-col-label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.change-old .change-col-label::before {
  content: '−';
  color: #f56c6c;
  font-weight: bold;
  font-size: 14px;
}
.change-new .change-col-label::before {
  content: '+';
  color: #67c23a;
  font-weight: bold;
  font-size: 14px;
}
.change-col-value {
  font-size: 13px;
  color: #303133;
  word-break: break-all;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.6;
}
.change-col-value.is-empty {
  color: #c0c4cc;
  font-style: italic;
}

/* 备注 */
.remark-box {
  padding: 10px 12px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  font-size: 13px;
  color: #303133;
  line-height: 1.6;
  word-break: break-all;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
