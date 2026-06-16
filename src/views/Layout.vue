<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
      <div class="logo">
        <el-icon :size="28" color="#fff"><Lock /></el-icon>
        <span v-if="!isCollapse" class="logo-text">基建-管理系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <template v-for="menu in menuList" :key="menu.id">
          <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
            <template #title>
              <el-icon><component :is="menu.icon || 'Menu'" /></el-icon>
              <span>{{ menu.name }}</span>
            </template>
            <el-menu-item v-for="child in menu.children" :key="child.id" :index="child.path" @click="handleMenuClick(child.path)">
              <el-icon><component :is="child.icon || 'Document'" /></el-icon>
              <template #title>{{ child.name }}</template>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path" @click="handleMenuClick(menu.path)">
            <el-icon><component :is="menu.icon || 'Document'" /></el-icon>
            <template #title>{{ menu.name }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" :size="20" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <div class="welcome-bar">
            <el-icon :size="18" color="#409EFF"><House /></el-icon>
            <span class="welcome-title">欢迎回来，{{ userStore.userInfo?.realName || '用户' }}</span>
            <span class="welcome-divider">|</span>
            <span class="welcome-date">今天是 {{ currentDate }}</span>
            <span class="welcome-divider">|</span>
            <span class="welcome-role">
              <el-tag size="small" v-for="(role, idx) in userStore.userInfo?.roles || []" :key="idx">
                {{ role }}
              </el-tag>
            </span>
          </div>
        </div>
        <div class="header-right">

          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="user-name">{{ userStore.userInfo?.realName || userStore.userInfo?.username || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Fold, Expand, ArrowDown, User, UserFilled, SwitchButton, Lock, House } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)

// 当前日期
const currentDate = ref('')
function updateDate() {
  const now = new Date()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`
}

const activeMenu = computed(() => route.path)
const menuList = computed(() => userStore.menuList)

onMounted(async () => {
  updateDate()

  // 只检查token是否存在，不再检查过期时间
  if (!userStore.token) {
    console.log('[Layout] 无Token，跳转登录页')
    router.push('/login')
    return
  }

  if (userStore.menuList.length === 0) {
    await userStore.getUserInfo()
  }
})

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
    }).catch(() => {})
  }
  if (command === 'profile') {
    router.push('/profile')
  }
}

function handleMenuClick(path) {
  router.push(path)
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.logo-text {
  margin-left: 10px;
}

.layout-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  cursor: pointer;
  color: #606266;
}

.welcome-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #303133;
}

.welcome-title {
  font-weight: 500;
}

.welcome-divider {
  color: #dcdfe6;
}

.welcome-date {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
}

.welcome-role {
  display: flex;
  gap: 4px;
  white-space: nowrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #606266;
}

.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
