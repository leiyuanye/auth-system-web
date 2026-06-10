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
              placeholder="搜索角色名称"
              style="width: 220px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
            />
            <el-button type="primary" :icon="Plus" v-if="userStore.hasPermission('system:role:add')">
              新增角色
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredRoles" style="width: 100%" stripe border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleCode" label="角色编码" width="160" />
        <el-table-column prop="roleName" label="角色名称" width="160" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              v-if="userStore.hasPermission('system:role:edit')"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              type="danger"
              link
              size="small"
              v-if="userStore.hasPermission('system:role:delete')"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="10"
          :total="filteredRoles.length"
          layout="prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const searchKeyword = ref('')
const currentPage = ref(1)

const roles = ref([
  { id: 1, roleCode: 'admin', roleName: '超级管理员', description: '拥有所有权限', status: 1, createTime: '2024-01-01 10:00:00' },
  { id: 2, roleCode: 'operator', roleName: '运营员', description: '运营数据相关操作权限', status: 1, createTime: '2024-01-02 11:00:00' },
  { id: 3, roleCode: 'viewer', roleName: '只读用户', description: '只有查看权限', status: 1, createTime: '2024-01-03 12:00:00' },
  { id: 4, roleCode: 'phone_admin', roleName: '手机卡管理员', description: '手机卡模块管理权限', status: 0, createTime: '2024-01-04 13:00:00' }
])

const filteredRoles = computed(() => {
  if (!searchKeyword.value) return roles.value
  return roles.value.filter(r => r.roleName.includes(searchKeyword.value) || r.roleCode.includes(searchKeyword.value))
})

function handleEdit(row) {
  ElMessage.info('编辑角色 ' + row.roleName + '（功能演示，后端未实现）')
}

function handleDelete(row) {
  ElMessage.warning('删除角色 ' + row.roleName + '（功能演示，后端未实现）')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
