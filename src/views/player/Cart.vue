<template>
  <div class="cart-container">
    <h1 class="page-title">购物车</h1>
    
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    
    <div v-else-if="cartItems.length === 0" class="empty-cart">
      <el-empty description="您的购物车是空的" :image-size="200">
        <template #description>
          <p>您的购物车是空的</p>
        </template>
        <el-button type="primary" @click="$router.push('/player/games')">去浏览游戏</el-button>
      </el-empty>
    </div>
    
    <div v-else class="cart-content">
      <div class="cart-header">
        <el-checkbox 
          v-model="allSelected" 
          @change="handleSelectAllChange"
          :indeterminate="isIndeterminate"
        >
          全选
        </el-checkbox>
        
        <el-button 
          type="danger" 
          size="small" 
          @click="batchRemoveFromCart" 
          :disabled="selectedItems.length === 0"
        >
          <el-icon><Delete /></el-icon> 删除选中
        </el-button>
      </div>
      
      <div class="cart-list">
        <div 
          v-for="item in cartItems" 
          :key="item.cartId" 
          class="cart-item"
          :class="{ 'cart-item-selected': item.selected }"
        >
          <div class="cart-item-select">
            <el-checkbox v-model="item.selected" @change="() => handleItemSelectChange(item)" />
          </div>
          
          <div class="cart-item-info">
            <el-image 
              :src="item.gameCoverImage" 
              class="cart-item-image" 
              fit="cover"
              :fallback="'/assets/images/game-default.jpg'"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            
            <div class="cart-item-details">
              <div class="cart-item-title">{{ item.gameTitle }}</div>
              <div class="cart-item-price">¥{{ item.gamePrice }}</div>
            </div>
          </div>
          
          <div class="cart-item-actions">
            <el-button 
              type="danger" 
              size="small" 
              @click="removeFromCart(item.cartId)"
              :loading="item.removing"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
      
      <div class="cart-footer">
        <div class="cart-summary">
          <div class="selected-count">
            已选择 <span class="count">{{ selectedItems.length }}</span> 件商品
          </div>
          <div class="total-price">
            合计: <span class="price">¥{{ totalPrice }}</span>
          </div>
        </div>
        
        <el-button 
          type="primary" 
          size="large" 
          @click="checkout"
          :disabled="selectedItems.length === 0"
        >
          结算
        </el-button>
      </div>
    </div>
    
    <!-- 结算对话框 -->
    <el-dialog
      v-model="checkoutDialogVisible"
      title="确认订单"
      width="500px"
    >
      <div class="checkout-dialog">
        <div class="checkout-items">
          <div 
            v-for="item in selectedItems" 
            :key="item.cartId" 
            class="checkout-item"
          >
            <el-image 
              :src="item.gameCoverImage" 
              class="checkout-item-image" 
              fit="cover"
            >
              <template #error>
                <div class="image-placeholder-small"></div>
              </template>
            </el-image>
            <div class="checkout-item-title">{{ item.gameTitle }}</div>
            <div class="checkout-item-price">¥{{ item.gamePrice }}</div>
          </div>
        </div>
        
        <div class="checkout-total">
          <div class="checkout-total-label">总计:</div>
          <div class="checkout-total-price">¥{{ totalPrice }}</div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="checkoutDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmCheckout" :loading="checkoutLoading">
            确认支付
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Picture } from '@element-plus/icons-vue'
import CartService from '@/services/CartService'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)
const tableLoading = ref(false)
const cartItems = ref([])
const allSelected = ref(false)
const isIndeterminate = ref(false)
const totalPrice = ref(0)
const checkoutDialogVisible = ref(false)
const checkoutLoading = ref(false)
const gameDetails = ref({})

