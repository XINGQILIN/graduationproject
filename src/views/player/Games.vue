<template>
  <div class="games-container">
    <!-- 添加返回首页按钮 -->
    <div class="page-header">
      <div class="back-button" @click="goToHome">
        <el-icon><Back /></el-icon>
        <span>返回首页</span>
      </div>
      <h1 class="page-title">
        {{ categoryName ? `${categoryName} 游戏` : '所有游戏' }}
        <span v-if="totalGames" class="game-count">({{ totalGames }})</span>
      </h1>
    </div>
    
    <!-- 筛选区域 -->
    <div class="filter-container">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索游戏名称..."
          clearable
          @input="handleSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
      
      <el-select v-model="selectedCategory" placeholder="游戏分类" @change="handleCategoryChange" class="category-select">
        <el-option label="全部分类" value="" />
        <el-option 
          v-for="category in categories" 
          :key="category.id" 
          :label="category.name" 
          :value="category.id" 
        />
      </el-select>
      
      <el-select v-model="sortOption" placeholder="排序方式" @change="handleSortChange" class="sort-select">
        <el-option label="默认排序" value="default" />
        <el-option label="价格从低到高" value="priceAsc" />
        <el-option label="价格从高到低" value="priceDesc" />
        <el-option label="最新发布" value="newest" />
      </el-select>
    </div>
    
    <!-- 游戏列表 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="games.length === 0" class="empty-games">
      <el-empty description="没有找到符合条件的游戏" :image-size="200">
        <template #description>
          <p>没有找到符合条件的游戏</p>
        </template>
        <el-button type="primary" @click="resetFilters">重置筛选条件</el-button>
      </el-empty>
    </div>
    
    <div v-else class="games-grid">
      <div v-for="game in games" :key="game.id" class="game-card" @click="goToGameDetail(game)">
        <div class="game-image-container">
          <el-image :src="game.cover_image || game.coverImage" fit="cover" class="game-image">
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
        <div class="game-info">
          <h3 class="game-title">{{ game.title || game.name }}</h3>
          <div class="game-meta">
            <span class="game-category">{{ getCategoryName(game.category_id || game.categoryId) }}</span>
            <span class="game-price">¥{{ (game.price || 0).toFixed(2) }}</span>
          </div>
          <div class="game-description">
            {{ game.description || game.brief || '暂无描述' }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination-container" v-if="totalGames > 0">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="totalGames"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Picture, Back, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const games = ref([])
const categories = ref([])
const loading = ref(true)
const totalGames = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const searchKeyword = ref('')
const sortOption = ref('default')
const allGames = ref([])

// 从路由参数中获取分类ID
const selectedCategory = ref('')
const categoryName = ref('')

// 获取游戏列表
const fetchGames = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value
    }
    
    if (selectedCategory.value) {
      params.category_id = selectedCategory.value
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    if (sortOption.value !== 'default') {
      switch (sortOption.value) {
        case 'priceAsc':
          params.sort = 'price'
          params.order = 'asc'
          break
        case 'priceDesc':
          params.sort = 'price'
          params.order = 'desc'
          break
        case 'newest':
          params.sort = 'create_time'
          params.order = 'desc'
          break
      }
    }
    
    console.log('获取游戏列表参数:', params)
    const response = await axios.get('/api/games', { params })
    
    if (response.data && response.data.code === 1) {
      console.log('获取游戏列表成功:', response.data.data)
      
      // 检查数据结构
      let gamesData = response.data.data;
      let gamesList = [];
      
      // 如果是分页结构 {total, rows}，则使用rows
      if (gamesData.rows && Array.isArray(gamesData.rows)) {
        console.log('检测到分页数据结构，使用rows数组')
        gamesList = gamesData.rows;
        totalGames.value = gamesData.total || 0;
      } else if (gamesData.list && Array.isArray(gamesData.list)) {
        gamesList = gamesData.list;
        totalGames.value = gamesData.total || 0;
      } else if (Array.isArray(gamesData)) {
        gamesList = gamesData;
        totalGames.value = gamesData.length;
      } else {
        console.error('无法识别的游戏数据结构:', gamesData);
        gamesList = [];
        totalGames.value = 0;
      }
      
      // 如果选择了分类，确保只显示该分类的游戏
      if (selectedCategory.value) {
        console.log('过滤游戏列表，只显示分类ID为', selectedCategory.value, '的游戏');
        gamesList = gamesList.filter(game => {
          const gameCategory = game.category_id || game.categoryId;
          const isMatch = 
            gameCategory === selectedCategory.value || 
            gameCategory === Number(selectedCategory.value) || 
            String(gameCategory) === String(selectedCategory.value);
          
          console.log(`游戏 ${game.title || game.name} 的分类ID: ${gameCategory}, 是否匹配: ${isMatch}`);
          return isMatch;
        });
        
        totalGames.value = gamesList.length;
      }
      
      games.value = gamesList;
      allGames.value = [...games.value];
      console.log('处理后的游戏数据:', games.value);
    } else {
      throw new Error(response.data?.msg || '获取游戏列表失败')
    }
  } catch (error) {
    console.error('获取游戏列表失败:', error)
    ElMessage.error('获取游戏列表失败，请稍后重试')
    games.value = []
    totalGames.value = 0
  } finally {
    loading.value = false
  }
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  console.log('获取分类名称，categoryId:', categoryId, '可用分类:', categories.value)
  const category = categories.value.find(c => 
    c.id === categoryId || 
    c.id === Number(categoryId) || 
    String(c.id) === String(categoryId)
  )
  return category ? category.name : '未分类'
}

