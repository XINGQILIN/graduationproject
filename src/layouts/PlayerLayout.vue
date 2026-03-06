<template>
  <div class="player-layout">
    <!-- 第一行：顶部标题栏 -->
    <header class="header">
      <div class="header-content">
        <!-- 左侧Logo和标题 -->
        <img src="@/assets/logo.png" alt="Logo" class="logo-image">
        <router-link to="/PlayerHome" class="logo">
          星期霖游戏平台
        </router-link>
        
        <!-- 右侧用户信息 -->
        <div class="user-info">
          <el-dropdown trigger="hover">
            <span class="user-dropdown">
              <span class="username">{{ userInfo.username }}</span>
              <el-avatar :size="32" :src="userInfo.avatar">
                {{ userInfo.username ? userInfo.username.charAt(0).toUpperCase() : 'U' }}
              </el-avatar>
              <el-icon class="dropdown-icon"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToPersonalInfo">个人信息</el-dropdown-item>
                <el-dropdown-item @click="goToChangePassword">修改密码</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    
    <!-- 第二行：功能导航菜单 -->
    <div class="function-menu">
      <div class="menu-content">
        <!-- 游戏分类下拉菜单 -->
        <el-dropdown trigger="hover" @command="handleCategorySelect" class="category-dropdown">
          <span class="menu-button">
            游戏分类
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="all">全部游戏</el-dropdown-item>
              <el-dropdown-item v-for="category in categories" :key="category.id" :command="category.id">
                {{ category.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        
        <!-- 其他功能按钮 -->
        <el-button 
          v-for="menu in menuItems" 
          :key="menu.path" 
          class="menu-button"
          :class="{ active: activeMenu === menu.name }"
          @click="navigateTo(menu.path)"
        >
          {{ menu.title }}
        </el-button>
      </div>
    </div>
    
    <!-- 第三行：主内容区域 -->
    <main class="main-content">
      <div class="content-container">
        <router-view />
      </div>
    </main>
    
    <!-- 底部版权信息 -->
    <footer class="footer">
      <div class="footer-content">
        <p>© 2025 星期霖游戏平台 版权所有</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { ArrowDown } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const activeMenu = ref('')

// 用户信息
const userInfo = ref({
  username: '',
  avatar: '',
  role: ''
})

// 游戏分类
const categories = ref([
  { id: 1, name: '动作游戏' },
  { id: 2, name: '冒险游戏' },
  { id: 3, name: '角色扮演' },
  { id: 4, name: '策略游戏' },
  { id: 5, name: '模拟游戏' },
  { id: 6, name: '体育游戏' }
])

// 菜单项
const menuItems = [
  { title: '个人仓库', path: '/player/library', name: 'Library' },
  { title: '我的收藏', path: '/player/favorites', name: 'Favorites' },
  { title: '我的评论', path: '/player/comments', name: 'Comments' },
  { title: '购物车', path: '/player/cart', name: 'Cart' },
  { title: '退款详情', path: '/player/refunds', name: 'Refunds' }
]

// 处理分类选择
const handleCategorySelect = (command) => {
  console.log('选择分类:', command)
  if (command === 'all') {
    router.push('/player/games')
  } else {
    router.push({
      path: '/player/games',
      query: { category_id: command }
    })
  }
}

// 导航到指定路径
const navigateTo = (path) => {
  console.log('导航到:', path)
  router.push(path)
}

// 处理退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清除本地存储的用户信息和token
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    sessionStorage.removeItem('userAvatar')
    
    ElMessage.success('已退出登录')
    
    // 跳转到登录页
    router.push('/login')
  } catch {
    // 用户取消退出
  }
}

// 加载用户信息
const loadUserInfo = () => {
  const storedUserInfo = localStorage.getItem('userInfo')
  if (storedUserInfo) {
    try {
      const parsedInfo = JSON.parse(storedUserInfo)
      userInfo.value = {
        username: parsedInfo.username || '用户',
        avatar: parsedInfo.avatar || '',
        role: parsedInfo.role || 'user'
      }
    } catch (error) {
      console.error('解析用户信息失败:', error)
    }
  }
}

