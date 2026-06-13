<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><Menu /></el-icon>
            <span style="margin-left: 8px;">菜单管理</span>
          </div>
          <div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索菜单名称"
              style="width: 220px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="loadList"
            />
            <el-button type="primary" :icon="Plus" @click="handleAdd(0)"
              v-if="userStore.hasPermission('system:menu:add')">
              新增菜单
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredTree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        style="width: 100%"
        stripe
        border
        v-loading="loading"
        default-expand-all
        @cell-dblclick="handleCellDblclick"
      >
        <el-table-column prop="name" label="菜单名称" width="180" />
        <el-table-column prop="path" label="路径" width="180" />
        <el-table-column prop="icon" label="图标" width="80">
          <template #default="{ row }">
            <el-icon><component :is="row.icon || 'Document'" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.menuType === 1 ? 'primary' : 'info'">
              {{ row.menuType === 1 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permCode" label="权限编码" width="200" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              link
              size="small"
              v-if="userStore.hasPermission('system:menu:add')"
              @click="handleAdd(row.id)">新增子菜单</el-button>
            <el-button
              type="primary"
              link
              size="small"
              v-if="userStore.hasPermission('system:menu:edit')"
              @click="handleEdit(row)">编辑</el-button>
            <el-button
              type="danger"
              link
              size="small"
              v-if="userStore.hasPermission('system:menu:delete')"
              @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑 对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            :props="{ label: 'name', value: 'id', children: 'children', checkStrictly: true }"
            check-strictly
            :render-after-expand="false"
            placeholder="选择上级菜单（留空为一级菜单）"
            style="width: 100%;"
            clearable
          />
        </el-form-item>
        <el-form-item label="类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio :value="1">菜单</el-radio>
            <el-radio :value="2">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="路径" v-if="form.menuType === 1">
          <el-input v-model="form.path" placeholder="如 /system/user" />
        </el-form-item>
        <el-form-item label="图标" v-if="form.menuType === 1">
          <el-input v-model="form.icon" placeholder="如 Menu, User, Setting (Element Plus 图标名)" />
        </el-form-item>
        <el-form-item label="权限编码" v-if="form.menuType === 2">
          <el-input v-model="form.permCode" placeholder="如 system:user:edit（可自动生成）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Menu, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getMenuList, addMenu, updateMenu, deleteMenu, getMenuTree } from '@/api/sys'

const userStore = useUserStore()

const searchKeyword = ref('')
const listData = ref([])
const allMenus = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新增菜单')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null,
  parentId: 0,
  menuType: 1,
  name: '',
  path: '',
  icon: '',
  permCode: '',
  sortOrder: 0,
  status: 1
})
const form = ref(defaultForm())

const rules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }]
}

// 上级菜单可选列表（树形）
const parentOptions = ref([])

// ========== 权限编码自动生成逻辑 ==========

// 权限动作映射（按钮类型时追加）
const PERM_ACTIONS = {
  'add': 'add',
  '新增': 'add',
  'edit': 'edit',
  '编辑': 'edit',
  '修改': 'edit',
  'update': 'edit',
  'delete': 'delete',
  '删除': 'delete',
  'del': 'delete',
  'view': 'view',
  '查询': 'view',
  '查看': 'view',
  'list': 'list',
  '列表': 'list',
  'export': 'export',
  '导出': 'export',
  'import': 'import',
  '导入': 'import'
}

/**
 * 根据菜单名称自动生成权限编码
 * 规则：
 * - 如果菜单名包含"新增/Add/新增" → action=add
 * - 如果包含"编辑/Edit/修改" → action=edit
 * - 如果包含"删除/Delete/Del" → action=delete
 * - 默认 → view
 * 编码格式: {parentCode}:{action}
 */
function autoGeneratePermCode() {
  if (form.value.menuType !== 2) return

  // 从父菜单获取基础 code
  let parentCode = ''
  if (form.value.parentId && form.value.parentId !== 0) {
    const parent = findMenuById(allMenus.value, form.value.parentId)
    if (parent) {
      parentCode = parent.permCode || slugify(parent.name)
    }
  }

  // 如果父级没有 permCode，尝试从当前菜单名推断
  const name = form.value.name.trim()
  if (!name) return

  if (parentCode) {
    // 尝试从名称推断动作
    let action = 'view'
    const lowerName = name.toLowerCase()
    for (const [keyword, act] of Object.entries(PERM_ACTIONS)) {
      if (lowerName.includes(keyword.toLowerCase())) {
        action = act
        break
      }
    }
    form.value.permCode = parentCode + ':' + action
  } else {
    // 独立按钮权限，用菜单名转 slug
    form.value.permCode = slugify(name)
  }
}

