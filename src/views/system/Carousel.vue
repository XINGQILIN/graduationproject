<template>
  <div class="carousel-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="游戏ID">
          <el-input v-model="searchForm.link_game_id" placeholder="请输入关联游戏ID" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" aria-label="搜索轮播图">搜索</el-button>
          <el-button @click="resetSearch" aria-label="重置搜索条件">重置</el-button>
          <el-button type="success" @click="handleAdd" aria-label="新增轮播图">新增轮播图</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="carouselList"
      border
      style="width: 100%"
      aria-label="轮播图列表"
    >
      <el-table-column prop="carousel_id" label="轮播图ID" width="100" />
      <el-table-column prop="admin_id" label="管理员ID" width="100" />
      <el-table-column label="轮播图" width="200">
        <template #default="scope">
          <el-image 
            :src="formatImageUrl(scope.row.image_url)" 
            :preview-src-list="[formatImageUrl(scope.row.image_url)]"
            fit="cover"
            style="width: 150px; height: 80px; border-radius: 4px;"
            :z-index="3000"
          >
            <template #error>
              <div class="image-error">
                <el-icon><picture-filled /></el-icon>
                <span>加载失败</span>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="link_game_id" label="关联游戏ID" width="120" />
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
          <el-button type="warning" size="small" plain @click="handleEdit(scope.row)" aria-label="编辑轮播图">编辑</el-button>
          <el-button type="danger" size="small" plain @click="handleDelete(scope.row)" aria-label="删除轮播图">删除</el-button>
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

    <!-- 新增轮播图对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增轮播图"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="关联游戏ID" prop="link_game_id">
          <el-input v-model.number="addForm.link_game_id" placeholder="请输入关联游戏ID" />
        </el-form-item>
        <el-form-item label="轮播图" prop="image_url">
          <el-upload
            class="carousel-uploader"
            :action="null"
            :http-request="customUpload"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <img v-if="addForm.image_url" :src="addForm.image_url" class="carousel-image" />
            <el-icon v-else class="carousel-uploader-icon"><plus /></el-icon>
          </el-upload>
          <div class="upload-tip">
            <p>支持JPG、PNG格式，建议尺寸1920x400像素</p>
            <p v-if="addForm.image_url">
              <el-button type="danger" size="small" @click="removeImage('add')">移除图片</el-button>
            </p>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false" aria-label="取消">取消</el-button>
          <el-button type="primary" @click="submitAddForm" aria-label="确定">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑轮播图对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑轮播图"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="轮播图ID">
          <el-input v-model="editForm.carousel_id" disabled />
        </el-form-item>
        <el-form-item label="关联游戏ID" prop="link_game_id">
          <el-input v-model.number="editForm.link_game_id" placeholder="请输入关联游戏ID" />
        </el-form-item>
        <el-form-item label="轮播图" prop="image_url">
          <el-upload
            class="carousel-uploader"
            :action="null"
            :http-request="customUpload"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
          >
            <img v-if="editForm.image_url" :src="editForm.image_url" class="carousel-image" />
            <el-icon v-else class="carousel-uploader-icon"><plus /></el-icon>
          </el-upload>
          <div class="upload-tip">
            <p>支持JPG、PNG格式，建议尺寸1920x400像素</p>
            <p v-if="editForm.image_url">
              <el-button type="danger" size="small" @click="removeImage('edit')">移除图片</el-button>
            </p>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false" aria-label="取消">取消</el-button>
          <el-button type="primary" @click="submitEditForm" aria-label="确定">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 轮播图详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="轮播图详情"
      width="800px"
    >
      <div v-if="carouselDetail" class="carousel-detail">
        <div class="detail-item">
          <div class="detail-label">轮播图ID:</div>
          <div class="detail-value">{{ carouselDetail.carousel_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">管理员ID:</div>
          <div class="detail-value">{{ carouselDetail.admin_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">关联游戏ID:</div>
          <div class="detail-value">{{ carouselDetail.link_game_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">轮播图:</div>
          <div class="detail-value">
            <el-image
              :src="formatImageUrl(carouselDetail.image_url)"
              :preview-src-list="[formatImageUrl(carouselDetail.image_url)]"
              fit="contain"
              style="width: 60%; max-height: 450px; border-radius: 5px;"
              :z-index="3000"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><picture-filled /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">图片地址:</div>
          <div class="detail-value">
            <el-input
              type="textarea"
              :rows="2"
              v-model="carouselDetail.image_url"
              readonly
            />
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">创建时间:</div>
          <div class="detail-value">{{ formatDateTime(carouselDetail.create_time) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">更新时间:</div>
          <div class="detail-value">{{ formatDateTime(carouselDetail.update_time) }}</div>
        </div>
      </div>
      <div v-else class="detail-loading">
        <el-skeleton :rows="6" animated />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, PictureFilled } from '@element-plus/icons-vue'

// 基础URL
const baseURL = import.meta.env.VITE_API_URL || '/api'

// 数据加载状态
const loading = ref(false)

// 轮播图列表数据
const carouselList = ref([])
const total = ref(0)
const currentPage = ref(1)

// 搜索表单
const searchForm = reactive({
  link_game_id: ''
})

// 新增轮播图对话框
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = reactive({
  link_game_id: '',
  image_url: ''
})

// 编辑轮播图对话框
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  carousel_id: '',
  link_game_id: '',
  image_url: ''
})

// 轮播图详情对话框
const detailDialogVisible = ref(false)
const carouselDetail = ref(null)

// 表单验证规则
const formRules = {
  link_game_id: [
    { required: true, message: '请输入关联游戏ID', trigger: 'blur' },
    { type: 'number', message: '游戏ID必须为数字', trigger: 'blur' }
  ],
  image_url: [
    { required: true, message: '请上传轮播图', trigger: 'change' }
  ]
}

// 上传相关配置
const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})

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

// 在 script 部分顶部添加
const dialogType = ref('add') // 默认为添加模式

// 获取轮播图列表
const fetchCarouselList = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: 10
    }
    
    // 添加搜索条件
    if (searchForm.link_game_id) params.link_game_id = searchForm.link_game_id
    
    const response = await axios.get('/api/carousels', { params })
    
    if (response.data && response.data.code === 1) {
      // 直接使用后端返回的数据，因为字段名已经是下划线格式
      carouselList.value = response.data.data.rows
      total.value = response.data.data.total || 0
    } else {
      ElMessage.error(response.data?.msg || '获取轮播图列表失败')
    }
  } catch (error) {
    console.error('获取轮播图列表出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索轮播图
const handleSearch = () => {
  currentPage.value = 1
  fetchCarouselList()
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.link_game_id = ''
  
  handleSearch()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchCarouselList()
}

// 新增轮播图
const handleAdd = () => {
  dialogType.value = 'add'
  addForm.link_game_id = ''
  addForm.image_url = ''
  
  addDialogVisible.value = true
  
  // 重置表单验证
  if (addFormRef.value) {
    setTimeout(() => {
      addFormRef.value.clearValidate()
    }, 0)
  }
}

// 上传前验证
const beforeUpload = (file) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  
  // 检查文件大小
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB')
    return false
  }
  
  return true
}

// 修改 handleUploadSuccess 函数
const handleUploadSuccess = (response) => {
  console.log('上传成功响应:', response)
  if (response.code === 1) {
    // 根据当前对话框的可见性决定更新哪个表单
    if (addDialogVisible.value) {
      addForm.image_url = response.data.url
    } else if (editDialogVisible.value) {
      editForm.image_url = response.data.url
    }
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error(response.msg || '图片上传失败')
  }
}

// 上传错误处理
const handleUploadError = (error) => {
  console.error('上传图片出错:', error)
  ElMessage.error('上传失败，请重试')
}

// 移除图片
const removeImage = (type) => {
  if (type === 'add') {
    addForm.image_url = ''
  } else if (type === 'edit') {
    editForm.image_url = ''
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
          link_game_id: addForm.link_game_id,
          image_url: addForm.image_url
        }
        
        const response = await axios.post('/api/carousels', formData)
        
        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || '轮播图添加成功')
          addDialogVisible.value = false
          fetchCarouselList()
        } else {
          ElMessage.error(response.data?.msg || '添加轮播图失败')
        }
      } catch (error) {
        console.error('添加轮播图出错:', error)
        ElMessage.error('网络错误，请稍后重试')
      }
    } else {
      return false
    }
  })
}

