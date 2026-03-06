<template>
  <div class="order-container">
    <!-- 搜索区域 - 已删除订单状态查询 -->
    <div class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.user_id" placeholder="请输入用户ID" clearable></el-input>
        </el-form-item>
        <el-form-item label="游戏ID">
          <el-input v-model="searchForm.game_id" placeholder="请输入游戏ID" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" aria-label="搜索订单">搜索</el-button>
          <el-button @click="resetSearch" aria-label="重置搜索条件">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="orderList"
      border
      style="width: 100%"
      aria-label="订单列表"
    >
      <el-table-column prop="order_id" label="订单ID" width="100" />
      <el-table-column prop="user_id" label="用户ID" width="100" />
      <el-table-column prop="game_id" label="游戏ID" width="100" />
      <el-table-column prop="amount" label="金额" width="120">
        <template #default="scope">
          ¥{{ scope.row.amount }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
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
          <el-button type="primary" size="small" plain @click="handleDetail(scope.row)" aria-label="查看订单详情">详情</el-button>
          <el-button type="success" size="small" plain @click="handleEdit(scope.row)" aria-label="修改订单状态">修改状态</el-button>
          <el-button type="danger" size="small" plain @click="handleDelete(scope.row)" aria-label="删除订单">删除</el-button>
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

    <!-- 修改订单状态对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改订单状态"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="订单ID">
          <el-input v-model="editForm.order_id" disabled />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="editForm.status" placeholder="请选择状态">
            <el-option label="待支付" value="pending" />
            <el-option label="已完成" value="completed" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false" aria-label="取消">取消</el-button>
          <el-button type="primary" @click="submitEditForm" aria-label="确定">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      width="600px"
    >
      <div v-if="orderDetail" class="order-detail">
        <div class="detail-item">
          <div class="detail-label">订单ID</div>
          <div class="detail-value">{{ orderDetail.order_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">用户ID</div>
          <div class="detail-value">{{ orderDetail.user_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">游戏ID</div>
          <div class="detail-value">{{ orderDetail.game_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">订单金额</div>
          <div class="detail-value">¥{{ orderDetail.amount }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">订单状态</div>
          <div class="detail-value">
            <el-tag :type="getStatusType(orderDetail.status)">
              {{ getStatusText(orderDetail.status) }}
            </el-tag>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">创建时间</div>
          <div class="detail-value">{{ formatDateTime(orderDetail.create_time) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">更新时间</div>
          <div class="detail-value">{{ formatDateTime(orderDetail.update_time) }}</div>
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

// 订单列表数据
const orderList = ref([])
const total = ref(0)
const currentPage = ref(1)

// 搜索表单
const searchForm = reactive({
  user_id: '',
  game_id: ''
})

// 修改订单状态对话框
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  order_id: '',
  status: ''
})

// 修改表单验证规则
const editRules = {
  status: [
    { required: true, message: '请选择订单状态', trigger: 'change' }
  ]
}

// 订单详情对话框
const detailDialogVisible = ref(false)
const orderDetail = ref(null)

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'pending':
      return 'warning'
    case 'refunded':
      return 'info'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'pending':
      return '待支付'
    case 'refunded':
      return '已退款'
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

// 获取订单列表
const fetchOrderList = async () => {
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
    
    const response = await axios.get(`${baseURL}/orders`, { params })
    console.log('订单列表原始响应:', response.data)
    
    if (response.data && response.data.code === 1) {
      // 确保数据格式正确，处理不同的数据结构
      let rows = [];
      
      if (Array.isArray(response.data.data)) {
        rows = response.data.data;
      } else if (response.data.data && response.data.data.rows && Array.isArray(response.data.data.rows)) {
        rows = response.data.data.rows;
        total.value = response.data.data.total || rows.length;
      } else if (typeof response.data.data === 'object') {
        console.log('订单数据是对象格式，尝试转换');
        rows = Object.values(response.data.data).filter(item => item && typeof item === 'object');
        total.value = rows.length;
      }
      
      console.log('处理后的订单列表数据:', rows)
      
      // 手动过滤数据，确保搜索条件生效
      if (searchForm.user_id || searchForm.game_id) {
        rows = rows.filter(order => {
          let matchUserId = true;
          let matchGameId = true;
          
          if (searchForm.user_id) {
            const userId = String(order.user_id || order.userId || '');
            matchUserId = userId.includes(String(searchForm.user_id));
          }
          
          if (searchForm.game_id) {
            const gameId = String(order.game_id || order.gameId || '');
            matchGameId = gameId.includes(String(searchForm.game_id));
          }
          
          return matchUserId && matchGameId;
        });
        
        console.log('过滤后的订单数据:', rows);
        total.value = rows.length;
      }
      
      // 处理数据，确保所有必要的字段都存在
      orderList.value = rows.map(order => {
        // 尝试获取各种可能的字段名
        const orderId = order.order_id || order.orderId || '';
        const userId = order.user_id || order.userId || '';
        const gameId = order.game_id || order.gameId || '';
        const createTime = order.create_time || order.createTime || '';
        const updateTime = order.update_time || order.updateTime || '';
        
        return {
          order_id: orderId,
          user_id: userId,
          game_id: gameId,
          amount: order.amount || 0,
          status: order.status || 'pending',
          create_time: createTime,
          update_time: updateTime
        };
      });
      
      if (!total.value) {
        total.value = orderList.value.length;
      }
    } else {
      ElMessage.error(response.data?.msg || '获取订单列表失败')
    }
  } catch (error) {
    console.error('获取订单列表出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索订单
const handleSearch = () => {
  currentPage.value = 1
  fetchOrderList()
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
  fetchOrderList()
}

// 查看订单详情
const handleDetail = async (row) => {
  // 确保order_id存在
  if (!row.order_id) {
    ElMessage.error('订单ID不存在，无法查看详情')
    return
  }
  
  detailDialogVisible.value = true
  orderDetail.value = null
  
  try {
    const response = await axios.get(`${baseURL}/orders/${row.order_id}`)
    
    if (response.data && response.data.code === 1) {
      const detail = response.data.data
      
      // 将驼峰命名转换为下划线命名
      orderDetail.value = {
        order_id: detail.orderId || detail.order_id,
        user_id: detail.userId || detail.user_id,
        game_id: detail.gameId || detail.game_id,
        amount: detail.amount || 0,
        status: detail.status || 'pending',
        create_time: detail.createTime || detail.create_time || '',
        update_time: detail.updateTime || detail.update_time || ''
      }
    } else {
      ElMessage.error(response.data?.msg || '获取订单详情失败')
    }
  } catch (error) {
    console.error('获取订单详情出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 修改订单状态
const handleEdit = (row) => {
  // 确保order_id存在
  if (!row.order_id) {
    ElMessage.error('订单ID不存在，无法修改状态')
    return
  }
  
  editForm.order_id = row.order_id
  editForm.status = row.status
  
  editDialogVisible.value = true
  
  // 重置表单验证
  if (editFormRef.value) {
    setTimeout(() => {
      editFormRef.value.clearValidate()
    }, 0)
  }
}

// 提交修改表单
const submitEditForm = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 将表单数据转换为API期望的格式
        const formData = {
          status: editForm.status
        }
        
        const response = await axios.put(`${baseURL}/orders/${editForm.order_id}`, formData)
        
        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || '订单状态修改成功')
          editDialogVisible.value = false
          fetchOrderList()
        } else {
          ElMessage.error(response.data?.msg || '修改订单状态失败')
        }
      } catch (error) {
        console.error('修改订单状态出错:', error)
        ElMessage.error('网络错误，请稍后重试')
      }
    } else {
      return false
    }
  })
}

// 删除订单
const handleDelete = (row) => {
  // 确保order_id存在
  if (!row.order_id) {
    ElMessage.error('订单ID不存在，无法删除')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除订单 #${row.order_id} 吗？此操作不可逆。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`${baseURL}/orders/${row.order_id}`)
      
      if (response.data && response.data.code === 1) {
        ElMessage.success(response.data.msg || '订单删除成功')
        fetchOrderList()
      } else {
        ElMessage.error(response.data?.msg || '删除订单失败')
      }
    } catch (error) {
      console.error('删除订单出错:', error)
      ElMessage.error('网络错误，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 初始化
onMounted(() => {
  fetchOrderList()
})
</script>

<style>
.order-container {
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
.order-detail {
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