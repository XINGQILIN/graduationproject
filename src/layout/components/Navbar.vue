<template>
  <div class="navbar">
    <!-- 其他导航栏内容 -->
    <div class="right-menu">
      <div class="avatar-container">
        <el-dropdown trigger="click">
          <div class="avatar-wrapper">
            <!-- 使用带时间戳的头像URL -->
            <el-avatar :size="32" :src="avatarUrl" />
            <span class="username">管理员</span>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goToPersonalInfo">个人信息</el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const avatarUrl = ref('/default-avatar.png')

// 从localStorage更新头像
const updateAvatarFromLocalStorage = () => {
  try {
    // 首先尝试从localStorage获取
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr)
      if (userInfo.avatar) {
        avatarUrl.value = userInfo.avatar
        console.log('Navbar - 从localStorage更新头像:', userInfo.avatar)
      }
    } else {
      // 尝试从sessionStorage获取
      const sessionAvatar = sessionStorage.getItem('userAvatar')
      if (sessionAvatar) {
        avatarUrl.value = sessionAvatar
        console.log('Navbar - 从sessionStorage更新头像:', sessionAvatar)
      }
    }
  } catch (error) {
    console.error('Navbar - 更新头像失败:', error)
  }
}

// 处理头像更新事件
const handleAvatarUpdated = (event) => {
  console.log('Navbar - 收到头像更新事件')
  if (event.detail) {
    avatarUrl.value = event.detail
    console.log('Navbar - 从事件更新头像:', event.detail)
  } else {
    // 如果事件中没有头像URL，从localStorage获取
    updateAvatarFromLocalStorage()
  }
}

// 跳转到个人信息页面
const goToPersonalInfo = () => {
  router.push('/personal-info')
}

// 退出登录
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  sessionStorage.removeItem('userAvatar')
  router.push('/login')
}

onMounted(() => {
  console.log('Navbar组件已挂载')
  
  // 初始化时从localStorage获取头像
  updateAvatarFromLocalStorage()
  
  // 监听头像更新事件
  window.addEventListener('avatar-updated', handleAvatarUpdated)
})

onBeforeUnmount(() => {
  // 组件卸载时清理
  window.removeEventListener('avatar-updated', handleAvatarUpdated)
})
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 50px;
  padding: 0 15px;
  background-color: #409EFF;
}

.right-menu {
  display: flex;
  align-items: center;
}

.avatar-container {
  margin-left: 10px;
  cursor: pointer;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
}

.username {
  margin-left: 8px;
  color: white;
  font-size: 14px;
}
</style> 