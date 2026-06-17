<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">
        <el-icon :size="40" color="#ffd700"><User /></el-icon>
        <h2>基建-管理系统</h2>
        <p>Auth System</p>
      </div>
      <el-form
        ref="loginForm"
        :model="form"
        :rules="rules"
        class="login-form"
        label-width="0"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">
        <el-tag type="info">测试账号：admin / admin123</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()
const loginForm = ref(null)
const loading = ref(false)

const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!loginForm.value) return

  // 使用 Promise 方式校验表单，确保异常能被正确捕获
  let valid = false
  try {
    valid = await loginForm.value.validate()
  } catch (e) {
    // 表单校验失败，直接返回
    console.log('[登录页] 表单校验未通过')
    return
  }

  if (!valid) return

  loading.value = true
  try {
    console.log('[登录页] 开始登录，用户名:', form.value.username)
    const ok = await userStore.login({ username: form.value.username, password: form.value.password })
    if (ok) {
      console.log('[登录页] 登录成功，正在获取用户信息...')
      ElMessage.success('登录成功，欢迎回来！')
      await userStore.getUserInfo()
      console.log('[登录页] 跳转至首页')
      router.push('/home')
    } else {
      console.warn('[登录页] 登录失败')
      ElMessage.error('登录失败，请检查用户名密码')
    }
  } catch (e) {
    console.error('[登录页] 登录异常，停留在登录页:', e.message)
    ElMessage.error('登录失败：' + (e.message || '未知错误'))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 15%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(255, 215, 0, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(100, 100, 200, 0.06) 0%, transparent 40%);
  pointer-events: none;
}

.login-box {
  position: relative;
  z-index: 10;
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 0 60px rgba(255, 215, 0, 0.03);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
}

.login-title h2 {
  margin: 10px 0 5px;
  color: #fff;
  font-size: 24px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.login-title p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

:deep(.login-form .el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: none;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

:deep(.login-form .el-input__wrapper:hover) {
  border-color: rgba(255, 215, 0, 0.5);
}

:deep(.login-form .el-input__wrapper.is-focus) {
  border-color: #ffd700;
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2);
}

:deep(.login-form .el-input__inner) {
  color: #fff;
}

:deep(.login-form .el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

:deep(.login-form .el-input__prefix .el-icon) {
  color: rgba(255, 255, 255, 0.5);
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
  border: none;
  color: #1a1a2e;
  font-weight: 600;
  letter-spacing: 2px;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: linear-gradient(135deg, #ffea00 0%, #ffa500 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
}

.login-tip {
  text-align: center;
  margin-top: 20px;
}

:deep(.login-tip .el-tag) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
}
</style>
