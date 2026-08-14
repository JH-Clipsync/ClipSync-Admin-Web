import axios, { type AxiosInstance } from 'axios'
import { ElMessage } from 'element-plus'
import { useAdminStore } from '@/stores/admin'
import router from '@/router'
import { calcSign, genNonce, buildSortedQuery, STATIC_SIGN_SECRET } from '@/utils/sign'

const http: AxiosInstance = axios.create({
  // 生产环境部署在 https://www.95qw.com/clipsync/admin/ 下
  // 浏览器请求 /clipsync/admin/api/xxx，由外层反向代理 strip /clipsync/admin 后转到后端 /api/admin/xxx
  // dev 环境走 vite proxy（见 vite.config.ts）
  baseURL: import.meta.env.VITE_API_BASE || '/clipsync/admin/api',
  timeout: 10000,
})

// 认证相关业务码：未登录/Token 过期/Token 无效
const AUTH_CODES = new Set([1410, 1411, 1412, 1413, 1414])

// 防止并发请求同时触发多次跳转/多个 Toast
let redirecting = false
function handleAuthExpired(message?: string) {
  if (redirecting) return
  redirecting = true
  try {
    useAdminStore().logoutLocal()
  } catch {}
  ElMessage.closeAll()
  ElMessage.warning(message || '登录已过期，请重新登录')
  const current = router.currentRoute.value
  const redirect = current.fullPath && current.name !== 'login' ? current.fullPath : undefined
  router.replace({ name: 'login', query: redirect ? { redirect } : {} }).finally(() => {
    // 跳转完成后释放锁，避免下一次登录后又被误拦
    setTimeout(() => {
      redirecting = false
    }, 300)
  })
}

http.interceptors.request.use((config) => {
  const store = useAdminStore()
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`
  }

  // 所有接口（含登录）必须签名
  const method = (config.method || 'GET').toUpperCase()
  const path = config.url || ''
  const timestamp = Date.now().toString()
  const nonce = genNonce()

  // body 序列化：必须先序列化再签名，确保发送内容与签名一致
  let bodyStr = ''
  if (config.data && typeof config.data === 'object') {
    bodyStr = JSON.stringify(config.data)
    config.data = bodyStr
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
  } else if (typeof config.data === 'string') {
    bodyStr = config.data
  }

  // 清理 params 空值，确保签名与 axios 实际发送的 URL 一致
  if (config.params && typeof config.params === 'object') {
    const cleaned: Record<string, any> = {}
    for (const [k, v] of Object.entries(config.params)) {
      if (v !== undefined && v !== null && v !== '') cleaned[k] = v
    }
    config.params = cleaned
  }

  // query 参与签名：按 key 字典序拼接
  const query = buildSortedQuery(config.params)

  // 密钥选择：已登录用动态密钥，未登录（登录接口）用静态密钥
  const secret = store.signSecret || STATIC_SIGN_SECRET
  const signature = calcSign({ method, path, query, timestamp, nonce, bodyStr, secret })
  config.headers['X-Timestamp'] = timestamp
  config.headers['X-Nonce'] = nonce
  config.headers['X-Signature'] = signature

  return config
})

// 后端在剩余寿命 < TTL/2 时会通过该响应头下发一个"新 token"，前端立刻替换本地存储
const REFRESH_HEADER = 'x-refresh-token'
function tryPickupRefreshedToken(res: {
  headers?: Record<string, unknown> & { get?: (k: string) => string | null }
}) {
  const h = res?.headers as any
  if (!h) return
  const v =
    typeof h.get === 'function' ? h.get(REFRESH_HEADER) : h[REFRESH_HEADER]
  if (v && typeof v === 'string' && v.length > 20) {
    try {
      useAdminStore().setToken(v)
    } catch {
      /* store 未就绪时忽略 */
    }
  }
}

http.interceptors.response.use(
  (res) => {
    tryPickupRefreshedToken(res as any)
    const body = res.data
    if (body && typeof body.code === 'number') {
      if (body.code === 1200) return body
      if (AUTH_CODES.has(body.code)) {
        handleAuthExpired(body.message)
        return Promise.reject(body)
      }
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(body)
    }
    return body
  },
  (err) => {
    if (err?.response) tryPickupRefreshedToken(err.response)
    const status = err?.response?.status
    if (status === 401) {
      handleAuthExpired()
      return Promise.reject(err)
    }
    ElMessage.error(err?.message || '网络异常')
    return Promise.reject(err)
  },
)

export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T = unknown> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export default http
