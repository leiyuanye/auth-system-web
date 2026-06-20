<template>
  <router-view v-slot="{ Component, route }">
    <transition name="fade-slide" mode="out-in">
      <div v-if="isPageLoading" class="page-loading-overlay">
        <div class="curve-loading">
          <div class="curve-ball"></div>
          <svg class="curve-line" viewBox="0 0 120 20" preserveAspectRatio="none">
            <path ref="curvePath" d="" stroke="#409EFF" stroke-width="3" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="page-loading-text">加载中...</div>
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
const curvePath = ref(null)
let animFrame = null
let showTime = 0          // 动画开始显示的时间戳
const MIN_DISPLAY = 400   // 最小显示时长(ms)，防止闪烁

// CurveLoadingView 阻尼弹跳动画
const BALL_DROP = 50
const LINE_WIDTH = 120
const DURATION = 900

function animateCurveLine(elapsed) {
  if (!curvePath.value) return
  const t = (elapsed % DURATION) / DURATION

  let bend = 0
  if (t < 0.35) {
    const p = t / 0.35
    bend = p * p * 16
  } else if (t < 0.5) {
    const p = (t - 0.35) / 0.15
    bend = 16 * (1 - p * p)
  } else if (t < 0.65) {
    const p = (t - 0.5) / 0.15
    bend = -8 * (1 - p)
  } else if (t < 0.8) {
    const p = (t - 0.65) / 0.15
    bend = -8 * (1 - p) * (1 - p)
  }

  const cx = LINE_WIDTH / 2
  const d = `M 0,10 Q ${cx},${10 + bend} ${LINE_WIDTH},10`
  curvePath.value.setAttribute('d', d)
}

function runAnimLoop(startTime) {
  const step = (now) => {
    if (!isPageLoading.value) return
    const elapsed = now - startTime
    animateCurveLine(elapsed)
    const ball = document.querySelector('.curve-ball')
    if (ball) {
      const t = (elapsed % DURATION) / DURATION
      let y = 0, rotation = 0, scale = 1
      if (t < 0.35) {
        const p = t / 0.35
        y = p * p * BALL_DROP
        rotation = p * 360
        scale = 1 - p * 0.15
      } else if (t < 0.5) {
        const p = (t - 0.35) / 0.15
        y = BALL_DROP - p * BALL_DROP * 0.3
        rotation = 360 + p * 90
        scale = 0.85 + p * 0.05
      } else if (t < 0.85) {
        const p = (t - 0.5) / 0.35
        const ease = 1 - (1 - p) * (1 - p)
        y = BALL_DROP * 0.7 * (1 - ease)
        rotation = 450 + p * 180
        scale = 0.9 + ease * 0.1
      } else {
        y = 0
        rotation = 630
        scale = 1
      }
      ball.style.transform = `translateY(${y}px) rotate(${rotation}deg) scale(${scale})`
    }
    animFrame = requestAnimationFrame(step)
  }
  animFrame = requestAnimationFrame(step)
}

function startLoading() {
  isPageLoading.value = true
  showTime = Date.now()
  // 等 DOM 渲染后再启动动画循环
  setTimeout(() => {
    runAnimLoop(performance.now())
  }, 50)
}

function stopLoading() {
  const elapsed = Date.now() - showTime
  const remaining = MIN_DISPLAY - elapsed
  if (remaining > 0 && showTime > 0) {
    // 已显示时长不足最小值，延迟关闭
    setTimeout(() => {
      isPageLoading.value = false
      if (animFrame) {
        cancelAnimationFrame(animFrame)
        animFrame = null
      }
    }, remaining)
  } else {
    isPageLoading.value = false
    if (animFrame) {
      cancelAnimationFrame(animFrame)
      animFrame = null
    }
  }
}

router.beforeEach((to, from, next) => {
  startLoading()
  next()
})

router.afterEach(() => {
  stopLoading()
})

router.onError(() => {
  stopLoading()
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

.curve-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.curve-ball {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.35);
  will-change: transform;
}

.curve-line {
  width: 120px;
  height: 20px;
  margin-top: -4px;
}

.page-loading-text {
  margin-top: 20px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}
</style>
