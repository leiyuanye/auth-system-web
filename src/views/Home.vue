<template>
  <div class="home-page">
    <el-skeleton v-if="loading" :rows="4" animated style="margin-bottom: 16px;" />

    <transition name="fade-slide" mode="out-in">
      <div v-show="!loading" key="home-content">
        <el-row :gutter="16">
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
    </transition>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue'
import { Key, Iphone, Warning, Monitor, Tools } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { getHomeStats } from '@/api/stats'

const userStore = useUserStore()
const loading = ref(false)

const stats = reactive({
  totalCards: 0,
  warningCards: 0,
  totalServers: 0,
  warningServers: 0
})

onMounted(async () => {
  loading.value = true
  try {
    const data = await getHomeStats()
    stats.totalCards = data?.totalCards ?? 0
    stats.warningCards = data?.warningCards ?? 0
    stats.totalServers = data?.totalServers ?? 0
    stats.warningServers = data?.warningServers ?? 0
  } catch (e) {
    // 错误已由 request 拦截器展示
  } finally {
    loading.value = false
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
