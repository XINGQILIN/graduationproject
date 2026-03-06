// API配置
export const API_CONFIG = {
  BASE_URL: '/api',
  NO_AUTH_BASE_URL: '/connection-test',
  
  // API路径
  PATHS: {
    // 用户相关
    LOGIN: '/login',
    USERS: '/users',
    
    // 游戏分类
    GAME_CATEGORIES: '/game-categories',
    
    // 游戏
    GAMES: '/games',
    
    // 文件上传
    FILE_UPLOAD: '/test-upload',
    
    // 测试连接
    CONNECTION_TEST: '/connection-test'
  },
  
  // 完整URL (用于直接访问，不通过代理)
  FULL_URL: 'http://10.107.183.43:8080'
}

// 构建API URL
export const buildApiUrl = (path, useNoAuth = false) => {
  const baseUrl = useNoAuth ? API_CONFIG.NO_AUTH_BASE_URL : API_CONFIG.BASE_URL
  return `${baseUrl}${path}`
}

// 构建完整URL (不通过代理)
export const buildFullUrl = (path) => {
  return `${API_CONFIG.FULL_URL}${API_CONFIG.BASE_URL}${path}`
} 