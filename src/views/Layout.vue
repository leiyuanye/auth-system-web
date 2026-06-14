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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Fold, Expand, ArrowDown, User, UserFilled, SwitchButton, Lock, Clock, House } from '@element-plus/icons-vue'
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

// 剩余时间（毫秒）
const remainingMs = ref(0)
let timer = null

const activeMenu = computed(() => route.path)
const menuList = computed(() => userStore.menuList)

const remainingTimeText = computed(() => {
  if (remainingMs.value <= 0) return '已过期'
  const totalSec = Math.floor(remainingMs.value / 1000)
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  if (hours > 0) {
    return `${hours}小时${minutes}分`
  }
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`
  }
  return `${seconds}秒`
})

const isTimeWarning = computed(() => {
  return remainingMs.value > 0 && remainingMs.value <= 2 * 60 * 60 * 1000
})

const isTimeDanger = computed(() => {
  return remainingMs.value > 0 && remainingMs.value <= 30 * 60 * 1000
})

function updateRemainingTime() {
  remainingMs.value = userStore.remainingTime
}

onMounted(async () => {
  updateDate()
  const isExpired = userStore.checkLoginExpiry()
  if (isExpired) {
    router.push({ path: '/login', query: { expired: '1' } })
    return
  }

  if (userStore.menuList.length === 0) {
    await userStore.getUserInfo()
  }

  updateRemainingTime()

  timer = setInterval(() => {
    updateRemainingTime()
    if (remainingMs.value <= 0) {
      clearInterval(timer)
      ElMessageBox.alert('登录已过期，请重新登录！', '会话超时', {
        confirmButtonText: '确定',
        type: 'warning'
      }).then(() => {
        userStore.clearSession()
        router.push('/login')
      }).catch(() => {
        userStore.clearSession()
        router.push('/login')
      })
    }
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    ElMessage.info('个人信息页面（功能演示）')
  }
}

function handleMenuClick(path) {
  if (path) {
    router.push(path)
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  background-color: #263445;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
}

.logo-text {
  font-size: 16px;
}

:deep(.el-menu) {
  border-right: none;
}

.layout-header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  min-width: 0;
  justify-content: flex-start;
}

.collapse-btn {
  cursor: pointer;
  color: #606266;
  flex-shrink: 0;
}

.welcome-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #ecf5ff 0%, #f4faff 100%);
  border-radius: 20px;
  border: 1px solid #d9ecff;
  flex: 0 0 auto;
  max-width: 520px;
  overflow: hidden;
}

.welcome-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.welcome-divider {
  color: #c0c4cc;
  font-size: 12px;
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

.session-timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
  padding: 4px 8px;
  background: #f4f4f5;
  border-radius: 4px;
  border: 1px solid #e4e4e7;
}

.time-warning {
  color: #e6a23c !important;
  font-weight: 500;
}

.time-danger {
  color: #f56c6c !important;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.user-name {
  font-size: 14px;
}

.layout-main {
  background: #f0f2f5;
  padding: 16px;
  overflow-y: auto;
}

@media (max-width: 900px) {
  .welcome-date,
  .welcome-divider:nth-child(4),
  .welcome-role {
    display: none;
  }
}
</style>
