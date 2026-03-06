<template>
  <div class="refunds-container">
    <h1 class="page-title">我的退款申请</h1>
    
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索订单ID或退款原因"
        clearable
        @input="filterRefunds"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    
    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="refunds.length === 0" class="empty-state">
      <el-empty description="暂无退款申请" />
    </div>
    
    <div v-else class="refunds-list">
      <el-table
        :data="paginatedRefunds"
        style="width: 100%"
        border
        v-loading="tableLoading"
      >
        <el-table-column prop="order_id" label="订单ID" width="120" />
        
        <el-table-column prop="reason" label="退款原因" min-width="200" />
        
        <el-table-column prop="create_time" label="申请时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.create_time) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewRefundDetail(scope.row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <div class="pagination-info">共 {{ filteredRefunds.length }} 条</div>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next"
          :total="filteredRefunds.length"
          @current-change="handleCurrentChange"
          :pager-count="5"
          prev-text="上一页"
          next-text="下一页"
          background
          aria-label="分页导航"
        />
      </div>
    </div>
    
    <el-dialog
      v-model="detailDialogVisible"
      title="退款详情"
      width="500px"
    >
      <div v-if="currentRefund" class="refund-detail">
        <div class="detail-header">
          <el-tag :type="getStatusType(currentRefund.status)" class="status-tag">
            {{ getStatusText(currentRefund.status) }}
          </el-tag>
        </div>
        
        <div class="detail-content">
          <div class="detail-item">
            <span class="detail-label">退款ID:</span>
            <span class="detail-value">{{ currentRefund.refund_id }}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">订单ID:</span>
            <span class="detail-value">{{ currentRefund.order_id }}</span>
          </div>
          
          <div class="detail-item">
            <span class="detail-label">申请时间:</span>
            <span class="detail-value">{{ formatDateTime(currentRefund.create_time) }}</span>
          </div>
          
          <el-divider content-position="left">退款原因</el-divider>
          
          <div class="reason-box">
            {{ currentRefund.reason }}
          </div>
          
          <div v-if="currentRefund.admin_remark">
            <el-divider content-position="left">管理员备注</el-divider>
            <div class="reason-box admin-remark">
              {{ currentRefund.admin_remark }}
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            v-if="currentRefund && currentRefund.status === 'pending'"
            type="danger" 
            @click="confirmCancelRefund"
            :loading="cancelLoading"
          >
            取消退款申请
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loading = ref(true)
const tableLoading = ref(false)
const searchKeyword = ref('')
const refunds = ref([])
const filteredRefunds = ref([])
const detailDialogVisible = ref(false)
const currentRefund = ref(null)
const cancelLoading = ref(false)

// 分页相关变量
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 计算分页后的数据
const paginatedRefunds = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredRefunds.value.slice(startIndex, endIndex)
})

// 处理页码变化
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  console.log(`已切换到第${currentPage.value}页，每页${pageSize.value}条，总计${filteredRefunds.value.length}条`)
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
    case 'rejected': return 'danger'
    case 'pending': return 'warning'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    case 'pending': return '处理中'
    default: return '未知状态'
  }
}

// 筛选退款
const filterRefunds = () => {
  if (!searchKeyword.value) {
    filteredRefunds.value = refunds.value
  } else {
    const keyword = searchKeyword.value.toLowerCase()
    filteredRefunds.value = refunds.value.filter(refund => {
      return refund.order_id.toString().includes(keyword) ||
             refund.reason.toLowerCase().includes(keyword)
    })
  }
  // 更新总数并重置到第一页
  total.value = filteredRefunds.value.length
  currentPage.value = 1
  console.log(`筛选后共有${total.value}条数据，当前在第${currentPage.value}页`)
}

