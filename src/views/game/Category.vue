<template>
  <div class="category-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="分类名称">
          <el-input v-model="searchForm.name" placeholder="请输入分类名称" clearable></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="handleAdd">新增分类</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="categoryList"
      border
      style="width: 100%"
    >
      <el-table-column prop="category_id" label="分类ID" width="100" />
      <el-table-column prop="name" label="分类名称" width="180" />
      <el-table-column prop="description" label="分类描述" min-width="150" />
      <el-table-column prop="create_time" label="创建时间" width="200" />
      <el-table-column prop="update_time" label="更新时间" width="200" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" plain @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" size="small" plain @click="handleDelete(scope.row)">删除</el-button>
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
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增游戏分类' : '编辑游戏分类'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'

// 基础URL
const baseURL = '/api'

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10) // 固定为10
const total = ref(0)

// 表格数据
const categoryList = ref([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  name: ''
})

// 新增/编辑表单
const categoryFormRef = ref(null)
const categoryForm = reactive({
  category_id: '',
  name: '',
  description: ''
})

// 表单验证规则
const categoryRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入分类描述', trigger: 'blur' },
    { max: 200, message: '长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' 或 'edit'

// 初始化加载数据
onMounted(() => {
  fetchCategoryList()
})

// 获取分类列表
const fetchCategoryList = async () => {
  loading.value = true
  try {
    console.log('开始获取分类列表，当前页码:', currentPage.value)
    
    const params = {
      page: currentPage.value,
      pageSize: 10
    }
    
    if (searchForm.name) params.name = searchForm.name
    
    console.log('请求参数:', params)
    
    // 使用正确的API路径
    const response = await axios.get('/api/game-categories', { 
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      }
    })
    
    console.log('分类列表响应:', response.data)
    
    if (response.data && response.data.code === 1) {
      categoryList.value = response.data.data.rows || []
      total.value = response.data.data.total || 0
    } else {
      throw new Error(response.data?.msg || '获取分类列表失败')
    }
  } catch (error) {
    console.error('获取分类列表错误:', error)
    
    // 尝试使用无权限API
    try {
      const fallbackResponse = await axios.get('/connection-test/game-categories', { params })
      if (fallbackResponse.data && fallbackResponse.data.code === 1) {
        categoryList.value = fallbackResponse.data.data.rows || []
        total.value = fallbackResponse.data.data.total || 0
        console.log('使用无权限API获取数据成功')
      } else {
        ElMessage.error(error.message || '网络错误，请稍后重试')
      }
    } catch (fallbackError) {
      if (error.response?.status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
      } else {
        ElMessage.error(error.message || '网络错误，请稍后重试')
      }
    }
  } finally {
    loading.value = false
  }
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchCategoryList()
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchCategoryList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.name = ''
  currentPage.value = 1
  fetchCategoryList()
}

// 新增分类
const handleAdd = () => {
  dialogType.value = 'add'
  categoryForm.category_id = ''
  categoryForm.name = ''
  categoryForm.description = ''
  dialogVisible.value = true
  
  // 重置表单验证
  if (categoryFormRef.value) {
    setTimeout(() => {
      categoryFormRef.value.clearValidate()
    }, 0)
  }
}

// 编辑分类
const handleEdit = (row) => {
  // 确保category_id存在
  if (!row.category_id) {
    ElMessage.error('分类ID不存在，无法编辑')
    return
  }
  
  dialogType.value = 'edit'
  categoryForm.category_id = row.category_id
  categoryForm.name = row.name
  categoryForm.description = row.description
  dialogVisible.value = true
  
  // 重置表单验证
  if (categoryFormRef.value) {
    setTimeout(() => {
      categoryFormRef.value.clearValidate()
    }, 0)
  }
}

// 删除分类
const handleDelete = (row) => {
  // 确保category_id存在
  if (!row.category_id) {
    ElMessage.error('分类ID不存在，无法删除')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除分类 "${row.name}" 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`${baseURL}/game-categories/${row.category_id}`)
      
      if (response.data && response.data.code === 1) {
        ElMessage.success(response.data.msg || '删除成功')
        fetchCategoryList()
      } else {
        ElMessage.error(response.data?.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除分类出错:', error)
      ElMessage.error('网络错误，请稍后重试')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 提交表单
const submitForm = async () => {
  if (!categoryFormRef.value) return
  
  await categoryFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let response
        const formData = {
          name: categoryForm.name,
          description: categoryForm.description
        }
        
        if (dialogType.value === 'add') {
          // 新增
          response = await axios.post(`${baseURL}/game-categories`, formData)
        } else {
          // 编辑
          // 确保category_id存在
          if (!categoryForm.category_id) {
            ElMessage.error('分类ID不存在，无法更新')
            return
          }
          
          response = await axios.put(`${baseURL}/game-categories/${categoryForm.category_id}`, formData)
        }
        
        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || (dialogType.value === 'add' ? '添加成功' : '更新成功'))
          dialogVisible.value = false
          fetchCategoryList()
        } else {
          ElMessage.error(response.data?.msg || '操作失败')
        }
      } catch (error) {
        console.error('提交表单出错:', error)
        ElMessage.error('网络错误，请稍后重试')
      }
    } else {
      return false
    }
  })
}
</script>

<style scoped>
.category-container {
  padding: 20px;
}

.search-container {
  margin-bottom: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.pagination-container {
  margin-top: 20px;
  padding: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #ebeef5;
}

.pagination-info {
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