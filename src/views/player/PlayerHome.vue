<template>
  <div class="player-home scrollable">
    <!-- 轮播图区域 -->
    <div class="carousel-section">
      <Carousel />
    </div>
    
    <!-- 主内容区域 -->
    <div class="main-content-wrapper">
      <!-- 热门游戏和公告区域 -->
      <div class="top-section">
        <!-- 热门游戏区域 -->
        <div class="games-section hot-games-section">
          <div class="section-header">
            <h2>热门游戏</h2>
            <el-link type="primary" @click="viewMoreHotGames">查看更多</el-link>
          </div>
          
          <div v-if="loadingHotGames" class="loading-games">
            <el-skeleton :rows="1" animated>
              <template #template>
                <div style="display: flex; justify-content: space-between;">
                  <el-skeleton-item variant="image" style="width: 180px; height: 120px; margin-right: 20px" />
                  <el-skeleton-item variant="image" style="width: 180px; height: 120px; margin-right: 20px" />
                  <el-skeleton-item variant="image" style="width: 180px; height: 120px; margin-right: 20px" />
                </div>
              </template>
            </el-skeleton>
          </div>
          
          <div v-else-if="hotGames.length === 0" class="empty-games">
            暂无热门游戏
          </div>
          
          <div v-else class="games-grid">
            <div 
              v-for="game in hotGames" 
              :key="game.id" 
              class="game-card"
              @click="router.push(`/player/game/${game.id}`)"
            >
              <div class="game-cover">
                <el-image :src="game.coverImage" fit="cover">
                  <template #error>
                    <div class="image-placeholder">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
              </div>
              <div class="game-info">
                <h3 class="game-title">{{ game.title }}</h3>
                <div class="game-price">¥{{ game.price }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 系统公告区域 -->
        <div class="announcements-section">
          <div class="section-header">
            <h2>系统公告</h2>
            <el-link type="primary" @click="viewAllAnnouncements">查看更多</el-link>
          </div>
          
          <div v-if="loadingAnnouncements" class="loading-announcements">
            <el-skeleton :rows="5" animated />
          </div>
          
          <div v-else-if="announcements.length === 0" class="empty-announcements">
            暂无公告
          </div>
          
          <div v-else class="announcement-list">
            <div 
              v-for="announcement in displayedAnnouncements" 
              :key="announcement.announce_id"
              class="announcement-item"
            >
              <div class="announcement-header">
                <div class="announcement-title">{{ announcement.title }}</div>
                <div class="announcement-date">{{ formatDate(announcement.publish_time) }}</div>
              </div>
              <div class="announcement-content">{{ announcement.content }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 新发布游戏区域 -->
      <div class="games-section new-games-section">
        <div class="section-header">
          <h2>新发布游戏</h2>
          <el-link type="primary" @click="viewMoreNewGames">查看更多</el-link>
        </div>
        
        <div v-if="loadingNewGames" class="loading-games">
          <el-skeleton :rows="1" animated>
            <template #template>
              <div style="display: flex; justify-content: space-between;">
                <el-skeleton-item variant="image" style="width: 180px; height: 120px; margin-right: 20px" />
                <el-skeleton-item variant="image" style="width: 180px; height: 120px; margin-right: 20px" />
                <el-skeleton-item variant="image" style="width: 180px; height: 120px; margin-right: 20px" />
              </div>
            </template>
          </el-skeleton>
        </div>
        
        <div v-else-if="newGames.length === 0" class="empty-games">
          暂无新发布游戏
        </div>
        
        <div v-else class="games-grid">
          <div 
            v-for="game in newGames" 
            :key="game.id" 
            class="game-card"
            @click="router.push(`/player/game/${game.id}`)"
          >
            <div class="game-cover">
              <el-image :src="game.coverImage" fit="cover">
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="game-info">
              <h3 class="game-title">{{ game.title }}</h3>
              <div class="game-price">¥{{ game.price }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 公告详情弹窗 -->
    <el-dialog
      v-model="announcementDialogVisible"
      title="系统公告"
      width="70%"
      class="announcement-dialog"
    >
      <div v-if="loadingAllAnnouncements" class="dialog-loading">
        <el-skeleton :rows="10" animated />
      </div>
      
      <div v-else-if="allAnnouncements.length === 0" class="dialog-empty">
        暂无公告
      </div>
      
      <div v-else class="dialog-announcement-list">
        <div 
          v-for="announcement in allAnnouncements" 
          :key="announcement.announce_id"
          class="dialog-announcement-item"
        >
          <div class="dialog-announcement-header">
            <h3 class="dialog-announcement-title">{{ announcement.title }}</h3>
            <span class="dialog-announcement-date">{{ formatDate(announcement.publish_time) }}</span>
          </div>
          <div class="dialog-announcement-content">{{ announcement.content }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import axios from 'axios'
import Carousel from './Carousel.vue'

const router = useRouter()

// 热门游戏数据
const hotGames = ref([])
const loadingHotGames = ref(true)

// 新发布游戏数据
const newGames = ref([])
const loadingNewGames = ref(true)

// 公告数据
const announcements = ref([])
const loadingAnnouncements = ref(true)
const announcementDialogVisible = ref(false)
const allAnnouncements = ref([])
const loadingAllAnnouncements = ref(false)

// 只显示前5条公告
const displayedAnnouncements = computed(() => {
  return announcements.value.slice(0, 8)
})

// 导航到游戏详情页
const navigateToGame = (gameId) => {
  console.log('导航到游戏详情页，游戏ID:', gameId)
  router.push(`/player/game/${gameId}`)
}

// 查看更多热门游戏
const viewMoreHotGames = () => {
  console.log('查看更多热门游戏')
  router.push('/player/games?sort=popular')
}

// 查看更多新发布游戏
const viewMoreNewGames = () => {
  console.log('查看更多新发布游戏')
  router.push('/player/games?sort=newest')
}

// 查看所有公告
const viewAllAnnouncements = async () => {
  announcementDialogVisible.value = true
  
  if (allAnnouncements.value.length === 0) {
    loadingAllAnnouncements.value = true
    try {
      const response = await axios.get('/api/announcements', {
        params: {
          pageSize: 50,  // 获取更多公告
          page: 1
        }
      })
      
      if (response.data && response.data.code === 1) {
        allAnnouncements.value = response.data.data.rows || []
      } else {
        console.error('获取所有公告失败:', response.data?.msg || '未知错误')
      }
    } catch (error) {
      console.error('获取所有公告列表失败:', error)
    } finally {
      loadingAllAnnouncements.value = false
    }
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取公告列表
const fetchAnnouncements = async () => {
  loadingAnnouncements.value = true
  try {
    const response = await axios.get('/api/announcements', {
      params: {
        pageSize: 10,  // 获取最新的10条公告
        page: 1
      }
    })
    
    if (response.data && response.data.code === 1) {
      announcements.value = response.data.data.rows || []
      console.log('获取到的公告数据:', announcements.value)
    } else {
      console.error('获取公告失败:', response.data?.msg || '未知错误')
    }
  } catch (error) {
    console.error('获取公告列表失败:', error)
  } finally {
    loadingAnnouncements.value = false
  }
}

// 获取热门游戏数据
const fetchHotGames = async () => {
  loadingHotGames.value = true
  try {
    // 获取所有游戏，然后随机选择6个作为热门游戏
    const response = await axios.get('/api/games', {
      params: {
        pageSize: 20,
        page: 1
      }
    })
    
    if (response.data && response.data.code === 1) {
      const allGames = response.data.data.rows || []
      
      // 如果游戏数量足够，随机选择6个
      if (allGames.length > 0) {
        // 随机打乱游戏数组
        const shuffled = [...allGames].sort(() => 0.5 - Math.random())
        // 取前6个
        hotGames.value = shuffled.slice(0, 6).map(game => ({
          id: game.game_id,
          title: game.title,
          price: game.price,
          coverImage: game.cover_image || '/game-covers/default.jpg'
        }))
      }
      
      console.log('获取到的热门游戏数据:', hotGames.value)
    } else {
      console.error('获取热门游戏失败:', response.data?.msg || '未知错误')
    }
  } catch (error) {
    console.error('获取热门游戏列表失败:', error)
  } finally {
    loadingHotGames.value = false
  }
}

// 获取新发布游戏数据
const fetchNewGames = async () => {
  loadingNewGames.value = true
  try {
    // 获取按发布时间排序的游戏
    const response = await axios.get('/api/games', {
      params: {
        pageSize: 8,  // 增加到8个游戏，显示在2行4列的网格中
        page: 1,
        sort: 'release_date',
        order: 'desc'
      }
    })
    
    if (response.data && response.data.code === 1) {
      const games = response.data.data.rows || []
      newGames.value = games.map(game => ({
        id: game.game_id,
        title: game.title,
        price: game.price,
        coverImage: game.cover_image || '/game-covers/default.jpg'
      }))
      
      console.log('获取到的新发布游戏数据:', newGames.value)
    } else {
      console.error('获取新发布游戏失败:', response.data?.msg || '未知错误')
    }
  } catch (error) {
    console.error('获取新发布游戏列表失败:', error)
  } finally {
    loadingNewGames.value = false
  }
}

onMounted(() => {
  fetchHotGames()
  fetchNewGames()
  fetchAnnouncements()
  
  // 确保页面可以滚动
  document.body.style.overflow = 'auto'
})

onUnmounted(() => {
  // 恢复默认设置
  document.body.style.overflow = ''
})
</script>

<style scoped>
.player-home {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.scrollable {
  overflow-y: auto;
}

.carousel-section {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.main-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-section {
  display: flex;
  gap: 20px;
}

.hot-games-section {
  flex: 1;
  max-width: calc(100% - 320px);
}

.announcements-section {
  width: 300px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 15px;
  height: 600px;
}

.new-games-section {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.games-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.new-games-section .games-grid {
  grid-template-columns: repeat(4, 1fr);  /* 4列布局 */
  grid-template-rows: repeat(2, auto);    /* 2行布局 */
}

.game-card {
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.game-cover {
  height: 150px;
  overflow: hidden;
}

.game-cover .el-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}

.game-card:hover .game-cover .el-image {
  transform: scale(1.05);
}

.game-info {
  padding: 10px;
}

.game-title {
  margin: 0 0 10px;
  font-size: 16px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

.announcement-list {
  max-height: 520px;
  overflow-y: auto;
}

.announcement-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.announcement-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.announcement-item:hover {
  background-color: #f5f7fa;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.announcement-title {
  font-weight: bold;
  color: #303133;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.announcement-date {
  color: #909399;
  font-size: 12px;
}

.announcement-content {
  color: #606266;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.loading-announcements {
  padding: 10px;
}

.empty-announcements {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.loading-games {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
}

.empty-games {
  padding: 40px 0;
  text-align: center;
  color: #909399;
  background-color: #fff;
  border-radius: 4px;
  margin-bottom: 20px;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
  background-color: #f5f7fa;
}

.image-placeholder .el-icon {
  font-size: 30px;
  margin-bottom: 10px;
}

/* 弹窗样式 */
.dialog-announcement-list {
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-announcement-item {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 15px;
}

.dialog-announcement-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.dialog-announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dialog-announcement-title {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.dialog-announcement-date {
  color: #909399;
  font-size: 14px;
}

.dialog-announcement-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;
}

.dialog-loading {
  padding: 20px;
}

.dialog-empty {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .top-section {
    flex-direction: column;
  }
  
  .hot-games-section {
    max-width: 100%;
  }
  
  .announcements-section {
    width: 100%;
  }
  
  .new-games-section .games-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .games-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .new-games-section .games-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style> 