<template>
  <div class="header">
    <!-- 其他导航栏内容 -->
    <div class="user-info">
      <el-avatar :src="avatarUrl" @click="goToPersonalInfo"></el-avatar>
      <span>{{ username }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const avatarUrl = ref('')
const username = ref('')

// 从localStorage获取用户信息
const loadUserInfo = () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr)
      avatarUrl.value = userInfo.avatar || ''
      username.value = userInfo.username || ''
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 跳转到个人信息页面
const goToPersonalInfo = () => {
  router.push('/personal-info')
}

onMounted(() => {
  // 初始加载用户信息
  loadUserInfo()
  
  // 监听头像更新事件
  window.addEventListener('userAvatarChanged', (event) => {
    if (event.detail && event.detail.avatar) {
      avatarUrl.value = event.detail.avatar
    }
  })
})
</script> 