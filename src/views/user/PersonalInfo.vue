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
          <el-form-item label="用户ID">
            <el-input v-model="userForm.user_id" disabled />
          </el-form-item>
          
          <el-form-item label="用户名" prop="username">
            <el-input v-model="userForm.username" placeholder="请输入用户名" />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="userForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          
          <el-form-item label="手机号码" prop="phone">
            <el-input v-model="userForm.phone" placeholder="请输入手机号码" />
          </el-form-item>
          
          <el-form-item label="真实姓名" prop="real_name">
            <el-input v-model="userForm.real_name" placeholder="请输入真实姓名" />
          </el-form-item>
          
          <el-form-item label="地址" prop="address">
            <el-input v-model="userForm.address" placeholder="请输入地址" />
          </el-form-item>
          
          <el-form-item label="个性签名" prop="bio">
            <el-input 
              v-model="userForm.bio" 
              type="textarea" 
              :rows="3"
              placeholder="请输入个性签名" 
            />
          </el-form-item>
          
          <el-form-item label="注册时间">
            <el-input :value="formatDateTime(userForm.create_time)" disabled />
          </el-form-item>
          
          <el-form-item v-if="isEditing">
            <el-button type="primary" @click="submitForm">保存</el-button>
            <el-button @click="cancelEdit">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import axios from 'axios'

// 表单引用
const formRef = ref(null)

// 状态变量
const loading = ref(true)
const isEditing = ref(false)
const originalUserInfo = ref({})
const userId = ref(null)

// 上传头像的请求头
const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})

// 用户表单数据
const userForm = reactive({
  user_id: '',
  username: '',
  email: '',
  phone: '',
  real_name: '',
  address: '',
  bio: '',
  avatar: '',
  create_time: ''
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应为2-20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  real_name: [
    { max: 20, message: '真实姓名不能超过20个字符', trigger: 'blur' }
  ],
  address: [
    { max: 100, message: '地址不能超过100个字符', trigger: 'blur' }
  ],
  bio: [
    { max: 200, message: '个性签名不能超过200个字符', trigger: 'blur' }
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

// 获取用户信息 - 同时获取基本信息和详细信息
const fetchUserInfo = async () => {
  loading.value = true
  try {
    // 从localStorage获取当前用户ID
    const userInfoStr = localStorage.getItem('userInfo')
    console.log('localStorage中的userInfo:', userInfoStr)
    
    // 尝试从JWT令牌中直接解析用户信息
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(window.atob(base64))
        console.log('从JWT解析的用户信息:', payload)
        
        // 从JWT中获取用户ID
        userId.value = payload.userId || payload.sub || payload.id
        console.log('从JWT中获取的用户ID:', userId.value)
      } catch (e) {
        console.error('JWT解析失败:', e)
      }
    }
    
    // 如果JWT中没有获取到，再尝试从localStorage获取
    if (!userId.value && userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr)
        console.log('解析后的userInfo:', userInfo)
        userId.value = userInfo.userId || userInfo.user_id
        console.log('从localStorage获取的用户ID:', userId.value)
      } catch (e) {
        console.error('解析userInfo失败:', e)
      }
    }
    
    if (!userId.value) {
      console.error('无法获取用户ID')
      ElMessage.error('获取用户信息失败，请重新登录')
      // 重定向到登录页
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
      return
    }
    
    console.log('最终使用的用户ID:', userId.value)
    
    // 并行获取用户基本信息和详细信息
    const [userBasicRes, userDetailRes] = await Promise.all([
      axios.get(`/api/users/${userId.value}`),
      axios.get(`/api/users/${userId.value}/personal-info`)
    ])
    
    console.log('用户基本信息响应:', userBasicRes.data)
    console.log('用户详细信息响应:', userDetailRes.data)
    
    // 处理用户基本信息
    if (userBasicRes.data && userBasicRes.data.code === 1) {
      const basicData = userBasicRes.data.data
      userForm.username = basicData.username || ''
      userForm.email = basicData.email || ''
    } else {
      console.error('获取用户基本信息失败:', userBasicRes.data?.msg)
    }
    
    // 处理用户详细信息
    if (userDetailRes.data && userDetailRes.data.code === 1) {
      const detailData = userDetailRes.data.data
      userForm.user_id = detailData.userId || detailData.user_id || ''
      userForm.phone = detailData.phone || ''
      userForm.real_name = detailData.realName || detailData.real_name || ''
      userForm.address = detailData.address || ''
      userForm.bio = detailData.bio || ''
      userForm.avatar = detailData.avatar || ''
      userForm.create_time = detailData.createTime || detailData.create_time || ''
    } else {
      console.error('获取用户详细信息失败:', userDetailRes.data?.msg)
    }
    
    // 打印更新后的表单数据，用于调试
    console.log('更新后的表单数据:', { ...userForm })
    
    // 保存原始数据，用于取消编辑
    originalUserInfo.value = { ...userForm }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 编辑信息
const handleEdit = () => {
  isEditing.value = true
}

// 取消编辑
const cancelEdit = () => {
  // 恢复原始数据
  Object.assign(userForm, originalUserInfo.value)
  isEditing.value = false
  
  // 清除验证
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 提交表单方法
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 准备用户基本信息更新数据
        const userBasicData = {
          username: userForm.username,
          email: userForm.email
        }
        
        // 准备个人详细信息更新数据
        const personalInfoData = {
          phone: userForm.phone,
          realName: userForm.real_name,
          address: userForm.address,
          bio: userForm.bio,
          avatar: userForm.avatar
        }
        
        console.log('准备提交的用户基本数据:', userBasicData)
        console.log('准备提交的个人详细数据:', personalInfoData)
        
        // 并行发送两个更新请求
        const [basicRes, detailRes] = await Promise.all([
          axios.put(`/api/users/${userId.value}`, userBasicData),
          axios.put(`/api/users/${userId.value}/personal-info`, personalInfoData)
        ])
        
        // 检查两个请求的响应
        if (basicRes.data.code === 1 && detailRes.data.code === 1) {
          ElMessage.success('个人信息更新成功')
          isEditing.value = false
          
          // 更新原始数据
          originalUserInfo.value = { ...userForm }
        } else {
          const errorMsg = []
          if (basicRes.data.code !== 1) errorMsg.push(basicRes.data.msg)
          if (detailRes.data.code !== 1) errorMsg.push(detailRes.data.msg)
          ElMessage.error(`更新失败: ${errorMsg.join(', ')}`)
        }
      } catch (error) {
        console.error('更新个人信息失败:', error)
        ElMessage.error('更新个人信息失败，请稍后重试')
      }
    }
  })
}

