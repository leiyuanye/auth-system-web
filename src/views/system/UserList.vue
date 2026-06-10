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
              placeholder="搜索用户名"
              style="width: 220px; margin-right: 10px;"
              clearable
              :prefix-icon="Search"
            />
            <el-button type="primary" :icon="Plus" v-if="userStore.hasPermission('system:user:add')">
              新增用户
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredUsers" style="width: 100%" stripe border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="手机" width="140" />
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
              v-if="userStore.hasPermission('system:user:edit')"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              type="danger"
              link
              size="small"
              v-if="userStore.hasPermission('system:user:delete')"
              @click="handleDelete(row)"
            >删除</el-button>
            <el-tag size="small" type="info" v-if="!userStore.hasPermission('system:user:edit') && !userStore.hasPermission('system:user:delete')">无权限</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right;">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="10"
          :total="filteredUsers.length"
          layout="prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Search, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const searchKeyword = ref('')
const currentPage = ref(1)

const users = ref([
  { id: 1, username: 'admin', realName: '系统管理员', email: 'admin@example.com', phone: '13800138000', status: 1, createTime: '2024-01-01 10:00:00' },
  { id: 2, username: 'zhangsan', realName: '张三', email: 'zhangsan@example.com', phone: '13800138001', status: 1, createTime: '2024-01-02 11:00:00' },
  { id: 3, username: 'lisi', realName: '李四', email: 'lisi@example.com', phone: '13800138002', status: 0, createTime: '2024-01-03 12:00:00' },
  { id: 4, username: 'wangwu', realName: '王五', email: 'wangwu@example.com', phone: '13800138003', status: 1, createTime: '2024-01-04 13:00:00' },
  { id: 5, username: 'zhaoliu', realName: '赵六', email: 'zhaoliu@example.com', phone: '13800138004', status: 1, createTime: '2024-01-05 14:00:00' },
  { id: 6, username: 'sunqi', realName: '孙七', email: 'sunqi@example.com', phone: '13800138005', status: 0, createTime: '2024-01-06 15:00:00' },
  { id: 7, username: 'zhouba', realName: '周八', email: 'zhouba@example.com', phone: '13800138006', status: 1, createTime: '2024-01-07 16:00:00' },
  { id: 8, username: 'wujiu', realName: '吴九', email: 'wujiu@example.com', phone: '13800138007', status: 1, createTime: '2024-01-08 17:00:00' }
])

const filteredUsers = computed(() => {
  if (!searchKeyword.value) return users.value
  return users.value.filter(u => u.username.includes(searchKeyword.value) || u.realName.includes(searchKeyword.value))
})

function handleEdit(row) {
  ElMessage.info('编辑用户 ' + row.username + '（功能演示，后端未实现）')
}

function handleDelete(row) {
  ElMessage.warning('删除用户 ' + row.username + '（功能演示，后端未实现）')
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
