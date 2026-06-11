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

    <el-dialog v-model="detailVisible" title="日志详情" width="760px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="日志ID">{{ detail.id ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ detail.moduleName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag v-if="detail.operateType" :type="tagType(detail.operateType)">{{ detail.operateType }}</el-tag>
          <span v-else>—</span>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.operator || '—' }}</el-descriptions-item>
        <el-descriptions-item label="数据ID">{{ detail.dataId ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="数据名称">{{ detail.dataName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ formatTime(detail.operateTime) }}</el-descriptions-item>
        <el-descriptions-item label="变更字段" :span="2">{{ detail.fieldChanged || '—' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.remark || '—' }}</el-descriptions-item>
        <el-descriptions-item label="修改前" :span="2">
          <pre class="json-block">{{ detail.oldValue || '—' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="修改后" :span="2">
          <pre class="json-block">{{ detail.newValue || '—' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, User, Refresh, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
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

.json-block {
  margin: 0;
  white-space: pre-wrap;
  max-height: 240px;
  overflow: auto;
  background: #f6f8fa;
  padding: 8px 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
}
</style>
