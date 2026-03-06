<template>
  <div class="user-management-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="searchForm.email" placeholder="请输入邮箱" clearable></el-input>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择角色" clearable>
            <el-option label="全部" value=""></el-option>
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="普通用户" value="user"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" aria-label="搜索用户">搜索</el-button>
          <el-button @click="resetSearch" aria-label="重置搜索条件">重置</el-button>
          <el-button 
            type="success" 
            @click="handleAdd" 
            aria-label="新增用户"
          >
            新增用户
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="userList"
      border
      style="width: 100%"
      aria-label="用户列表"
    >
      <el-table-column prop="user_id" label="用户ID" width="100" />
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="email" label="邮箱" min-width="200" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'success'">
            {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
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
          <el-button type="warning" size="small" plain @click="handleEdit(scope.row)" aria-label="编辑用户">编辑</el-button>
          <el-button 
            type="danger" 
            size="small" 
            plain 
            @click="handleDelete(scope.row)" 
            aria-label="删除用户"
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

    <!-- 新增用户对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增用户"
      width="500px"
      @closed="resetAddForm"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="addForm.password" type="password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="addForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="addForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="普通用户" value="user"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑用户"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="用户ID">
          <el-input v-model="editForm.user_id" disabled></el-input>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="普通用户" value="user"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditForm">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="600px"
    >
      <div v-if="userDetail" class="user-detail">
        <div class="detail-item">
          <div class="detail-label">用户ID</div>
          <div class="detail-value">{{ userDetail.user_id }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">用户名</div>
          <div class="detail-value">{{ userDetail.username }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">邮箱</div>
          <div class="detail-value">{{ userDetail.email }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">角色</div>
          <div class="detail-value">
            <el-tag :type="userDetail.role === 'admin' ? 'danger' : 'success'">
              {{ userDetail.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">创建时间</div>
          <div class="detail-value">{{ formatDateTime(userDetail.create_time) }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">更新时间</div>
          <div class="detail-value">{{ formatDateTime(userDetail.update_time) }}</div>
        </div>
      </div>
      <div v-else class="detail-loading">
        <el-skeleton :rows="5" animated />
      </div>
    </el-dialog>

    <!-- 全局错误提示 -->
    <el-alert
      v-if="serverError"
      title="服务器内部错误"
      type="error"
      description="可能是用户已存在或其他数据库错误，请联系管理员"
      show-icon
      closable
      @close="serverError = false"
      style="margin-bottom: 20px;"
    />
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
const serverError = ref(false)

// 用户列表数据
const userList = ref([])
const total = ref(0)
const currentPage = ref(1)

// 搜索表单
const searchForm = reactive({
  username: '',
  email: '',
  role: '' // 可以搜索所有角色
})

// 新增用户对话框
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = reactive({
  username: '',
  password: '',
  email: '',
  role: 'user' // 默认为普通用户
})

// 编辑用户对话框
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = reactive({
  user_id: '',
  username: '',
  email: '',
  role: ''
})

// 用户详情对话框
const detailDialogVisible = ref(false)
const userDetail = ref(null)

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 编辑表单验证规则（不包含密码）
const editRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
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

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  
  try {
    // 构建查询参数
    const params = {
      username: searchForm.username || '',
      email: searchForm.email || '',
      role: searchForm.role || '',
      page: currentPage.value,
      pageSize: 10
    }
    
    console.log('请求用户列表参数:', params)
    
    const response = await axios.get(`${baseURL}/users`, { params })
    
    console.log('用户列表响应:', response.data)
    
    if (response.data && response.data.code === 1) {
      // 处理不同的数据结构
      if (Array.isArray(response.data.data)) {
        userList.value = response.data.data
      } else if (response.data.data && Array.isArray(response.data.data.rows)) {
        userList.value = response.data.data.rows
      } else if (response.data.data && response.data.data.list) {
        userList.value = response.data.data.list
      } else {
        userList.value = []
      }
      
      // 设置总数
      if (response.data.data && response.data.data.total) {
        total.value = response.data.data.total
      } else {
        total.value = userList.value.length
      }
      
      console.log('获取到的用户列表:', userList.value)
    } else {
      ElMessage.error(response.data?.msg || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表出错:', error)
    if (error.response && error.response.status === 500) {
      serverError.value = true
    }
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 搜索用户
const handleSearch = () => {
  currentPage.value = 1
  fetchUserList()
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.username = ''
  searchForm.email = ''
  searchForm.role = ''
  currentPage.value = 1
  fetchUserList()
}

// 分页切换
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchUserList()
}

// 新增用户
const handleAdd = () => {
  // 重置表单
  addForm.username = ''
  addForm.password = ''
  addForm.email = ''
  addForm.role = 'user' // 默认为普通用户
  
  addDialogVisible.value = true
  
  // 重置表单验证
  if (addFormRef.value) {
    setTimeout(() => {
      addFormRef.value.clearValidate()
    }, 0)
  }
}

// 重置新增表单
const resetAddForm = () => {
  if (addFormRef.value) {
    addFormRef.value.resetFields()
  }
}

// 提交添加用户表单
const submitAddForm = async () => {
  if (!addFormRef.value) return
  
  await addFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        
        // 移除user_id字段，让后端自动生成
        const userData = {
          username: addForm.username,
          password: addForm.password,
          email: addForm.email,
          role: addForm.role
        }
        
        console.log('添加用户请求数据:', userData)
        
        const response = await axios.post(`${baseURL}/users`, userData)
        
        console.log('添加用户响应:', response.data)
        
        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || '添加用户成功')
          addDialogVisible.value = false
          fetchUserList()
        } else {
          ElMessage.error(response.data?.msg || '添加用户失败')
        }
      } catch (error) {
        console.error('添加用户出错:', error)
        
        if (error.response) {
          console.error('错误状态码:', error.response.status)
          console.error('错误数据:', error.response.data)
          ElMessage.error(`添加失败: ${error.response.data?.msg || '服务器内部错误'}`)
        } else {
          ElMessage.error('网络错误，请稍后重试')
        }
      } finally {
        loading.value = false
      }
    }
  })
}

// 查看用户详情
const handleDetail = async (row) => {
  // 确保user_id存在
  if (!row.user_id) {
    ElMessage.error('用户ID不存在，无法查看详情')
    return
  }
  
  detailDialogVisible.value = true
  userDetail.value = null
  
  try {
    const response = await axios.get(`${baseURL}/users/${row.user_id}`)
    
    if (response.data && response.data.code === 1) {
      const detail = response.data.data
      
      // 将驼峰命名转换为下划线命名
      userDetail.value = {
        user_id: detail.userId || detail.user_id,
        username: detail.username || '',
        email: detail.email || '',
        role: detail.role || '',
        create_time: detail.createTime || detail.create_time || '',
        update_time: detail.updateTime || detail.update_time || ''
      }
    } else {
      ElMessage.error(response.data?.msg || '获取用户详情失败')
    }
  } catch (error) {
    console.error('获取用户详情出错:', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}

// 编辑用户
const handleEdit = (row) => {
  // 确保user_id存在
  if (!row.user_id) {
    ElMessage.error('用户ID不存在，无法编辑')
    return
  }
  
  editForm.user_id = row.user_id
  editForm.username = row.username
  editForm.email = row.email
  editForm.role = row.role
  
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
          username: editForm.username,
          email: editForm.email,
          role: editForm.role
        }
        
        const response = await axios.put(`${baseURL}/users/${editForm.user_id}`, formData)
        
        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || '用户信息更新成功')
          editDialogVisible.value = false
          fetchUserList()
        } else {
          ElMessage.error(response.data?.msg || '更新用户信息失败')
        }
      } catch (error) {
        console.error('更新用户信息出错:', error)
        ElMessage.error('网络错误，请稍后重试')
      }
    } else {
      return false
    }
  })
}