// 获取退款列表
const fetchRefunds = async () => {
  loading.value = true
  try {
    console.log('获取退款列表...')
    
    // 获取用户信息和token
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.user_id
    const token = localStorage.getItem('token')
    
    console.log('当前用户ID:', userId)
    console.log('当前token状态:', token ? '存在' : '不存在')
    
    if (!userId || !token) {
      throw new Error('用户未登录或信息缺失')
    }
    
    // 使用API前缀，确保请求被正确路由到后端
    const API_PREFIX = '/api';
    
    // 尝试使用旧接口路径获取退款列表
    const response = await axios({
      method: 'get',
      url: `${API_PREFIX}/users/${userId}/refunds`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('API响应:', response)
    
    if (response && response.data && response.data.code === 1) {
      console.log('获取退款列表成功:', response.data.data)
      
      // 检查数据结构
      let refundsData = response.data.data
      
      if (refundsData.rows && Array.isArray(refundsData.rows)) {
        refunds.value = refundsData.rows
      } else if (Array.isArray(refundsData)) {
        refunds.value = refundsData
      } else {
        console.error('无法识别的退款数据结构:', refundsData)
        refunds.value = []
      }
      
      filteredRefunds.value = [...refunds.value]
      // 设置总数，确保分页正常工作
      total.value = filteredRefunds.value.length
      console.log(`已加载数据，每页${pageSize.value}条，总计${total.value}条`)
    } else {
      console.error('API返回错误:', response?.data)
      throw new Error(response?.data?.msg || '获取退款列表失败')
    }
  } catch (error) {
    console.error('获取退款列表失败:', error)
    
    // 添加更详细的错误日志
    if (error.response) {
      console.error('错误状态:', error.response.status)
      console.error('错误数据:', error.response.data)
    } else if (error.request) {
      console.error('没有收到响应', error.request)
    } else {
      console.error('错误信息:', error.message)
    }
    
    // 使用硬编码的模拟数据作为后备方案
    console.log('使用模拟数据作为后备方案')
    refunds.value = [
      {
        refund_id: 10001,
        order_id: 2001,
        user_id: JSON.parse(localStorage.getItem('userInfo') || '{}').user_id || 1001,
        reason: '游戏不符合预期',
        status: 'pending',
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString()
      },
      {
        refund_id: 10002,
        order_id: 2002,
        user_id: JSON.parse(localStorage.getItem('userInfo') || '{}').user_id || 1001,
        reason: '购买错误',
        status: 'approved',
        admin_remark: '已确认退款',
        create_time: new Date(Date.now() - 86400000).toISOString(),
        update_time: new Date().toISOString()
      }
    ]
    filteredRefunds.value = [...refunds.value]
    total.value = filteredRefunds.value.length
    
    ElMessage.info('已加载示例数据，实际数据获取失败')
  } finally {
    loading.value = false
  }
}

// 查看退款详情
const viewRefundDetail = (refund) => {
  currentRefund.value = refund
  detailDialogVisible.value = true
}

// 取消退款申请前的确认
const confirmCancelRefund = () => {
  if (!currentRefund.value || currentRefund.value.status !== 'pending') {
    ElMessage.warning('只能取消处理中的退款申请')
    return
  }
  
  ElMessageBox.confirm(
    '确定要取消此退款申请吗？取消后不可恢复。',
    '取消退款申请',
    {
      confirmButtonText: '确定取消',
      cancelButtonText: '返回',
      type: 'warning'
    }
  ).then(() => {
    deleteRefund(currentRefund.value.refund_id)
  }).catch(() => {
    console.log('用户取消了操作')
  })
}

// 删除退款申请
const deleteRefund = async (refundId) => {
  cancelLoading.value = true
  
  try {
    const token = localStorage.getItem('token')
    
    const response = await axios({
      method: 'delete',
      url: `/api/refunds/${refundId}`, // 使用API前缀
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.data && response.data.code === 1) {
      ElMessage.success('退款申请已取消')
      detailDialogVisible.value = false
      fetchRefunds() // 重新加载数据
    } else {
      throw new Error(response.data?.msg || '取消退款申请失败')
    }
  } catch (error) {
    console.error('取消退款申请失败:', error)
    
    // 添加更详细的错误日志
    if (error.response) {
      console.error('错误状态:', error.response.status)
      console.error('错误数据:', error.response.data)
      ElMessage.error(error.response.data?.msg || '取消退款申请失败')
    } else if (error.request) {
      console.error('没有收到响应', error.request)
      ElMessage.error('服务器无响应，请稍后再试')
    } else {
      console.error('错误信息:', error.message)
      ElMessage.error(error.message || '取消退款申请失败')
    }
  } finally {
    cancelLoading.value = false
  }
}

onMounted(() => {
  // 为确保用户信息已加载，延迟一小段时间再获取退款数据
  setTimeout(() => {
    fetchRefunds()
  }, 300)
  
  // 确保页面可以滚动
  document.body.style.overflow = 'auto'
})
</script>

<style scoped>
.refunds-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 30px;
  font-size: 24px;
  color: #303133;
  text-align: center;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-input {
  width: 300px;
}

.loading {
  padding: 40px 0;
  text-align: center;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.refunds-list {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 详情对话框样式 */
.refund-detail {
  padding: 0 10px;
}

.detail-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.status-tag {
  font-size: 14px;
}

.detail-content {
  margin-bottom: 20px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
}

.detail-label {
  width: 80px;
  color: #606266;
  font-weight: bold;
}

.detail-value {
  color: #303133;
}

.reason-box {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  color: #303133;
  margin-bottom: 15px;
  line-height: 1.5;
}

.admin-remark {
  background-color: #fdf6ec;
  color: #e6a23c;
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