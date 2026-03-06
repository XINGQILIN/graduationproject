import axios from 'axios';

class CartService {
  // 获取购物车列表
  getCartItems() {
    console.log('调用购物车API: /api/carts');
    return axios.get('/api/carts', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
  
  // 添加商品到购物车
  addToCart(gameId) {
    // 确保gameId是基本类型而不是响应式对象
    const gameIdValue = typeof gameId === 'object' && gameId.value !== undefined 
      ? gameId.value 
      : gameId;
      
    console.log('添加商品到购物车, gameId:', gameIdValue);
    
    return axios.post('/api/carts', {
      game_id: gameIdValue
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
  
  // 从购物车移除商品
  removeFromCart(cartId) {
    return axios.delete(`/api/carts/${cartId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
  
  // 清空购物车
  clearCart() {
    return axios.delete('/api/carts', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
  
  // 检查商品是否在购物车中
  checkInCart(gameId) {
    // 确保gameId是基本类型而不是响应式对象
    const gameIdValue = typeof gameId === 'object' && gameId.value !== undefined 
      ? gameId.value 
      : gameId;
      
    return axios.get('/api/carts/check', {
      params: {
        game_id: gameIdValue
      },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
}

export default new CartService(); 