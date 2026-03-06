<template>
  <div>
    <!-- 按钮添加aria-label -->
    <el-button aria-label="操作按钮">操作</el-button>
    
    <!-- 表单元素添加label -->
    <el-form-item label="用户名">
      <el-input aria-label="用户名输入框" placeholder="请输入用户名" />
    </el-form-item>
    
    <!-- 图片添加alt文本 -->
    <el-image :src="imageUrl" alt="图片描述" />
  </div>
</template> 