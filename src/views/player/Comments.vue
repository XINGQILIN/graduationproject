<template>
  <div class="comments-container">
    <h1 class="page-title">我的评论</h1>
    
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索评论内容或游戏名称..."
        prefix-icon="Search"
        clearable
        @input="filterComments"
        class="search-input"
      />
      
      <div class="action-buttons" v-if="selectedComments.length > 0">
        <el-button type="danger" @click="batchDeleteComments">
          <el-icon><Delete /></el-icon> 批量删除
        </el-button>
      </div>
    </div>
    
    <!-- 评论列表 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="filteredComments.length === 0" class="empty-comments">
      <el-empty description="您还没有发表任何评论" :image-size="200">
        <template #description>
          <p>您还没有发表任何评论</p>
        </template>
        <el-button type="primary" @click="$router.push('/player/games')">去浏览游戏</el-button>
      </el-empty>
    </div>
    
    <div v-else>
      <el-table
        v-loading="tableLoading"
        :data="paginatedComments"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column label="游戏" width="200">
          <template #default="scope">
            <div class="game-info-cell">
              <el-image :src="scope.row.gameCoverImage" class="game-cover-small" fit="cover">
                <template #error>
                  <div class="image-placeholder-small">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="game-title-cell">{{ scope.row.gameTitle }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="评论内容" min-width="300" show-overflow-tooltip>
          <template #default="scope">
            <div class="comment-content">{{ scope.row.content }}</div>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="评论时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="editComment(scope.row)"
              :disabled="scope.row.status === 'deleted'"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="deleteComment(scope.row)"
              :disabled="scope.row.status === 'deleted'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页区域 -->
      <div class="pagination-container">
        <div class="pagination-info">共 {{ total }} 条</div>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next"
          :total="total"
          @current-change="handleCurrentChange"
          :pager-count="5"
          prev-text="上一页"
          next-text="下一页"
          background
          aria-label="分页导航"
        />
      </div>
    </div>
    
    <!-- 编辑评论对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑评论"
      width="500px"
    >
      <el-form 
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="80px"
      >
        <div class="edit-game-info">
          <el-image :src="editForm.gameCoverImage" class="edit-game-cover" fit="cover">
            <template #error>
              <div class="image-placeholder-edit">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="edit-game-title">{{ editForm.gameTitle }}</div>
        </div>
        
        <el-form-item label="评论内容" prop="content">
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入评论内容"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditComment" :loading="submitLoading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Picture, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loading = ref(true)
const tableLoading = ref(false)
const submitLoading = ref(false)
const searchKeyword = ref('')
const comments = ref([])
const filteredComments = ref([])
const selectedComments = ref([])
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  id: '',
  gameId: '',
  gameTitle: '',
  gameCoverImage: '',
  content: ''
})

// 分页相关变量
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 计算分页后的数据
const paginatedComments = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredComments.value.slice(startIndex, endIndex)
})

// 处理页码变化
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  console.log(`已切换到第${currentPage.value}页，每页${pageSize.value}条，总计${total.value}条`)
}

// 表单验证规则
const editRules = {
  content: [
    { required: true, message: '请输入评论内容', trigger: 'blur' },
    { min: 5, max: 500, message: '评论内容长度应在5到500个字符之间', trigger: 'blur' }
  ]
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '未知时间'
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'approved': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'danger'
    case 'deleted': return 'info'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'approved': return '已通过'
    case 'pending': return '待审核'
    case 'rejected': return '已拒绝'
    case 'deleted': return '已删除'
    default: return '未知'
  }
}