// 修改计算属性
const formattedAvatarUrl = computed(() => {
  if (!userForm.avatar) return ''
  
  // 处理OSS协议
  if (userForm.avatar && userForm.avatar.startsWith('oss://')) {
    const ossPath = userForm.avatar.replace('oss://', '')
    const parts = ossPath.split('/', 1)
    const bucket = parts[0]
    const objectPath = ossPath.substring(bucket.length + 1)
    
    return `https://${bucket}.oss-cn-beijing.aliyuncs.com/${objectPath}`
  }
  
  return userForm.avatar
})

// 头像上传前验证
const beforeAvatarUpload = (file) => {
  console.log('准备上传文件:', file.name, '类型:', file.type, '大小:', file.size)
  
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('头像必须是图片格式!')
    return false
  }
  
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过2MB!')
    return false
  }
  
  return true
}

// 头像上传成功回调
const handleAvatarSuccess = (response) => {
  console.log('头像上传响应:', response)
  
  try {
    // 处理响应数据，提取头像URL
    let avatarUrl = ''
    
    // 根据后端新的响应格式提取URL
    if (response && response.code === 1) {
      // 情况1: { code: 1, data: { url: "..." } }
      if (response.data && response.data.url) {
        avatarUrl = response.data.url
        console.log('从response.data.url提取头像URL:', avatarUrl)
      } 
      // 情况2: { code: 1, data: "..." }
      else if (response.data && typeof response.data === 'string') {
        avatarUrl = response.data
        console.log('从response.data(字符串)提取头像URL:', avatarUrl)
      }
    }
    
    // 如果还没找到URL，尝试其他可能的格式
    if (!avatarUrl) {
      if (response && response.url) {
        avatarUrl = response.url
        console.log('从response.url提取头像URL:', avatarUrl)
      } else if (typeof response === 'string') {
        avatarUrl = response
        console.log('从response(字符串)提取头像URL:', avatarUrl)
      }
    }
    
    if (!avatarUrl) {
      console.error('无法从响应中提取头像URL，完整响应:', JSON.stringify(response))
      ElMessage.warning('头像URL')
      return
    }
    
    console.log('提取的头像URL:', avatarUrl)
    
    // 确保URL已经包含时间戳，如果没有则添加
    if (!avatarUrl.includes('t=')) {
      if (avatarUrl.includes('?')) {
        avatarUrl += '&t=' + new Date().getTime()
      } else {
        avatarUrl += '?t=' + new Date().getTime()
      }
      console.log('添加时间戳后的头像URL:', avatarUrl)
    }
    
    // 更新表单中的头像
    userForm.avatar = avatarUrl
    
    // 更新localStorage中的用户信息
    const userInfoStr = localStorage.getItem('userInfo')
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr)
        userInfo.avatar = avatarUrl
        localStorage.setItem('userInfo', JSON.stringify(userInfo))
        console.log('已更新localStorage中的头像URL:', avatarUrl)
        
        // 同时更新sessionStorage
        sessionStorage.setItem('userAvatar', avatarUrl)
        console.log('已更新sessionStorage中的头像URL')
      } catch (e) {
        console.error('更新localStorage中的用户信息失败:', e)
      }
    }
    
    // 触发全局事件，通知其他组件（如Navbar）头像已更新
    window.dispatchEvent(new CustomEvent('avatar-updated', { detail: avatarUrl }))
    
    ElMessage.success('头像上传成功')
  } catch (error) {
    console.error('处理上传响应出错:', error)
    ElMessage.error('处理上传响应出错')
  }
}

