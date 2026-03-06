<template>
  <div class="refund-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.user_id" placeholder="请输入用户ID" clearable></el-input>
        </el-form-item>
        <el-form-item label="订单ID">
          <el-input v-model="searchForm.order_id" placeholder="请输入订单ID" clearable></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" aria-label="搜索退款">搜索</el-button>
          <el-button @click="resetSearch" aria-label="重置搜索条件">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="refundList"
      border
      style="width: 100%"
      aria-label="退款列表"
    >
      <el-table-column prop="refund_id" label="退款ID" width="100" />
      <el-table-column prop="user_id" label="用户ID" width="100" />
      <el-table-column prop="order_id" label="订单ID" width="100" />
      <el-table-column label="退款原因" min-width="200" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.reason }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="admin_id" label="处理管理员" width="120">
        <template #default="scope">
          {{ scope.row.admin_id || '未处理' }}
        </template>
      </el-table-column>
      <el-table-column label="申请时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.create_time) }}
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.update_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" plain @click="handleDetail(scope.row)" aria-label="查看详情">详情</el-button>
          <el-button
            v-if="scope.row.status === 'pending'"
            type="success"
            size="small"
            plain
            @click="handleProcess(scope.row)"
            aria-label="处理退款"
          >
            处理
          </el-button>
          <el-button
            type="danger"
            size="small"
            plain
            @click="handleDelete(scope.row)"
            aria-label="删除退款"
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

    <!-- 处理退款对话框 -->
    <el-dialog
      v-model="processDialogVisible"
      title="处理退款申请"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="processFormRef"
        :model="processForm"
        :rules="processRules"
        label-width="100px"
      >
        <el-form-item label="退款ID">
          <el-input v-model="processForm.refund_id" disabled />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="processForm.user_id" disabled />
        </el-form-item>
        <el-form-item label="订单ID">
          <el-input v-model="processForm.order_id" disabled />
        </el-form-item>
        <el-form-item label="退款原因">
          <el-input v-model="processForm.reason" type="textarea" :rows="3" disabled />
        </el-form-item>
        <el-form-item label="处理结果" prop="status">
          <el-radio-group v-model="processForm.status">
            <el-radio label="approved">批准</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="管理员备注" prop="admin_remark">
          <el-input v-model="processForm.admin_remark" type="textarea" :rows="3" placeholder="请输入处理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="processDialogVisible = false" aria-label="取消">取消</el-button>
          <el-button type="primary" @click="submitProcessForm" aria-label="确定">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 退款详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="退款详情"
      width="600px"
    >
      <div v-if="refundDetail" class="refund-detail">
        <div class="detail-item">
          <div class="detail-label">退款ID</div>
          <div class="detail-value">{{ refundDetail.refund_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">用户ID</div>
          <div class="detail-value">{{ refundDetail.user_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">订单ID</div>
          <div class="detail-value">{{ refundDetail.order_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">退款原因</div>
          <div class="detail-value">{{ refundDetail.reason }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">退款状态</div>
          <div class="detail-value">
            <el-tag :type="getStatusType(refundDetail.status)">
              {{ getStatusText(refundDetail.status) }}
            </el-tag>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">处理管理员</div>
          <div class="detail-value">{{ refundDetail.admin_id || '未处理' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">管理员备注</div>
          <div class="detail-value">{{ refundDetail.admin_remark || '无' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">申请时间</div>
          <div class="detail-value">{{ formatDateTime(refundDetail.create_time) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">更新时间</div>
          <div class="detail-value">{{ formatDateTime(refundDetail.update_time) }}</div>
        </div>
      </div>
      <div v-else class="detail-loading">
        <el-skeleton :rows="9" animated />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button
            type="danger"
            @click="handleDelete(refundDetail)"
            v-if="refundDetail"
          >
            删除退款
          </el-button>
        </span>
      </template>
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

// 退款列表数据
const refundList = ref([])
const total = ref(0)
const currentPage = ref(1)

// 搜索表单
const searchForm = reactive({
  user_id: '',
  order_id: '',
  status: ''
})

// 处理退款对话框
const processDialogVisible = ref(false)
const processFormRef = ref(null)
const processForm = reactive({
  refund_id: '',
  user_id: '',
  order_id: '',
  reason: '',
  status: 'approved',
  admin_remark: ''
})

// 处理表单验证规则
const processRules = {
  status: [
    { required: true, message: '请选择处理结果', trigger: 'change' }
  ],
  admin_remark: [
    { required: true, message: '请输入管理员备注', trigger: 'blur' },
    { min: 5, max: 500, message: '备注长度应在5到500个字符之间', trigger: 'blur' }
  ]
}

// 退款详情对话框
const detailDialogVisible = ref(false)
const refundDetail = ref(null)

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
      return '已批准'
    case 'pending':
      return '待处理'
    case 'rejected':
      return '已拒绝'
    default:
      return '未知状态'
  }
}

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '未知时间'

  try {
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) return dateTimeStr // 如果无法解析，则返回原始字符串

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

// 获取退款列表
const fetchRefundList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: 10
    }

    // 添加搜索条件
    if (searchForm.user_id) params.user_id = searchForm.user_id
    if (searchForm.order_id) params.order_id = searchForm.order_id

    console.log('搜索参数:', params)

    // 修改API路径
    const response = await axios.get(`${baseURL}/admin/refunds`, { params })
    console.log('退款列表原始响应:', response.data)

    if (response.data && response.data.code === 1) {
      // 处理数据...
      let rows = [];
      let totalItems = 0;

      if (Array.isArray(response.data.data)) {
        rows = response.data.data;
        totalItems = rows.length;
      } else if (response.data.data && response.data.data.rows && Array.isArray(response.data.data.rows)) {
        rows = response.data.data.rows;
        // 使用后端返回的总数，而不是当前页的数量
        totalItems = response.data.data.total || 0;
      } else if (response.data.data && response.data.data.list && Array.isArray(response.data.data.list)) {
        rows = response.data.data.list;
        totalItems = response.data.data.total || 0;
      }

      // 手动过滤数据，确保搜索条件生效
      if (searchForm.user_id || searchForm.order_id) {
        rows = rows.filter(refund => {
          let matchUserId = true;
          let matchOrderId = true;

          if (searchForm.user_id) {
            const userId = String(refund.user_id || refund.userId || '');
            matchUserId = userId.includes(String(searchForm.user_id));
          }

          if (searchForm.order_id) {
            const orderId = String(refund.order_id || refund.orderId || '');
            matchOrderId = orderId.includes(String(searchForm.order_id));
          }

          return matchUserId && matchOrderId;
        });

        // 如果是前端过滤，总数应该是过滤后的数量
        totalItems = rows.length;
      }

      refundList.value = rows.map(refund => ({
        refund_id: refund.refund_id || refund.refundId,
        user_id: refund.user_id || refund.userId,
        order_id: refund.order_id || refund.orderId,
        reason: refund.reason || '',
        status: refund.status || 'pending',
        admin_id: refund.admin_id || refund.adminId,
        admin_remark: refund.admin_remark || refund.adminRemark || '',
        create_time: refund.create_time || refund.createTime || '',
        update_time: refund.update_time || refund.updateTime || ''
      }));

      // 设置总数，确保分页正常工作
      total.value = totalItems;
      console.log(`已加载第${currentPage.value}页数据，每页${params.pageSize}条，总计${total.value}条`);

    } else {
      ElMessage.error(response.data?.msg || '获取退款列表失败')
    }
  } catch (error) {
    console.error('获取退款列表出错:', error)
    if (error.response) {
      console.error('错误状态码:', error.response.status)
      console.error('错误数据:', error.response.data)
    }
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchRefundList()
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.user_id = ''
  searchForm.order_id = ''
  searchForm.status = ''

  handleSearch()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchRefundList()
}

// 查看退款详情
const handleDetail = async (row) => {
  // 确保refund_id存在
  if (!row.refund_id) {
    ElMessage.error('退款ID不存在，无法查看详情')
    return
  }

  detailDialogVisible.value = true
  refundDetail.value = null

  try {
    // 这里直接使用行数据，因为API没有提供单个退款详情的接口
    refundDetail.value = { ...row }
  } catch (error) {
    console.error('获取退款详情出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 处理退款申请
const handleProcess = (row) => {
  // 确保refund_id存在
  if (!row.refund_id) {
    ElMessage.error('退款ID不存在，无法处理')
    return
  }

  // 只能处理待处理的退款
  if (row.status !== 'pending') {
    ElMessage.warning('只能处理待处理状态的退款申请')
    return
  }

  processForm.refund_id = row.refund_id
  processForm.user_id = row.user_id
  processForm.order_id = row.order_id
  processForm.reason = row.reason
  processForm.status = 'approved' // 默认选择批准
  processForm.admin_remark = ''

  processDialogVisible.value = true

  // 重置表单验证
  if (processFormRef.value) {
    setTimeout(() => {
      processFormRef.value.clearValidate()
    }, 0)
  }
}

// 提交处理表单
const submitProcessForm = async () => {
  if (!processFormRef.value) return

  await processFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 将表单数据转换为API期望的格式
        const formData = {
          status: processForm.status,
          admin_remark: processForm.admin_remark
        }

        console.log('提交的处理数据:', formData)

        const response = await axios.put(`${baseURL}/admin/refunds/${processForm.refund_id}`, formData)

        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || '退款申请处理成功')
          processDialogVisible.value = false
          fetchRefundList()
        } else {
          ElMessage.error(response.data?.msg || '处理退款申请失败')
        }
      } catch (error) {
        console.error('处理退款申请出错:', error)
        ElMessage.error('网络错误，请稍后重试')
      }
    } else {
      return false
    }
  })
}

// 删除退款申请
const handleDelete = (row) => {
  // 确保refund_id存在
  if (!row || !row.refund_id) {
    ElMessage.error('退款ID不存在，无法删除')
    return
  }

  ElMessageBox.confirm(
    `确定要删除该退款申请吗？此操作不可逆。${row.status !== 'pending' ? '\n\n注意：该退款已处理，删除可能影响系统记录。' : ''}`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      distinguishCancelAndClose: true,
    }
  ).then(() => {
    deleteRefund(row.refund_id)
  }).catch(() => {
    console.log('用户取消了删除操作')
  })
}

// 执行删除退款
const deleteRefund = async (refundId) => {
  try {
    console.log(`开始删除退款申请: ${refundId}`)

    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.error('未登录，请先登录')
      return
    }

    const response = await axios({
      method: 'delete',
      url: `${baseURL}/admin/refunds/${refundId}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('删除退款响应:', response.data)

    if (response.data && response.data.code === 1) {
      ElMessage.success(response.data.msg || '退款申请已成功删除')

      // 如果当前在详情对话框，则关闭对话框
      if (detailDialogVisible.value) {
        detailDialogVisible.value = false
      }

      // 刷新退款列表
      fetchRefundList()
    } else {
      ElMessage.error(response.data?.msg || '删除退款申请失败')
    }
  } catch (error) {
    console.error('删除退款申请出错:', error)

    // 添加更详细的错误日志
    if (error.response) {
      console.error('错误状态码:', error.response.status)
      console.error('错误数据:', error.response.data)

      if (error.response.status === 403) {
        ElMessage.error('权限不足，仅管理员可执行此操作')
      } else {
        ElMessage.error(error.response.data?.msg || '删除退款申请失败')
      }
    } else if (error.request) {
      console.error('没有收到响应', error.request)
      ElMessage.error('服务器无响应，请稍后再试')
    } else {
      console.error('错误信息:', error.message)
      ElMessage.error(error.message || '删除退款申请失败')
    }
  }
}

// 初始化
onMounted(() => {
  fetchRefundList()
})
</script>

<style>
.refund-container {
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
.refund-detail {
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
