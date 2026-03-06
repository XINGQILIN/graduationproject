<template>
  <div class="change-password-container">
    <el-card class="password-card">
      <template #header>
        <div class="card-header">
          <h2>修改密码</h2>
        </div>
      </template>
      
      <el-form 
        ref="formRef" 
        :model="passwordForm" 
        :rules="formRules" 
        label-width="120px"
        status-icon
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input 
            v-model="passwordForm.oldPassword" 
            type="password" 
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">确认修改</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      
      <div class="password-tips">
        <h3>密码修改说明：</h3>
        <ul>
          <li>密码长度必须在8-20个字符之间</li>
          <li>密码必须包含字母、数字或特殊字符中的至少两种</li>
          <li>为了您的账户安全，请定期修改密码</li>
          <li>请勿使用与其他网站相同的密码</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单引用
const formRef = ref(null)

// 加载状态
const loading = ref(false)

// 密码表单数据
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证新密码是否符合要求
const validateNewPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入新密码'))
    return
  }
  
  if (value.length < 8 || value.length > 20) {
    callback(new Error('密码长度必须在8-20个字符之间'))
    return
  }
  
  // 检查密码复杂度：必须包含字母、数字或特殊字符中的至少两种
  const hasLetter = /[a-zA-Z]/.test(value)
  const hasNumber = /[0-9]/.test(value)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
  
  // 计算包含的字符类型数量
  const typeCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length
  
  if (typeCount < 2) {
    callback(new Error('密码必须包含字母、数字或特殊字符中的至少两种'))
    return
  }
  
  // 如果确认密码已填写，则验证两次输入是否一致
  if (passwordForm.confirmPassword !== '') {
    formRef.value.validateField('confirmPassword')
  }
  
  callback()
}

// 验证确认密码是否与新密码一致
const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入新密码'))
    return
  }
  
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  
  callback()
}

// 表单验证规则
const formRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { validator: validateNewPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 添加请求拦截器
axios.interceptors.request.use(config => {
  if (config.url.includes('/password')) {
    console.log('发送请求配置:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    })
  }
  return config
})

// 添加响应拦截器
axios.interceptors.response.use(
  response => {
    if (response.config.url.includes('/password')) {
      console.log('收到响应:', {
        status: response.status,
        headers: response.headers,
        data: response.data
      })
    }
    return response
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    // 表单验证
    await formRef.value.validate()
    
    // 显示加载状态
    loading.value = true
    
    // 获取用户ID
    const userInfoStr = localStorage.getItem('userInfo')
    let userId = null
    
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr)
      userId = userInfo.userId || userInfo.user_id
      console.log('从localStorage获取的用户ID:', userId)
    }
    
    if (!userId) {
      // 尝试从JWT令牌中获取用户ID
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const base64Url = token.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const payload = JSON.parse(window.atob(base64))
          userId = payload.userId || payload.sub || payload.id
          console.log('从JWT获取的用户ID:', userId)
        } catch (e) {
          console.error('JWT解析失败:', e)
        }
      }
    }
    
    if (!userId) {
      ElMessage.error('无法获取用户ID，请重新登录')
      return
    }
    
    // 确保密码不为空
    if (!passwordForm.oldPassword) {
      ElMessage.error('当前密码不能为空')
      return
    }
    
    if (!passwordForm.newPassword) {
      ElMessage.error('新密码不能为空')
      return
    }
    
    console.log('准备发送修改密码请求，用户ID:', userId)
    
    // 准备请求数据
    const requestData = {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    }
    
    console.log('请求数据:', requestData)
    
    // 使用正确的API路径
    const response = await axios.put(`/api/users/${userId}/password`, requestData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('修改密码响应:', response.data)
    
    // 处理响应
    if (response.data && response.data.code === 1) {
      ElMessage.success('密码修改成功，请重新登录')
      
      // 自动退出登录
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      
      // 延迟跳转到登录页
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      const errorMsg = response.data?.msg || '密码修改失败，请重试'
      ElMessage.error(errorMsg)
    }
  } catch (error) {
    // 处理错误
    console.error('修改密码出错:', error)
    
    // 尝试提取错误信息
    let errorMsg = '密码修改失败，请重试'
    if (error.response && error.response.data) {
      errorMsg = error.response.data.msg || error.response.data.message || errorMsg
      console.error('错误响应数据:', error.response.data)
    }
    
    ElMessage.error(errorMsg)
  } finally {
    // 隐藏加载状态
    loading.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

onMounted(() => {
  // 不执行任何测试连接
})
</script>

<style scoped>
.change-password-container {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.password-card {
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

.password-tips {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.password-tips h3 {
  margin-top: 0;
  font-size: 16px;
  color: #606266;
}

.password-tips ul {
  margin: 10px 0 0;
  padding-left: 20px;
  color: #909399;
}

.password-tips li {
  margin-bottom: 5px;
}
</style> 