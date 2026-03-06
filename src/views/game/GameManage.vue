<template>
  <div class="game-container">
    <!-- 搜索区域 -->
    <div class="search-container">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="游戏标题">
          <el-input v-model="searchForm.title" placeholder="请输入游戏标题" clearable></el-input>
        </el-form-item>
        <el-form-item label="游戏分类">
          <el-select
              v-model="searchForm.category_id"
              placeholder="请选择游戏分类"
              style="width: 100%"
              filterable
              :popper-options="{ boundariesPadding: 0, gpuAcceleration: false }"
          >
            <el-option
                v-for="item in categoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" aria-label="搜索游戏">搜索</el-button>
          <el-button @click="resetSearch" aria-label="重置搜索条件">重置</el-button>
          <el-button type="success" @click="handleAdd" aria-label="新增游戏">新增游戏</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table
        v-loading="loading"
        :data="gameList"
        border
        style="width: 100%"
        aria-label="游戏列表"
    >
      <el-table-column prop="game_id" label="游戏ID" width="80" />
      <el-table-column label="封面图" width="100">
        <template #default="scope">
          <el-image
              :src="formatImageUrl(scope.row.cover_image)"
              :preview-src-list="[formatImageUrl(scope.row.cover_image)]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px;"
              :alt="`${scope.row.title || '未命名游戏'}的封面图`"
          >
            <template #error>
              <div class="image-error" role="img" aria-label="图片加载失败">
                <el-icon><picture-filled /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="游戏标题" width="120" show-overflow-tooltip />
      <el-table-column label="游戏描述" min-width="180" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.description || '暂无描述' }}
        </template>
      </el-table-column>
      <el-table-column label="分类" width="100">
        <template #default="scope">
          {{ getCategoryName(scope.row.category_id) }}
        </template>
      </el-table-column>
      <el-table-column label="管理员" width="80">
        <template #default="scope">
          {{ scope.row.admin_id }}
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="80">
        <template #default="scope">
          ¥{{ scope.row.price }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="normalizeStatus(scope.row.status) === 'online' ? 'success' : 'info'">
            {{ normalizeStatus(scope.row.status) === 'online' ? '上架' : '下架' }}
          </el-tag>
          <span class="status-debug" style="display: none; font-size: 10px; color: #999;">
            ({{ typeof scope.row.status === 'string' ? scope.row.status : JSON.stringify(scope.row.status) }})
          </span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="scope">
          {{ formatDateTime(scope.row.create_time) }}
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="160">
        <template #default="scope">
          {{ formatDateTime(scope.row.update_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" plain @click="handleEdit(scope.row)" aria-label="编辑游戏">编辑</el-button>
          <el-button type="success" size="small" plain @click="handleDetail(scope.row)" aria-label="查看游戏详情">详情</el-button>
          <el-button
              type="warning"
              size="small"
              plain
              @click="handleToggleStatus(scope.row)"
              :aria-label="normalizeStatus(scope.row.status) === 'online' ? '下架游戏' : '上架游戏'"
          >
            {{ normalizeStatus(scope.row.status) === 'online' ? '下架' : '上架' }}
          </el-button>
          <el-button type="danger" size="small" plain @click="handleDelete(scope.row)" aria-label="删除游戏">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页区域 -->
    <div class="pagination-container">
      <div class="pagination-info">共 {{ total }} 条</div>
      <el-pagination
          v-model:current-page="currentPage"
          :page-size="10"
          layout="prev, pager, next"
          :total="total"
          @current-change="handleCurrentChange"
          :pager-count="5"
          prev-text="上一页"
          next-text="下一页"
          background
          aria-label="分页导航"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '添加游戏' : '编辑游戏'"
        width="700px"
        destroy-on-close
    >
      <el-form
          ref="gameFormRef"
          :model="gameForm"
          :rules="gameRules"
          label-width="100px"
      >
        <el-form-item label="游戏标题" prop="title">
          <el-input v-model="gameForm.title" placeholder="请输入游戏标题" />
        </el-form-item>
        <el-form-item label="游戏分类" prop="category_id">
          <el-select
              v-model="gameForm.category_id"
              placeholder="请选择分类"
              style="width: 100%"
              filterable
              :popper-options="{ boundariesPadding: 0, gpuAcceleration: false }"
          >
            <el-option
                v-for="item in categoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="游戏价格" prop="price">
          <el-input-number
              v-model="gameForm.price"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="游戏状态" prop="status">
          <el-radio-group v-model="gameForm.status">
            <el-radio label="online">上架</el-radio>
            <el-radio label="offline">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="游戏描述" prop="description">
          <el-input
              v-model="gameForm.description"
              type="textarea"
              :rows="4"
              placeholder="请输入游戏描述"
          />
        </el-form-item>
        <el-form-item label="封面图" prop="cover_image">
          <el-upload
              action="/api/games/upload"
              :headers="uploadHeaders"
              :data="{fileType: 'cover'}"
              :show-file-list="true"
              :limit="1"
              :on-success="handleCoverSuccess"
              :on-error="handleUploadError"
              :before-upload="beforeCoverUpload"
              :file-list="coverFileList"
              :on-remove="() => { gameForm.cover_image = ''; coverFileList.value = []; }"
              accept="image/*"
              class="cover-upload"
          >
            <el-button type="primary">上传封面图</el-button>
            <template #tip>
              <div class="upload-tip">建议尺寸：800x600像素，JPG/PNG格式</div>
            </template>
          </el-upload>

          <div v-if="gameForm.cover_image" class="cover-preview">
            <el-image
                :src="formatImageUrl(gameForm.cover_image)"
                fit="cover"
                :preview-src-list="[formatImageUrl(gameForm.cover_image)]"
                class="preview-image"
            />
          </div>
        </el-form-item>
        <el-form-item label="游戏包" prop="game_package">
          <el-upload
              action="/api/games/upload"
              :headers="uploadHeaders"
              :data="{fileType: 'package'}"
              :show-file-list="true"
              :limit="1"
              :on-success="handlePackageSuccess"
              :on-error="handleUploadError"
              :before-upload="beforePackageUpload"
              :file-list="packageFileList"
              :on-remove="() => { gameForm.game_package = ''; packageFileList.value = []; }"
          >
            <el-button type="primary">上传游戏包</el-button>
            <template #tip>
              <div class="upload-tip">只能上传zip/rar文件，且不超过500MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" aria-label="取消">取消</el-button>
          <el-button type="primary" @click="submitForm" aria-label="确定">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 游戏详情对话框 -->
    <el-dialog
        v-model="detailDialogVisible"
        title="游戏详情"
        width="700px"
    >
      <div v-if="gameDetail" class="game-detail">
        <div class="detail-header">
          <div class="detail-cover">
            <el-image
                :src="formatImageUrl(gameDetail.cover_image)"
                :preview-src-list="[formatImageUrl(gameDetail.cover_image)]"
                fit="cover"
                class="detail-image"
                :alt="`${gameDetail.title || '未命名游戏'}的封面图`"
            >
              <template #error>
                <div class="image-error" role="img" aria-label="图片加载失败">
                  <el-icon><picture-filled /></el-icon>
                </div>
              </template>
            </el-image>
          </div>
          <div class="detail-info">
            <div class="detail-item">
              <div class="detail-label">游戏ID</div>
              <div class="detail-value">{{ gameDetail.game_id }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">游戏标题</div>
              <div class="detail-value">{{ gameDetail.title }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">游戏分类</div>
              <div class="detail-value">{{ getCategoryName(gameDetail.category_id) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">上传管理员ID</div>
              <div class="detail-value">{{ gameDetail.admin_id }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">价格</div>
              <div class="detail-value">¥{{ gameDetail.price }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">状态</div>
              <div class="detail-value">
                <el-tag :type="normalizeStatus(gameDetail.status) === 'online' ? 'success' : 'info'">
                  {{ normalizeStatus(gameDetail.status) === 'online' ? '上架' : '下架' }}
                </el-tag>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">创建时间</div>
              <div class="detail-value">{{ formatDateTime(gameDetail.create_time) }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">更新时间</div>
              <div class="detail-value">{{ formatDateTime(gameDetail.update_time) }}</div>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="detail-item">
          <div class="detail-label">游戏描述</div>
          <div class="detail-description">{{ gameDetail.description || '暂无描述' }}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">封面图路径</div>
          <div class="detail-value">{{ gameDetail.cover_image || '暂无' }}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">游戏包</div>
          <div class="detail-value" v-if="gameDetail.game_package">
            <el-icon><document /></el-icon>
            {{ getPackageName(gameDetail.game_package) }}
          </div>
          <div class="detail-value" v-else>暂无游戏包</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">游戏包路径</div>
          <div class="detail-value">{{ gameDetail.game_package || '暂无' }}</div>
        </div>
      </div>
      <div v-else class="detail-loading">
        <el-skeleton :rows="6" animated />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, PictureFilled } from '@element-plus/icons-vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { getGameList, getCategoryList } from '@/api/services/gameService'

// 基础URL
const baseURL = '/api'

// 上传相关配置
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`
  }
})

// 添加文件列表变量
const coverFileList = ref([])
const packageFileList = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表格数据
const gameList = ref([])
const loading = ref(false)

// 分类选项
const categoryOptions = ref([])

// 搜索表单
const searchForm = reactive({
  title: '',
  category_id: ''
})

// 新增/编辑表单
const gameFormRef = ref(null)
const gameForm = reactive({
  game_id: '',
  title: '',
  category_id: '',
  price: 0,
  description: '',
  cover_image: '',
  game_package: '',
  status: 'offline'
})

// 表单验证规则
const gameRules = {
  title: [
    { required: true, message: '请输入游戏标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择游戏分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入游戏价格', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入游戏描述', trigger: 'blur' }
  ]
}

// 对话框显示控制
const dialogVisible = ref(false)  // 添加/编辑对话框
const detailDialogVisible = ref(false)  // 详情对话框
const dialogType = ref('add')  // 对话框类型：add或edit

// 在其他 ref 变量定义的地方添加
const gameDetail = ref(null)  // 用于存储游戏详情数据

// 处理查看详情
const handleDetail = async (row) => {
  try {
    detailDialogVisible.value = true
    const response = await axios.get(`/api/games/${row.game_id}`)

    if (response.data && response.data.code === 1) {
      gameDetail.value = response.data.data
    } else {
      throw new Error(response.data?.msg || '获取游戏详情失败')
    }
  } catch (error) {
    console.error('获取游戏详情出错:', error)
    ElMessage.error('获取游戏详情失败')
    detailDialogVisible.value = false
  }
}

// 处理编辑
const handleEdit = async (row) => {
  try {
    dialogType.value = 'edit'
    const response = await axios.get(`/api/games/${row.game_id}`)

    if (response.data && response.data.code === 1) {
      // 直接使用后端返回的数据填充表单
      const gameData = response.data.data

      // 规范化状态值
      gameData.status = normalizeStatus(gameData.status)

      Object.keys(gameForm).forEach(key => {
        if (key in gameData) {
          gameForm[key] = gameData[key]
        }
      })

      // 初始化文件列表
      if (gameForm.cover_image) {
        coverFileList.value = [{
          name: '已上传的封面图',
          url: formatImageUrl(gameForm.cover_image)
        }]
      } else {
        coverFileList.value = []
      }

      if (gameForm.game_package) {
        packageFileList.value = [{
          name: getPackageName(gameForm.game_package),
          url: gameForm.game_package
        }]
      } else {
        packageFileList.value = []
      }

      dialogVisible.value = true

      // 重置表单验证
      if (gameFormRef.value) {
        nextTick(() => {
          gameFormRef.value.clearValidate()
        })
      }
    } else {
      throw new Error(response.data?.msg || '获取游戏数据失败')
    }
  } catch (error) {
    console.error('获取待编辑游戏数据出错:', error)
    ElMessage.error('获取游戏数据失败')
  }
}

// 获取游戏列表
const fetchGameList = async () => {
  loading.value = true
  try {
    console.log('开始获取游戏列表，当前页码:', currentPage.value)

    const params = {
      page: currentPage.value,
      pageSize: 10
    }

    // 添加搜索条件
    if (searchForm.title) params.title = searchForm.title
    if (searchForm.category_id) params.category_id = searchForm.category_id

    console.log('请求参数:', params)

    const response = await axios.get('/api/games', { params })

    if (response.data && response.data.code === 1) {  // 使用状态码 1
      // 直接使用后端返回的数据，不需要转换字段名
      gameList.value = response.data.data.rows
      total.value = response.data.data.total
      console.log('游戏列表获取成功:', gameList.value)
    } else {
      throw new Error(response.data?.msg || '获取游戏列表失败')
    }
  } catch (error) {
    console.error('获取游戏列表出错:', error)
    ElMessage.error('获取游戏列表失败，请稍后重试')
    gameList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 获取分类选项
const getCategoryOptions = async () => {
  try {
    const result = await getCategoryList()

    if (result && result.code === 1) {
      // 处理分类数据
      const categoryData = result.data

      if (categoryData.rows) {
        categoryOptions.value = categoryData.rows.map(item => ({
          value: item.category_id,
          label: item.name
        }))
      } else if (Array.isArray(categoryData)) {
        categoryOptions.value = categoryData.map(item => ({
          value: item.category_id,
          label: item.name
        }))
      } else {
        console.warn('意外的分类数据结构:', categoryData)
        categoryOptions.value = []
      }

      console.log('分类选项加载成功:', categoryOptions.value)
    } else {
      throw new Error(result?.msg || '获取分类列表失败')
    }
  } catch (error) {
    console.error('获取分类列表出错:', error)
    ElMessage.error('获取分类列表失败，请稍后重试')
    categoryOptions.value = []
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchGameList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.title = ''
  searchForm.category_id = ''
  currentPage.value = 1
  fetchGameList()
}

// 页码变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchGameList()
}

// 新增游戏
const handleAdd = () => {
  dialogType.value = 'add'

  // 重置表单
  gameForm.game_id = ''
  gameForm.title = ''
  gameForm.category_id = ''
  gameForm.price = 0
  gameForm.description = ''
  gameForm.cover_image = ''
  gameForm.game_package = ''
  gameForm.status = 'offline' // 确保默认值是字符串

  // 清空文件列表
  coverFileList.value = []
  packageFileList.value = []

  dialogVisible.value = true

  // 重置表单验证
  if (gameFormRef.value) {
    setTimeout(() => {
      gameFormRef.value.clearValidate()
    }, 0)
  }
}

// 切换游戏状态
const handleToggleStatus = (row) => {
  // 确保game_id存在
  if (!row.game_id) {
    ElMessage.error('游戏ID不存在，无法切换状态')
    return
  }

  // 获取当前状态并规范化
  const currentStatus = normalizeStatus(row.status)

  // 确保状态值是字符串
  const newStatus = currentStatus === 'online' ? 'offline' : 'online'
  const statusText = newStatus === 'online' ? '上架' : '下架'

  console.log('当前状态:', currentStatus, '新状态:', newStatus)

  ElMessageBox.confirm(
      `确定要将游戏 "${row.title}" ${statusText}吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(async () => {
    try {
      console.log(`准备将游戏ID ${row.game_id} 的状态修改为: ${newStatus}`)

      // 构建请求数据，只包含status字段
      const requestData = {
        status: newStatus
      }

      console.log('发送数据:', requestData)

      const response = await axios.put(`/api/games/${row.game_id}`, requestData)

      if (response.data && response.data.code === 1) {
        ElMessage.success(response.data.msg || `游戏${statusText}成功`)
        // 更新本地状态
        row.status = newStatus
        // 刷新列表
        fetchGameList()
      } else {
        ElMessage.error(response.data?.msg || `游戏${statusText}失败`)
      }
    } catch (error) {
      console.error('切换游戏状态出错:', error)
      if (error.response) {
        console.error('错误状态码:', error.response.status)
        console.error('错误数据:', error.response.data)
      }
      ElMessage.error('网络错误，请稍后重试')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 删除游戏
const handleDelete = (row) => {
  // 确保game_id存在
  if (!row.game_id) {
    ElMessage.error('游戏ID不存在，无法删除')
    return
  }

  ElMessageBox.confirm(
      `确定要删除游戏 "${row.title}" 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
  ).then(async () => {
    try {
      const response = await axios.delete(`${baseURL}/games/${row.game_id}`)

      if (response.data && response.data.code === 1) {
        ElMessage.success(response.data.msg || '删除成功')
        fetchGameList()
      } else {
        ElMessage.error(response.data?.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除游戏出错:', error)
      ElMessage.error('网络错误，请稍后重试')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 格式化图片URL
const formatImageUrl = (url) => {
  if (!url) return ''
  // 如果是OSS协议的URL，转换为HTTPS访问地址
  if (url.startsWith('oss://')) {
    return url.replace('oss://your-bucket', 'https://wqx-yx-bysj.oss-cn-beijing.aliyuncs.com')
  }
  return url
}

// 封面图上传前验证
const beforeCoverUpload = (file) => {
  // 验证文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  // 验证文件大小（小于2MB）
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB！')
    return false
  }
  return true
}

// 封面图上传成功的回调
const handleCoverSuccess = (response, file) => {
  console.log('封面图上传响应:', response)
  if (response.code === 1) {
    const url = response.data.url
    gameForm.cover_image = url
    ElMessage.success(response.msg || '封面图上传成功')
  } else {
    ElMessage.error(response.msg || '封面图上传失败')
  }
}

// 游戏包上传前的验证
const beforePackageUpload = (file) => {
  // 验证文件类型
  const extension = file.name.split('.').pop().toLowerCase()
  const isZipOrRar = extension === 'zip' || extension === 'rar'
  if (!isZipOrRar) {
    ElMessage.error('游戏包只能是zip或rar格式!')
    return false
  }

  // 验证文件大小（小于500MB）
  const isLt500M = file.size / 1024 / 1024 < 500
  if (!isLt500M) {
    ElMessage.error('游戏包大小不能超过500MB!')
    return false
  }

  return true
}

// 游戏包上传成功的回调
const handlePackageSuccess = (response, file) => {
  console.log('游戏包上传响应:', response)
  if (response.code === 1) {
    const url = response.data.url
    gameForm.game_package = url
    ElMessage.success(response.msg || '游戏包上传成功')
  } else {
    ElMessage.error(response.msg || '游戏包上传失败')
  }
}

// 上传失败的回调
const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败，请重试')
}

// 获取游戏包文件名
const getPackageName = (ossPath) => {
  if (!ossPath) return ''

  // 从OSS路径中提取文件名
  const parts = ossPath.split('/')
  return parts[parts.length - 1]
}

// 获取分类名称
const getCategoryName = (categoryId) => {
  if (!categoryId) {
    console.log('查找分类ID: undefined 可用选项:', categoryOptions.value);
    return '未知分类';
  }

  // 转换为字符串进行比较，避免类型不匹配问题
  const categoryIdStr = String(categoryId);
  const category = categoryOptions.value.find(option => String(option.value) === categoryIdStr);

  if (category) {
    return category.label;
  } else {
    console.log(`查找分类ID: ${categoryId} 可用选项:`, categoryOptions.value);
    return '未知分类';
  }
}

// 提交表单
const submitForm = async () => {
  if (!gameFormRef.value) return

  await gameFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 确保状态是正确的字符串值
        const status = normalizeStatus(gameForm.status)

        // 构建请求数据
        const formData = {
          title: gameForm.title,
          category_id: gameForm.category_id,
          price: gameForm.price,
          description: gameForm.description,
          status: status // 使用规范化的状态值
        }

        // 如果有封面图，添加到请求数据
        if (gameForm.cover_image) {
          formData.cover_image = gameForm.cover_image
        }

        // 如果有游戏包，添加到请求数据
        if (gameForm.game_package) {
          formData.game_package = gameForm.game_package
        }

        console.log('提交的表单数据:', formData)

        let response
        if (dialogType.value === 'add') {
          // 新增游戏
          response = await axios.post(`/api/games`, formData)
        } else {
          // 编辑游戏
          const gameId = gameForm.game_id
          response = await axios.put(`/api/games/${gameId}`, formData)
        }

        if (response.data && response.data.code === 1) {
          ElMessage.success(response.data.msg || (dialogType.value === 'add' ? '游戏添加成功' : '游戏更新成功'))
          dialogVisible.value = false
          fetchGameList()
        } else {
          ElMessage.error(response.data?.msg || '操作失败')
        }
      } catch (error) {
        console.error('提交表单出错:', error)
        if (error.response) {
          console.error('错误状态码:', error.response.status)
          console.error('错误数据:', error.response.data)
          ElMessage.error(`操作失败: ${error.response.data?.msg || '服务器内部错误'}`)
        } else {
          ElMessage.error('网络错误，请稍后重试')
        }
      }
    } else {
      return false
    }
  })
}

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''

  try {
    const date = new Date(dateTimeStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.error('日期格式化错误:', error)
    return dateTimeStr
  }
}

// 添加状态规范化函数
const normalizeStatus = (status) => {
  // 处理不同类型的状态值
  if (status === null || status === undefined) {
    return 'offline'; // 默认值
  }

  if (typeof status === 'string') {
    return status.toLowerCase(); // 转小写确保匹配
  }

  if (typeof status === 'boolean') {
    return status ? 'online' : 'offline'; // 布尔值转换
  }

  if (typeof status === 'number') {
    return status === 1 ? 'online' : 'offline'; // 数字转换
  }

  // 其他情况默认为下架
  return 'offline';
}

// 在组件内部检查用户权限
onMounted(() => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  console.log('当前用户信息:', userInfo) // 添加日志

  if (userInfo.role !== 'admin') {
    ElMessage.error('您没有权限执行此操作')
    // 可能还有禁用按钮或隐藏功能的代码
  } else {
    // 即使没有用户ID，也允许管理员操作
    if (!userInfo.userId) {
      console.warn('警告: 用户ID不存在，某些功能可能受限')
    }
  }

  // 添加调试函数到window对象
  window.debugGameStatus = () => {
    console.log('开始调试游戏状态...');
    if (gameList.value && gameList.value.length > 0) {
      gameList.value.forEach((game, index) => {
        console.log(`游戏 ${index+1} - ${game.title}:`);
        console.log(`  状态(原始): ${game.status} (类型: ${typeof game.status})`);
        console.log(`  状态(规范化): ${normalizeStatus(game.status)}`);
      });
    } else {
      console.log('游戏列表为空');
    }

    // 显示隐藏的调试信息
    const debugElements = document.querySelectorAll('.status-debug');
    debugElements.forEach(el => {
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
    });

    return '状态调试完成，可以在表格中查看原始状态值';
  };

  console.log('提示: 在控制台执行 window.debugGameStatus() 可以检查游戏状态值');

  getCategoryOptions()
  fetchGameList()
})
</script>

<style>
.game-container {
  padding: 20px;
}

.search-container {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-info {
  color: #606266;
  font-size: 14px;
}

.price-separator {
  margin: 0 5px;
  color: #606266;
}

/* 上传相关样式 */
.cover-uploader {
  width: 178px;
  height: 178px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.cover-uploader:hover {
  border-color: #409eff;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.cover-image {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #606266;
  margin-top: 5px;
}

.package-info .el-icon {
  margin-right: 5px;
  color: #409eff;
}

/* 详情对话框样式 */
.game-detail {
  padding: 10px;
}

.detail-header {
  display: flex;
  margin-bottom: 20px;
}

.detail-cover {
  margin-right: 30px;
}

.detail-info {
  flex: 1;
}

.detail-item {
  margin-bottom: 15px;
}

.detail-label {
  font-weight: bold;
  color: #606266;
  margin-bottom: 5px;
}

.detail-value {
  color: #333;
}

.detail-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.detail-description {
  white-space: pre-line;
  line-height: 1.6;
  color: #333;
  background-color: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.detail-loading {
  padding: 20px;
}

/* 自定义分页样式 */
:deep(.el-pagination) {
  --el-pagination-font-size: 14px;
  --el-pagination-button-color: #606266;
  --el-pagination-button-bg-color: #fff;
  --el-pagination-button-disabled-color: #c0c4cc;
  --el-pagination-button-disabled-bg-color: #fff;
  --el-pagination-hover-color: #409eff;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background-color: #18b566;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled):hover) {
  color: #18b566;
}

/* 图片错误占位符 */
.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

/* 修复兼容性问题 */
.el-select-dropdown__item {
  -webkit-user-select: none;
  user-select: none;
}

.el-input__wrapper {
  -webkit-appearance: none;
  appearance: none;
}

.el-select__wrapper {
  width: -webkit-fill-available;
  width: stretch;
}

/* 为Element Plus默认头像图片添加alt属性的全局样式 */
img[src^="https://cube.elemecdn.com"] {
  alt: "Element Plus默认头像";
}

/* 或者可以使用伪元素添加替代内容 */
img[src^="https://cube.elemecdn.com"]::before {
  content: "Element Plus默认头像";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

/* 优化分类选择器样式 */
:deep(.el-select-dropdown__wrap) {
  max-height: 300px; /* 增加下拉框高度，显示更多选项 */
}

:deep(.el-select-dropdown__item) {
  padding: 0 20px;
  height: 34px;
  line-height: 34px;
}

/* 封面预览样式 */
.cover-upload {
  margin-bottom: 10px;
}

.cover-preview {
  margin-top: 15px;
  border: 1px dashed #ccc;
  padding: 8px;
  border-radius: 4px;
  width: fit-content;
}

.preview-image {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 上传文件列表样式优化 */
:deep(.el-upload-list) {
  margin-top: 8px;
}

:deep(.el-upload-list__item) {
  transition: all 0.3s;
}

:deep(.el-upload-list__item:hover) {
  background-color: #f5f7fa;
}
</style>
