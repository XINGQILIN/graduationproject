// 检查权限组件的逻辑
const checkPermission = (requiredRole) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  return userInfo.role === requiredRole && userInfo.userId // 确保userId存在
} 