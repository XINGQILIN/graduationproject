import axios from 'axios'

/**
 * 测试与后端的连接
 * @returns {Promise<Object>} 连接测试结果
 */
export const testBackendConnection = async () => {
    console.log('测试连接到后端...')

    try {
        // 添加随机参数避免缓存
        const timestamp = new Date().getTime();

        // 使用健康检查或简单的API路径测试连接
        const response = await axios.get('/api/game-categories', {
            params: { _t: timestamp }, // 添加时间戳避免缓存
            timeout: 5000  // 5秒超时
        })

        console.log('后端连接成功:', response.data)
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('连接主API失败:', error.message)

        // 尝试更简单的健康检查接口
        try {
            const healthResponse = await axios.get('/api/health', {
                timeout: 3000,
                params: { _t: new Date().getTime() }
            });

            console.log('健康检查连接成功:', healthResponse.data);
            return {
                success: true,
                data: healthResponse.data
            };
        } catch (healthError) {
            console.error('健康检查连接失败:', healthError.message);

            // 最后尝试一个完全不需要认证的基本路径
            try {
                const basicResponse = await axios.get('/api', { timeout: 3000 });
                console.log('基本路径连接成功:', basicResponse.data);
                return {
                    success: true,
                    data: basicResponse.data
                };
            } catch (basicError) {
                console.error('所有连接尝试均失败');
                console.error('请检查: 1. 后端是否启动; 2. 端口是否正确; 3. CORS配置是否正确');

                return {
                    success: false,
                    error: error.message,
                    details: '尝试了多个路径但均失败，请检查后端服务是否正常运行'
                };
            }
        }
    }
}

/**
 * 创建全局axios拦截器
 */
export const setupAxiosInterceptors = () => {
    // 请求拦截器
    axios.interceptors.request.use(
        config => {
            // 记录所有请求，帮助调试
            console.log(`请求: ${config.method?.toUpperCase() || 'GET'} ${config.url}`, config.params || {});

            // 添加token
            const token = localStorage.getItem('token')
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`
            }

            // 确保超时设置
            if (!config.timeout) {
                config.timeout = 15000; // 默认15秒超时
            }

            return config
        },
        error => {
            console.error('请求配置错误:', error)
            return Promise.reject(error)
        }
    )

    // 响应拦截器
    axios.interceptors.response.use(
        response => {
            // 记录所有响应，帮助调试
            console.log(`响应: ${response.config.url}`, {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });

            return response;
        },
        error => {
            if (error.response) {
                console.error(`请求失败: ${error.response.status}`, error.response.data)

                // 处理不同的错误码
                switch (error.response.status) {
                    case 500:
                        console.error('服务器内部错误，请联系后端开发人员')
                        break
                    case 401:
                        console.error('未授权，请重新登录')
                        // 可以在这里添加重定向到登录页的逻辑
                        break
                    case 404:
                        console.error('请求的资源不存在:', error.config.url)
                        break
                    default:
                        console.error('请求失败')
                }
            } else if (error.request) {
                console.error('未收到响应，服务器可能未启动', {
                    url: error.config?.url,
                    method: error.config?.method,
                    timeout: error.config?.timeout
                })
            } else {
                console.error('请求配置有误', error.message)
            }

            return Promise.reject(error)
        }
    )
}