// 设置axios拦截器，确保所有请求都添加Authorization头
axios.interceptors.request.use(config => {
  // 获取token
  const token = localStorage.getItem('token');
  if (token) {
    // 添加Authorization头
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 计算选中的商品
const selectedItems = computed(() => {
  return cartItems.value.filter(item => item.selected)
})

// 计算选中商品的ID列表
const selectedItemIds = computed(() => {
  return selectedItems.value.map(item => item.cartId)
})

// 计算总价
const calculateTotal = () => {
  totalPrice.value = selectedItems.value.reduce((total, item) => {
    return total + (parseFloat(item.gamePrice) || 0)
  }, 0).toFixed(2)
}

// 获取购物车数据
const fetchCartItems = async () => {
  loading.value = true;
  try {
    console.log('正在获取购物车数据...');
    
    // 使用购物车服务获取数据
    const response = await axios.get('/api/carts', {
      params: {
        page: 1,
        pageSize: 50
      }
    });
    
    console.log('购物车API响应:', response.data);
    
    if (response.data && response.data.code === 1) {
      // 处理购物车数据
      let cartData;
      
      // 尝试不同的数据结构
      if (response.data.data.list) {
        cartData = response.data.data.list;
      } else if (response.data.data.rows) {
        cartData = response.data.data.rows;
      } else if (Array.isArray(response.data.data)) {
        cartData = response.data.data;
      } else {
        console.log('购物车数据结构不匹配，原始数据:', response.data);
        cartData = [];
      }
      
      console.log('购物车数据项:', cartData);
      
      // 获取游戏详情信息并处理购物车数据
      if (cartData.length > 0) {
        await fetchGameDetails(cartData);
      } else {
        cartItems.value = [];
      }
    } else {
      ElMessage.error(response.data?.msg || '获取购物车失败');
      cartItems.value = [];
    }
  } catch (error) {
    console.error('获取购物车失败:', error);
    
    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误数据:', error.response.data);
    }
    
    ElMessage.error('获取购物车失败，请稍后再试');
    cartItems.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取游戏详情
const fetchGameDetails = async (cartData) => {
  try {
    // 创建游戏ID数组，处理可能的不同字段名称
    const gameIds = cartData.map(item => item.gameId || item.game_id);
    
    if (gameIds.length === 0) {
      cartItems.value = [];
      return;
    }
    
    console.log('需要获取详情的游戏ID:', gameIds);
    
    // 逐个获取游戏详情
    for (const gameId of gameIds) {
      try {
        const response = await axios.get(`/api/games/${gameId}`);
        
        if (response.data && response.data.code === 1) {
          gameDetails.value[gameId] = response.data.data;
        }
      } catch (error) {
        console.error(`获取游戏 ${gameId} 详情失败:`, error);
      }
    }
    
    console.log('游戏详情数据:', gameDetails.value);
    
    // 处理购物车数据
    processCartItems(cartData);
  } catch (error) {
    console.error('获取游戏详情失败:', error);
    
    // 即使获取详情失败，也尝试显示基本信息
    cartItems.value = cartData.map(item => {
      return {
        cartId: item.cartId || item.cart_id,
        gameId: item.gameId || item.game_id,
        gameTitle: item.gameTitle || item.game_title || '未知游戏',
        gamePrice: item.gamePrice || item.game_price || 0,
        selected: false,
        gameCoverImage: '/assets/images/default-cover.jpg'
      };
    });
  }
};

// 处理购物车数据
const processCartItems = (cartData) => {
  // 将购物车数据与游戏详情合并
  cartItems.value = cartData.map(item => {
    // 获取游戏ID (处理不同的字段名)
    const gameId = item.gameId || item.game_id;
    const gameDetail = gameDetails.value[gameId] || {};
    
    // 构建完整的购物车项
    return {
      cartId: item.cartId || item.cart_id,
      gameId: gameId,
      gameTitle: item.gameTitle || item.game_title || gameDetail.title || '未知游戏',
      gamePrice: item.gamePrice || item.game_price || gameDetail.price || 0,
      // 不再依赖后端isSelected字段，默认为未选中
      selected: false,
      gameCoverImage: gameDetail.coverImage || gameDetail.cover_image || '/assets/images/default-cover.jpg'
    };
  });
  
  console.log('处理后的购物车数据:', cartItems.value);
  
  // 更新全选状态
  updateSelectionState();
  
  // 计算总价
  calculateTotal();
};

// 更新选择状态函数-简化版
const updateSelectionState = () => {
  if (cartItems.value.length === 0) {
    allSelected.value = false;
    isIndeterminate.value = false;
    return;
  }
  
  const checkedCount = cartItems.value.filter(item => item.selected).length;
  allSelected.value = checkedCount === cartItems.value.length && cartItems.value.length > 0;
  isIndeterminate.value = checkedCount > 0 && checkedCount < cartItems.value.length;
};

// 处理购物车项选中状态变化-简化版
const handleItemSelectChange = (item) => {
  console.log('购物车项选中状态变化:', item.cartId, item.selected);
  
  // 仅在前端维护选中状态，不发送API请求
  console.log(`商品 ${item.gameTitle} 选中状态: ${item.selected ? '已选中' : '未选中'}`);
  
  // 更新全选状态和总价
  refreshCartUIState();
};

// 处理全选/全不选-简化版
const handleSelectAllChange = (selected) => {
  console.log('设置全选状态为:', selected);
  
  // 仅在前端更新全选状态，不发送API请求
  cartItems.value.forEach(item => item.selected = selected);
  
  // 更新状态和总价
  refreshCartUIState();
};

// 刷新购物车UI状态（更新全选状态和总价）
const refreshCartUIState = () => {
  // 更新全选状态
  updateSelectionState();
  // 计算总价
  calculateTotal();
};

// 从购物车移除商品
const removeFromCart = async (cartId) => {
  try {
    tableLoading.value = true;
    
    // 使用正确的API路径
    const response = await axios.delete(`/api/carts/${cartId}`);
    
    if (response.data && response.data.code === 1) {
      ElMessage.success('商品已从购物车移除');
      // 重新获取购物车列表
      fetchCartItems();
    } else {
      ElMessage.error(response.data?.msg || '移除失败');
    }
  } catch (error) {
    console.error('从购物车移除商品失败:', error);
    ElMessage.error('移除失败，请稍后再试');
  } finally {
    tableLoading.value = false;
  }
};

// 批量从购物车移除商品
const batchRemoveFromCart = async () => {
  if (selectedItems.value.length === 0) return;
  
  try {
    ElMessageBox.confirm('确定要删除选中的商品吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      tableLoading.value = true;
      
      // 逐个删除选中的商品，使用正确的API路径
      const promises = selectedItems.value.map(item => 
        axios.delete(`/api/carts/${item.cartId}`)
      );
      
      try {
        await Promise.all(promises);
        ElMessage.success('选中商品已从购物车移除');
        // 重新获取购物车列表
        fetchCartItems();
      } catch (error) {
        console.error('批量删除失败:', error);
        ElMessage.error('批量删除失败，请稍后再试');
      } finally {
        tableLoading.value = false;
      }
    }).catch(() => {
      // 用户取消操作
    });
  } catch (error) {
    console.error('批量删除操作失败:', error);
  }
};

// 清空购物车
const clearCart = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空购物车吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 使用正确的API路径
    const response = await axios.delete('/api/carts');
    
    if (response.data && response.data.code === 1) {
      ElMessage.success('购物车已清空');
      cartItems.value = [];
    } else {
      ElMessage.error(response.data?.msg || '清空购物车失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空购物车错误:', error);
      ElMessage.error('清空购物车失败，请稍后再试');
    }
  }
};

// 添加刷新购物车数据的方法
const refreshCart = async () => {
  ElMessage.info('正在刷新购物车...');
  await fetchCartItems();
  ElMessage.success('购物车数据已刷新');
};

// 恢复未选中的商品
const restoreNonSelectedItems = async (nonSelectedItems) => {
  try {
    console.log('尝试恢复未选中的商品到购物车...');
    
    if (!nonSelectedItems || nonSelectedItems.length === 0) {
      return false;
    }
    
    // 逐个恢复未选中的商品
    const promises = nonSelectedItems.map(item => {
      return axios.post('/api/carts', {
        gameId: item.gameId
      });
    });
    
    await Promise.all(promises);
    
    // 重新获取购物车列表
    await fetchCartItems();
    
    return true;
  } catch (error) {
    console.error('恢复未选中商品失败:', error);
    return false;
  }
};

// 确认结算 - 修复版
const confirmCheckout = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请至少选择一件商品');
    return;
  }
  
  checkoutLoading.value = true;
  try {
    // 获取token
    const token = localStorage.getItem('token');
    if (!token) {
      ElMessage.error('您尚未登录，请先登录');
      router.push('/login');
      return;
    }
    
    // 获取选中商品的ID
    const selectedCartIds = selectedItems.value.map(item => item.cartId);
    
    // 记录结算信息，便于调试
    console.log('选中结算的商品:', {
      购物车IDs: selectedCartIds,
      商品标题: selectedItems.value.map(item => item.gameTitle),
      选中商品数量: selectedItems.value.length
    });
    
    const nonSelectedItems = cartItems.value.filter(item => !item.selected);
    if (nonSelectedItems.length > 0) {
      console.log('未选中的商品将保留在购物车中:', {
        购物车IDs: nonSelectedItems.map(item => item.cartId),
        商品标题: nonSelectedItems.map(item => item.gameTitle),
        未选中商品数量: nonSelectedItems.length
      });
    }
    
    // 重要：确保正确添加Authorization头
    console.log('执行结算，传递参数:', { cartIds: selectedCartIds });
    const response = await axios.post('/api/carts/checkout', 
      { cartIds: selectedCartIds },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('结算响应:', response.data);
    
    if (response.data && response.data.code === 1) {
      // 构建成功消息，包含已购买的游戏名称
      let successMessage = '支付成功！';
      const selectedGameTitles = selectedItems.value.map(item => item.gameTitle);
      if (selectedGameTitles.length <= 3) {
        successMessage += ` 已购买: ${selectedGameTitles.join('、')}`;
      } else {
        successMessage += ` 已购买: ${selectedGameTitles.slice(0, 2).join('、')}等${selectedGameTitles.length}款游戏`;
      }
      
      ElMessage.success(successMessage);
      
      // 重新获取购物车列表，应只包含未选中的商品
      await fetchCartItems();
      
      console.log('结算后购物车状态:', {
        购物车总项数: cartItems.value.length,
        购物车内容: cartItems.value.map(item => ({
          cartId: item.cartId,
          gameId: item.gameId,
          title: item.gameTitle,
          price: item.gamePrice
        }))
      });
      
      // 跳转到个人仓库页面
      router.push('/player/library');
    } else {
      ElMessage.error(response.data?.msg || '创建订单失败');
      
      // 重新获取购物车列表
      await fetchCartItems();
    }
  } catch (error) {
    console.error('结算失败:', error);
    
    if (error.response) {
      console.error('服务器响应:', error.response.status, error.response.data);
      ElMessage.error(`结算失败: ${error.response.data?.msg || '服务器错误'}`);
    } else {
      ElMessage.error('结算失败，请检查网络连接后重试');
    }
    
    // 重新获取购物车列表
    await fetchCartItems();
  } finally {
    checkoutLoading.value = false;
  }
};

