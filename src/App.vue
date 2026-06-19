<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade-slide" mode="out-in">
      <div v-if="isPageLoading" class="page-loading-overlay">
        <div class="page-loading-spinner"></div>
        <div class="page-loading-text">页面加载中...</div>
      </div>
      <component v-else :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isPageLoading = ref(false)
let loadingTimer = null
const LOADING_DELAY = 300 // 只有加载时间超过300ms才显示动画

// 路由开始切换时延迟显示加载动画
router.beforeEach((to, from, next) => {
  // 只有当加载时间超过300ms才显示动画
  loadingTimer = setTimeout(() => {
    isPageLoading.value = true
  }, LOADING_DELAY)
  next()
})

// 路由切换完成时隐藏加载动画
router.afterEach(() => {
  if (loadingTimer) {
    clearTimeout(loadingTimer)
    loadingTimer = null
  }
  isPageLoading.value = false
})

// 路由切换失败时也隐藏加载动画
router.onError(() => {
  if (loadingTimer) {
    clearTimeout(loadingTimer)
    loadingTimer = null
  }
  isPageLoading.value = false
})
</script>

<style scoped>
.page-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

.page-loading-spinner {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #79bbff 25%, #95d475 25%, #95d475 50%, #eebe77 50%, #eebe77 75%, #f89898 75%);
  background-size: 25px 25px;
  border-radius: 12px;
  animation: pageSpinnerRotate 1s ease-in-out infinite;
}

.page-loading-text {
  margin-top: 16px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

@keyframes pageSpinnerRotate {
  0%, 100% {
    transform: rotate(0deg) scale(1);
    border-radius: 12px;
  }
  25% {
    transform: rotate(90deg) scale(0.85);
    border-radius: 50%;
  }
  50% {
    transform: rotate(180deg) scale(1);
    border-radius: 12px;
  }
  75% {
    transform: rotate(270deg) scale(0.85);
    border-radius: 50%;
  }
}
</style>
