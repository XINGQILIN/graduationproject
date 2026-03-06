<template>
  <div class="categories-container">
    <h1 class="page-title">游戏分类</h1>
    
    <div class="categories-grid">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="category in categories" :key="category.id">
          <div class="category-card" @click="navigateToCategory(category.id)">
            <div class="category-icon">
              <el-icon><Grid /></el-icon>
            </div>
            <div class="category-name">{{ category.name }}</div>
            <div class="category-description">{{ category.description }}</div>
            <div class="category-count">{{ category.gameCount || 0 }} 款游戏</div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>
    
    <!-- 空状态 -->
    <el-empty v-if="!loading && categories.length === 0" description="暂无游戏分类" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Grid } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const categories = ref([])
const loading = ref(true)

// 导航到分类
const navigateToCategory = (categoryId) => {
  console.log('导航到分类，categoryId:', categoryId)
  router.push({
    path: '/player/games',
    query: { category_id: categoryId }
  })
}

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    console.log('正在获取游戏分类...')
    // 设置较大的pageSize以获取所有分类
    const response = await axios.get('/api/game-categories', {
      params: {
        pageSize: 100 // 设置一个足够大的值
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
        const id = category.id || category.category_id;
        console.log(`处理分类: id=${id}, name=${category.name}`)
        return {
          id: id,
          name: category.name,
          description: category.description || '暂无描述',
          gameCount: category.game_count || 0
        }
      });
      
      console.log('处理后的分类数据:', categories.value)
    } else {
      throw new Error(response.data?.msg || '获取分类列表失败')
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
    ElMessage.error('获取游戏分类失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.categories-container {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.categories-grid {
  margin-top: 20px;
}

.category-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  text-align: center;
  height: 200px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  margin-bottom: 20px;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
}

.category-icon {
  font-size: 40px;
  margin-bottom: 15px;
  color: #18b566;
}

.category-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.category-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 15px;
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.category-count {
  font-size: 14px;
  color: #909399;
  background-color: #f5f7fa;
  padding: 5px 10px;
  border-radius: 15px;
  display: inline-block;
}

.loading-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  margin-top: 20px;
}
</style> 