// 查看轮播图详情
const handleDetail = async (row) => {
  detailDialogVisible.value = true
  carouselDetail.value = null
  
  try {
    console.log('发送请求:', `${baseURL}/carousels/${row.carousel_id} get`)
    
    const response = await axios.get(`${baseURL}/carousels/${row.carousel_id}`)
    
    console.log('收到响应:', response.status, response.data)
    
    if (response.data && response.data.code === 1) {
      // 处理可能的字段名差异
      const detail = response.data.data
      
      carouselDetail.value = {
        carousel_id: detail.carousel_id || detail.id,
        admin_id: detail.admin_id || detail.adminId,
        link_game_id: detail.link_game_id || detail.linkGameId,
        image_url: detail.image_url || detail.imageUrl,
        create_time: detail.create_time || detail.createTime,
        update_time: detail.update_time || detail.updateTime
      }
      
      console.log('处理后的轮播图详情:', carouselDetail.value)
    } else {
      ElMessage.error(response.data?.msg || '获取轮播图详情失败')
    }
  } catch (error) {
    console.error('获取轮播图详情出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 编辑轮播图
const handleEdit = (row) => {
  dialogType.value = 'edit'
  // 确保carousel_id存在
  if (!row.carousel_id) {
    ElMessage.error('轮播图ID不存在，无法编辑')
    return
  }
  
  editForm.carousel_id = row.carousel_id
  editForm.link_game_id = row.link_game_id
  editForm.image_url = row.image_url
  
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
          link_game_id: editForm.link_game_id,
          image_url: editForm.image_url
        }
        
        const response = await axios.put('/api/carousels/' + editForm.carousel_id, formData)
        
        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || '轮播图更新成功')
          editDialogVisible.value = false
          fetchCarouselList()
        } else {
          ElMessage.error(response.data?.msg || '更新轮播图失败')
        }
      } catch (error) {
        console.error('更新轮播图出错:', error)
        ElMessage.error('网络错误，请稍后重试')
      }
    } else {
      return false
    }
  })
}

