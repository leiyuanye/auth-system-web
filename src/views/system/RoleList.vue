<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><UserFilled /></el-icon>
            <span style="margin-left: 8px;">角色管理</span>
          </div>
          <div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索角色名称/编码"
              style="width: 220px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="loadList"
            />
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('system:role:add')">
              新增角色
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="roleCode" label="角色编码" width="160" />
        <el-table-column prop="roleName" label="角色名称" width="160" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              v-if="userStore.hasPermission('system:role:edit')"
              @click="handleEdit(row)">编辑</el-button>
            <el-button
              type="warning"
              link
              size="small"
              v-if="userStore.hasPermission('system:role:edit')"
              @click="handleAssignMenu(row)">分配菜单</el-button>
            <el-button
              type="danger"
              link
              size="small"
              v-if="userStore.hasPermission('system:role:delete')"
              @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </el-card>

    <!-- 新增/编辑 对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" :disabled="isEdit" placeholder="如 ROLE_ADMIN" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="角色描述" />
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

    <!-- 分配菜单 对话框 -->
    <el-dialog v-model="menuDialogVisible" title="分配菜单/权限" width="600px">
      <div v-if="currentRole">
        <p>角色：<b>{{ currentRole.roleName }}</b> ({{ currentRole.roleCode }})</p>
        <el-tree
          ref="treeRef"
          :data="menuTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          show-checkbox
          check-strictly
          :default-checked-keys="checkedMenuIds"
          style="max-height: 400px; overflow: auto;"
        />
      </div>
      <template #footer>
        <el-button @click="menuDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAssignMenuSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  getRoleList,
  addRole,
  updateRole,
  deleteRole,
  getRoleMenuIds,
  assignRoleMenus
} from '@/api/sys'
import { getMenuTree } from '@/api/sys'

const userStore = useUserStore()

const searchKeyword = ref('')
const page = ref(1)
const size = ref(10)
const total = ref(0)
const listData = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null,
  roleCode: '',
  roleName: '',
  description: '',
  status: 1
})
const form = ref(defaultForm())

const rules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

// 分配菜单
const menuDialogVisible = ref(false)
const currentRole = ref(null)
const menuTree = ref([])
const checkedMenuIds = ref([])
const treeRef = ref(null)

async function loadList() {
  loading.value = true
  try {
    const params = {
      keyword: searchKeyword.value || undefined,
      page: page.value,
      size: size.value
    }
    const res = await getRoleList(params)
    const data = (res && typeof res === 'object') ? res : {}
    listData.value = Array.isArray(data.list) ? data.list : (Array.isArray(data.records) ? data.records : (Array.isArray(data.rows) ? data.rows : []))
    total.value = Number(data.total ?? 0)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadList()
})



function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
  form.value = {
    id: row.id,
    roleCode: row.roleCode,
    roleName: row.roleName,
    description: row.description || '',
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
    if (isEdit.value) {
      await updateRole(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addRole(form.value)
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
  try {
    await ElMessageBox.confirm(`确定删除角色 "${row.roleName}" 吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    // ignore
  }
}

// ============ 分配菜单 ============
async function handleAssignMenu(row) {
  currentRole.value = row
  try {
    menuTree.value = await getMenuTree() || []
    checkedMenuIds.value = await getRoleMenuIds(row.id) || []
  } catch (e) {
    menuTree.value = []
    checkedMenuIds.value = []
  }
  menuDialogVisible.value = true
}

async function handleAssignMenuSubmit() {
  submitting.value = true
  try {
    // 获取 el-tree 中所有选中的节点 id
    const checkedKeys = treeRef.value ? treeRef.value.getCheckedKeys() : checkedMenuIds.value
    await assignRoleMenus(currentRole.value.id, checkedKeys)
    ElMessage.success('菜单分配成功')
    menuDialogVisible.value = false
  } catch (e) {
    // ignore
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
