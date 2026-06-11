<template>
  <div class="page-container">
    <el-card class="page-card">
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <el-icon><User /></el-icon>
            <span style="margin-left: 8px;">用户管理</span>
          </div>
          <div>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户名/姓名"
              style="width: 220px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
              @keyup.enter="loadList"
            />
            <el-button type="primary" :icon="Plus" @click="handleAdd"
              v-if="userStore.hasPermission('system:user:add')">
              新增用户
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="listData" style="width: 100%" stripe border v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="手机" width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              v-if="userStore.hasPermission('system:user:edit')"
              @click="handleEdit(row)">编辑</el-button>
            <el-button
              type="warning"
              link
              size="small"
              v-if="userStore.hasPermission('system:user:edit')"
              @click="handleAssignRole(row)">分配角色</el-button>
            <el-button
              type="success"
              link
              size="small"
              v-if="userStore.hasPermission('system:user:edit')"
              @click="handleResetPwd(row)">重置密码</el-button>
            <el-button
              type="danger"
              link
              size="small"
              v-if="userStore.hasPermission('system:user:delete')"
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
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" v-if="!isEdit" prop="password">
          <el-input v-model="form.password" type="password" placeholder="留空默认为 admin123" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
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

    <!-- 分配角色 对话框 -->
    <el-dialog v-model="roleDialogVisible" title="分配角色" width="500px">
      <div v-if="currentUser">
        <p>用户：<b>{{ currentUser.username }}</b> ({{ currentUser.realName }})</p>
        <el-checkbox-group v-model="checkedRoleIds" style="margin-top: 16px;">
          <el-checkbox v-for="role in allRoles" :key="role.id" :value="role.id" style="display: block; margin-bottom: 12px;">
            <b>{{ role.roleName }}</b> <span style="color: #909399; margin-left: 8px;">({{ role.roleCode }})</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAssignRoleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  getUserList,
  addUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getUserRoleIds,
  assignUserRoles
} from '@/api/sys'
import { getAllRoles } from '@/api/sys'

const userStore = useUserStore()

const searchKeyword = ref('')
const page = ref(1)
const size = ref(10)
const total = ref(0)
const listData = ref([])
const loading = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const defaultForm = () => ({
  id: null,
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  status: 1
})
const form = ref(defaultForm())

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
}

// 分配角色
const roleDialogVisible = ref(false)
const currentUser = ref(null)
const allRoles = ref([])
const checkedRoleIds = ref([])

async function loadList() {
  loading.value = true
  try {
    const params = {
      keyword: searchKeyword.value || undefined,
      page: page.value,
      size: size.value
    }
    const res = await getUserList(params)
    listData.value = res.list || []
    total.value = res.total || 0
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
  dialogTitle.value = '新增用户'
  form.value = defaultForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  form.value = {
    id: row.id,
    username: row.username,
    realName: row.realName || '',
    email: row.email || '',
    phone: row.phone || '',
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
      await updateUser(form.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await addUser(form.value)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {
    // error already shown by interceptor
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除用户 "${row.username}" 吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).catch(() => { throw new Error('cancel') })
  try {
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    // ignore cancel
  }
}

async function handleResetPwd(row) {
  const { value } = await ElMessageBox.prompt(`重置 "${row.username}" 的密码`, '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '新密码（留空默认 admin123）'
  }).catch(() => { throw new Error('cancel') })
  try {
    await resetUserPassword(row.id, value || 'admin123')
    ElMessage.success('密码重置成功，新密码为：' + (value || 'admin123'))
  } catch (e) {
    // ignore cancel
  }
}

// ============ 分配角色 ============
async function handleAssignRole(row) {
  currentUser.value = row
  try {
    allRoles.value = await getAllRoles() || []
    checkedRoleIds.value = await getUserRoleIds(row.id) || []
  } catch (e) {
    allRoles.value = []
    checkedRoleIds.value = []
  }
  roleDialogVisible.value = true
}

async function handleAssignRoleSubmit() {
  submitting.value = true
  try {
    await assignUserRoles(currentUser.value.id, checkedRoleIds.value)
    ElMessage.success('角色分配成功')
    roleDialogVisible.value = false
  } catch (e) {
    // ignore
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.page-card {
  background: #fff;
}
</style>
