<template>
  <div class="dict-page">
    <div class="dict-layout">
      <div class="dict-sider">
        <div class="sider-title">
          <el-icon><Menu /></el-icon>
          <span>字典分组</span>
        </div>
        <div class="sider-group" v-for="group in dictGroups" :key="group.key">
          <div class="group-label" @click="toggleGroup(group.key)">
            <span>{{ group.label }}</span>
            <span class="group-meta">
              <span class="group-count">{{ groupCount(group.items) }}</span>
              <el-icon class="group-arrow" :class="{ expanded: !collapsedGroups[group.key] }">
                <ArrowRight />
              </el-icon>
            </span>
          </div>
          <transition name="group-collapse">
            <div v-show="!collapsedGroups[group.key]" class="group-body">
              <div
                v-for="t in group.items"
                :key="t.type"
                class="sider-item"
                :class="{ active: filterType === t.type }"
                @click="selectType(t.type)">
                <el-icon><component :is="iconFor(t.tag)" /></el-icon>
                <span class="item-label">{{ t.label }}</span>
                <span class="item-count">{{ countFor(t.type) }}</span>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div class="dict-main">
        <div class="main-header">
          <div class="header-title">
            <el-icon><Document /></el-icon>
            <span>{{ currentTitle }}</span>
          </div>
          <div class="header-actions">
            <el-input
              v-model="searchText"
              placeholder="搜索字典键 / 字典值"
              clearable
              style="width: 260px;"
              :prefix-icon="Search" />
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增字典项</el-button>
          </div>
        </div>

        <div class="table-wrap">
          <el-table
            :data="filteredList"
            style="width: 100%;"
            stripe
            border
            height="100%"
            v-loading="loading"
            element-loading-text="加载中...">
            <el-table-column label="序号" type="index" width="70" align="center" />
            <el-table-column label="字典类型" width="170">
              <template #default="{ row }">
                <el-tag size="small" :type="typeTagType(row.dictType)" effect="light">
                  {{ typeLabel(row.dictType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="dictKey" label="字典键" min-width="180" show-overflow-tooltip />
            <el-table-column prop="dictValue" label="字典值（显示文本）" min-width="220" show-overflow-tooltip />
            <el-table-column prop="sortOrder" label="排序" width="100" align="center" />
            <el-table-column label="操作" width="170" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="字典类型" prop="dictType">
          <el-select v-model="form.dictType" placeholder="请选择字典类型" style="width: 100%;">
            <el-option-group label="服务器" v-for="g in ['server']" :key="g">
              <el-option v-for="t in serverTypes" :key="t.type" :label="t.label" :value="t.type" />
            </el-option-group>
            <el-option-group label="手机卡" v-for="g in ['phone']" :key="g">
              <el-option v-for="t in phoneTypes" :key="t.type" :label="t.label" :value="t.type" />
            </el-option-group>
            <el-option-group label="实名人员" v-for="g in ['realname']" :key="g">
              <el-option v-for="t in realnameTypes" :key="t.type" :label="t.label" :value="t.type" />
            </el-option-group>
            <el-option-group label="企微主体" v-for="g in ['wecorp']" :key="g">
              <el-option v-for="t in wecorpTypes" :key="t.type" :label="t.label" :value="t.type" />
            </el-option-group>
            <el-option-group label="设备管理" v-for="g in ['device']" :key="g">
              <el-option v-for="t in deviceTypes" :key="t.type" :label="t.label" :value="t.type" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="字典键" prop="dictKey">
          <el-input v-model="form.dictKey" placeholder="存数据库的值，如 1 / 腾讯云" />
        </el-form-item>
        <el-form-item label="字典值" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="显示文本，如 运行中 / 腾讯云" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" style="width: 200px;" />
        </el-form-item>
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
import { Document, Plus, Search, Menu, Guide, Setting, Warning, IceCreamRound, ArrowRight } from '@element-plus/icons-vue'
import { getDictByType, addDict, updateDict, deleteDict } from '@/api/dict'
import { useDictStore } from '@/store/dict'

const dictStore = useDictStore()

const typeMeta = [
  { type: 'server_type', label: '服务器类型', tag: 'success', group: 'server' },
  { type: 'server_group', label: '服务器分组', tag: 'primary', group: 'server' },
  { type: 'server_status', label: '服务器状态', tag: 'warning', group: 'server' },
  { type: 'stock_status', label: '库存状态', tag: 'info', group: 'server' },
  { type: 'phone_operator', label: '手机卡运营商', tag: 'success', group: 'phone' },
  { type: 'phone_usage_status', label: '手机卡使用状态', tag: 'primary', group: 'phone' },
  { type: 'phone_card_status', label: '手机卡状态', tag: 'warning', group: 'phone' },
  { type: 'phone_agent', label: '代理商', tag: 'danger', group: 'phone' },
  { type: 'colleague_status', label: '同事状态', tag: 'success', group: 'realname' },
  { type: 'we_corp_subject_short', label: '企微主体简称', tag: 'success', group: 'wecorp' },
  { type: 'we_corp_customer_type', label: '企微客户类型', tag: 'primary', group: 'wecorp' },
  { type: 'we_corp_status', label: '企微主体状态', tag: 'warning', group: 'wecorp' },
  { type: 'phone_device_wechat_status', label: '企微状态', tag: 'primary', group: 'device' },
  { type: 'phone_device_use_status', label: '使用状态', tag: 'success', group: 'device' },
  { type: 'phone_device_dept', label: '使用部门', tag: 'warning', group: 'device' },
  { type: 'phone_device_wechat_usage', label: '企微用途', tag: 'info', group: 'device' },
  { type: 'phone_device_wx_status', label: '微信状态', tag: 'danger', group: 'device' },
  { type: 'phone_device_wx_usage', label: '微信用途', tag: 'primary', group: 'device' },
  { type: 'phone_device_phone_type', label: '手机类型', tag: 'success', group: 'device' },
  { type: 'phone_device_phone_location', label: '手机位置', tag: 'warning', group: 'device' }
]

const serverTypes = computed(() => typeMeta.filter(t => t.group === 'server'))
const phoneTypes = computed(() => typeMeta.filter(t => t.group === 'phone'))
const realnameTypes = computed(() => typeMeta.filter(t => t.group === 'realname'))
const wecorpTypes = computed(() => typeMeta.filter(t => t.group === 'wecorp'))
const deviceTypes = computed(() => typeMeta.filter(t => t.group === 'device'))
const dictGroups = computed(() => [
  { key: 'server', label: '服务器', items: serverTypes.value },
  { key: 'phone', label: '手机卡', items: phoneTypes.value },
  { key: 'realname', label: '实名人员', items: realnameTypes.value },
  { key: 'wecorp', label: '企微主体', items: wecorpTypes.value },
  { key: 'device', label: '设备管理', items: deviceTypes.value }
])

const filterType = ref('')
const searchText = ref('')
const listData = ref([])
const loading = ref(false)
const collapsedGroups = ref({
  server: true,
  phone: true,
  realname: true,
  wecorp: true,
  device: true
})

const currentTitle = computed(() => {
  const found = typeMeta.find(t => t.type === filterType.value)
  return found ? found.label : '全部字典'
})

const filteredList = computed(() => {
  let list = listData.value
  if (filterType.value) list = list.filter(i => i.dictType === filterType.value)
  if (searchText.value && searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    list = list.filter(i =>
      (i.dictKey && String(i.dictKey).toLowerCase().indexOf(kw) !== -1) ||
      (i.dictValue && String(i.dictValue).toLowerCase().indexOf(kw) !== -1)
    )
  }
  return list
})

function selectType(t) { filterType.value = (filterType.value === t) ? '' : t }
function typeLabel(t) { const f = typeMeta.find(m => m.type === t); return f ? f.label : t }
function typeTagType(t) { const f = typeMeta.find(m => m.type === t); return f ? f.tag : '' }
function countFor(t) { return listData.value.filter(i => i.dictType === t).length }
function groupCount(items) { return items.reduce((sum, item) => sum + countFor(item.type), 0) }
function toggleGroup(key) { collapsedGroups.value[key] = !collapsedGroups.value[key] }
function iconFor(tag) {
  switch (tag) {
    case 'success': return Guide
    case 'warning': return Warning
    case 'info': return Setting
    case 'danger': return IceCreamRound
    default: return Document
  }
}

const dialogVisible = ref(false)
const dialogTitle = ref('新增字典项')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const defaultForm = () => ({ id: null, dictType: typeMeta[0].type, dictKey: '', dictValue: '', sortOrder: 0 })
const form = ref(defaultForm())
const rules = {
  dictType: [{ required: true, message: '请选择字典类型', trigger: 'change' }],
  dictKey: [{ required: true, message: '请输入字典键', trigger: 'blur' }],
  dictValue: [{ required: true, message: '请输入字典值', trigger: 'blur' }]
}



async function loadList() {
  loading.value = true
  try {
    const all = await Promise.all(typeMeta.map(t => getDictByType(t.type)))
    const merged = []
    all.forEach((arr, idx) => {
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (!item.dictType) item.dictType = typeMeta[idx].type
          merged.push(item)
        })
      }
    })
    merged.sort((a, b) => {
      if (a.dictType !== b.dictType) return a.dictType.localeCompare(b.dictType)
      return (a.sortOrder || 0) - (b.sortOrder || 0)
    })
    listData.value = merged
  } catch (e) {
    ElMessage.error('加载字典数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => loadList())

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增字典项'
  form.value = defaultForm()
  if (filterType.value) form.value.dictType = filterType.value
  dialogVisible.value = true
}
function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑字典项'
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
      await updateDict(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addDict(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    // 清除该类型字典缓存，其他页面下次访问会自动重新加载
    dictStore.clearCache(form.value.dictType)
    loadList()
  } catch (e) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}
async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除字典项 "${row.dictValue}" 吗？\n若业务记录仍在使用此选项，下拉将不再显示。`,
      '提示',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    await deleteDict(row.id)
    ElMessage.success('删除成功')
    // 清除该类型字典缓存，其他页面下次访问会自动重新加载
    dictStore.clearCache(row.dictType)
    loadList()
  } catch (e) {
    if (e !== 'cancel' && e?.message !== 'cancel') {
      ElMessage.error(e?.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.dict-page {
  padding: 16px;
  height: 100%;
}
.dict-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 112px);
  min-height: 500px;
}
.dict-sider {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow-y: auto;
}
.sider-title {
  padding: 16px;
  font-weight: 600;
  font-size: 15px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sider-group {
  border-bottom: 1px solid #f0f2f5;
}
.sider-group:last-child { border-bottom: none; }
.group-label {
  padding: 12px 16px;
  font-size: 13px;
  color: #606266;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.15s, color 0.15s;
}
.group-label:hover {
  background: #f5f7fa;
  color: #409eff;
}
.group-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.group-count {
  min-width: 24px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #eef3fb;
  color: #7b8da8;
  font-size: 12px;
  letter-spacing: 0;
  text-align: center;
}
.group-arrow {
  color: #a8abb2;
  transition: transform 0.18s ease;
}
.group-arrow.expanded {
  transform: rotate(90deg);
}
.group-body {
  padding: 4px 0 8px;
}
.sider-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: background 0.15s;
}
.sider-item:hover { background: #f5f7fa; }
.sider-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 600;
}
.sider-item .item-label { flex: 1; }
.sider-item .item-count {
  font-size: 12px;
  color: #c0c4cc;
  background: #f4f4f5;
  border-radius: 10px;
  padding: 1px 8px;
  min-width: 24px;
  text-align: center;
}
.sider-item.active .item-count {
  background: #409eff;
  color: #fff;
}
.dict-main {
  flex: 1;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.table-wrap {
  flex: 1;
  padding: 16px 20px;
  overflow: hidden;
  min-height: 0;
}
.group-collapse-enter-active,
.group-collapse-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.group-collapse-enter-from,
.group-collapse-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
