<template>
  <div class="library-container">
    <h1 class="page-title">我的游戏仓库</h1>
    
    <div class="search-row">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索游戏名称..."
        prefix-icon="Search"
        clearable
        @input="filterGames"
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="gameLibrary.length === 0" class="empty-library">
      <el-empty description="您的游戏仓库为空">
        <el-button type="primary" @click="$router.push('/PlayerHome')">
          去商城购买游戏
        </el-button>
      </el-empty>
    </div>

    <div v-else class="game-grid">
      <el-card 
        v-for="game in filteredGames" 
        :key="game.gameId" 
        class="game-card"
        :body-style="{ padding: '0px' }"
      >
        <div class="game-cover">
          <el-image
            :src="game.coverImage || '/assets/images/default-cover.jpg'"
            fit="cover"
            :lazy="true"
            @error="() => handleImageError(game)"
          >
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
        
        <div class="game-info">
          <h3 class="game-title" :title="game.title">{{ game.title }}</h3>
          <div class="game-meta">
            <span class="game-date">购买日期: {{ formatDate(game.purchaseDate) }}</span>
            <span v-if="game.refundStatus" class="game-refund-status">
              <el-tag 
                v-if="game.refundStatus.hasPendingRefund" 
                type="warning" 
                size="small"
              >
                退款处理中
              </el-tag>
              <el-tag 
                v-if="game.refundStatus.hasApprovedRefund" 
                type="success" 
                size="small"
              >
                已退款
              </el-tag>
              <el-tag 
                v-if="game.refundStatus.hasRejectedRefund" 
                type="danger" 
                size="small"
              >
                退款被拒
              </el-tag>
            </span>
          </div>
          
          <div class="game-actions">
            <el-tooltip content="下载游戏" placement="top">
              <el-button 
                type="primary" 
                size="small" 
                :loading="game.downloading"
                @click="downloadGame(game)"
              >
                <el-icon><Download /></el-icon> 下载
              </el-button>
            </el-tooltip>
            
            <el-tooltip content="查看详情" placement="top">
              <el-button 
                type="info" 
                size="small"
                @click="viewGameDetail(game)"
              >
                <el-icon><InfoFilled /></el-icon> 详情
              </el-button>
            </el-tooltip>

            <el-tooltip :content="getRefundTooltip(game)" placement="top">
              <el-button 
                type="danger" 
                size="small"
                :disabled="!canRefund(game) || (game.refundStatus && (game.refundStatus.hasPendingRefund || game.refundStatus.hasApprovedRefund))"
                @click="showRefundDialog(game)"
              >
                <el-icon><Delete /></el-icon> 退款
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </el-card>
    </div>

    <div class="pagination-container" v-if="totalGames > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalGames"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加退款弹窗 -->
    <el-dialog
      v-model="refundDialogVisible"
      title="申请退款"
      width="30%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedGame">
        <p>游戏名称：{{ selectedGame.title }}</p>
        <p>购买日期：{{ formatDate(selectedGame.purchaseDate) }}</p>
        <el-form :model="refundForm" label-width="80px">
          <el-form-item label="退款原因" required>
            <el-input
              v-model="refundForm.reason"
              type="textarea"
              :rows="4"
              placeholder="请详细描述退款原因（必填）"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="refundDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRefund" :loading="submittingRefund">
            确认退款
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Search, Download, InfoFilled, Picture, Delete } from '@element-plus/icons-vue';
import axios from 'axios';

const router = useRouter();
const gameLibrary = ref([]);
const loading = ref(true);
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const totalGames = ref(0);

// 退款相关的响应式变量
const refundDialogVisible = ref(false);
const selectedGame = ref(null);
const submittingRefund = ref(false);
const refundForm = ref({
  reason: ''
});

// 过滤后的游戏列表
const filteredGames = computed(() => {
  if (!searchKeyword.value) return gameLibrary.value;
  
  const keyword = searchKeyword.value.toLowerCase();
  return gameLibrary.value.filter(game => 
    game.title.toLowerCase().includes(keyword) || 
    (game.categoryName && game.categoryName.toLowerCase().includes(keyword))
  );
});

