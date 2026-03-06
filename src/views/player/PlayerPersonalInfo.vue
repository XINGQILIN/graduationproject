<template>
  <div class="personal-info-container">
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <h2>个人信息</h2>
          <el-button 
            type="primary" 
            @click="handleEdit" 
            :disabled="isEditing"
          >
            {{ isEditing ? '正在编辑' : '编辑信息' }}
          </el-button>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else>
        <!-- 头像上传区域 -->
        <div class="avatar-container">
          <el-upload
            class="avatar-uploader"
            :action="null"
            :http-request="customUploadAvatar"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :on-error="handleAvatarError"
            :before-upload="beforeAvatarUpload"
            :disabled="!isEditing"
          >
            <img v-if="userForm.avatar" :src="formattedAvatarUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            <div v-if="isEditing" class="avatar-hover-text">点击更换头像</div>
          </el-upload>
        </div>
        
        <el-form 
          ref="formRef" 
          :model="userForm" 
          :rules="formRules" 
          label-width="100px"
          :disabled="!isEditing"
        >
          <el-form-item label="用户名">
            <el-input v-model="userForm.username" disabled>
              <template #append>
                <el-tooltip content="用户名只能由管理员修改" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="邮箱">
            <el-input v-model="userForm.email" disabled>
              <template #append>
                <el-tooltip content="邮箱只能由管理员修改" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="真实姓名" prop="real_name">
            <el-input v-model="userForm.real_name" placeholder="请输入真实姓名" />
          </el-form-item>
          
          <el-form-item label="手机号码" prop="phone">
            <el-input v-model="userForm.phone" placeholder="请输入手机号码" />
          </el-form-item>
          
          <el-form-item label="地址" prop="address">
            <el-input v-model="userForm.address" placeholder="请输入地址" />
          </el-form-item>
          
          <el-form-item label="个性签名" prop="signature">
            <el-input 
              v-model="userForm.signature" 
              type="textarea" 
              :rows="3"
              placeholder="请输入个性签名" 
            />
          </el-form-item>
          
          <el-form-item label="注册时间">
            <el-input v-model="userForm.create_time" disabled />
          </el-form-item>
          
          <el-form-item v-if="isEditing">
            <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
            <el-button @click="cancelEdit">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import axios from 'axios'

// 表单数据
const userForm = ref({
  user_id: '',
  username: '',
  real_name: '',
  email: '',
  phone: '',
  address: '',
  signature: '',
  avatar: '',
  create_time: ''
})

// 表单规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  real_name: [
    { max: 20, message: '长度不能超过 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  address: [
    { max: 100, message: '地址长度不能超过 100 个字符', trigger: 'blur' }
  ],
  signature: [
    { max: 200, message: '个性签名不能超过 200 个字符', trigger: 'blur' }
  ]
}

const formRef = ref(null)
const loading = ref(true)
const submitting = ref(false)
const isEditing = ref(false)
const avatarChanged = ref(false)

// 格式化头像URL
const formattedAvatarUrl = computed(() => {
  if (!userForm.value.avatar) return ''
  
  // 如果已经是完整URL，直接返回
  if (userForm.value.avatar.startsWith('http')) {
    return userForm.value.avatar
  }
  
  // 否则拼接基础URL
  return `/uploads/${userForm.value.avatar}`
})