/** 将中文/英文名称转为 slug 格式，如 "用户管理" → "user:manage" */
function slugify(name) {
  return name
    .replace(/[A-Z]/g, c => c.toLowerCase())
    .replace(/([\u4e00-\u9fa5])/g, (m) => {
      // 常用中文词汇映射
      const map = {
        '用户': 'user', '管理': 'manage', '角色': 'role', '菜单': 'menu',
        '系统': 'system', '手机': 'phone', '卡': 'card', '列表': 'list',
        '新增': 'add', '编辑': 'edit', '删除': 'delete', '修改': 'edit',
        '查询': 'view', '查看': 'view', '导出': 'export', '导入': 'import',
        '添加': 'add', '查询': 'view', '禁用': 'disable', '启用': 'enable'
      }
      return map[m] !== undefined ? ':' + map[m] : ''
    })
    .replace(/[^a-z0-9:]/g, '')
    .replace(/:+/g, ':')
    .replace(/^:+/, '')
    .replace(/:+$/, '')
}

/** 递归查找菜单（allMenus 为平铺数组） */
function findMenuById(menus, id) {
  for (const m of menus) {
    if (m.id === id) return m
  }
  return null
}

// 监听：切换菜单类型或菜单名称变化时，自动生成权限编码
watch(() => [form.value.name, form.value.menuType, form.value.parentId], () => {
  if (form.value.menuType === 2 && form.value.name) {
    autoGeneratePermCode()
  }
}, { immediate: false })

// 过滤后的菜单树（搜索时用平铺展示）
const filteredTree = computed(() => {
  if (!searchKeyword.value) return listData.value
  const kw = searchKeyword.value.toLowerCase()
  // 递归收集匹配的菜单及其父级路径
  const matchedIds = new Set()
  function walk(nodes, path) {
    for (const node of nodes) {
      const newPath = [...path, node]
      if ((node.name || '').toLowerCase().includes(kw) ||
          (node.path || '').toLowerCase().includes(kw) ||
          (node.permCode || '').toLowerCase().includes(kw)) {
        for (const p of newPath) matchedIds.add(p.id)
      }
      if (node.children && node.children.length > 0) walk(node.children, newPath)
    }
  }
  walk(listData.value, [])

  function filter(nodes) {
    const result = []
    for (const node of nodes) {
      if (matchedIds.has(node.id)) {
        const newNode = { ...node }
        if (node.children && node.children.length > 0) {
          newNode.children = filter(node.children)
        } else {
          newNode.children = []
        }
        result.push(newNode)
      }
    }
    return result
  }
  return filter(listData.value)
})

async function loadList() {
  loading.value = true
  try {
    // 先加载完整的菜单树（用于表格展示）
    listData.value = await getMenuTree() || []
    // 再加载平铺的菜单列表（用于上级菜单下拉）
    allMenus.value = await getMenuList() || []
    buildParentOptions()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function buildParentOptions() {
  // 只包含 menuType=1 的菜单作为可选父级
  const menus = allMenus.value.filter(m => m.menuType !== 2)
  function toTree(list, parentId) {
    return list
      .filter(m => (m.parentId || 0) === parentId)
      .map(m => ({ ...m, children: toTree(list, m.id) }))
  }
  parentOptions.value = [{ id: 0, name: '顶级菜单', children: toTree(menus, 0) }]
}

onMounted(() => {
  loadList()
})

function handleCellDblclick(row, column, cell, event) {
  let text = ''
  if (cell && cell.innerText !== undefined) text = cell.innerText
  if (!text || text.trim() === '') return
  text = text.trim()
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => { ElMessage.success('已复制：' + text) }).catch(() => {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy'); ElMessage.success('已复制：' + text) } catch (e) { ElMessage.warning('复制失败') }
      document.body.removeChild(ta)
    })
  } else {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select()
    try { document.execCommand('copy'); ElMessage.success('已复制：' + text) } catch (e) { ElMessage.warning('复制失败') }
    document.body.removeChild(ta)
  }
}

function handleAdd(parentId) {
  isEdit.value = false
  dialogTitle.value = parentId && parentId !== 0 ? '新增子菜单' : '新增菜单'
  form.value = { ...defaultForm(), parentId: parentId || 0 }
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑菜单'
  form.value = {
    id: row.id,
    parentId: row.parentId || 0,
    menuType: row.menuType || 1,
    name: row.name,
    path: row.path || '',
    icon: row.icon || '',
    permCode: row.permCode || '',
    sortOrder: row.sortOrder || 0,
    status: row.status
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    // 菜单类型：自动根据名称生成路径
    if (form.value.menuType === 1 && form.value.name && !form.value.path) {
      form.value.path = '/' + slugify(form.value.name).replace(/:/g, '/')
    }
    // 按钮类型：权限编码为空时自动生成
    if (form.value.menuType === 2 && !form.value.permCode) {
      autoGeneratePermCode()
    }
    if (isEdit.value) {
      await updateMenu(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addMenu(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {
    // ignore
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除菜单 "${row.name}" 吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).catch(() => { throw new Error('cancel') })
  try {
    await deleteMenu(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    // ignore
  }
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