// 获取游戏分类
const fetchCategories = async () => {
  try {
    console.log('正在获取导航栏游戏分类...')
    const response = await axios.get('/api/game-categories', {
      params: {
        pageSize: 100 // 设置一个足够大的值以获取所有分类
      }
    })
    
    if (response.data && response.data.code === 1) {
      console.log('获取分类成功，原始数据:', response.data.data)
      
      // 检查数据结构
      let categoriesData = response.data.data;
      
      // 如果是分页结构 {total, rows}，则使用rows
      if (categoriesData.rows && Array.isArray(categoriesData.rows)) {
        console.log('检测到分页数据结构，使用rows数组')
        categoriesData = categoriesData.rows;
      } else if (!Array.isArray(categoriesData)) {
        console.error('无法识别的分类数据结构:', categoriesData)
        categoriesData = [];
      }
      
      categories.value = categoriesData.map(category => {
        return {
          id: category.id || category.category_id,
          name: category.name
        }
      });
      
      console.log('处理后的分类数据:', categories.value)
    }
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 监听路由变化，更新活动菜单
watch(() => route.path, (newPath) => {
  const menuItem = menuItems.find(item => item.path === newPath)
  if (menuItem) {
    activeMenu.value = menuItem.name
  } else if (newPath.includes('/Categories')) {
    activeMenu.value = 'Categories'
  } else {
    activeMenu.value = ''
  }
})

onMounted(() => {
  loadUserInfo()
  fetchCategories()
  
  // 初始化活动菜单
  const currentPath = route.path
  const menuItem = menuItems.find(item => item.path === currentPath)
  if (menuItem) {
    activeMenu.value = menuItem.name
  } else if (currentPath.includes('/Categories')) {
    activeMenu.value = 'Categories'
  }
})

// 跳转到个人信息页面
const goToPersonalInfo = () => {
  router.push('/PlayerHome/personal-info')
}

// 跳转到修改密码页面
const goToChangePassword = () => {
  router.push('/PlayerHome/change-password')
}
</script>

<style scoped>
.player-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 第一行：顶部标题栏 */
.header {
  background-color:rgba(121, 188, 255, 0.76);
  color: white;
  width: 100%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}

.logo-image {
  height: 40px;
  margin-right: 10px;
  border-radius: 8px;
}

.logo {
  color: white;
  font-size: 20px;
  font-weight: bold;
  text-decoration: none;
  transition: color 0.3s;
  margin-right: auto; /* 将标题推到左侧 */
}

.logo:hover {
  color: #f0f0f0;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.user-dropdown:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.username {
  margin-right: 8px;
  font-weight: 500;
  color: white;
}

.dropdown-icon {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

/* 第二行：功能导航菜单 */
.function-menu {
  background-color:rgb(250, 205, 224); /* 浅粉色背景 */
  padding: 10px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.menu-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between; /* 平均分布按钮 */
  align-items: center;
  padding: 0 20px;
}

.menu-button {
  display: inline-block;
  padding: 8px 16px;
  color: #333;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
  background-color:rgb(250, 205, 224);  /* 浅粉色背景 */
  border: 1px solid #f0d0d3;  /* 浅粉色边框 */
  margin: 0 5px; /* 增加按钮间距 */
  text-align: center;
}

.menu-button:hover {
  background-color:rgba(255, 165, 178, 0.96); /* 鼠标悬停时的背景色 */
  color: #fff;
}

.menu-button.active {
  background-color:rgb(255, 99, 177); /* 活跃状态的背景色 */
  color: #fff;
}

/* 确保下拉菜单样式匹配 */
.category-dropdown {
  margin: 0 5px;
}

/* 第三行：主内容区域 */
.main-content {
  flex: 1;
  width: 100%;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
}

.content-container {
  width: 1200px;
  max-width: 100%;
  padding: 20px;
}

.footer {
  background-color: #fff;
  width: 100%;
  padding: 20px 0;
  text-align: center;
  color: #909399;
  border-top: 1px solid #ebeef5;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .content-container {
    width: 100%;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: wrap;
    height: auto;
    padding: 10px;
  }
  
  .logo {
    margin-right: 0;
    width: 100%;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .user-info {
    width: 100%;
    justify-content: center;
  }
  
  .menu-content {
    justify-content: space-around; /* 在小屏幕上使用space-around */
    flex-wrap: wrap;
  }
  
  .menu-button {
    margin: 5px;
  }
}
</style> 