// 提供一个立即结算指定购物车项的工具方法 - 修复版
const checkoutDirectly = async (cartId) => {
  try {
    console.log(`尝试直接结算购物车项: ${cartId}`);
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('未找到token');
      return false;
    }
    
    // 重要：确保正确添加Authorization头
    const response = await axios.post('/api/carts/checkout', 
      { cartIds: [cartId] },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('直接结算响应:', response.data);
    
    if (response.data && response.data.code === 1) {
      console.log('直接结算成功');
      
      // 重新获取购物车列表
      await fetchCartItems();
      
      // 如果购物车为空，则可能确实是全部清空了
      if (cartItems.value.length === 0) {
        console.warn('警告：直接结算后购物车为空，可能是后端实现问题');
      } else {
        console.log('直接结算后购物车中仍有商品，选择性结算正常工作');
      }
      
      return true;
    } else {
      console.error('直接结算失败:', response.data?.msg);
      return false;
    }
  } catch (error) {
    console.error('直接结算出错:', error);
    return false;
  }
};

// 结算购物车
const checkout = () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请至少选择一件商品');
    return;
  }
  
  // 获取选中商品的标题和总价
  const selectedGameTitles = selectedItems.value.map(item => item.gameTitle);
  const total = totalPrice.value;
  
  // 计算未选中的商品
  const nonSelectedItems = cartItems.value.filter(item => !item.selected);
  
  // 构建确认信息
  let confirmMessage = '';
  
  if (nonSelectedItems.length > 0) {
    confirmMessage = `您选择了${selectedItems.value.length}件商品进行结算。`;
  } else {
    confirmMessage = `您选择了所有${selectedItems.value.length}件商品进行结算。`;
  }
  
  // 记录结算信息，便于调试
  console.log('选中的商品:', selectedItems.value);
  
  // 显示结算确认
  ElMessageBox.confirm(
    confirmMessage,
    '确认结算',
    {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 用户点击确认，调用结算方法
    confirmCheckout();
  }).catch(() => {
    // 用户取消，不做操作
  });
};

