import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
    // baseURL: process.env.VUE_APP_BASE_API, // 删除硬编码的baseURL
    baseURL: '', // 使用空字符串，让请求使用相对路径
    timeout: 30000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
    config => {
        // 在请求被发送之前做些什么
        // 添加token到header
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        console.log('发送请求:', config.url);

        return config
    },
    error => {
        // 对请求错误做些什么
        console.error('请求错误:', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    response => {
        // 对响应数据做点什么
        const res = response.data

        // 如果响应不成功，显示错误消息
        if (res.code !== 1 && res.code !== 200) {
            ElMessage({
                message: res.msg || '服务器响应异常',
                type: 'error',
                duration: 5 * 1000
            })

            // 处理token过期等特殊错误码
            if (res.code === 401) {
                // Token过期处理
                ElMessage({
                    message: '登录已过期，请重新登录',
                    type: 'error',
                    duration: 5 * 1000
                })
                localStorage.removeItem('token')
                localStorage.removeItem('userInfo')
                setTimeout(() => {
                    window.location.href = '/login'
                }, 1500)
            }

            return Promise.reject(new Error(res.msg || '服务器响应异常'))
        } else {
            return res
        }
    },
    error => {
        // 对响应错误做点什么
        console.error('响应错误:', error)
        ElMessage({
            message: error.message || '网络异常，请稍后重试',
            type: 'error',
            duration: 5 * 1000
        })
        return Promise.reject(error)
    }
)

export default service
