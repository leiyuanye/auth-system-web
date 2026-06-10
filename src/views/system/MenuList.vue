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
            <el-button type="primary" :icon="Plus" v-if="userStore.hasPermission('system:menu:add')">
              新增菜单
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="menuTree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        style="width: 100%"
        stripe
        border
      >
        <el-table-column prop="name" label="菜单名称" width="180" />
        <el-table-column prop="path" label="路径" width="220" />
        <el-table-column label="图标" width="80">
          <template #default="{ row }">
            <el-icon><component :is="row.icon || 'Document'" /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'primary' : 'info'">
              {{ row.type === 1 ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permission" label="权限编码" width="180" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              v-if="userStore.hasPermission('system:menu:edit')"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              type="danger"
              link
              size="small"
              v-if="userStore.hasPermission('system:menu:delete')"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Menu, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const menuTree = ref([
  {
    id: 1, name: '首页', path: '/home', icon: 'HomeFilled', type: 1, permission: '', sort: 1, status: 1, children: []
  },
  {
    id: 2, name: '系统管理', path: '/system', icon: 'Setting', type: 1, permission: '', sort: 2, status: 1,
    children: [
      { id: 21, name: '用户管理', path: '/system/user', icon: 'User', type: 1, permission: 'system:user:view', sort: 1, status: 1, children: [] },
      { id: 22, name: '角色管理', path: '/system/role', icon: 'UserFilled', type: 1, permission: 'system:role:view', sort: 2, status: 1, children: [] },
      { id: 23, name: '菜单管理', path: '/system/menu', icon: 'Menu', type: 1, permission: 'system:menu:view', sort: 3, status: 1, children: [] }
    ]
  },
  {
    id: 3, name: '手机卡管理', path: '/phone', icon: 'Phone', type: 1, permission: '', sort: 3, status: 1,
    children: [
      { id: 31, name: '卡列表', path: '/phone/list', icon: 'Tickets', type: 1, permission: 'phone:list:view', sort: 1, status: 1, children: [] }
    ]
  },
  {
    id: 4, name: '运营中心', path: '/operation', icon: 'DataAnalysis', type: 1, permission: '', sort: 4, status: 1,
    children: [
      { id: 41, name: '数据概览', path: '/operation/summary', icon: 'Histogram', type: 1, permission: 'operation:summary:view', sort: 1, status: 1, children: [] },
      { id: 42, name: '日报表', path: '/operation/report', icon: 'Document', type: 1, permission: 'operation:report:view', sort: 2, status: 1, children: [] }
    ]
  }
])

function handleEdit(row) {
  ElMessage.info('编辑菜单 ' + row.name + '（功能演示，后端未实现）')
}

function handleDelete(row) {
  ElMessage.warning('删除菜单 ' + row.name + '（功能演示，后端未实现）')
}
</script>

<style scoped>
.page-container { padding: 16px; }
.page-card { background: #fff; }
</style>