onMounted(() => {
  fetchCartItems()
  
  // 确保页面可以滚动
  document.body.style.overflow = 'auto'
})

// 将刷新方法添加到模板中 - 后续可以在购物车页面添加刷新按钮
defineExpose({
  refreshCart,
  checkoutDirectly
});
</script>

<style scoped>
.cart-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 30px;
  font-size: 24px;
  color: #303133;
  text-align: center;
}

.loading-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.empty-cart {
  padding: 40px;
  text-align: center;
}

.cart-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.cart-list {
  padding: 0 20px;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.cart-item-selected {
  background-color: #f0f9eb;
}

.cart-item-select {
  margin-right: 15px;
}

.cart-item-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.cart-item-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  margin-right: 15px;
}

.cart-item-details {
  flex: 1;
}

.cart-item-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.cart-item-price {
  font-weight: bold;
  color: #f56c6c;
  margin: 0 30px;
  font-size: 18px;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  background-color: #f5f7fa;
}

.cart-summary {
  display: flex;
  align-items: center;
}

.selected-count {
  margin-right: 20px;
  color: #606266;
}

.total-price {
  font-size: 18px;
  color: #606266;
}

.highlight {
  color: #f56c6c;
  font-weight: bold;
}

.image-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
  border-radius: 4px;
}

.image-placeholder-small {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  color: #909399;
  border-radius: 4px;
}

.checkout-items {
  max-height: 300px;
  overflow-y: auto;
}

.checkout-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.checkout-item-image {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 10px;
}

.checkout-item-title {
  flex: 1;
  color: #303133;
}

.checkout-item-price {
  color: #f56c6c;
  font-weight: bold;
}

.checkout-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.checkout-total-label {
  font-size: 16px;
  color: #606266;
}

.checkout-total-price {
  font-size: 20px;
  color: #f56c6c;
  font-weight: bold;
}
</style> 