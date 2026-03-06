<template>
  <div class="game-detail-container scrollable">
    <!-- 游戏详情卡片 -->
    <div class="game-detail-card">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>
      
      <div v-else-if="!gameInfo.id" class="error-container">
        <el-empty description="游戏信息不存在或已被删除" />
      </div>
      
      <div v-else class="game-detail-layout">
        <!-- 左上角：图片区域 -->
        <div class="image-area">
          <el-image :src="gameInfo.coverImage" fit="cover">
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
                <span>图片区域</span>
              </div>
            </template>
          </el-image>
        </div>
        
        <!-- 右侧：游戏信息区域 -->
        <div class="info-area">
          <h1 class="game-title">{{ gameInfo.title }}</h1>
          
          <div class="game-meta">
            <div class="meta-item">
              <span class="meta-label">发行日期:</span>
              <span class="meta-value">{{ formatDate(gameInfo.createTime || gameInfo.releaseDate) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">分类:</span>
              <span class="meta-value">{{ gameInfo.categoryName }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">价格:</span>
              <span class="price-value">¥{{ gameInfo.price }}</span>
            </div>
          </div>
          
          <div class="game-description">
            <h3>游戏简介</h3>
            <p>{{ gameInfo.description }}</p>
          </div>
        </div>
        
        <!-- 左下角：功能按钮区域 -->
        <div class="action-area">
          <el-button 
            class="action-button"
            :type="isFavorite ? 'danger' : 'default'"
            :icon="Star"
            @click="toggleFavorite"
          >
            {{ isFavorite ? '取消收藏' : '收藏' }}
          </el-button>
          
          <template v-if="userOwnsGame">
            <el-button 
              class="action-button"
              type="primary" 
              disabled
            >
              已拥有
            </el-button>
          </template>
          <template v-else>
            <el-button 
              class="action-button"
              type="primary" 
              @click="buyNow"
            >
              <el-icon><ShoppingCart /></el-icon> 添加至购物车
            </el-button>
          </template>
        </div>
      </div>
    </div>
    
    <!-- 游戏评论部分 -->
    <div class="game-comments-section">
      <!-- 评论标题和快速添加评论区域 -->
      <div class="section-header">
        <h2>用户评论</h2>
      </div>
      
      <!-- 快速评论输入框 -->
      <div class="quick-comment-form">
        <div class="comment-input-container">
          <input 
            v-model="commentForm.content"
            type="text"
            placeholder="评论千万条，等你这一条"
            maxlength="500"
            class="comment-input"
          />
          <button 
            class="publish-button"
            @click="submitComment"
            :disabled="!commentForm.content"
          >
            发布
          </button>
        </div>
      </div>
      
      <!-- 评论表单 -->
      <div v-if="showCommentForm" class="comment-form">
        <h3 class="form-title">添加评论</h3>
        <el-form :model="commentForm" :rules="commentRules" ref="commentFormRef">
          <el-form-item prop="content">
            <el-input
              v-model="commentForm.content"
              type="textarea"
              :rows="4"
              placeholder="请输入您对游戏的评价..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item class="form-buttons">
            <el-button type="primary" @click="submitComment" :icon="Edit">提交评论</el-button>
            <el-button @click="showCommentForm = false">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 评论列表 -->
      <div v-if="loadingComments" class="loading-comments">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="comments.length === 0" class="empty-comments">
        暂无评论，快来发表第一条评论吧！
      </div>
      
      <div v-else class="comments-list">
        <div v-for="comment in comments" :key="comment.comment_id" class="comment-item">
          <div class="comment-header">
            <div class="user-info">
              <el-avatar :size="40" :src="comment.userAvatar">
                {{ comment.username ? comment.username.substring(0, 1).toUpperCase() : 'U' }}
              </el-avatar>
              <div class="user-details">
                <div class="username-container">
                  <div class="username">{{ comment.username || '未知用户' }}</div>
                  <!-- 如果是用户自己的评论，显示操作按钮 -->
                  <el-dropdown v-if="comment.isCurrentUserComment" trigger="click" class="comment-dropdown">
                    <span class="el-dropdown-link">
                      <el-icon><MoreFilled /></el-icon>
                    </span>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="editComment(comment)">
                          <el-icon><Edit /></el-icon> 编辑
                        </el-dropdown-item>
                        <el-dropdown-item @click="deleteComment(comment.comment_id)" class="delete-item">
                          <el-icon><Delete /></el-icon> 删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <div class="comment-date">{{ formatDate(comment.create_time) }}</div>
              </div>
            </div>
          </div>
          
          <div class="comment-content">
            {{ comment.content }}
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="totalComments > pageSize" class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="totalComments"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>
    
    <!-- 编辑评论对话框 -->
    <el-dialog
      title="编辑评论"
      v-model="editDialogVisible"
      width="550px"
      destroy-on-close
    >
      <div class="edit-comment-container">
        <el-form :model="editForm" :rules="commentRules" ref="editFormRef">
          <el-form-item prop="content">
            <el-input
              v-model="editForm.content"
              type="textarea"
              :rows="4"
              placeholder="请输入您对游戏的评价..."
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateComment" :icon="Edit">保存修改</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, ShoppingCart, Star, Edit, Delete, ArrowUp, MoreFilled } from '@element-plus/icons-vue'
import axios from 'axios'
import CartService from '@/services/CartService'

const route = useRoute()
const router = useRouter()

// 游戏ID
const game_id = computed(() => route.params.id)

// 游戏信息
const gameInfo = ref({})
const loading = ref(true)
const userOwnsGame = ref(false)
const isFavorite = ref(false)
const inCart = ref(false)
const categories = ref([])

// 当前用户ID
const currentUserId = ref(null)

// 获取游戏详情
const fetchGameDetail = async () => {
  loading.value = true
  try {
    console.log('获取游戏详情, game_id:', game_id.value)
    const response = await axios.get(`/api/games/${game_id.value}`)
    
    if (response.data && response.data.code === 1) {
      const game = response.data.data
      console.log('获取到的游戏详情数据:', game)
      
      // 适配后端字段名称，确保正确获取game_id或id
      gameInfo.value = {
        id: game.game_id || game.game_id || game.id,
        title: game.title,
        description: game.description,
        coverImage: game.cover_image || game.coverImage,
        price: game.price,
        releaseDate: game.release_date || game.releaseDate,
        createTime: game.create_time || game.createTime,
        developer: game.developer,
        publisher: game.publisher,
        categoryId: game.category_id || game.categoryId,
        categoryName: getCategoryName(game.category_id || game.categoryId),
        rating: game.rating,
        status: game.status,
        downloadCount: game.download_count || game.downloadCount
      }
      
      console.log('处理后的游戏信息:', gameInfo.value)
      
      // 获取用户基本信息
      getUserBasicInfo()
      
      // 通过查询订单判断用户是否拥有游戏
      checkGameOwnershipByOrders()
      
      // 检查用户是否已收藏该游戏
      checkIfGameIsFavorite()
      
      // 检查游戏是否已在购物车中
      checkCartStatus()
    } else {
      ElMessage.error(response.data?.msg || '获取游戏详情失败')
    }
  } catch (error) {
    console.error('获取游戏详情失败:', error)
    ElMessage.error('获取游戏详情失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

// 获取用户基本信息
const getUserBasicInfo = () => {
  try {
    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    currentUserId.value = userInfo.id || userInfo.userId || userInfo.user_id
    console.log('当前用户ID:', currentUserId.value)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    currentUserId.value = null
  }
}

// 通过查询订单判断用户是否拥有游戏
const checkGameOwnershipByOrders = async () => {
  console.log('开始检查用户是否拥有游戏...');
  
  // 如果用户未登录，则肯定不拥有游戏
  if (!currentUserId.value) {
    console.log('用户未登录，无法拥有游戏');
    userOwnsGame.value = false;
    return;
  }
  
  try {
    // 获取token和用户ID
    const token = localStorage.getItem('token');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId || userInfo.user_id || currentUserId.value;
    
    console.log('当前登录用户ID:', userId);
    console.log('检查的游戏ID:', game_id.value);
    
    // 查询用户订单，使用与后端一致的参数名 userId
    console.log('正在请求用户已完成订单数据...');
    const response = await axios.get('/api/orders', {
      params: {
        status: 'completed', // 只查询已完成状态的订单
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('订单API响应:', response.data);
    
    if (response.data && response.data.code === 1) {
      // 获取订单数据，处理可能的不同数据结构
      let orders = [];
      
      if (response.data.data.rows) {
        console.log('订单数据使用分页格式');
        orders = response.data.data.rows;
      } else if (Array.isArray(response.data.data)) {
        console.log('订单数据使用数组格式');
        orders = response.data.data;
      } else if (response.data.data.list) {
        console.log('订单数据使用list格式');
        orders = response.data.data.list;
      } else if (response.data.data) {
        console.log('订单数据可能是单个对象');
        orders = [response.data.data];
      }
      
      console.log('获取到的已完成订单数量:', orders.length);
      
      // 检查订单中是否包含当前游戏
      const currentGameId = game_id.value;
      let hasGame = false;
      
      // 遍历每个订单和订单项
      for (const order of orders) {
        console.log('检查订单:', order.order_id || order.id || order.orderId);
        
        // 确保只检查已完成状态的订单
        if (order.status !== 'completed') {
          console.log('跳过非已完成状态的订单:', order.status);
          continue;
        }
        
        // 检查订单项数据 (Library.vue 中的关键逻辑)
        if (order.orderItems && Array.isArray(order.orderItems)) {
          for (const item of order.orderItems) {
            const itemGameId = item.gameId || item.game_id;
            console.log('订单项游戏ID:', itemGameId, '当前游戏ID:', currentGameId);
            
            if (String(itemGameId) === String(currentGameId)) {
              hasGame = true;
              console.log('在orderItems中找到匹配的游戏ID');
              break;
            }
          }
        } 
        // 检查订单本身是否包含游戏ID
        else if (order.game_id || order.gameId) {
          const orderGameId = order.game_id || order.gameId;
          console.log('订单直接包含游戏ID:', orderGameId);
          
          if (String(orderGameId) === String(currentGameId)) {
            hasGame = true;
            console.log('在订单的game_id/gameId字段中找到匹配的游戏ID');
            break;
          }
        }
        
        if (hasGame) break;
      }
      
      // 更新游戏所有权状态
      userOwnsGame.value = hasGame;
      console.log('用户拥有游戏检查结果:', hasGame);
    } else {
      console.warn('获取订单失败:', response.data?.msg);
      userOwnsGame.value = false;
    }
  } catch (error) {
    console.error('检查游戏所有权失败:', error);
    userOwnsGame.value = false;
  }
}

// 检查用户是否已收藏该游戏
const checkIfGameIsFavorite = async () => {
  // 获取token，如果没有token则用户未登录
  const token = localStorage.getItem('token')
  if (!token) return
  
  try {
    // 确保已获取用户ID
    if (!currentUserId.value) {
      getUserBasicInfo()
    }
    
    if (!currentUserId.value) return
    
    // 使用正确的API路径检查收藏状态
    const response = await axios.get(`/api/users/${currentUserId.value}/favorites/${game_id.value}/check`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data && response.data.code === 1) {
      isFavorite.value = response.data.data
      console.log('游戏收藏状态:', isFavorite.value)
    }
  } catch (error) {
    console.error('获取收藏状态失败:', error)
    isFavorite.value = false
  }
}

// 检查游戏是否在购物车中
const checkCartStatus = async () => {
  try {
    // 获取token，如果没有token则用户未登录
    const token = localStorage.getItem('token')
    if (!token) return
    
    // 使用CartService检查商品是否在购物车中
    const response = await CartService.checkInCart(game_id.value)
    
    if (response.data && response.data.code === 1) {
      inCart.value = response.data.data
    }
  } catch (error) {
    console.error('检查购物车状态失败:', error)
  }
}

// 添加到购物车
const addToCart = async () => {
  try {
    // 获取token，如果没有token则用户未登录
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    if (!gameInfo.value || !gameInfo.value.id) {
      ElMessage.error('游戏信息不完整，无法添加到购物车')
      return
    }
    
    // 使用游戏详情中的ID，确保是正确的ID
    const game_idValue = gameInfo.value.id
    console.log('正在添加游戏到购物车, game_id:', game_idValue)
    
    // 使用CartService调用正确的API路径
    const response = await CartService.addToCart(game_idValue)
    
    console.log('添加到购物车响应:', response.data)
    
    if (response.data && response.data.code === 1) {
      ElMessage.success(response.data.msg || '成功添加到购物车')
      inCart.value = true
      showCartAnimation()
    } else {
      // 处理错误消息
      const errorMsg = response.data?.msg || '添加到购物车失败'
      ElMessage.error(errorMsg)
      
      // 如果是游戏不存在的错误，提供更多帮助信息
      if (errorMsg.includes('游戏不存在')) {
        console.error('游戏ID可能不正确，当前游戏详情:', gameInfo.value)
        ElMessage({
          type: 'warning',
          message: '游戏ID可能不正确，请刷新页面或联系管理员',
          duration: 5000
        })
      }
    }
  } catch (error) {
    console.error('购买失败:', error)
    
    if (error.response) {
      if (error.response.status === 404) {
        ElMessage.error('购物车服务不可用，请稍后再试')
      } else if (error.response.status === 403) {
        ElMessage.error('您没有权限执行此操作')
      } else {
        ElMessage.error(error.response.data?.msg || '添加到购物车失败')
      }
    } else {
      ElMessage.error('网络错误，请稍后再试')
    }
  }
}

// 显示添加到购物车的动画效果
const showCartAnimation = () => {
  // 显示一个确认对话框，询问是否前往购物车
  ElMessageBox.confirm(
    '已成功添加到购物车，是否立即前往购物车？',
    '添加成功',
    {
      confirmButtonText: '前往购物车',
      cancelButtonText: '继续购物',
      type: 'success',
      center: true,
      showClose: false,
      distinguishCancelAndClose: true,
      callback: (action) => {
        if (action === 'confirm') {
          // 用户点击"前往购物车"
          router.push('/player/cart')
        } else {
          // 用户点击"继续购物"，不做任何操作
          console.log('用户选择继续购物')
        }
      }
    }
  ).catch(() => {
    // 捕获可能的错误，防止程序崩溃
  })
}

// 立即购买
const buyNow = async () => {
  try {
    // 获取用户token
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    // 添加到购物车
    await addToCart()
    
    // 注意：不直接跳转到购物车，而是在addToCart中的showCartAnimation方法中询问用户是否跳转
  } catch (error) {
    console.error('购买操作失败:', error)
    ElMessage.error('购买操作失败，请稍后再试')
  }
}

// 收藏/取消收藏
const toggleFavorite = async () => {
  // 获取token，如果没有token则用户未登录
  const token = localStorage.getItem('token')
  if (!token) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    let response
    
    if (isFavorite.value) {
      // 取消收藏
      response = await axios.delete(`/api/users/${currentUserId.value}/favorites/${game_id.value}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    } else {
      // 添加收藏
      response = await axios.post(`/api/users/${currentUserId.value}/favorites`, {
        game_id: game_id.value
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    }
    
    if (response.data && response.data.code === 1) {
      isFavorite.value = !isFavorite.value
      ElMessage.success(isFavorite.value ? '收藏成功' : '已取消收藏')
    } else {
      throw new Error(response.data?.msg || '操作失败')
    }
  } catch (error) {
    console.error('操作收藏失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 评论相关
const comments = ref([])
const loadingComments = ref(false)
const totalComments = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const userHasCommented = ref(false)
const showCommentForm = ref(false)

// 用户信息缓存
const userInfoCache = ref({})

// 评论表单
const commentForm = reactive({
  content: ''
})

// 评论表单验证规则
const commentRules = {
  content: [
    { required: true, message: '请输入评论内容', trigger: 'blur' },
    { min: 5, max: 500, message: '评论内容长度应在5到500个字符之间', trigger: 'blur' }
  ]
}

// 编辑评论相关
const editDialogVisible = ref(false)
const editForm = reactive({
  comment_id: null,
  content: ''
})
const commentFormRef = ref(null)
const editFormRef = ref(null)

// 检查用户是否已评论该游戏
const checkIfUserHasCommented = async () => {
  try {
    const response = await axios.get('/api/user/comments/check', {
      params: { game_id: game_id.value }
    })
    
    if (response.data && response.data.code === 1) {
      userHasCommented.value = response.data.data.commented
    }
  } catch (error) {
    console.error('检查用户评论状态失败:', error)
  }
}

// 获取游戏评论
const fetchComments = async (page = 1) => {
  loadingComments.value = true
  try {
    console.log('获取游戏评论, gameId:', game_id.value, '页码:', page)
    
    const response = await axios.get('/api/comments', {
      params: {
        gameId: game_id.value,
        page: page,
        pageSize: pageSize.value,
        status: 'approved' // 只获取已通过审核的评论
      }
    })
    
    if (response.data && response.data.code === 1) {
      console.log('获取评论成功:', response.data.data)
      
      // 处理不同的数据结构
      if (response.data.data.rows) {
        comments.value = response.data.data.rows
        totalComments.value = response.data.data.total || 0
      } else if (Array.isArray(response.data.data)) {
        comments.value = response.data.data
        totalComments.value = response.data.data.length
      } else {
        comments.value = []
        totalComments.value = 0
      }
      
      currentPage.value = page
      
      // 获取所有评论用户的信息
      await fetchCommentUsersInfo()
      
      // 为每条评论添加额外信息
      comments.value.forEach(comment => {
        // 统一字段名称
        const userId = comment.userId || comment.user_id
        
        // 检查评论是否属于当前用户
        comment.isCurrentUserComment = currentUserId.value && 
          (Number(userId) === Number(currentUserId.value))
      })
      
      console.log('处理后的评论数据:', comments.value)
    } else {
      ElMessage.warning(response.data?.msg || '获取评论失败')
      comments.value = []
      totalComments.value = 0
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    ElMessage.error('获取评论列表出错，请稍后再试')
    comments.value = []
    totalComments.value = 0
  } finally {
    loadingComments.value = false
  }
}

// 获取评论用户信息
const fetchCommentUsersInfo = async () => {
  try {
    // 提取所有不重复的用户ID
    const userIds = [...new Set(comments.value.map(comment => comment.userId || comment.user_id))]
    console.log('需要获取信息的用户ID:', userIds)
    
    // 为每个用户ID获取用户信息
    for (const userId of userIds) {
      if (!userId) continue
      
      // 如果缓存中已有该用户信息，则跳过
      if (userInfoCache.value[userId]) {
        console.log(`用户 ${userId} 信息已在缓存中`)
        continue
      }
      
      try {
        // 使用现有接口获取用户基本信息
        const userResponse = await axios.get(`/api/users/${userId}`)
        
        if (userResponse.data && userResponse.data.code === 1) {
          const userData = userResponse.data.data
          userInfoCache.value[userId] = {
            username: userData.username,
            avatar: null // 先设置为null，稍后获取头像
          }
          
          console.log(`获取到用户 ${userId} 的信息:`, userData.username)
          
          // 获取用户头像
          try {
            const avatarResponse = await axios.get(`/api/users/${userId}/avatar-url`)
            if (avatarResponse.data && avatarResponse.data.code === 1) {
              userInfoCache.value[userId].avatar = avatarResponse.data.data
              console.log(`获取到用户 ${userId} 的头像`)
            }
          } catch (error) {
            console.warn(`获取用户 ${userId} 头像失败:`, error)
          }
        }
      } catch (error) {
        console.warn(`获取用户 ${userId} 信息失败:`, error)
        // 设置默认信息到缓存，避免重复请求失败的用户
        userInfoCache.value[userId] = {
          username: `用户${userId}`,
          avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
        }
      }
    }
    
    console.log('用户信息缓存:', userInfoCache.value)
    
    // 为每条评论关联用户信息
    comments.value.forEach(comment => {
      const userId = comment.userId || comment.user_id
      if (userId && userInfoCache.value[userId]) {
        comment.username = userInfoCache.value[userId].username || '未知用户'
        comment.userAvatar = userInfoCache.value[userId].avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      } else {
        comment.username = `用户${userId}` || '未知用户'
        comment.userAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
      }
    })
    
    console.log('关联用户信息后的评论:', comments.value)
  } catch (error) {
    console.error('关联用户信息失败:', error)
  }
}

// 提交评论
const submitComment = async () => {
  // 如果用户未登录，提示登录
  if (!currentUserId.value) {
    ElMessageBox.confirm(
      '你需要登录才能发表评论',
      '提示',
      {
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
        type: 'info',
      }
    ).then(() => {
      goToLogin()
    }).catch(() => {})
    return
  }
  
  // 如果用户还没有购买游戏，提示购买
  if (!userOwnsGame.value) {
    ElMessageBox.confirm(
      '只有购买了游戏的用户才能发表评论，是否立即购买？',
      '提示',
      {
        confirmButtonText: '去购买',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      // 跳转到购买页面
      addToCart(game_id.value)
    }).catch(() => {})
    return
  }

  if (!commentForm.content || commentForm.content.trim() === '') {
    ElMessage.warning('评论内容不能为空');
    return;
  }
  
  try {
    // 使用后端期望的参数名称 game_id，并且不传 userId（由后端从token获取）
    const response = await axios.post('/api/comments', {
      game_id: game_id.value,
      content: commentForm.content
      // 不传 userId，后端从 token 中获取
      // 不传 status，由后端控制
    });
    
    if (response.data && response.data.code === 1) {
      ElMessage.success('评论发表成功，等待管理员审核');
      userHasCommented.value = true;
      commentForm.content = '';
      
      // 重新加载评论
      fetchComments();
    } else {
      ElMessage.error(response.data?.msg || '评论发表失败');
    }
  } catch (error) {
    console.error('发表评论失败:', error);
    ElMessage.error('发表评论失败，请稍后再试');
  }
}

// 添加新方法，跳转到登录页
const goToLogin = () => {
  router.push({
    path: '/login',
    query: { redirect: router.currentRoute.value.fullPath }
  });
}

// 编辑评论
const editComment = (comment) => {
  editForm.comment_id = comment.comment_id
  editForm.content = comment.content
  editDialogVisible.value = true
}

// 更新评论
const updateComment = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      const response = await axios.put(`/api/comments/${editForm.comment_id}`, {
        content: editForm.content,
        status: 'pending' // 编辑后的评论重新变为待审核状态
      })
      
      if (response.data && response.data.code === 1) {
        ElMessage.success('评论更新成功')
        editDialogVisible.value = false
        
        // 更新本地评论数据
        const index = comments.value.findIndex(c => c.comment_id === editForm.comment_id)
        if (index !== -1) {
          comments.value[index].content = editForm.content
        }
        
        // 重新加载评论
        fetchComments()
      } else {
        ElMessage.error(response.data?.msg || '评论更新失败')
      }
    } catch (error) {
      console.error('更新评论失败:', error)
      ElMessage.error('更新评论失败，请稍后再试')
    }
  })
}

// 删除评论
const deleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const response = await axios.delete(`/api/comments/${commentId}`)
    
    if (response.data && response.data.code === 1) {
      ElMessage.success('评论已删除')
      
      // 从列表中移除该评论
      comments.value = comments.value.filter(c => c.comment_id !== commentId)
      
      // 更新评论状态
      userHasCommented.value = false
      
      // 重新加载评论
      fetchComments()
    } else {
      ElMessage.error(response.data?.msg || '删除评论失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('删除评论失败，请稍后再试')
    }
  }
}

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  fetchComments()
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  } catch (error) {
    return '未知'
  }
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/game-categories')
    if (response.data && response.data.code === 1) {
      // 处理可能的分页数据结构
      if (response.data.data.rows) {
        categories.value = response.data.data.rows
      } else {
        categories.value = response.data.data
      }
      console.log('获取到分类列表:', categories.value)
    }
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

// 根据分类ID获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId || !categories.value.length) return '未知分类'
  const category = categories.value.find(c => c.category_id === categoryId || c.id === categoryId)
  return category ? category.name : '未知分类'
}

onMounted(() => {
  console.log('GameDetail页面加载，游戏ID:', game_id.value)
  
  // 先获取分类列表
  fetchCategories()
  
  // 获取游戏详情（会同时检查游戏所有权等）
  fetchGameDetail()
  
  // 获取评论
  fetchComments()
  
  // 确保页面可以滚动
  document.body.style.overflow = 'auto'
})

onUnmounted(() => {
  // 恢复默认设置
  document.body.style.overflow = ''
})
</script>

<style scoped>
.game-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
}

/* 游戏详情卡片 */
.game-detail-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.loading-container, .error-container {
  padding: 40px;
  text-align: center;
}

.game-detail-layout {
  display: grid;
  grid-template-columns: 450px 1fr;
  grid-template-rows: auto auto;
  grid-template-areas: 
    "image info"
    "action info";
  gap: 20px;
  min-height: 400px;
}

.image-area {
  grid-area: image;
  border: 2px solid #f0d0d3;
  border-radius: 8px;
  overflow: hidden;
  height: 350px;
}

.image-area .el-image {
  width: 100%;
  height: 100%;
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

.info-area {
  grid-area: info;
  border: 2px solid #f0d0d3;
  border-radius: 8px;
  padding: 15px;
  overflow-y: auto;
}

.game-title {
  font-size: 28px;
  margin: 0 0 20px;
  color: #303133;
}

.game-meta {
  margin-bottom: 20px;
}

.meta-item {
  margin-bottom: 10px;
  display: flex;
}

.meta-label {
  font-weight: bold;
  color: #606266;
  width: 80px;
}

.meta-value {
  color: #303133;
}

.price-value {
  color: #f56c6c;
  font-weight: bold;
  font-size: 20px;
}

.game-description {
  margin-bottom: 30px;
}

.game-description h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #303133;
}

.game-description p {
  color: #606266;
  line-height: 1.6;
  white-space: pre-line;
}

.action-area {
  grid-area: action;
  border: 2px solid #f0d0d3;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 150px;
}

.action-button {
  width: 60%;
  margin-bottom: 15px;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-button .el-icon {
  margin-right: 5px;
  font-size: 18px;
}

/* 收藏按钮样式 */
.action-button.el-button--danger {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}

.action-button.el-button--danger:hover {
  background-color: #f78989;
  border-color: #f78989;
}

/* 购物车按钮样式 */
.action-button.el-button--primary {
  background-color: #409EFF;
  border-color: #409EFF;
  transition: all 0.3s;
}

.action-button.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.5);
}

/* 评论部分 */
.game-comments-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-top: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
  font-weight: 600;
}

.comment-form {
  background-color: #f5f7fa;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-title {
  font-size: 18px;
  margin: 0 0 20px 0;
  color: #303133;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.loading-comments, .empty-comments {
  padding: 30px;
  text-align: center;
  color: #909399;
  font-size: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 20px 0;
}

.comments-list {
  margin-bottom: 20px;
}

.comment-item {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.comment-item:hover {
  background-color: #f9f9f9;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-details {
  margin-left: 12px;
  line-height: 1.4;
  flex: 1;
}

.username-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.username {
  font-weight: bold;
  color: #303133;
  font-size: 15px;
}

.comment-date {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.comment-content {
  color: #606266;
  line-height: 1.6;
  white-space: pre-line;
  margin-bottom: 15px;
  padding: 0 5px;
  font-size: 15px;
}

.comment-dropdown {
  margin-left: 10px;
  cursor: pointer;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  color: #909399;
  transition: color 0.3s;
}

.el-dropdown-link:hover {
  color: #409EFF;
}

.delete-item {
  color: #F56C6C;
}

.comment-actions {
  display: none; /* 隐藏原来的操作按钮 */
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .game-detail-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    grid-template-areas: 
      "image"
      "action"
      "info";
  }
  
  .image-area {
    height: 250px;
  }
}

.edit-comment-container {
  padding: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.rating-container {
  display: flex;
  align-items: center;
}

.rating-label {
  margin-right: 15px;
  font-weight: 600;
  color: #606266;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  margin-bottom: 0;
}

/* 快速评论输入框样式 */
.quick-comment-form {
  margin-bottom: 20px;
}

.comment-input {
  width: 100%;
}

.comment-input :deep(.el-input-group__append) {
  background-color: #409EFF;
  border-color: #409EFF;
  color: white;
  padding: 0;
}

.comment-input :deep(.el-input-group__append button) {
  background-color: transparent;
  border: none;
  color: white;
  padding: 8px 20px;
}

/* 快速评论输入框样式 */
.quick-comment-form {
  margin-bottom: 20px;
}

.comment-input-container {
  display: flex;
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.comment-input {
  flex: 1;
  border: none;
  padding: 12px 15px;
  outline: none;
  font-size: 14px;
  color: #606266;
}

.comment-input:focus {
  box-shadow: none;
}

.comment-input::placeholder {
  color: #c0c4cc;
}

.publish-button {
  width: 80px;
  border: none;
  background-color: #409EFF;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
  border-radius: 0;
}

.publish-button:hover {
  background-color: #66b1ff;
}

.publish-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style> 