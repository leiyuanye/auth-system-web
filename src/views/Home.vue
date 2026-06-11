<template>
  <div class="home-page">
    <el-row :gutter="16">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon :size="20" color="#409EFF"><House /></el-icon>
              <span>欢迎信息</span>
            </div>
          </template>
          <div class="welcome-content">
            <h2>欢迎回来，{{ userStore.userInfo?.realName || '用户' }}！</h2>
            <p>今天是 {{ currentDate }}，祝您工作愉快。</p>
            <el-descriptions :column="2" border size="small" style="margin-top: 20px;">
              <el-descriptions-item label="用户名">{{ userStore.userInfo?.username || '-' }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ userStore.userInfo?.email || '-' }}</el-descriptions-item>
              <el-descriptions-item label="角色">
                <el-tag v-for="(role, idx) in userStore.userInfo?.roles || []" :key="idx" style="margin-right: 5px;">
                  {{ role }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="登录状态">
                <el-tag type="success">已登录</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 业务数据概览 -->
    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-icon" style="background: #409EFF;">
            <el-icon :size="28"><Iphone /></el-icon>
          </div>
          <div class="overview-info">
            <div class="overview-label">手机卡总数</div>
            <div class="overview-value">{{ stats.totalCards }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-icon" style="background: #E6A23C;">
            <el-icon :size="28"><Warning /></el-icon>
          </div>
          <div class="overview-info">
            <div class="overview-label">手机卡异常</div>
            <div class="overview-value">{{ stats.warningCards }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-icon" style="background: #67C23A;">
            <el-icon :size="28"><Monitor /></el-icon>
          </div>
          <div class="overview-info">
            <div class="overview-label">服务器总数</div>
            <div class="overview-value">{{ stats.totalServers }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-icon" style="background: #F56C6C;">
            <el-icon :size="28"><Tools /></el-icon>
          </div>
          <div class="overview-info">
            <div class="overview-label">服务器异常</div>
            <div class="overview-value">{{ stats.warningServers }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <el-icon :size="20" color="#409EFF"><Key /></el-icon>
              <span>您拥有的权限标识</span>
            </div>
          </template>
          <div class="permissions-box">
            <el-tag
              v-for="(perm, idx) in userStore.permissions"
              :key="idx"
              size="large"
              :type="getPermType(perm)"
              style="margin: 5px;"
            >
              {{ perm }}
            </el-tag>
            <el-tag v-if="!userStore.permissions || userStore.permissions.length === 0" type="info">
              暂无权限数据
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue'
import { House, Key, Iphone, Warning, Monitor, Tools } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getHomeStats } from '@/api/stats'

const userStore = useUserStore()
const currentDate = ref('')

const stats = reactive({
  totalCards: 0,
  warningCards: 0,
  totalServers: 0,
  warningServers: 0
})

onMounted(async () => {
  const now = new Date()
  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`

  try {
    const data = await getHomeStats()
    stats.totalCards = data?.totalCards ?? 0
    stats.warningCards = data?.warningCards ?? 0
    stats.totalServers = data?.totalServers ?? 0
    stats.warningServers = data?.warningServers ?? 0
  } catch (e) {
    // 错误已由 request 拦截器展示
  }
})

function getPermType(perm) {
  if (!perm) return 'info'
  if (perm.startsWith('system')) return 'primary'
  if (perm.startsWith('phone')) return 'success'
  if (perm.startsWith('server')) return 'warning'
  if (perm.startsWith('operation')) return 'danger'
  return 'info'
}
</script>

<style scoped>
.home-page { padding: 0; }

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
}

.welcome-content h2 {
  margin: 0 0 10px;
  color: #303133;
}

.welcome-content p {
  color: #909399;
  margin: 0;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: default;
}

.overview-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
}

.overview-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.overview-info { flex: 1; min-width: 0; }

.overview-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.overview-value {
  font-size: 26px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.permissions-box { padding: 10px 0; }
</style>
