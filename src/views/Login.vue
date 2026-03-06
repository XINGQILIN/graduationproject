<template>
  <div class="login-container">
    <!-- 添加背景图片 -->
    <div class="background-image">
      <img src="../assets/images/bcsz.png" alt="登录背景" />
    </div>

    <div class="login-form-container">
      <h1 class="login-title">用户登录</h1>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入账号"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="role">
          <el-select
            v-model="loginForm.role"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            type="danger"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-options">
        <router-link to="/register" class="register-link">还没有账号？ 请 注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()


// 登录表单引用
const loginFormRef = ref(null)

// 登录状态
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  role: 'user' // 默认选择普通用户
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 50, message: '账号长度应在3到50个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6到20个字符之间', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 登录处理
const handleLogin = async () => {
  try {
    loading.value = true

    // 表单验证
    await loginFormRef.value.validate()

    // 发送登录请求
    const response = await axios.post('/api/login', {
      username: loginForm.username,
      password: loginForm.password
    })

    if (response.data && response.data.code === 1) {
      // 登录成功后处理
      await handleLoginSuccess(response)
    } else {
      ElMessage.error(response.data?.msg || '登录失败')
    }
  } catch (error) {
    console.error('登录错误:', error)
    ElMessage.error(error.response?.data?.msg || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 登录成功后的处理
const handleLoginSuccess = (response) => {
  const { token, user } = response.data.data

  // 保存token到localStorage
  localStorage.setItem('token', token)

  console.log('登录成功，获取完整用户信息...')

  // 获取完整的用户信息
  axios.get('/api/users/current', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(userResponse => {
    console.log('获取到的完整用户信息:', userResponse.data)

    if (userResponse.data.code === 1) {
      const userData = userResponse.data.data
      console.log('解析后的用户数据:', userData)

      // 添加时间戳到头像URL，避免缓存
      if (userData.avatar) {
        const timestamp = new Date().getTime()
        userData.avatar = `${userData.avatar}?t=${timestamp}`
        console.log('获取到的头像URL(带时间戳):', userData.avatar)
      }

      // 保存用户信息到localStorage
      localStorage.setItem('userInfo', JSON.stringify(userData))
      console.log('已保存带时间戳的头像URL到localStorage:', userData.avatar)

      // 同时保存到sessionStorage，以便在其他页面使用
      sessionStorage.setItem('userAvatar', userData.avatar || '')
      console.log('已保存带时间戳的头像URL到sessionStorage')

      // 根据用户角色重定向到不同页面
      if (userData.role === 'admin') {
        router.push('/home')  // 管理员跳转到管理员首页
      } else {
        router.push('/PlayerHome')  // 普通用户跳转到用户首页
      }
    }
  }).catch(error => {
    console.error('获取用户信息失败:', error)
    // 即使获取详细信息失败，也允许用户登录
    // 根据基本角色信息重定向
    if (user.role === 'admin') {
      router.push('/home')  // 管理员跳转到管理员首页
    } else {
      router.push('/PlayerHome')  // 普通用户跳转到用户首页
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;
}

/* 添加背景图片样式 */
/* 优化版背景图片样式 */
.background-image {
  position: fixed;  /* 改为固定定位 */
  top: 0;
  left: 0;
  width: 100vw;    /* 使用视窗单位 */
  height: 100vh;
  z-index: 0;
  overflow: hidden; /* 防止滚动白边 */
  transform: translateZ(0); /* 触发GPU加速 */
}

.background-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top; /* 重点保护顶部区域 */
  opacity: 0.9;
  min-height: 110vh; /* 增加高度裕量 */
  transform: scale(1.05); /* 微放大防止边缘留白 */
}

/* 以下原有样式完全保留 */
.login-form-container {
  position: relative;
  z-index: 1;
  width: 380px;
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}


.login-form {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  height: 40px;
  font-size: 16px;
  background-color: #c45a65;
  border-color: #c45a65;
}

.login-button:hover,
.login-button:focus {
  background-color: #d4717a;
  border-color: #d4717a;
}

.login-options {
  display: flex;
  justify-content: flex-end;
}

.register-link {
  color: #c45a65;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c45a65 inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #c45a65 inset !important;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #c45a65 inset !important;
}

:deep(.el-select-dropdown__item.selected) {
  color: #c45a65;
}
</style>
