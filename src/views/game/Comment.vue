<template>
  <div class="comment-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.user_id" placeholder="请输入用户ID" clearable></el-input>
        </el-form-item>
        <el-form-item label="游戏ID">
          <el-input v-model="searchForm.game_id" placeholder="请输入游戏ID" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" aria-label="搜索评论">搜索</el-button>
          <el-button @click="resetSearch" aria-label="重置搜索条件">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="commentList"
      border
      style="width: 100%"
      aria-label="评论列表"
    >
      <el-table-column prop="comment_id" label="评论ID" width="100" />
      <el-table-column prop="user_id" label="用户ID" width="100" />
      <el-table-column prop="game_id" label="游戏ID" width="100" />
      <el-table-column label="评论内容" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.content }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.create_time) }}
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.update_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" plain @click="handleDetail(scope.row)" aria-label="查看详情">详情</el-button>
          <el-button
            v-if="scope.row.status === 'pending'"
            type="success"
            size="small"
            plain
            @click="handleReview(scope.row)"
            aria-label="审核评论"
          >
            审核
          </el-button>
          <el-button type="danger" size="small" plain @click="handleDelete(scope.row)" aria-label="删除评论">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页区域 -->
    <div class="pagination-container">
      <div class="pagination-info">共 {{ total }} 条</div>
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="10"
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

    <!-- 审核评论对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="审核评论"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="reviewFormRef"
        :model="reviewForm"
        :rules="reviewRules"
        label-width="100px"
      >
        <el-form-item label="评论ID">
          <el-input v-model="reviewForm.comment_id" disabled />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="reviewForm.user_id" disabled />
        </el-form-item>
        <el-form-item label="游戏ID">
          <el-input v-model="reviewForm.game_id" disabled />
        </el-form-item>
        <el-form-item label="评论内容">
          <el-input v-model="reviewForm.content" type="textarea" :rows="4" disabled />
        </el-form-item>
        <el-form-item label="审核结果" prop="status">
          <el-radio-group v-model="reviewForm.status">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false" aria-label="取消">取消</el-button>
          <el-button type="primary" @click="submitReviewForm" aria-label="确定">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 评论详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="评论详情"
      width="600px"
    >
      <div v-if="commentDetail" class="comment-detail">
        <div class="detail-item">
          <div class="detail-label">评论ID</div>
          <div class="detail-value">{{ commentDetail.comment_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">用户ID</div>
          <div class="detail-value">{{ commentDetail.user_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">游戏ID</div>
          <div class="detail-value">{{ commentDetail.game_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">评论内容</div>
          <div class="detail-value">{{ commentDetail.content }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">审核状态</div>
          <div class="detail-value">
            <el-tag :type="getStatusType(commentDetail.status)">
              {{ getStatusText(commentDetail.status) }}
            </el-tag>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">创建时间</div>
          <div class="detail-value">{{ formatDateTime(commentDetail.create_time) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">更新时间</div>
          <div class="detail-value">{{ formatDateTime(commentDetail.update_time) }}</div>
        </div>
      </div>
      <div v-else class="detail-loading">
        <el-skeleton :rows="7" animated />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// 基础URL
const baseURL = import.meta.env.VITE_API_URL || '/api'

// 数据加载状态
const loading = ref(false)

// 评论列表数据
const commentList = ref([])
const total = ref(0)
const currentPage = ref(1)

// 搜索表单
const searchForm = reactive({
  user_id: '',
  game_id: ''
})

// 审核评论对话框
const reviewDialogVisible = ref(false)
const reviewFormRef = ref(null)
const reviewForm = reactive({
  comment_id: '',
  user_id: '',
  game_id: '',
  content: '',
  status: 'approved'
})

// 审核表单验证规则
const reviewRules = {
  status: [
    { required: true, message: '请选择审核结果', trigger: 'change' }
  ]
}

// 评论详情对话框
const detailDialogVisible = ref(false)
const commentDetail = ref(null)

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'approved':
      return '已通过'
    case 'pending':
      return '待审核'
    case 'rejected':
      return '已拒绝'
    default:
      return '未知状态'
  }
}

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''

  try {
    const date = new Date(dateTimeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('日期格式化错误:', error)
    return dateTimeStr
  }
}

// 获取评论列表
const fetchCommentList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: 10
    }

    // 添加搜索条件
    if (searchForm.user_id) params.user_id = searchForm.user_id
    if (searchForm.game_id) params.game_id = searchForm.game_id

    console.log('搜索参数:', params)

    const response = await axios.get(`${baseURL}/comments`, { params })
    console.log('评论列表原始响应:', response.data)

    if (response.data && response.data.code === 1) {
      // 确保数据格式正确，处理不同的数据结构
      let rows = [];

      if (Array.isArray(response.data.data)) {
        rows = response.data.data;
      } else if (response.data.data && response.data.data.rows && Array.isArray(response.data.data.rows)) {
        rows = response.data.data.rows;
        total.value = response.data.data.total || rows.length;
      } else if (typeof response.data.data === 'object') {
        console.log('评论数据是对象格式，尝试转换');
        rows = Object.values(response.data.data).filter(item => item && typeof item === 'object');
        total.value = rows.length;
      }

      console.log('处理后的评论列表数据:', rows)

      // 手动过滤数据，确保搜索条件生效
      if (searchForm.user_id || searchForm.game_id) {
        rows = rows.filter(comment => {
          let matchUserId = true;
          let matchGameId = true;

          if (searchForm.user_id) {
            const userId = String(comment.user_id || comment.userId || '');
            matchUserId = userId.includes(String(searchForm.user_id));
          }

          if (searchForm.game_id) {
            const gameId = String(comment.game_id || comment.gameId || '');
            matchGameId = gameId.includes(String(searchForm.game_id));
          }

          return matchUserId && matchGameId;
        });

        console.log('过滤后的评论数据:', rows);
        total.value = rows.length;
      }

      // 处理数据，确保所有必要的字段都存在
      commentList.value = rows.map(comment => {
        // 尝试获取各种可能的字段名
        const commentId = comment.comment_id || comment.commentId || '';
        const userId = comment.user_id || comment.userId || '';
        const gameId = comment.game_id || comment.gameId || '';
        const createTime = comment.create_time || comment.createTime || '';
        const updateTime = comment.update_time || comment.updateTime || '';

        return {
          comment_id: commentId,
          user_id: userId,
          game_id: gameId,
          content: comment.content || '',
          status: comment.status || 'pending',
          create_time: createTime,
          update_time: updateTime
        };
      });

      if (!total.value) {
        total.value = commentList.value.length;
      }
    } else {
      ElMessage.error(response.data?.msg || '获取评论列表失败')
    }
  } catch (error) {
    console.error('获取评论列表出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索评论
const handleSearch = () => {
  currentPage.value = 1
  fetchCommentList()
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.user_id = ''
  searchForm.game_id = ''
  handleSearch()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchCommentList()
}

// 查看评论详情
const handleDetail = async (row) => {
  // 确保comment_id存在
  if (!row.comment_id) {
    ElMessage.error('评论ID不存在，无法查看详情')
    return
  }

  detailDialogVisible.value = true
  commentDetail.value = null

  try {
    const response = await axios.get(`${baseURL}/comments/${row.comment_id}`)

    if (response.data && response.data.code === 1) {
      const detail = response.data.data

      // 将驼峰命名转换为下划线命名
      commentDetail.value = {
        comment_id: detail.commentId || detail.comment_id,
        user_id: detail.userId || detail.user_id,
        game_id: detail.gameId || detail.game_id,
        content: detail.content || '',
        status: detail.status || 'pending',
        create_time: detail.createTime || detail.create_time || '',
        update_time: detail.updateTime || detail.update_time || ''
      }
    } else {
      ElMessage.error(response.data?.msg || '获取评论详情失败')
    }
  } catch (error) {
    console.error('获取评论详情出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 审核评论
const handleReview = (row) => {
  // 确保comment_id存在
  if (!row.comment_id) {
    ElMessage.error('评论ID不存在，无法审核')
    return
  }

  // 只能审核待审核的评论
  if (row.status !== 'pending') {
    ElMessage.warning('只能审核待审核状态的评论')
    return
  }

  reviewForm.comment_id = row.comment_id
  reviewForm.user_id = row.user_id
  reviewForm.game_id = row.game_id
  reviewForm.content = row.content
  reviewForm.status = 'approved' // 默认选择通过

  reviewDialogVisible.value = true

  // 重置表单验证
  if (reviewFormRef.value) {
    setTimeout(() => {
      reviewFormRef.value.clearValidate()
    }, 0)
  }
}

// 提交审核表单
const submitReviewForm = async () => {
  if (!reviewFormRef.value) return

  await reviewFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 将表单数据转换为API期望的格式
        const formData = {
          status: reviewForm.status
        }

        const response = await axios.put(`${baseURL}/comments/${reviewForm.comment_id}/review`, formData)

        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || '评论审核成功')
          reviewDialogVisible.value = false
          fetchCommentList()
        } else {
          ElMessage.error(response.data?.msg || '审核评论失败')
        }
      } catch (error) {
        console.error('审核评论出错:', error)
        ElMessage.error('网络错误，请稍后重试')
      }
    } else {
      return false
    }
  })
}

// 删除评论
const handleDelete = (row) => {
  // 确保comment_id存在
  if (!row.comment_id) {
    ElMessage.error('评论ID不存在，无法删除')
    return
  }

  ElMessageBox.confirm(
    `确定要删除评论 #${row.comment_id} 吗？此操作不可逆。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`${baseURL}/comments/${row.comment_id}`)

      if (response.data && response.data.code === 1) {
        ElMessage.success(response.data.msg || '评论删除成功')
        fetchCommentList()
      } else {
        ElMessage.error(response.data?.msg || '删除评论失败')
      }
    } catch (error) {
      console.error('删除评论出错:', error)
      ElMessage.error('网络错误，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 初始化
onMounted(() => {
  fetchCommentList()
})
</script>

<style>
.comment-container {
  padding: 20px;
}

.search-container {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-info {
  color: #606266;
  font-size: 14px;
}

/* 详情对话框样式 */
.comment-detail {
  padding: 10px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.detail-label {
  font-weight: bold;
  color: #606266;
  width: 100px;
  flex-shrink: 0;
}

.detail-value {
  color: #333;
  flex: 1;
  word-break: break-word;
}

.detail-loading {
  padding: 20px;
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