// 获取特定分类的名称
const fetchCategoryName = async (categoryId) => {
  console.log('获取特定分类名称，categoryId:', categoryId)
  try {
    // 如果已经加载了分类列表，直接从中查找
    if (categories.value.length > 0) {
      const category = categories.value.find(c => 
        c.id === categoryId || 
        c.id === Number(categoryId) || 
        String(c.id) === String(categoryId)
      )
      if (category) {
        categoryName.value = category.name
        console.log('从已加载分类中找到名称:', categoryName.value)
        return
      }
    }
    
    // 否则从API获取
    console.log('从API获取分类名称:', `/api/game-categories/${categoryId}`)
    const response = await axios.get(`/api/game-categories/${categoryId}`)
    if (response.data && response.data.code === 1) {
      categoryName.value = response.data.data.name
      console.log('API返回的分类名称:', categoryName.value)
    }
  } catch (error) {
    console.error('获取分类名称失败:', error)
  }
}

// 获取所有分类
const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/game-categories', {
      params: {
        pageSize: 100 // 设置一个足够大的值
      }
    })
    if (response.data && response.data.code === 1) {
      console.log('Games页面获取分类列表成功:', response.data.data)
      
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
        const id = category.id || category.category_id;
        console.log(`处理分类: id=${id}, name=${category.name}`)
        return {
          id: id,
          name: category.name
        }
      });
      
      console.log('Games页面处理后的分类数据:', categories.value)
      
      // 如果有选中的分类，更新分类名称
      if (selectedCategory.value) {
        fetchCategoryName(selectedCategory.value)
      }
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 处理分类变更
const handleCategoryChange = (categoryId) => {
  // 更新分类名称
  if (categoryId) {
    const category = categories.value.find(c => 
      c.id === categoryId || 
      c.id === Number(categoryId) || 
      String(c.id) === String(categoryId)
    )
    categoryName.value = category ? category.name : ''
  } else {
    categoryName.value = ''
  }
  
  // 更新选中的分类ID
  selectedCategory.value = categoryId
  
  // 重置页码
  currentPage.value = 1
  
  // 获取游戏列表
  fetchGames()
}