// 头像上传失败回调
const handleAvatarError = (error) => {
  console.error('头像上传失败:', error)
  
  // 尝试解析错误信息
  let errorMsg = '上传失败，请稍后重试'
  try {
    if (typeof error === 'string') {
      errorMsg = error
    } else if (error.message && error.message.includes('{')) {
      const jsonStr = error.message.substring(error.message.indexOf('{'))
      const jsonError = JSON.parse(jsonStr)
      errorMsg = jsonError.msg || errorMsg
    } else if (error.response && error.response.data) {
      errorMsg = error.response.data.msg || errorMsg
    }
  } catch (e) {
    console.error('解析错误信息失败:', e)
  }
  
  ElMessage.error(errorMsg)
}

// 自定义头像上传方法
const customUploadAvatar = async (options) => {
  try {
    const formData = new FormData()
    formData.append('file', options.file)
    
    console.log('开始上传头像:', options.file.name, '类型:', options.file.type, '大小:', options.file.size)
    
    // 使用正确的头像上传API路径
    const apiPath = `/api/users/${userId.value}/personal-info/avatar`
    console.log(`上传到: ${apiPath}`)
    
    const token = localStorage.getItem('token')
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log(`上传成功到: ${apiPath}`, data)
      
      if (data) {
        // 上传成功后，获取带时间戳的头像URL
        try {
          const avatarUrlResponse = await fetch(`/api/users/${userId.value}/avatar-url`)
          if (avatarUrlResponse.ok) {
            const avatarUrlData = await avatarUrlResponse.json()
            console.log('获取到的头像URL:', avatarUrlData)
            
            // 如果成功获取到头像URL，使用它
            if (avatarUrlData && avatarUrlData.code === 1 && avatarUrlData.data) {
              // 将头像URL传递给成功回调
              options.onSuccess({
                code: 1,
                data: avatarUrlData.data,
                msg: '头像上传成功'
              })
              return
            }
          }
        } catch (urlError) {
          console.error('获取头像URL失败:', urlError)
          // 如果获取URL失败，继续使用原始响应
        }
        
        // 如果没有成功获取到新的URL，使用原始响应
        options.onSuccess(data)
      } else {
        throw new Error('服务器返回空数据')
      }
    } else {
      const errorText = await response.text()
      console.error(`上传失败，状态码: ${response.status}`, errorText)
      throw new Error(`上传失败: ${response.statusText}`)
    }
  } catch (error) {
    console.error('头像上传出错:', error)
    options.onError(error)
  }
}

// 初始化
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.personal-info-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.info-card {
  margin-bottom: 20px;
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
  padding: 20px 0;
}

/* 头像上传样式 */
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
</style> 