// 删除轮播图
const handleDelete = (row) => {
  // 确保carousel_id存在
  if (!row.carousel_id) {
    ElMessage.error('轮播图ID不存在，无法删除')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除ID为 ${row.carousel_id} 的轮播图吗？此操作不可逆。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete('/api/carousels/' + row.carousel_id)
      
      if (response.data && response.data.code === 1) {
        ElMessage.success(response.data.msg || '轮播图删除成功')
        fetchCarouselList()
      } else {
        ElMessage.error(response.data?.msg || '删除轮播图失败')
      }
    } catch (error) {
      console.error('删除轮播图出错:', error)
      ElMessage.error('网络错误，请稍后重试')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 格式化图片URL
const formatImageUrl = (url) => {
  if (!url) return ''
  
  // 检查URL是否已经是完整URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 如果是oss://格式，转换为https://格式
  if (url.startsWith('oss://')) {
    // 从URL中提取bucket和对象路径
    const ossPath = url.replace('oss://', '')
    const parts = ossPath.split('/', 1)
    const bucket = parts[0]
    const objectPath = ossPath.substring(bucket.length + 1)
    
    // 构建完整的OSS URL
    return `https://${bucket}.oss-cn-beijing.aliyuncs.com/${objectPath}`
  }
  
  // 如果是相对路径，添加baseURL
  const baseUrl = 'https://pggfypwetpzu.sealoshzh.site'
  return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`
}

// 添加自定义上传方法
const customUpload = async (options) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    
    console.log('开始上传文件:', options.file.name, '类型:', options.file.type, '大小:', options.file.size)
    
    // 使用fetch API代替axios
    const token = localStorage.getItem('token')
    const response = await fetch('/api/carousels/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`上传失败: ${response.status} ${errorText}`)
    }
    
    // 解析JSON响应
    const data = await response.json()
    console.log('上传响应:', data)
    
    if (data && data.code === 1) {
      options.onSuccess(data)
    } else {
      throw new Error(data.msg || '上传失败')
    }
  } catch (error) {
    console.error('上传出错:', error)
    
    // 添加更详细的错误日志
    if (error.response) {
      console.error('错误状态码:', error.response.status)
      console.error('错误数据:', error.response.data)
    }
    
    options.onError(error)
  }
}

// 在 onMounted 之前添加
// 创建请求拦截器
axios.interceptors.request.use(
  config => {
    console.log('发送请求:', config.url, config.method, config.data)
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 创建响应拦截器
axios.interceptors.response.use(
  response => {
    console.log('收到响应:', response.status, response.data)
    return response
  },
  error => {
    console.error('响应错误:', error)
    return Promise.reject(error)
  }
)

// 初始化
onMounted(() => {
  fetchCarouselList()
})
</script>

<style>
.carousel-container {
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

/* 图片上传样式 */
.carousel-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.carousel-uploader:hover {
  border-color: #409EFF;
}

.carousel-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 300px;
  height: 150px;
  line-height: 150px;
  text-align: center;
}

.carousel-image {
  width: 300px;
  height: 150px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  color: #606266;
  font-size: 12px;
  margin-top: 7px;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 14px;
}

/* 详情对话框样式 */
.carousel-detail {
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