// 删除用户
const handleDelete = (row) => {
  // 确保user_id存在
  if (!row.user_id) {
    ElMessage.error('用户ID不存在，无法删除')
    return
  }
  
  // 检查是否是当前登录的用户
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (row.user_id === userInfo.userId || row.user_id === userInfo.user_id) {
    ElMessage.warning('不能删除当前登录的账号')
    return
  }
  
  // 如果是管理员，显示更强烈的警告
  const confirmMessage = row.role === 'admin' 
    ? `警告：您正在删除管理员 "${row.username}"！\n\n删除管理员可能会影响系统安全和管理功能。\n确定要继续吗？`
    : `确定要删除用户 "${row.username}" 吗？此操作不可逆。`
  
  const confirmType = row.role === 'admin' ? 'error' : 'warning'
  
  ElMessageBox.confirm(
    confirmMessage,
    row.role === 'admin' ? '危险操作' : '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: confirmType,
      distinguishCancelAndClose: true,
      confirmButtonClass: row.role === 'admin' ? 'el-button--danger' : ''
    }
  ).then(async () => {
    try {
      console.log(`开始删除${row.role === 'admin' ? '管理员' : '用户'}:`, row.user_id)
      
      const response = await axios.delete(`${baseURL}/users/${row.user_id}`)
      
      console.log('删除响应:', response.data)
      
      if (response.data && response.data.code === 1) {
        ElMessage.success(response.data.msg || `${row.role === 'admin' ? '管理员' : '用户'}删除成功`)
        fetchUserList()
      } else {
        ElMessage.error(response.data?.msg || `删除${row.role === 'admin' ? '管理员' : '用户'}失败`)
      }
    } catch (error) {
      console.error(`删除${row.role === 'admin' ? '管理员' : '用户'}出错:`, error)
      
      if (error.response) {
        console.error('错误状态码:', error.response.status)
        console.error('错误数据:', error.response.data)
        ElMessage.error(`删除失败: ${error.response.data?.msg || '服务器内部错误'}`)
      } else {
        ElMessage.error('网络错误，请稍后重试')
      }
    }
  }).catch(() => {
    // 用户取消删除
    console.log('用户取消了删除操作')
  })
}

// 在组件加载时获取用户列表
onMounted(() => {
  console.log('开始获取用户列表')
  fetchUserList()
})
</script>

<style>
.user-management-container {
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
.user-detail {
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
  flex-grow: 1;
  word-break: break-all;
}

.detail-loading {
  padding: 20px;
}
</style> 