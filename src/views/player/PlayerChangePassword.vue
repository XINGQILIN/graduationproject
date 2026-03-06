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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单数据
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单规则
const formRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度在 8 到 20 个字符', trigger: 'blur' },
    { 
      pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)(?![!@#$%^&*]+$)[0-9A-Za-z!@#$%^&*]{8,20}$/, 
      message: '密码必须包含字母、数字或特殊字符中的至少两种', 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

const formRef = ref(null)
const loading = ref(false)

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 从localStorage获取用户ID
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        const userId = userInfo.user_id
        
        if (!userId) {
          ElMessage.error('获取用户信息失败，请重新登录')
          return
        }
        
        const response = await axios.put(`/api/users/${userId}/password`, {
          old_password: passwordForm.value.oldPassword,
          new_password: passwordForm.value.newPassword
        })
        
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
          throw new Error(response.data?.msg || '密码修改失败')
        }
      } catch (error) {
        console.error('密码修改失败:', error)
        if (error.response && error.response.status === 400) {
          ElMessage.error(error.response.data?.msg || '当前密码不正确')
        } else {
          ElMessage.error('密码修改失败，请稍后重试')
        }
      } finally {
        loading.value = false
      }
    }
  })
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