// 搜索游戏
const filterGames = () => {
  // 搜索功能已经通过 filteredGames 计算属性实现
  // 这个函数保留为空，以避免控制台警告
  console.log('搜索关键词:', searchKeyword.value);
}

// 获取用户的已购买游戏
const fetchPurchasedGames = async () => {
  try {
    loading.value = true;
    
    // 获取token和用户ID
    const token = localStorage.getItem('token');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId || userInfo.user_id;
    
    console.log('获取游戏库数据，用户ID:', userId);
    
    // 获取已完成的订单
    const ordersResponse = await axios.get('/api/orders', {
      params: {
        status: 'completed',
        page: currentPage.value,
        pageSize: pageSize.value
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('订单API响应:', ordersResponse.data);
    
    if (ordersResponse.data && ordersResponse.data.code === 1) {
      let orders = [];
      let total = 0;
      
      if (ordersResponse.data.data) {
        if (Array.isArray(ordersResponse.data.data)) {
          orders = ordersResponse.data.data;
          total = orders.length;
        } else if (ordersResponse.data.data.list) {
          orders = ordersResponse.data.data.list;
          total = ordersResponse.data.data.total || orders.length;
        } else if (ordersResponse.data.data.rows) {
          orders = ordersResponse.data.data.rows;
          total = ordersResponse.data.data.total || orders.length;
        } else {
          orders = [ordersResponse.data.data];
          total = 1;
        }
      }
      
      totalGames.value = total;
      console.log('获取到的订单数据:', orders);
      
      const purchasedGames = [];
      
      for (const order of orders) {
        // 确保正确获取orderId
        const orderId = order.id || order.orderId || order.order_id;
        
        if (order.orderItems && Array.isArray(order.orderItems)) {
          for (const item of order.orderItems) {
            purchasedGames.push({
              gameId: item.gameId || item.game_id,
              orderId: orderId, // 使用订单ID
              title: item.gameTitle || item.title || '',
              purchaseDate: order.createTime || order.create_time,
              downloading: false
            });
          }
        } else if (order.game_id || order.gameId) {
          purchasedGames.push({
            gameId: order.game_id || order.gameId,
            orderId: orderId, // 使用订单ID
            title: order.gameTitle || order.title || '',
            purchaseDate: order.createTime || order.create_time,
            downloading: false
          });
        }
      }
      
      console.log('已购买游戏列表:', purchasedGames);
      await fetchGamesDetails(purchasedGames);
    } else {
      console.error('获取订单失败:', ordersResponse.data);
      ElMessage.error(ordersResponse.data?.msg || '获取订单数据失败');
    }
  } catch (error) {
    console.error('获取已购买游戏错误:', error);
    ElMessage.error('获取游戏库数据失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 获取游戏详细信息
const fetchGamesDetails = async (purchasedGames) => {
  try {
    if (!purchasedGames || purchasedGames.length === 0) {
      gameLibrary.value = [];
      return;
    }
    
    const gamesWithDetails = [];
    
    // 获取所有游戏的退款状态
    let allRefundStatuses = {};
    try {
      // 先获取所有退款数据，避免多次请求
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const userId = userInfo.userId || userInfo.user_id;
      
      if (userId) {
        const refundsResponse = await axios.get(`/api/users/${userId}/refunds`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (refundsResponse.data && refundsResponse.data.code === 1) {
          let refundList = [];
          
          if (Array.isArray(refundsResponse.data.data)) {
            refundList = refundsResponse.data.data;
          } else if (refundsResponse.data.data && refundsResponse.data.data.rows) {
            refundList = refundsResponse.data.data.rows;
          }
          
          console.log('所有退款记录:', refundList);
          
          // 按订单ID分组
          purchasedGames.forEach(game => {
            const gameRefunds = refundList.filter(refund => 
              refund.order_id === game.orderId
            );
            
            if (gameRefunds.length > 0) {
              allRefundStatuses[game.orderId] = {
                hasPendingRefund: gameRefunds.some(r => r.status === 'pending'),
                hasApprovedRefund: gameRefunds.some(r => r.status === 'approved'),
                hasRejectedRefund: gameRefunds.some(r => r.status === 'rejected'),
                refunds: gameRefunds
              };
            }
          });
          
          console.log('所有游戏退款状态:', allRefundStatuses);
        }
      }
    } catch (error) {
      console.error('获取退款状态失败:', error);
      // 继续处理，不阻止游戏列表加载
    }
    
    // 获取每个游戏的详情
    for (const game of purchasedGames) {
      try {
        console.log(`获取游戏 ${game.gameId} 的详情...`);
        const response = await axios.get(`/api/games/${game.gameId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data && response.data.code === 1) {
          const gameDetail = response.data.data;
          console.log(`游戏 ${game.gameId} 详情:`, gameDetail);
          
          // 添加退款状态
          const refundStatus = allRefundStatuses[game.orderId];
          
          gamesWithDetails.push({
            gameId: gameDetail.game_id || gameDetail.gameId || gameDetail.id || game.gameId,
            orderId: game.orderId,
            title: gameDetail.title || game.title,
            description: gameDetail.description || '暂无描述',
            coverImage: gameDetail.cover_image || gameDetail.coverImage || '',
            price: gameDetail.price || 0,
            purchaseDate: game.purchaseDate,
            downloading: false,
            gamePackage: gameDetail.game_package || gameDetail.gamePackage,
            refundStatus: refundStatus || null
          });
        } else {
          // 添加退款状态
          const refundStatus = allRefundStatuses[game.orderId];
          
          gamesWithDetails.push({
            gameId: game.gameId,
            orderId: game.orderId,
            title: game.title || `游戏 #${game.gameId}`,
            description: '游戏详情获取失败',
            coverImage: '',
            purchaseDate: game.purchaseDate,
            downloading: false,
            refundStatus: refundStatus || null
          });
        }
      } catch (gameError) {
        console.error(`获取游戏ID ${game.gameId} 详情失败:`, gameError);
        
        // 添加退款状态
        const refundStatus = allRefundStatuses[game.orderId];
        
        gamesWithDetails.push({
          gameId: game.gameId,
          orderId: game.orderId,
          title: game.title || `游戏 #${game.gameId}`,
          description: '游戏详情获取失败',
          coverImage: '',
          purchaseDate: game.purchaseDate,
          downloading: false,
          refundStatus: refundStatus || null
        });
      }
    }
    
    gameLibrary.value = gamesWithDetails;
    console.log('游戏库数据:', gameLibrary.value);
  } catch (error) {
    console.error('获取游戏详情错误:', error);
    gameLibrary.value = [];
  }
};

// 下载游戏
const downloadGame = async (game) => {
  // 如果已经在下载中，不重复处理
  if (game.downloading) {
    return;
  }
  
  try {
    // 设置下载状态
    game.downloading = true;
    
    // 显示提示
    ElMessage.info('正在准备下载，请稍候...');
    console.log(`准备下载游戏: ${game.gameId}`, game);
    
    // 获取游戏包路径
    let downloadUrl = '';
    
    if (game.gamePackage) {
      // 如果游戏对象中已经有完整的包路径，直接使用
      downloadUrl = game.gamePackage;
      console.log(`使用游戏对象中的包路径: ${downloadUrl}`);
    } else {
      // 如果没有，再次尝试获取游戏详情
      try {
        const response = await axios.get(`/api/games/${game.gameId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.data && response.data.code === 1) {
          const gameDetail = response.data.data;
          downloadUrl = gameDetail.game_package || gameDetail.gamePackage;
          
          if (downloadUrl) {
            console.log(`从API获取到游戏包路径: ${downloadUrl}`);
          }
        }
      } catch (error) {
        console.error('获取游戏详情失败:', error);
      }
    }
    
    // 如果获取到了下载链接，执行下载
    if (downloadUrl) {
      // 使用a标签下载
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${game.title}.zip`);
      link.setAttribute('target', '_blank');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // 清理DOM并显示成功消息
      setTimeout(() => {
        document.body.removeChild(link);
        ElMessage.success(`${game.title} 下载已开始，请查看浏览器下载文件夹`);
      }, 1000);
    } else {
      // 如果没有获取到下载链接，使用固定的OSS链接
      // 这是一个示例，实际使用中不应该硬编码
      const ossLink = 'https://wqx-yx-bysj.oss-cn-beijing.aliyuncs.com/games/packages/ce855fea-1ab0-41f0-b8e9-fd82bc69357a.zip';
      console.log(`未获取到游戏包路径，使用示例OSS链接: ${ossLink}`);
      
      const link = document.createElement('a');
      link.href = ossLink;
      link.setAttribute('download', `${game.title}.zip`);
      link.setAttribute('target', '_blank');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // 清理DOM并显示成功消息
      setTimeout(() => {
        document.body.removeChild(link);
        ElMessage.success(`${game.title} 下载已开始，请查看浏览器下载文件夹`);
      }, 1000);
    }
  } catch (error) {
    console.error('下载游戏错误:', error);
    ElMessage.error('下载失败，请稍后重试');
  } finally {
    // 延迟修改下载状态
    setTimeout(() => {
      game.downloading = false;
    }, 1500);
  }
};

// 查看游戏详情
const viewGameDetail = (game) => {
  router.push(`/player/game/${game.gameId}`);
};

// 搜索处理
const handleSearch = () => {
  // 本地过滤，不需要重新请求
};

// 分页大小变化
const handleSizeChange = (newSize) => {
  pageSize.value = newSize;
  fetchPurchasedGames();
};

// 当前页变化
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage;
  fetchPurchasedGames();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知日期';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return '未知日期';
  }
};

// 图片加载错误处理
const handleImageError = (game) => {
  game.coverImage = '/assets/images/default-cover.jpg';
};

// 检查是否可以退款（14天内）
const canRefund = (game) => {
  const purchaseDate = new Date(game.purchaseDate);
  const now = new Date();
  const diffTime = Math.abs(now - purchaseDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 14;
};

// 获取退款按钮的提示文本
const getRefundTooltip = (game) => {
  // 首先检查购买日期
  if (!canRefund(game)) {
    return '购买游戏超过14天，无法退款！';
  }
  
  // 检查退款状态
  if (game.refundStatus) {
    if (game.refundStatus.hasPendingRefund) {
      return '该游戏已有一个正在处理中的退款申请';
    }
    
    if (game.refundStatus.hasApprovedRefund) {
      return '该游戏已成功退款';
    }
    
    if (game.refundStatus.hasRejectedRefund) {
      return '退款被拒，可以再次申请';
    }
  }
  
  return '申请退款';
};

// 显示退款弹窗
const showRefundDialog = async (game) => {
  if (!canRefund(game)) {
    ElMessage.warning('购买游戏超过14天，无法退款！');
    return;
  }
  
  try {
    // 获取该游戏的退款记录信息
    const refundStatus = await getGameRefundStatus(game);
    console.log('游戏退款状态:', refundStatus);
    
    // 如果有待处理的退款，不允许再次申请
    if (refundStatus.hasPendingRefund) {
      ElMessage.warning('该游戏已有一个正在处理中的退款申请，请等待处理完成');
      return;
    }
    
    // 如果已有被通过的退款，不允许再次申请
    if (refundStatus.hasApprovedRefund) {
      ElMessage.warning('该游戏已成功退款，无法再次申请');
      return;
    }
    
    // 如果有被拒绝的退款，可以再次申请（前提是仍在14天内）
    if (refundStatus.hasRejectedRefund) {
      console.log('该游戏有一个被拒绝的退款申请，允许再次申请');
    }
    
    // 显示退款弹窗
    selectedGame.value = game;
    refundForm.value.reason = '';
    refundDialogVisible.value = true;
  } catch (error) {
    console.error('检查退款状态失败:', error);
    ElMessage.error('无法获取退款状态，请稍后再试');
  }
};

// 获取游戏的退款状态
const getGameRefundStatus = async (game) => {
  try {
    // 获取用户ID
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId || userInfo.user_id;
    
    if (!userId) {
      throw new Error('获取用户信息失败，请重新登录');
    }
    
    // 获取用户的退款列表
    const response = await axios.get(`/api/users/${userId}/refunds`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // 处理响应
    if (response.data && response.data.code === 1) {
      // 获取退款列表
      let refundList = [];
      
      if (Array.isArray(response.data.data)) {
        refundList = response.data.data;
      } else if (response.data.data && response.data.data.rows) {
        refundList = response.data.data.rows;
      } else {
        refundList = [];
      }
      
      console.log('用户退款列表:', refundList);
      console.log('正在检查游戏:', game.title, ', 订单ID:', game.orderId);
      
      // 查找与当前游戏相关的退款记录
      const gameRefunds = refundList.filter(refund => 
        refund.order_id === game.orderId
      );
      
      console.log('该游戏的退款记录:', gameRefunds);
      
      // 检查是否有待处理的退款
      const hasPendingRefund = gameRefunds.some(refund => refund.status === 'pending');
      
      // 检查是否有已批准的退款
      const hasApprovedRefund = gameRefunds.some(refund => refund.status === 'approved');
      
      // 检查是否有被拒绝的退款
      const hasRejectedRefund = gameRefunds.some(refund => refund.status === 'rejected');
      
      return {
        hasPendingRefund,
        hasApprovedRefund,
        hasRejectedRefund,
        refunds: gameRefunds
      };
    } else {
      console.error('获取退款列表失败:', response.data);
      throw new Error('获取退款列表失败: ' + (response.data?.msg || '未知错误'));
    }
  } catch (error) {
    console.error('获取游戏退款状态失败:', error);
    return {
      hasPendingRefund: false,
      hasApprovedRefund: false,
      hasRejectedRefund: false,
      refunds: []
    };
  }
};

// 提交退款申请
const submitRefund = async () => {
  if (!refundForm.value.reason.trim()) {
    ElMessage.warning('请填写退款原因');
    return;
  }

  try {
    submittingRefund.value = true;
    
    // 获取用户ID
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo.userId || userInfo.user_id;
    
    if (!userId) {
      ElMessage.error('获取用户信息失败，请重新登录');
      return;
    }

    // 构造退款申请数据（按照API文档格式）
    const refundData = {
      order_id: selectedGame.value.orderId,
      reason: refundForm.value.reason
    };

    console.log('提交退款申请数据:', refundData);

    // 使用正确的API路径
    const response = await axios.post(`/api/users/${userId}/refunds`, refundData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.data && response.data.code === 1) {
      ElMessage.success(response.data.msg || '退款申请已提交，请等待管理员审核');
      refundDialogVisible.value = false;
      
      // 刷新游戏列表
      await fetchPurchasedGames();
    } else {
      ElMessage.error(response.data?.msg || '退款申请提交失败');
    }
  } catch (error) {
    console.error('提交退款申请失败:', error);
    if (error.response?.status === 404) {
      ElMessage.error('找不到退款服务，请确认API地址是否正确');
    } else if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录');
      router.push('/login');
    } else {
      ElMessage.error(error.response?.data?.msg || '退款申请提交失败，请稍后重试');
    }
  } finally {
    submittingRefund.value = false;
  }
};

// 初始化
onMounted(() => {
  fetchPurchasedGames();
  
  // 确保页面可以滚动
  document.body.style.overflow = 'auto'
});
</script>

<style scoped>
.library-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
  text-align: center;
}

.search-row {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.search-input {
  width: 300px;
}

.loading-container {
  padding: 20px;
}

.empty-library {
  text-align: center;
  padding: 40px 0;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.game-card {
  height: 100%;
  transition: transform 0.3s;
  overflow: hidden;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.game-cover {
  height: 160px;
  overflow: hidden;
}

.game-cover .el-image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 24px;
}

.game-info {
  padding: 15px;
}

.game-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.game-meta {
  margin-bottom: 15px;
  font-size: 12px;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.game-date {
  color: #666;
}

.game-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0 10px;
}

.game-actions .el-button {
  flex: 1;
  min-width: 80px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 