// 过滤评论
const filterComments = () => {
  if (!searchKeyword.value) {
    filteredComments.value = comments.value
  } else {
    filteredComments.value = comments.value.filter(comment => 
      comment.content.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      comment.gameTitle.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 更新总数并重置到第一页
  total.value = filteredComments.value.length
  currentPage.value = 1
  console.log(`筛选后共有${total.value}条数据，当前在第${currentPage.value}页`)
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedComments.value = selection
}

// 获取评论列表
const fetchComments = async () => {
  loading.value = true
  try {
    console.log('获取评论列表...')
    const userId = JSON.parse(localStorage.getItem('userInfo')).user_id
    
    // 修改为正确的API路径和参数格式
    const response = await axios.get('/api/comments', {
      params: {
        user_id: userId,
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    
    console.log('API返回的评论数据:', response.data)
    
    if (response.data && response.data.code === 1) {
      console.log('获取评论列表成功:', response.data.data)
      
      // 检查数据结构
      let commentsData = response.data.data
      
      if (commentsData.rows && Array.isArray(commentsData.rows)) {
        // 确保只显示当前用户的评论
        const userComments = commentsData.rows.filter(comment => 
          (comment.user_id || comment.userId) == userId
        )
        comments.value = await processCommentData(userComments)
        total.value = userComments.length
      } else if (Array.isArray(commentsData)) {
        // 确保只显示当前用户的评论
        const userComments = commentsData.filter(comment => 
          (comment.user_id || comment.userId) == userId
        )
        comments.value = await processCommentData(userComments)
        total.value = userComments.length
      } else {
        console.error('无法识别的评论数据结构:', commentsData)
        comments.value = []
        total.value = 0
      }
      
      filteredComments.value = [...comments.value]
      
      // 设置总数，确保分页正常工作
      total.value = filteredComments.value.length
      console.log(`已加载第${currentPage.value}页数据，每页${pageSize.value}条，总计${total.value}条`)
    } else {
      throw new Error(response.data?.msg || '获取评论列表失败')
    }
  } catch (error) {
    console.error('获取评论列表失败:', error)
    ElMessage.error('获取评论列表失败，请稍后重试')
    comments.value = []
    filteredComments.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 处理评论数据，确保字段名称一致并获取游戏信息
const processCommentData = async (commentsList) => {
  // 临时存储已获取的游戏信息
  const gameInfoCache = {}
  
  // 创建一个处理评论项的函数
  const processCommentItem = async (item) => {
    // 标准化字段名
    const commentId = item.id || item.comment_id || item.commentId
    const gameId = item.game_id || item.gameId
    
    // 如果评论项已包含完整游戏信息
    if (item.gameTitle || item.game_title) {
      return {
        id: commentId,
        gameId: gameId,
        gameTitle: item.gameTitle || item.game_title || '未知游戏',
        gameCoverImage: item.gameCoverImage || item.game_cover_image || '',
        content: item.content,
        status: item.status || 'pending',
        createTime: item.create_time || item.createTime
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
            coverImage: gameData.cover_image || ''
          }
        } else {
          console.error(`获取游戏 ${gameId} 详情失败:`, gameResponse.data)
          gameInfoCache[gameId] = {
            title: '未知游戏',
            coverImage: ''
          }
        }
      }
      
      // 使用缓存的游戏信息
      const gameInfo = gameInfoCache[gameId]
      return {
        id: commentId,
        gameId: gameId,
        gameTitle: gameInfo.title,
        gameCoverImage: gameInfo.coverImage,
        content: item.content,
        status: item.status || 'pending',
        createTime: item.create_time || item.createTime
      }
    } catch (error) {
      console.error(`处理评论项 ${commentId} 出错:`, error)
      return {
        id: commentId,
        gameId: gameId,
        gameTitle: '加载失败',
        gameCoverImage: '',
        content: item.content,
        status: item.status || 'pending',
        createTime: item.create_time || item.createTime
      }
    }
  }
  
  // 处理所有评论项
  const processedItems = await Promise.all(commentsList.map(processCommentItem))
  return processedItems
}

// 批量删除评论
const batchDeleteComments = async () => {
  if (selectedComments.value.length === 0) {
    ElMessage.warning('请先选择要删除的评论')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedComments.value.length} 条评论吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    tableLoading.value = true
    
    const commentIds = selectedComments.value.map(item => item.id)
    const response = await axios.delete('/api/comments/batch', {
      data: { ids: commentIds }
    })
    
    if (response.data && response.data.code === 1) {
      ElMessage.success('批量删除成功')
      await fetchComments()
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

// 编辑评论
const editComment = (comment) => {
  editForm.value = {
    id: comment.id,
    gameId: comment.gameId,
    gameTitle: comment.gameTitle,
    gameCoverImage: comment.gameCoverImage,
    content: comment.content
  }
  editDialogVisible.value = true
}

// 提交编辑评论
const submitEditComment = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const response = await axios.put(`/api/comments/${editForm.value.id}`, {
          content: editForm.value.content
        })
        
        if (response.data && response.data.code === 1) {
          ElMessage.success('评论修改成功')
          editDialogVisible.value = false
          await fetchComments()
        } else {
          ElMessage.error(response.data?.msg || '修改评论失败')
        }
      } catch (error) {
        console.error('修改评论失败:', error)
        ElMessage.error('操作失败，请重试')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 删除评论
const deleteComment = async (comment) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条评论吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    tableLoading.value = true
    
    const response = await axios.delete(`/api/comments/${comment.id}`)
    
    if (response.data && response.data.code === 1) {
      ElMessage.success('评论删除成功')
      await fetchComments()
    } else {
      ElMessage.error(response.data?.msg || '删除评论失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  } finally {
    tableLoading.value = false
  }
}

onMounted(() => {
  fetchComments()
  
  // 确保页面可以滚动
  document.body.style.overflow = 'auto'
})
</script>

<style scoped>
.comments-container {
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

.empty-comments {
  padding: 40px;
  text-align: center;
}

.game-info-cell {
  display: flex;
  align-items: center;
}

.game-cover-small {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 10px;
}

.image-placeholder-small {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
  border-radius: 4px;
}

.game-title-cell {
  font-weight: bold;
  color: #303133;
}

.comment-content {
  color: #606266;
  line-height: 1.5;
}

.edit-game-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.edit-game-cover {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  margin-right: 10px;
}

.image-placeholder-edit {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ebeef5;
  color: #909399;
  border-radius: 4px;
}

.edit-game-title {
  font-weight: bold;
  color: #303133;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
}

.pagination-info {
  margin-right: 15px;
  color: #606266;
  font-size: 14px;
}

/* 自定义分页样式 */
:deep(.el-pagination) {
  --el-pagination-font-size: 14px;
  --el-pagination-button-color: #606266;
  --el-pagination-button-bg-color: #fff;
  --el-pagination-button-disabled-color: #c0c4cc;
  --el-pagination-button-disabled-bg-color: #fff;
  --el-pagination-hover-color: #409eff;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #18b566;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  color: #18b566;
}
</style>