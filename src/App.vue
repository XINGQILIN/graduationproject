<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { HomeFilled, Setting, User, Monitor, Menu, ArrowDown, Key, SwitchButton } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as jwtDecode from 'jwt-decode'

const router = useRouter()
const route = useRoute()
const isCollapse = ref(false)
const activeMenu = ref('')
const userAvatar = ref('')
const username = ref('')
const userRole = ref('')

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 计算当前激活的菜单项
const activeMenuComputed = computed(() => {
  return route.path
})

// 判断当前用户是否是管理员
const isAdmin = computed(() => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return userInfo.role === 'admin'
  } catch (error) {
    console.error('获取用户角色失败:', error)
    return false
  }
})

// 判断当前用户是否是普通用户
const isUser = computed(() => {
  return userRole.value === 'user'
})

// 判断当前路由是否是用户路由
const isUserRoute = computed(() => {
  return route.path.startsWith('/PlayerHome') || route.path.startsWith('/player')
})

// 判断当前是否是登录或注册页面
const isLoginPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})

// 获取用户信息
const getUserInfo = () => {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = jwtDecode.jwtDecode(token)
      userRole.value = decoded.role
      username.value = decoded.username

      // 从localStorage获取用户信息
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      userAvatar.value = userInfo.avatar || defaultAvatar

      console.log('当前用户角色:', userRole.value)
    } else {
      userRole.value = ''
      username.value = ''
      userAvatar.value = defaultAvatar
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    userRole.value = ''
    username.value = ''
    userAvatar.value = defaultAvatar
  }
}

// 跳转到个人信息页面
const goToPersonalInfo = () => {
  router.push('/personal-info')
}

// 跳转到修改密码页面
const goToChangePassword = () => {
  router.push('/change-password')
}

// 退出登录
const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')

  ElMessage.success('退出登录成功')
  router.push('/login').then(() => {
    window.location.reload() // 新增：强制刷新页面
  })
}

// const logout = () => {
//   localStorage.removeItem('token')
//   localStorage.removeItem('userInfo')
//   ElMessage.success('退出登录成功')
//   router.push('/login')
// }

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath

    // 如果是登录页或注册页，不做处理
    if (isLoginPage.value) return

    // 根据用户角色和当前路由设置页面标题
    updatePageTitle()
  }
)

// 更新页面标题
const updatePageTitle = () => {
  // 获取当前路由的meta信息中的标题
  const pageTitle = route.meta.title || ''

  // 根据用户角色设置不同的标题前缀
  if (userRole.value === 'admin') {
    document.title = pageTitle ? `管理系统 - ${pageTitle}` : '星期霖游戏管理系统'
  } else if (userRole.value === 'user') {
    document.title = pageTitle ? `游戏平台 - ${pageTitle}` : '星期霖游戏平台'
  }
}

// 初始化
onMounted(() => {
  getUserInfo()
  activeMenu.value = route.path

  // 根据用户角色重定向到对应首页
  if (!isLoginPage.value) {
    if (userRole.value === 'admin' && isUserRoute.value) {
      router.push('/home')
    } else if (userRole.value === 'user' && !isUserRoute.value && route.path !== '/') {
      router.push('/PlayerHome')
    }
  }

  // 初始设置页面标题
  updatePageTitle()
})

// 根据路由选择布局
const layout = computed(() => {
  // 如果是登录或注册页面，不使用布局
  if (isLoginPage.value) return 'div'

  // 如果路径以 /PlayerHome 开头，使用用户布局
  if (route.path.startsWith('/PlayerHome')) return 'player-layout'

  // 默认使用管理员布局
  return 'admin-layout'
})
</script>

<template>
  <div class="app-container">
    <!-- 登录/注册页面 -->
    <template v-if="isLoginPage">
      <router-view />
    </template>

    <!-- 管理员界面 -->
    <template v-else-if="isAdmin">
      <!-- 管理员布局 -->
      <div class="admin-header">
        <div class="logo">
          <img src="@/assets/logo.png" alt="Logo" class="logo-image">
          <span class="logo-text">星期霖游戏管理系统</span>
        </div>
        <div class="user-info">
          <el-dropdown trigger="click">
            <div class="avatar-wrapper">
              <span>管理员</span>
              <el-avatar :size="32" :src="userAvatar">
                {{ username ? username.charAt(0).toUpperCase() : 'A' }}
              </el-avatar>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToPersonalInfo">
                  <el-icon><user /></el-icon>个人信息
                </el-dropdown-item>
                <el-dropdown-item @click="goToChangePassword">
                  <el-icon><key /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item divided @click="logout">
                  <el-icon><switch-button /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="main-container">
        <!-- 左侧导航栏 -->
        <div class="sidebar">
          <el-menu
            :default-active="activeMenu"
            class="sidebar-menu"
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b"
            router
          >
            <el-menu-item index="/home">
              <el-icon><HomeFilled /></el-icon>
              <span>系统首页</span>
            </el-menu-item>

            <!-- 游戏信息管理 -->
            <el-sub-menu index="1">
              <template #title>
                <el-icon><Menu /></el-icon>
                <span>游戏信息管理</span>
              </template>
              <el-menu-item index="/game/category">分类管理</el-menu-item>
              <el-menu-item index="/game/GameManage">游戏管理</el-menu-item>
              <el-menu-item index="/game/order">订单管理</el-menu-item>
              <el-menu-item index="/game/refund">退款管理</el-menu-item>
              <el-menu-item index="/game/comment">评论管理</el-menu-item>
            </el-sub-menu>

            <!-- 系统信息管理 -->
            <el-sub-menu index="2">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>系统信息管理</span>
              </template>
              <el-menu-item index="/system/announcement">公告管理</el-menu-item>
              <el-menu-item index="/system/carousel">轮播图管理</el-menu-item>
            </el-sub-menu>

            <!-- 用户信息管理 -->
            <el-sub-menu index="3">
              <template #title>
                <el-icon><User /></el-icon>
                <span>用户信息管理</span>
              </template>
              <el-menu-item index="/user/UserManagement">用户与管理员</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>

        <!-- 主内容区域 -->
        <div class="content">
          <router-view />
        </div>
      </div>
    </template>

    <!-- 用户界面 -->
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 60px;
  background-color: #409EFF;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 40px;
  margin-right: 10px;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background-color: #545c64;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.sidebar-menu {
  height: 100%;
  border-right: none;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f0f2f5;
}
</style>
