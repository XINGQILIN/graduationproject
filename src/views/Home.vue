<template>
  <div class="home-container">
    <div class="welcome-section">
      <h2>欢迎使用星期霖游戏管理系统</h2>
      <p>当前登录用户：{{ userName }}</p>
      <p>登录时间：{{ loginTime }}</p>
    </div>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="6">
        <el-card class="data-card">
          <div class="data-card-inner">
            <div class="data-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="data-info">
              <div class="data-title">用户总数</div>
              <div class="data-value">{{ userCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card">
          <div class="data-card-inner">
            <div class="data-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="data-info">
              <div class="data-title">游戏总数</div>
              <div class="data-value">{{ gameCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card">
          <div class="data-card-inner">
            <div class="data-icon">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="data-info">
              <div class="data-title">订单总数</div>
              <div class="data-value">{{ orderCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="data-card">
          <div class="data-card-inner">
            <div class="data-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="data-info">
              <div class="data-title">总收入</div>
              <div class="data-value">¥{{ totalIncome }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>最近7天订单统计</span>
            </div>
          </template>
          <div class="chart-container" ref="orderChartRef"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
<!--            <div class="card-header">-->
<!--              <span>游戏分类统计</span>-->
<!--            </div>-->
          </template>
          <div class="chart-container" ref="categoryChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>系统公告</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(announcement, index) in announcements"
              :key="index"
              :timestamp="announcement.date"
              placement="top"
            >
              {{ announcement.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { User, Monitor, ShoppingCart, Money } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 基础URL
const baseURL = import.meta.env.VITE_API_URL || '/api'

// 用户信息
const userName = ref('管理员')
const loginTime = ref(new Date().toLocaleString())

// 统计数据
const userCount = ref(0)
const gameCount = ref(0)
const orderCount = ref(0)
const totalIncome = ref('0')

// 图表引用
const orderChartRef = ref(null)
const categoryChartRef = ref(null)
let orderChart = null // 保存图表实例以便更新

// 公告
const announcements = ref([
  {
    date: '2025-1-6',
    content: '系统正式上线，开始内测'
  },
  {
    date: '2025-2-22',
    content: '所有功能已完成，可以正常使用'
  },
  {
    date: '2025-3-25',
    content: '今天天气很棒，可以出去一起玩了'
  }
])

// 获取当前登录用户信息
const getCurrentUser = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (userInfo.username) {
      userName.value = userInfo.username
    }

    // 从localStorage获取登录时间，如果没有则使用当前时间
    const storedLoginTime = localStorage.getItem('loginTime')
    if (storedLoginTime) {
      loginTime.value = new Date(parseInt(storedLoginTime)).toLocaleString()
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 获取用户总数
const fetchUserCount = async () => {
  try {
    console.log('正在获取用户总数...')
    const response = await axios.get(`${baseURL}/users`, {
      params: { page: 1, pageSize: 1 } // 只需要获取总数
    })

    console.log('用户API响应:', response.data)
// 检查响应是否成功
    if (response.data && response.data.code === 1) {
      // 当响应数据中存在 total 字段时
      if (response.data.data && response.data.data.total) {
        // 从分页数据中提取总数
        userCount.value = response.data.data.total
        // 当响应数据是数组时（如直接返回用户列表）
      } else if (Array.isArray(response.data.data)) {
        // 通过数组长度获取用户数量
        userCount.value = response.data.data.length
      }// 调试输出用户总数
      console.log('用户总数:', userCount.value)
    } // 捕获任何异常情况
  } catch (error) {
    console.error('获取用户总数失败:', error)
    userCount.value = 0
  }
}

// 异步获取游戏总数
const fetchGameCount = async () => {
  try {
    console.log('正在获取游戏总数...')
    const response = await axios.get(`${baseURL}/games`, {
      params: { page: 1, pageSize: 1 }  // 1. 触发后端分页逻辑获取总数量 2. 仅返回1条数据
    })
// 打印原始响应数据
    console.log('游戏API响应:', response.data)
// 处理成功响应
    if (response.data && response.data.code === 1) {
      // 情况1：分页数据结构
      if (response.data.data && response.data.data.total) {
        // 从分页元数据中提取总数
        gameCount.value = response.data.data.total
        // 情况2：直接返回数组结构
      } else if (Array.isArray(response.data.data)) {
        // 通过数组长度统计总数
        gameCount.value = response.data.data.length
      }// 调试输出统计结果
      console.log('游戏总数:', gameCount.value)
    }// 异常处理（网络错误
  } catch (error) {
    console.error('获取游戏总数失败:', error)
    gameCount.value = 0
  }
}

// 获取订单总数和总收入
const fetchOrderStats = async () => {
  try {
    console.log('正在获取订单数据...')
    // 只请求第一页，但通过total字段获取总数
    const response = await axios.get(`${baseURL}/orders`, {
      params: {
        page: 1,
        pageSize: 10 // 只获取第一页数据
      }
    })

    console.log('订单API响应:', response.data)

    if (response.data && response.data.code === 1) {
      // 从分页数据中获取总数
      if (response.data.data && response.data.data.total) {
        // 后端直接返回了total字段
        orderCount.value = response.data.data.total
        console.log('从total字段获取订单总数:', orderCount.value)
      } else if (Array.isArray(response.data.data)) {
        // 如果没有total字段，使用数组长度
        orderCount.value = response.data.data.length
        console.log('从数组长度获取订单总数:', orderCount.value)
      }

      // 获取所有已完成订单计算总收入
      fetchCompletedOrders()
    } else {
      console.error('获取订单数据失败:', response.data?.msg)
    }
  } catch (error) {
    console.error('获取订单统计失败:', error)
    orderCount.value = 0
  }
}

// 获取已完成订单计算总收入
const fetchCompletedOrders = async () => {
  try {
    console.log('正在获取已完成订单...')
    // 专门查询已完成状态的订单
    const response = await axios.get(`${baseURL}/orders`, {
      params: {
        status: 'completed', // 只查询已完成订单
        page: 1,
        pageSize: 1000 // 尽可能获取更多订单
      }
    })
    // 检查响应是否成功
    if (response.data && response.data.code === 1) {
      let completedOrders = []

      // 处理不同的数据结构，情况1：分页数据结构
      if (response.data.data && response.data.data.rows) {
        completedOrders = response.data.data.rows
        // 情况2：直接返回数组
      } else if (Array.isArray(response.data.data)) {
        completedOrders = response.data.data
        // 情况3：返回对象结构
      } else if (typeof response.data.data === 'object') {
        // 将对象值转为数组，并过滤有效订单对象
        completedOrders = Object.values(response.data.data).filter(item => item && typeof item === 'object')
      }
      // 调试输出订单数量
      console.log('获取到已完成订单数量:', completedOrders.length)

      // 计算总收入
      let income = 0// 初始化总收入
      completedOrders.forEach(order => {
        // 安全转换金额字段
        const amount = parseFloat(order.amount || 0)// 关键点1：处理字段缺失
        if (!isNaN(amount)) {// 关键点2：过滤非法数值
          income += amount
        }
      })

      // 调试输出格式化结果
      totalIncome.value = income.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,// 强制保留2位小数
        maximumFractionDigits: 2
      })
      // 安全回退值
      console.log('已完成订单总收入:', totalIncome.value)
    }
  } catch (error) {
    console.error('获取已完成订单失败:', error)
    totalIncome.value = '0.00'
  }
}

// 获取最近7天订单统计数据
const fetchOrderTrend = async () => {
  try {
    console.log('正在获取最近7天订单统计数据...')

    // 计算最近7天的日期
    const dateLabels = []// 存储格式化后的日期标签（如 ["5-20"
    const today = new Date()// 获取当前日期对象
    // 循环生成最近7天日期（从6天前到今天）
    for (let i = 6; i >= 0; i--) {// i从6递减到0，生成过去7天
      const date = new Date(today)/ 克隆当前日期
      date.setDate(today.getDate() - i)// 当i=0 → date = today - 6天
      const formattedDate = date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })// 格式化为中文短日期（月-日）
      dateLabels.push(formattedDate)
    }

    // 初始化每天的订单数量为0
    const dailyOrders = Array(7).fill(0)

    // 获取所有订单
    const response = await axios.get(`${baseURL}/orders`, {
      params: {
        page: 1,
        pageSize: 1000 // 尽可能获取更多订单
      }
    })
    // 检查响应是否成功
    if (response.data && response.data.code === 1) {
      let orders = []// 初始化订单数组

      // 处理不同的数据结构 情况1：分页数据结构
      if (response.data.data && response.data.data.rows) {
        orders = response.data.data.rows
        // 情况2：直接返回数组
      } else if (Array.isArray(response.data.data)) {
        orders = response.data.data
        // 情况3：返回对象结构
      } else if (typeof response.data.data === 'object') {
        // 将对象值转为数组，并过滤有效订单对象
        orders = Object.values(response.data.data).filter(item => item && typeof item === 'object')/ 过滤无效项
      }

      console.log(`获取到${orders.length}条订单，开始统计最近7天数据...`)

      // 统计每天的订单数量
      orders.forEach(order => {
        // 处理字段名差异
        const createTime = order.create_time || order.createTime
        if (createTime) {
          // 将时间字符串转为Date对象
          const orderDate = new Date(createTime)
          // 计算时间差（毫秒）
          const timeDiff = today.getTime() - orderDate.getTime()
          // 转换为天数差（取整）
          const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

          // 只统计最近7天的订单 , dayDiff=0 → 今天 , dayDiff=6 → 6天前（7天内）
          if (dayDiff >= 0 && dayDiff < 7) {
            const index = 6 - dayDiff // 转换为数组索引
            dailyOrders[index]++// 累加对应日期的订单数
          }
        }
      })

      console.log('最近7天订单统计:', dateLabels, dailyOrders)

      // 更新图表
      if (orderChart) {
        orderChart.setOption({// 更新图表配置（增量更新）
          xAxis: {// 配置X轴
            data: dateLabels// 设置日期标签
          },
          series: [{// 配置数据系列
            name: '订单数',// 数据系列名称
            data: dailyOrders// 订单数量数组
          }]
        })
      }
    } else {// 图表实例未初始化时的错误处理
      console.error('获取订单数据失败:', response.data?.msg)
    }
  } catch (error) {// 异常捕获
    console.error('获取最近7天订单统计失败:', error)
  }
}

onMounted(() => {
  // 获取当前用户信息
  getCurrentUser()

  // 获取各项统计数据
  fetchUserCount()
  fetchGameCount()
  fetchOrderStats()

  // 修改订单统计图表为折线图
  orderChart = echarts.init(orderChartRef.value)
  orderChart.setOption({
    title: {
      text: '最近7天订单趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 单',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['加载中...', '加载中...', '加载中...', '加载中...', '加载中...', '加载中...', '加载中...'],
      axisLabel: {
        rotate: 45
      },
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitNumber: 4
    },
    series: [
      {
        name: '订单数',
        type: 'line', // 修改为折线图类型
        data: [0, 0, 0, 0, 0, 0, 0],
        smooth: true, // 启用平滑曲线
        symbol: 'circle', // 数据点形状
        symbolSize: 8, // 数据点大小
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          width: 3,
          type: 'solid'
        },
        areaStyle: { // 添加区域填充
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(64, 158, 255, 0.6)'
            }, {
              offset: 1, color: 'rgba(64, 158, 255, 0.01)'
            }]
          }
        },
        emphasis: {
          itemStyle: {
            color: '#fff',
            borderColor: '#409EFF',
            borderWidth: 2
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}'
        }
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%', // 增加底部间距
      top: '15%',
      containLabel: true
    }
  })

  // 获取订单趋势数据
  fetchOrderTrend()

  // 初始化游戏分类统计图表
  // const categoryChart = echarts.init(categoryChartRef.value)
  // categoryChart.setOption({
  //   title: {
  //     text: '游戏分类统计',
  //     left: 'center'
  //   },
  //   tooltip: {
  //     trigger: 'item',
  //     formatter: '{a} <br/>{b}: {c} ({d}%)'
  //   },
  //   legend: {
  //     orient: 'vertical',
  //     left: 10,
  //     top: 'middle',
  //     itemGap: 10,
  //     data: ['角色扮演', '动作冒险', '射击游戏', '策略游戏', '赛车游戏']
  //   },
  //   series: [
  //     {
  //       name: '游戏数量',
  //       type: 'pie',
  //       radius: ['40%', '60%'],
  //       center: ['60%', '50%'],
  //       avoidLabelOverlap: true,
  //       label: {
  //         show: false
  //       },
  //       emphasis: {
  //         label: {
  //           show: true,
  //           fontSize: '16',
  //           fontWeight: 'bold'
  //         }
  //       },
  //       labelLine: {
  //         show: false
  //       },
  //       data: [
  //         { value: 35, name: '角色扮演' },
  //         { value: 25, name: '动作冒险' },
  //         { value: 20, name: '射击游戏' },
  //         { value: 15, name: '策略游戏' },
  //         { value: 10, name: '赛车游戏' }
  //       ]
  //     }
  //   ]
  // })

  // 监听窗口大小变化，重新调整图表大小
  window.addEventListener('resize', () => {
    orderChart.resize()
    categoryChart.resize()
  })
})
</script>

<style scoped>
.home-container {
  padding: 0;
}

.welcome-section {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.welcome-section h2 {
  margin-top: 0;
  color: #303133;
}

.welcome-section p {
  color: #606266;
  margin: 8px 0;
}

.mt-20 {
  margin-top: 20px;
}

.data-card {
  height: 100px;
  border-radius: 4px;
}

.data-card-inner {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 15px;
}

.data-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #ecf5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.data-icon .el-icon {
  font-size: 30px;
  color: #409EFF;
}

.data-info {
  flex: 1;
}

.data-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.data-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.chart-card {
  height: 350px;
}

.chart-container {
  height: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
