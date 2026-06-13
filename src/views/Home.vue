<template>
  <div class="home-page">
    <div class="welcome-empty">
      <el-icon :size="48" color="#c0c4cc"><House /></el-icon>
      <p style="color: #909399; margin-top: 12px;">欢迎使用基建管理系统</p>
    </div>
  </div>
</template>

<script setup>
import { House } from '@element-plus/icons-vue'
</script>

<style scoped>
.home-page { padding: 0; }

.welcome-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #909399;
}
</style>
