<template>
  <div class="carousel-container">
    <el-carousel 
      height="400px" 
      indicator-position="none" 
      :interval="4000"
      @change="handleCarouselChange"
      ref="carouselRef"
    >
      <el-carousel-item v-for="carousel in carousels" :key="carousel.carousel_id || carousel.id">
        <div class="carousel-content" @click="navigateToGame(carousel.link_game_id)">
          <el-image :src="carousel.image_url" fit="cover" class="carousel-image">
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
                <span>轮播图内容</span>
              </div>
            </template>
          </el-image>
          <!-- 游戏信息覆盖层 -->
          <div class="game-info-overlay" v-if="carousel.link_game_id">
            <div class="game-details">
              <div class="game-title">{{ getGameTitle(carousel.link_game_id) }}</div>
            </div>
            <div class="game-price" v-if="getGamePrice(carousel.link_game_id)">
              ¥{{ getGamePrice(carousel.link_game_id) }}
            </div>
          </div>
          
          <!-- 非游戏轮播图的标题 -->
          <div class="carousel-title" v-else-if="carousel.title">{{ carousel.title }}</div>
        </div>
      </el-carousel-item>
      
      <!-- 自定义指示器 -->
      <div class="custom-indicators">
        <span 
          v-for="(item, index) in carousels" 
          :key="index"
          class="indicator-dot"
          :class="{ 'active': currentIndex === index }"
          @click="setActiveItem(index)"
        ></span>
      </div>
    </el-carousel>
    <div v-if="loading" class="loading-overlay">
      <el-skeleton :rows="3" animated />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const router = useRouter()
const carousels = ref([])
const loading = ref(true)
const currentIndex = ref(0)
const carouselRef = ref(null)
const gameData = ref({}) // 存储游戏数据

// 处理轮播图变化事件
const handleCarouselChange = (index) => {
  console.log('轮播图切换到索引:', index)
  currentIndex.value = index
}

// 设置当前活动项
const setActiveItem = (index) => {
  if (carouselRef.value) {
    carouselRef.value.setActiveItem(index)
  }
  currentIndex.value = index;
  console.log('手动设置轮播图索引:', index)
}

const navigateToGame = (gameId) => {
  if (!gameId) return
  
  router.push(`/player/games/${gameId}`)
}

// 获取游戏标题
const getGameTitle = (gameId) => {
  if (!gameId) return ''
  return gameData.value[gameId]?.title || '精彩游戏'
}

// 获取游戏价格
const getGamePrice = (gameId) => {
  if (!gameId) return null
  return gameData.value[gameId]?.price || null
}

// 获取轮播图关联的游戏数据
const fetchGameData = async () => {
  try {
    // 获取所有轮播图关联的游戏ID
    const gameIds = carousels.value
      .filter(carousel => carousel.link_game_id)
      .map(carousel => carousel.link_game_id)
    
    if (gameIds.length === 0) return
    
    console.log('需要获取的游戏ID:', gameIds)
    
    // 批量获取游戏数据
    const promises = gameIds.map(gameId => 
      axios.get(`/api/games/${gameId}`).catch(err => {
        console.error(`获取游戏 ${gameId} 数据失败:`, err)
        return { data: { code: 0 } }
      })
    )
    
    const responses = await Promise.all(promises)
    
    // 处理响应数据
    responses.forEach((response, index) => {
      if (response.data && response.data.code === 1 && response.data.data) {
        const game = response.data.data
        
        gameData.value[game.game_id] = {
          title: game.title,
          price: game.price
        }
        
        console.log(`游戏 ${game.game_id} (${game.title}) 的价格: ${game.price}`)
      }
    })
    
    console.log('获取到的游戏数据:', gameData.value)
  } catch (error) {
    console.error('获取游戏数据失败:', error)
  }
}

