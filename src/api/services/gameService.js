import axios from 'axios'

// 获取游戏列表
export const getGameList = async (params = {}) => {
  try {
    console.log('请求游戏列表，参数:', params);

    // 使用/api前缀，vite代理会处理
    const response = await axios.get('/api/games', {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('游戏列表响应:', response.data);

    if (response.data && response.data.code === 1) {
      return response.data;
    } else {
      throw new Error(response.data?.msg || '获取游戏列表失败');
    }
  } catch (error) {
    console.error('获取游戏列表服务错误:', error);
    throw error;
  }
}

// 获取游戏分类列表
export const getCategoryList = async (params = {}) => {
  try {
    // 使用/api前缀，vite代理会处理
    const response = await axios.get('/api/game-categories', {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('获取分类列表服务错误:', error);
    throw error;
  }
}
