import './assets/main.css'
import './assets/css/compatibility.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import axios from 'axios'
import { setupAxiosInterceptors } from './utils/testConnection'

// 设置全局axios拦截器
setupAxiosInterceptors()

console.log('应用初始化开始...')

// 设置全局axios默认配置
axios.defaults.timeout = 15000

// 添加请求拦截器
axios.interceptors.request.use(
    config => {
        console.log(`发送请求: ${config.url}`, config)

        // 为所有请求添加token
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => {
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

// 添加响应拦截器
axios.interceptors.response.use(
    response => {
        console.log(`响应成功: ${response.config.url}`, response.data)
        return response
    },
    error => {
        console.error('响应错误:', error)
        return Promise.reject(error)
    }
)

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(router)
app.use(ElementPlus)

// 全局挂载axios
app.config.globalProperties.$axios = axios

// 测试后端连接
import { testBackendConnection } from './utils/testConnection'
testBackendConnection()
    .then(result => {
        if (result.success) {
            console.log('后端连接测试成功:', result.data)
        } else {
            console.error('后端连接测试失败:', result.error)
        }
    })
    .catch(err => {
        console.error('测试过程发生异常:', err)
    })

console.log('挂载应用...')
app.mount('#app')
console.log('应用挂载完成')
