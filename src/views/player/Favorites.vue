<template>
  <div class="favorites-container">
    <h1 class="page-title">我的收藏</h1>
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索收藏的游戏..."
        prefix-icon="Search"
        clearable
        @input="filterFavorites"
        class="search-input"
      />
      
      <div class="action-buttons" v-if="selectedFavorites.length > 0">
        <el-button type="danger" @click="batchRemoveFavorites">
          <el-icon><Delete /></el-icon> 批量删除
        </el-button>
      </div>
    </div>
    
    <!-- 收藏列表 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="filteredFavorites.length === 0" class="empty-favorites">
      <el-empty description="您还没有收藏任何游戏" :image-size="200">
        <template #description>
          <p>您还没有收藏任何游戏</p>
        </template>
        <el-button type="primary" @click="$router.push('/player/games')">去浏览游戏</el-button>
      </el-empty>
    </div>
    
    <div v-else>
      <el-table
        v-loading="tableLoading"
        :data="filteredFavorites"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="游戏" min-width="300">
          <template #default="scope">
            <div class="game-info-cell">
              <el-image 
                :src="scope.row.gameInfo?.cover_image || scope.row.coverImage" 
                class="game-cover-small" 
                fit="cover"
              >
                <template #error>
                  <div class="image-placeholder-small">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="game-info-text">
                <div class="game-title-cell">{{ scope.row.gameInfo?.title || scope.row.title || '未知游戏' }}</div>
                <div class="game-category-cell">{{ scope.row.gameInfo?.category_name || scope.row.categoryName || '' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="价格" width="100">
          <template #default="scope">
            <span class="game-price">¥{{ scope.row.gameInfo?.price || scope.row.price || 0 }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="收藏时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.create_time || scope.row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewGameDetail(scope.row.gameId)">
              查看详情
            </el-button>
            <el-button type="danger" size="small" @click="removeFavorite(scope.row.gameId)">
              取消收藏
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Picture, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const favorites = ref([])
const loading = ref(true)
const searchKeyword = ref('')
const filteredFavorites = ref([])
const currentUserId = ref(null)
const tableLoading = ref(false)
const selectedFavorites = ref([])

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取当前用户ID
const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return false
    
    const response = await axios.get('/users/current', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data && response.data.code === 1) {
      currentUserId.value = response.data.data.user_id
      return true
    }
    
    return false
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return false
  }
}

// 获取收藏列表
const fetchFavorites = async () => {
  // 获取token，如果没有token则用户未登录
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  loading.value = true
  try {
    // 从localStorage获取用户ID
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.user_id
    
    if (!userId) {
      ElMessage.warning('无法获取用户信息，请重新登录')
      router.push('/login')
      return
    }
    
    // 使用正确的API路径获取收藏列表
    const response = await axios.get(`/api/users/${userId}/favorites`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data && response.data.code === 1) {
      // 处理返回的数据结构 {total: n, rows: Array(n)}
      const favoritesData = response.data.data
      
      let rawFavorites = []
      if (favoritesData.rows && Array.isArray(favoritesData.rows)) {
        // 使用rows数组作为收藏列表
        rawFavorites = favoritesData.rows
      } else if (Array.isArray(favoritesData)) {
        // 如果直接是数组，就直接使用
        rawFavorites = favoritesData
      }
      
      console.log('原始收藏数据:', rawFavorites)
      
      // 提取所有游戏ID
      const gameIds = rawFavorites.map(item => item.game_id).filter(id => id)
      
      // 如果有游戏ID，则获取游戏信息
      if (gameIds.length > 0) {
        // 创建一个映射来存储游戏信息
        const gamesMap = {}
        
        // 逐个获取游戏信息
        await Promise.all(gameIds.map(async (gameId) => {
          try {
            const gameResponse = await axios.get(`/api/games/${gameId}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            
            if (gameResponse.data && gameResponse.data.code === 1) {
              gamesMap[gameId] = gameResponse.data.data
            }
          } catch (error) {
            console.error(`获取游戏ID ${gameId} 的信息失败:`, error)
          }
        }))
        
        // 将游戏信息合并到收藏项中
        favorites.value = rawFavorites.map(item => {
          const gameInfo = gamesMap[item.game_id] || {}
          return {
            id: item.favorite_id || item.id,
            gameId: item.game_id,
            userId: item.user_id,
            title: gameInfo.title || '未知游戏',
            coverImage: gameInfo.cover_image || '',
            price: gameInfo.price || 0,
            categoryName: gameInfo.category_name || '',
            createTime: item.create_time || new Date().toISOString(),
            // 添加其他可能需要的字段
            ...item, // 保留原始数据中的所有字段
            gameInfo // 添加完整的游戏信息
          }
        })
      } else {
        // 如果没有游戏ID，直接使用原始数据
        favorites.value = rawFavorites
      }
      
      console.log('处理后的收藏列表:', favorites.value)
      // 初始化过滤后的收藏列表
      filteredFavorites.value = [...favorites.value]
    } else {
      ElMessage.warning(response.data?.msg || '获取收藏列表失败')
      favorites.value = []
      filteredFavorites.value = []
    }
  } catch (error) {
    console.error('获取收藏列表失败:', error)
    ElMessage.error('获取收藏列表失败，请稍后重试')
    favorites.value = []
    filteredFavorites.value = []
  } finally {
    loading.value = false
  }
}

// 处理并丰富收藏数据
const processAndEnrichFavorites = async (favoritesList) => {
  // 临时存储已获取的游戏信息
  const gameInfoCache = {}
  
  // 创建一个处理收藏项的函数
  const processFavoriteItem = async (item) => {
    // 标准化字段名
    const favoriteId = item.id || item.favorite_id || item.favoriteId
    const gameId = item.game_id || item.gameId
    
    // 如果收藏项已包含完整游戏信息
    if (item.title || item.game_title) {
      return {
        id: favoriteId,
        gameId: gameId,
        title: item.title || item.game_title,
        coverImage: item.coverImage || item.cover_image,
        categoryName: item.categoryName || item.category_name || '未分类',
        price: item.price || item.game_price || 0,
        createTime: item.createTime || item.create_time
      }
    }
    
    // 如果没有游戏信息，需要单独获取
    try {
      // 检查缓存中是否已有该游戏信息
      if (!gameInfoCache[gameId]) {
        console.log(`获取游戏ID ${gameId} 的详细信息`)
        const gameResponse = await axios.get(`/api/games/${gameId}`)
        
        if (gameResponse.data && gameResponse.data.code === 1) {
          const gameData = gameResponse.data.data
          gameInfoCache[gameId] = {
            title: gameData.title,
            coverImage: gameData.cover_image,
            categoryName: gameData.category_name || '未分类',
            price: gameData.price || 0
          }
        } else {
          console.error(`获取游戏 ${gameId} 详情失败:`, gameResponse.data)
          gameInfoCache[gameId] = {
            title: '未知游戏',
            coverImage: '',
            categoryName: '未分类',
            price: 0
          }
        }
      }
      
      // 使用缓存的游戏信息
      const gameInfo = gameInfoCache[gameId]
      return {
        id: favoriteId,
        gameId: gameId,
        title: gameInfo.title,
        coverImage: gameInfo.coverImage,
        categoryName: gameInfo.categoryName,
        price: gameInfo.price,
        createTime: item.createTime || item.create_time
      }
    } catch (error) {
      console.error(`处理收藏项 ${favoriteId} 出错:`, error)
      return {
        id: favoriteId,
        gameId: gameId,
        title: '加载失败',
        coverImage: '',
        categoryName: '未分类',
        price: 0,
        createTime: item.createTime || item.create_time
      }
    }
  }
  
  // 处理所有收藏项
  const processedItems = await Promise.all(favoritesList.map(processFavoriteItem))
  favorites.value = processedItems
}

// 查看游戏详情
const viewGameDetail = (gameId) => {
  if (!gameId) {
    ElMessage.warning('游戏ID无效，无法查看详情')
    return
  }
  
  // 导航到游戏详情页面
  router.push(`/player/game/${gameId}`)
}

// 取消收藏
const removeFavorite = async (gameId) => {
  try {
    // 获取token和用户信息
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    // 从localStorage获取用户ID
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.user_id || userInfo.userId
    
    if (!userId) {
      ElMessage.warning('无法获取用户信息，请重新登录')
      router.push('/login')
      return
    }
    
    await ElMessageBox.confirm(
      '确定要取消收藏该游戏吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(async () => {
      try {
        // 使用正确的API路径
        const response = await axios.delete(`/api/users/${userId}/favorites/${gameId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        if (response.data && response.data.code === 1) {
          ElMessage.success('已取消收藏')
          
          // 从列表中移除
          favorites.value = favorites.value.filter(item => item.gameId !== gameId)
          filteredFavorites.value = filteredFavorites.value.filter(item => item.gameId !== gameId)
          
          // 发布自定义事件，通知其他组件收藏状态已更改
          const event = new CustomEvent('favoritesChanged', {
            detail: {
              gameId: Number(gameId),
              isFavorite: false
            }
          })
          window.dispatchEvent(event)
        } else {
          ElMessage.error(response.data?.msg || '取消收藏失败')
        }
      } catch (error) {
        console.error('取消收藏失败:', error)
        ElMessage.error('操作失败，请稍后再试')
      }
    }).catch(() => {})
  } catch (error) {
    console.error('取消收藏对话框错误:', error)
  }
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedFavorites.value = selection
}

// 批量删除收藏
const batchRemoveFavorites = async () => {
  if (selectedFavorites.value.length === 0) {
    ElMessage.warning('请先选择要删除的收藏')
    return
  }
  
  // 获取token和用户信息
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  // 从localStorage获取用户ID
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const userId = userInfo.user_id || userInfo.userId
  
  if (!userId) {
    ElMessage.warning('无法获取用户信息，请重新登录')
    router.push('/login')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFavorites.value.length} 个收藏吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    tableLoading.value = true
    
    const favoriteIds = selectedFavorites.value.map(item => item.gameId)
    const response = await axios.delete(`/api/users/${userId}/favorites/batch`, {
      data: { ids: favoriteIds },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data && response.data.code === 1) {
      ElMessage.success('批量删除成功')
      await fetchFavorites()
    } else {
      ElMessage.error(response.data?.msg || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  } finally {
    tableLoading.value = false
  }
}

// 搜索收藏
const filterFavorites = () => {
  if (!searchKeyword.value) {
    filteredFavorites.value = [...favorites.value]
    return
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  filteredFavorites.value = favorites.value.filter(item => 
    item.title.toLowerCase().includes(keyword) || 
    item.categoryName.toLowerCase().includes(keyword)
  )
}

// 监听收藏状态变化事件
const handleFavoritesChanged = (event) => {
  const { gameId, isFavorite, gameInfo } = event.detail
  
  if (!isFavorite) {
    // 如果取消收藏，从列表中移除
    favorites.value = favorites.value.filter(item => item.gameId !== gameId)
    filteredFavorites.value = filteredFavorites.value.filter(item => item.gameId !== gameId)
  } else if (gameInfo && !favorites.value.some(item => item.gameId === gameId)) {
    // 如果是新增收藏且列表中没有，添加到列表
    const newFavorite = {
      id: Date.now(), // 临时ID
      gameId: gameId,
      title: gameInfo.title,
      coverImage: gameInfo.coverImage,
      categoryName: gameInfo.categoryName,
      price: gameInfo.price,
      createTime: new Date().toISOString()
    }
    
    favorites.value.unshift(newFavorite)
    filteredFavorites.value = [...favorites.value]
  }
}

onMounted(() => {
  fetchFavorites()
  
  // 确保页面可以滚动
  document.body.style.overflow = 'auto'
})

onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener('favoritesChanged', handleFavoritesChanged)
})
</script>

<style scoped>
.favorites-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 30px;
  font-size: 24px;
  color: #303133;
  text-align: center;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.loading-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.empty-favorites {
  padding: 40px;
  text-align: center;
}

.game-info-cell {
  display: flex;
  align-items: center;
}

.game-cover-small {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  margin-right: 10px;
}

.image-placeholder-small {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
  border-radius: 4px;
}

.game-info-text {
  display: flex;
  flex-direction: column;
}

.game-title-cell {
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.game-category-cell {
  font-size: 12px;
  color: #909399;
}

.game-price {
  color: #f56c6c;
  font-weight: bold;
}
</style> 