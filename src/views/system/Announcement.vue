<template>
  <div class="announcement-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="公告标题">
          <el-input v-model="searchForm.title" placeholder="请输入公告标题" clearable></el-input>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="searchForm.start_time"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDT00:00:00"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" aria-label="搜索公告">搜索</el-button>
          <el-button @click="resetSearch" aria-label="重置搜索条件">重置</el-button>
          <el-button type="success" @click="handleAdd" aria-label="新增公告">新增公告</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="announcementList"
      border
      style="width: 100%"
      aria-label="公告列表"
    >
      <el-table-column prop="announce_id" label="公告ID" width="100" />
      <el-table-column prop="admin_id" label="管理员ID" width="100" />
      <el-table-column prop="title" label="公告标题" min-width="180" show-overflow-tooltip />
      <el-table-column label="公告内容" min-width="250" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.content }}
        </template>
      </el-table-column>
      <el-table-column label="发布时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.publish_time) }}
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
          <el-button type="warning" size="small" plain @click="handleEdit(scope.row)" aria-label="编辑公告">编辑</el-button>
          <el-button type="danger" size="small" plain @click="handleDelete(scope.row)" aria-label="删除公告">删除</el-button>
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

    <!-- 新增公告对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增公告"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input 
            v-model="addForm.content" 
            type="textarea" 
            :rows="8" 
            placeholder="请输入公告内容" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false" aria-label="取消">取消</el-button>
          <el-button type="primary" @click="submitAddForm" aria-label="确定">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑公告对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑公告"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="公告ID">
          <el-input v-model="editForm.announce_id" disabled />
        </el-form-item>
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="editForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input 
            v-model="editForm.content" 
            type="textarea" 
            :rows="8" 
            placeholder="请输入公告内容" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false" aria-label="取消">取消</el-button>
          <el-button type="primary" @click="submitEditForm" aria-label="确定">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 公告详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="公告详情"
      width="700px"
    >
      <div v-if="announcementDetail" class="announcement-detail">
        <div class="detail-item">
          <div class="detail-label">公告ID</div>
          <div class="detail-value">{{ announcementDetail.announce_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">管理员ID</div>
          <div class="detail-value">{{ announcementDetail.admin_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">公告标题</div>
          <div class="detail-value">{{ announcementDetail.title }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">公告内容</div>
          <div class="detail-value content-box">{{ announcementDetail.content }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">发布时间</div>
          <div class="detail-value">{{ formatDateTime(announcementDetail.publish_time) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">创建时间</div>
          <div class="detail-value">{{ formatDateTime(announcementDetail.create_time) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">更新时间</div>
          <div class="detail-value">{{ formatDateTime(announcementDetail.update_time) }}</div>
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

// 公告列表数据
const announcementList = ref([])
const total = ref(0)
const currentPage = ref(1)

// 搜索表单
const searchForm = reactive({
  title: '',
  start_time: ''
})

// 新增公告对话框
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = reactive({
  title: '',
  content: ''
})

// 编辑公告对话框
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  announce_id: '',
  title: '',
  content: ''
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度应在2到100个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { min: 5, max: 5000, message: '内容长度应在5到5000个字符之间', trigger: 'blur' }
  ]
}

// 公告详情对话框
const detailDialogVisible = ref(false)
const announcementDetail = ref(null)

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

// 获取公告列表
const fetchAnnouncementList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: 10
    }
    
    // 添加搜索条件
    if (searchForm.title) params.title = searchForm.title
    if (searchForm.start_time) params.start_time = searchForm.start_time
    
    const response = await axios.get(`${baseURL}/announcements`, { params })
    
    if (response.data && response.data.code === 1) {
      const rows = response.data.data?.rows || []
      
      // 将驼峰命名转换为下划线命名
      announcementList.value = rows.map(announcement => ({
        announce_id: announcement.announceId || announcement.announce_id,
        admin_id: announcement.adminId || announcement.admin_id,
        title: announcement.title || '',
        content: announcement.content || '',
        publish_time: announcement.publishTime || announcement.publish_time || '',
        create_time: announcement.createTime || announcement.create_time || '',
        update_time: announcement.updateTime || announcement.update_time || ''
      }))
      
      total.value = response.data.data?.total || 0
    } else {
      ElMessage.error(response.data?.msg || '获取公告列表失败')
    }
  } catch (error) {
    console.error('获取公告列表出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索公告
const handleSearch = () => {
  currentPage.value = 1
  fetchAnnouncementList()
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.title = ''
  searchForm.start_time = ''
  
  handleSearch()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchAnnouncementList()
}

// 新增公告
const handleAdd = () => {
  addForm.title = ''
  addForm.content = ''
  
  addDialogVisible.value = true
  
  // 重置表单验证
  if (addFormRef.value) {
    setTimeout(() => {
      addFormRef.value.clearValidate()
    }, 0)
  }
}

// 提交新增表单
const submitAddForm = async () => {
  if (!addFormRef.value) return
  
  await addFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 将表单数据转换为API期望的格式
        const formData = {
          title: addForm.title,
          content: addForm.content
        }
        
        const response = await axios.post(`${baseURL}/announcements`, formData)
        
        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || '公告发布成功')
          addDialogVisible.value = false
          fetchAnnouncementList()
        } else {
          ElMessage.error(response.data?.msg || '发布公告失败')
        }
      } catch (error) {
        console.error('发布公告出错:', error)
        ElMessage.error('网络错误，请稍后重试')
      }
    } else {
      return false
    }
  })
}

// 查看公告详情
const handleDetail = async (row) => {
  // 确保announce_id存在
  if (!row.announce_id) {
    ElMessage.error('公告ID不存在，无法查看详情')
    return
  }
  
  detailDialogVisible.value = true
  announcementDetail.value = null
  
  try {
    const response = await axios.get(`${baseURL}/announcements/${row.announce_id}`)
    
    if (response.data && response.data.code === 1) {
      const detail = response.data.data
      
      // 将驼峰命名转换为下划线命名
      announcementDetail.value = {
        announce_id: detail.announceId || detail.announce_id,
        admin_id: detail.adminId || detail.admin_id,
        title: detail.title || '',
        content: detail.content || '',
        publish_time: detail.publishTime || detail.publish_time || '',
        create_time: detail.createTime || detail.create_time || '',
        update_time: detail.updateTime || detail.update_time || ''
      }
    } else {
      ElMessage.error(response.data?.msg || '获取公告详情失败')
    }
  } catch (error) {
    console.error('获取公告详情出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 编辑公告
const handleEdit = (row) => {
  // 确保announce_id存在
  if (!row.announce_id) {
    ElMessage.error('公告ID不存在，无法编辑')
    return
  }
  
  editForm.announce_id = row.announce_id
  editForm.title = row.title
  editForm.content = row.content
  
  editDialogVisible.value = true
  
  // 重置表单验证
  if (editFormRef.value) {
    setTimeout(() => {
      editFormRef.value.clearValidate()
    }, 0)
  }
}

// 提交编辑表单
const submitEditForm = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 将表单数据转换为API期望的格式
        const formData = {
          title: editForm.title,
          content: editForm.content
        }
        
        const response = await axios.put(`${baseURL}/announcements/${editForm.announce_id}`, formData)
        
        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || '公告修改成功')
          editDialogVisible.value = false
          fetchAnnouncementList()
        } else {
          ElMessage.error(response.data?.msg || '修改公告失败')
        }
      } catch (error) {
        console.error('修改公告出错:', error)
        ElMessage.error('网络错误，请稍后重试')
      }
    } else {
      return false
    }
  })
}

// 删除公告
const handleDelete = (row) => {
  // 确保announce_id存在
  if (!row.announce_id) {
    ElMessage.error('公告ID不存在，无法删除')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除公告 "${row.title}" 吗？此操作不可逆。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`${baseURL}/announcements/${row.announce_id}`)
      
      if (response.data && response.data.code === 1) {
        ElMessage.success(response.data.msg || '公告删除成功')
        fetchAnnouncementList()
      } else {
        ElMessage.error(response.data?.msg || '删除公告失败')
      }
    } catch (error) {
      console.error('删除公告出错:', error)
      ElMessage.error('网络错误，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 初始化
onMounted(() => {
  fetchAnnouncementList()
})
</script>

<style>
.announcement-container {
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
.announcement-detail {
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

.content-box {
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
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