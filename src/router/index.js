import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as jwtDecode from 'jwt-decode'

// 导入布局组件
import PlayerLayout from '../layouts/PlayerLayout.vue'

// 导入视图组件
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Home from '../views/Home.vue'
import PlayerHome from '../views/player/PlayerHome.vue'

// 管理员页面
import UserManagement from '../views/user/UserManagement.vue'
import PersonalInfo from '../views/user/PersonalInfo.vue'
import ChangePassword from '../views/user/ChangePassword.vue'
import Category from '../views/game/Category.vue'
import GameManage from '../views/game/GameManage.vue'
import Order from '../views/game/Order.vue'
import Comment from '../views/game/Comment.vue'
import Refund from '../views/game/Refund.vue'
import Announcement from '../views/system/Announcement.vue'
import Carousel from '../views/system/Carousel.vue'

// 用户页面
import Categories from '../views/player/Categories.vue'
import Library from '../views/player/Library.vue'
import Favorites from '../views/player/Favorites.vue'
import Comments from '../views/player/Comments.vue'
import Cart from '../views/player/Cart.vue'
import Refunds from '../views/player/Refunds.vue'
import GameDetail from '../views/player/GameDetail.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: '注册' }
  },

  // 管理员路由
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { title: '首页', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/user/UserManagement',
    name: 'UserManagement',
    component: UserManagement,
    meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/game/category',
    name: 'Category',
    component: Category,
    meta: { title: '分类管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/game/GameManage',
    name: 'GameManage',
    component: GameManage,
    meta: { title: '游戏管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/game/order',
    name: 'Order',
    component: Order,
    meta: { title: '订单管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/game/comment',
    name: 'Comment',
    component: Comment,
    meta: { title: '评论管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/game/refund',
    name: 'Refund',
    component: Refund,
    meta: { title: '退款管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/system/announcement',
    name: 'Announcement',
    component: Announcement,
    meta: { title: '公告管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/system/carousel',
    name: 'Carousel',
    component: Carousel,
    meta: { title: '轮播图管理', requiresAuth: true, requiresAdmin: true }
  },

  // 添加管理员的个人信息和修改密码路由
  {
    path: '/personal-info',
    name: 'PersonalInfo',
    component: PersonalInfo,
    meta: { title: '个人信息', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: ChangePassword,
    meta: { title: '修改密码', requiresAuth: true, requiresAdmin: true }
  },

  // 用户路由 - 使用PlayerLayout布局
  {
    path: '/PlayerHome',
    component: PlayerLayout,
    children: [
      {
        path: '',
        name: 'PlayerHome',
        component: PlayerHome,
        meta: { title: '首页', requiresAuth: true, role: 'user' }
      },
      {
        path: '/player/categories',
        name: 'Categories',
        component: Categories,
        meta: { title: '游戏分类', requiresAuth: true, role: 'user' }
      },
      {
        path: '/player/library',
        name: 'Library',
        component: Library,
        meta: { title: '个人仓库', requiresAuth: true, role: 'user' }
      },
      {
        path: '/player/favorites',
        name: 'Favorites',
        component: Favorites,
        meta: { title: '我的收藏', requiresAuth: true, role: 'user' }
      },
      {
        path: '/player/comments',
        name: 'PlayerComments',
        component: Comments,
        meta: { title: '我的评论', requiresAuth: true, role: 'user' }
      },
      {
        path: '/player/cart',
        name: 'Cart',
        component: Cart,
        meta: { title: '购物车', requiresAuth: true, role: 'user' }
      },
      {
        path: '/player/refunds',
        name: 'PlayerRefunds',
        component: Refunds,
        meta: { title: '退款详情', requiresAuth: true, role: 'user' }
      },
      {
        path: 'personal-info',
        name: 'PlayerPersonalInfo',
        component: () => import('../views/player/PlayerPersonalInfo.vue'),
        meta: { title: '个人信息', requiresAuth: true, role: ['user', 'admin'] }
      },
      {
        path: 'change-password',
        name: 'PlayerChangePassword',
        component: () => import('../views/player/PlayerChangePassword.vue'),
        meta: { title: '修改密码', requiresAuth: true, role: ['user', 'admin'] }
      },
      {
        path: '/player/game/:id',
        name: 'GameDetail',
        component: GameDetail,
        meta: { title: '游戏详情', requiresAuth: true, role: 'user' }
      },
    ]
  },
  {
    path: '/player/categories',
    name: 'PlayerCategories',
    component: () => import('../views/player/Categories.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/player/games',
    name: 'PlayerGames',
    component: () => import('../views/player/Games.vue'),
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// 简化路由守卫
router.beforeEach((to, from, next) => {
  console.log(`路由导航: ${from.path} -> ${to.path}`)
  next()
})

export default router