// 获取用户信息
const fetchUserInfo = async () => {
  loading.value = true
  try {
    // 使用 /api/users/current 接口获取完整的用户信息
    const response = await axios.get('/api/users/current')
    
    if (response.data && response.data.code === 1) {
      const userData = response.data.data
      
      // 格式化日期
      if (userData.create_time) {
        userData.create_time = new Date(userData.create_time).toLocaleString()
      }
      
      userForm.value = {
        user_id: userData.user_id,
        username: userData.username,
        real_name: userData.real_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        signature: userData.bio || '', // 将bio映射到signature
        avatar: userData.avatar || '',
        create_time: userData.create_time || ''
      }
    } else {
      throw new Error(response.data?.msg || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 进入编辑模式
const handleEdit = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  ElMessageBox.confirm(
    '确定要取消编辑吗？所有未保存的修改将丢失。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    isEditing.value = false
    fetchUserInfo() // 重新获取用户信息，恢复原始数据
  }).catch(() => {
    // 用户取消操作，继续编辑
  })
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 获取当前用户ID
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const userId = userInfo.user_id
        
        if (!userId) {
          ElMessage.error('获取用户信息失败，请重新登录')
          return
        }
        
        console.log('正在更新用户ID:', userId, '的信息')
        
        // 只更新个人信息表中的详细信息
        const response = await axios.put(`/api/users/${userId}/personal-info`, {
          real_name: userForm.value.real_name,
          phone: userForm.value.phone,
          address: userForm.value.address,
          bio: userForm.value.signature
        })
        
        console.log('个人信息更新响应:', response.data)
        
        if (response.data && response.data.code === 1) {
          ElMessage.success('个人信息更新成功')
          isEditing.value = false
          
          // 更新本地存储的用户信息，但保持用户名和邮箱不变
          const updatedUserInfo = {
            ...userInfo,
            phone: userForm.value.phone,
            real_name: userForm.value.real_name,
            address: userForm.value.address,
            signature: userForm.value.signature
          }
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
          
          // 刷新用户信息
          await fetchUserInfo()
          
          // 触发头像更新事件
          if (avatarChanged.value) {
            window.dispatchEvent(new CustomEvent('avatar-updated', {
              detail: formattedAvatarUrl.value
            }))
            avatarChanged.value = false
          }
        } else {
          throw new Error(response.data?.msg || '更新失败')
        }
      } catch (error) {
        console.error('提交表单出错:', error)
        ElMessage.error(error.response?.data?.msg || error.message || '更新失败，请稍后重试')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 头像上传前的验证
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('头像只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 自定义上传头像方法
const customUploadAvatar = async (options) => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const userId = userInfo.user_id
    
    // 创建FormData对象
    const formData = new FormData()
    formData.append('file', options.file)
    
    // 使用正确的API路径上传头像
    const response = await axios.post(`/api/users/${userId}/personal-info/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    if (response.data && response.data.code === 1) {
      // 更新头像URL
      userForm.value.avatar = response.data.data.url
      
      // 更新本地存储的用户信息
      const updatedUserInfo = {
        ...userInfo,
        avatar: response.data.data.url
      }
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
      
      // 标记头像已更改
      avatarChanged.value = true
      
      ElMessage.success('头像上传成功')
      options.onSuccess()
    } else {
      throw new Error(response.data?.msg || '头像上传失败')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    ElMessage.error(error.response?.data?.msg || error.message || '头像上传失败，请稍后重试')
    options.onError()
  }
}

// 头像上传成功
const handleAvatarSuccess = () => {
  // 已在customUploadAvatar中处理
}

// 头像上传失败
const handleAvatarError = () => {
  ElMessage.error('头像上传失败，请稍后重试')
}

onMounted(() => {
  fetchUserInfo()
  
  // 确保页面可以滚动
  document.body.style.overflow = 'auto'
})
</script>

<style scoped>
.personal-info-container {
  padding: 20px;
}

.info-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.loading-container {
  padding: 20px;
}

.avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.avatar-uploader {
  position: relative;
  border: 1px dashed #d9d9d9;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  width: 120px;
  height: 120px;
  transition: border-color 0.3s;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-hover-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  text-align: center;
  padding: 4px 0;
  display: none;
}

.avatar-uploader:hover .avatar-hover-text {
  display: block;
}

:deep(.el-form-item__label) {
  font-weight: bold;
}

:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f7fa;
}

/* 添加提示图标的样式 */
.el-input-group__append .el-icon {
  margin: 0 5px;
  color: #909399;
}

.el-tooltip__trigger {
  cursor: help;
}
</style> 