// 处理搜索
const handleSearch = () => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  
  if (!keyword) {
    // 如果搜索关键词为空，显示所有游戏
    games.value = [...allGames.value]
  } else {
    // 根据关键词过滤游戏
    games.value = allGames.value.filter(game => 
      game.title.toLowerCase().includes(keyword) ||
      (game.description && game.description.toLowerCase().includes(keyword))
    )
  }
  
  // 如果有分类过滤，重新应用分类过滤
  if (selectedCategory.value) {
    filterGamesByCategory()
  }
}

// 处理排序变更
const handleSortChange = (value) => {
  sortOption.value = value
  handleSort()
}

// 处理页码变更
const handlePageChange = (page) => {
  currentPage.value = page
  router.push({
    path: '/player/games',
    query: {
      ...route.query,
      page
    }
  })
}

// 重置筛选条件
const resetFilters = () => {
  router.push('/player/games')
}

// 添加返回首页函数
const goToHome = () => {
  router.push('/PlayerHome')
}

// 添加跳转到游戏详情页函数
const goToGameDetail = (game) => {
  // 阻止事件冒泡，防止点击卡片内部元素时触发多次跳转
  event?.stopPropagation()
  
  // 获取游戏ID，兼容不同的属性名
  const gameId = game.id || game.gameId || game.game_id
  
  if (gameId) {
    console.log('跳转到游戏详情页，游戏ID:', gameId)
    router.push(`/player/game/${gameId}`)
  } else {
    console.error('游戏ID不存在:', game)
    ElMessage.error('无法查看游戏详情，缺少游戏ID')
  }
}

// 监听路由参数变化
watch(() => route.query, (newQuery) => {
  console.log('路由参数变化:', newQuery)
  if (newQuery.category_id) {
    selectedCategory.value = newQuery.category_id
    fetchCategoryName(newQuery.category_id)
  } else {
    selectedCategory.value = ''
    categoryName.value = ''
  }
  
  if (newQuery.keyword) {
    searchKeyword.value = newQuery.keyword
  }
  
  fetchGames()
}, { immediate: true })

// 优化排序功能
const handleSort = () => {
  const sortedGames = [...games.value]
  
  switch (sortOption.value) {
    case 'priceAsc':
      sortedGames.sort((a, b) => (a.price || 0) - (b.price || 0))
      break
    case 'priceDesc':
      sortedGames.sort((a, b) => (b.price || 0) - (a.price || 0))
      break
    case 'newest':
      sortedGames.sort((a, b) => {
        const dateA = new Date(a.create_time || a.createTime || 0)
        const dateB = new Date(b.create_time || b.createTime || 0)
        return dateB - dateA
      })
      break
    default:
      // 默认排序，保持原顺序或按ID排序
      sortedGames.sort((a, b) => (a.id || 0) - (b.id || 0))
      break
  }
  
  games.value = sortedGames
}

onMounted(() => {
  fetchCategories()
  // 设置默认排序
  sortOption.value = 'default'
})
</script>

<style scoped>
.games-container {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #409EFF;
  margin-right: 15px;
  transition: color 0.3s;
}

.back-button:hover {
  color: #66b1ff;
}

.back-button .el-icon {
  margin-right: 5px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
  display: flex;
  align-items: center;
}

.game-count {
  font-size: 16px;
  color: #909399;
  margin-left: 10px;
}

.filter-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
}

.search-box {
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
}

.category-select, .sort-select {
  width: 150px;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.game-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
}

.game-image-container {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.game-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.game-info {
  padding: 15px;
}

.game-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.game-category {
  background-color: #f0f9eb;
  color: #67c23a;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.game-price {
  color: #f56c6c;
  font-weight: bold;
}

.image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
}

.loading-container, .empty-games {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.game-description {
  font-size: 12px;
  color: #606266;
  margin-top: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  height: 36px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .filter-container {
    flex-direction: column;
  }
  
  .search-input, .category-select, .sort-select {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .games-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style> 