const fetchCarousels = async () => {
  try {
    loading.value = true
    console.log('开始获取轮播图数据...')
    
    // 直接获取所有轮播图列表
    const response = await axios.get('/api/carousels', {
      params: {
        page: 1,
        pageSize: 10
      }
    })
    console.log('轮播图原始响应:', response.data)
    
    if (response.data.code === 1) {
      console.log('轮播图数据处理前:', response.data.data)
      
      // 简化数据处理逻辑，直接从响应中提取轮播图数据
      if (response.data.data && response.data.data.rows && Array.isArray(response.data.data.rows)) {
        // 使用rows数组格式的响应（后端实际返回格式）
        carousels.value = response.data.data.rows
        console.log('从rows数组中获取轮播图:', carousels.value)
      } else if (response.data.data && response.data.data.list && Array.isArray(response.data.data.list)) {
        // 分页格式的响应
        carousels.value = response.data.data.list
        console.log('从分页数据中获取轮播图:', carousels.value)
      } else if (Array.isArray(response.data.data)) {
        // 直接返回数组的响应
        carousels.value = response.data.data
        console.log('从数组数据中获取轮播图:', carousels.value)
      } else if (response.data.data) {
        // 单个对象的响应
        carousels.value = [response.data.data]
        console.log('从单个对象中获取轮播图:', carousels.value)
      } else {
        console.warn('未能识别的轮播图数据格式:', response.data)
        carousels.value = []
      }
      
      console.log('轮播图数据处理后:', carousels.value)
      
      // 如果没有轮播图数据，添加默认图片
      if (carousels.value.length === 0) {
        console.log('没有获取到轮播图数据，使用默认轮播图')
        // 添加多个默认轮播图，确保轮播效果
        carousels.value = [
          {
            id: -1,
            image_url: '/images/carousel-default-1.jpg',
            link_game_id: null,
            title: '欢迎来到星期霖游戏平台',
            description: '海量游戏等你体验'
          },
          {
            id: -2,
            image_url: '/images/carousel-default-2.jpg',
            link_game_id: null,
            title: '热门游戏推荐',
            description: '查看本周最受欢迎的游戏'
          },
          {
            id: -3,
            image_url: '/images/carousel-default-3.jpg',
            link_game_id: null,
            title: '限时优惠',
            description: '多款游戏限时折扣中'
          }
        ]
      }
    } else {
      ElMessage.warning(response.data.msg || '获取轮播图数据失败')
      console.warn('API返回错误:', response.data.msg)
      // 添加默认轮播图
      addDefaultCarousel()
    }
  } catch (error) {
    console.error('获取轮播图数据失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    ElMessage.error('网络错误，无法获取轮播图数据')
    // 添加默认轮播图
    addDefaultCarousel()
  } finally {
    loading.value = false
    console.log('轮播图加载完成，最终数据:', carousels.value)
  }
}

// 添加默认轮播图
const addDefaultCarousel = () => {
  // 添加多个默认轮播图，确保轮播效果
  carousels.value = [
    {
      id: -1,
      image_url: '/images/carousel-default-1.jpg',
      link_game_id: null,
      title: '欢迎来到星期霖游戏平台',
      description: '海量游戏等你体验'
    },
    {
      id: -2,
      image_url: '/images/carousel-default-2.jpg',
      link_game_id: null,
      title: '热门游戏推荐',
      description: '查看本周最受欢迎的游戏'
    },
    {
      id: -3,
      image_url: '/images/carousel-default-3.jpg',
      link_game_id: null,
      title: '限时优惠',
      description: '多款游戏限时折扣中'
    }
  ]
  console.log('已添加默认轮播图')
}

onMounted(() => {
  console.log('轮播图组件已挂载，开始获取数据')
  fetchCarousels()
  .then(() => {
    // 获取轮播图关联的游戏数据
    if (carousels.value.length > 0) {
      fetchGameData()
    }
  })
})
</script>

<style scoped>
.carousel-container {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  position: relative;
}

.carousel-content {
  position: relative;
  height: 100%;
  cursor: pointer;
  transition: transform 0.3s;
}

.carousel-content:hover {
  transform: scale(1.02);
}

.carousel-image {
  width: 100%;
  height: 100%;
}

/* 游戏信息覆盖层 */
.game-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
  color: white;
}

.game-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.game-title {
  font-size: 24px;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
}

.game-price {
  font-size: 28px;
  font-weight: bold;
  color: #f56c6c;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
}

/* 非游戏轮播图的标题 */
.carousel-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.5);
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
}

/* 自定义指示器样式 */
.custom-indicators {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 10px;
  z-index: 10;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.indicator-dot.active {
  background-color: rgba(255, 255, 255, 1);
  transform: scale(1.2);
}

.indicator-dot:hover {
  background-color: rgba(255, 255, 255, 0.8);
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
}

.image-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  padding: 20px;
}
</style> 