<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">
        <el-icon :size="40" color="#409EFF"><User /></el-icon>
        <h2>权限管理系统</h2>
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
          <el-input v-model="form.username" placeholder="用户名" size="large" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" placeholder="密码" size="large" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">
        <el-tag type="info">测试账号：admin / 123456</el-tag>
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
  loginForm.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const ok = await userStore.login({ username: form.value.username, password: form.value.password })
      if (ok) {
        ElMessage.success('登录成功')
        await userStore.getUserInfo()
        router.push('/home')
      } else {
        ElMessage.error('登录失败，请检查用户名密码')
      }
    } catch (e) {
      ElMessage.error('登录失败：' + (e.message || '未知错误'))
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
}

.login-title h2 {
  margin: 10px 0 5px;
  color: #333;
  font-size: 24px;
}

.login-title p {
  color: #999;
  margin: 0;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
}

.login-tip {
  text-align: center;
  margin-top: 20px;
}
</style>
