import CryptoJS from 'crypto-js'

/**
 * STATIC_SIGN_SECRET 登录前签名密钥。
 * 从 .env 的 VITE_SIGN_STATIC_SECRET 读取，与后端 config.yaml 的 security.sign_static_secret 必须完全一致。
 * 登录成功后前端切换为动态下发的 signSecret。
 */
export const STATIC_SIGN_SECRET = import.meta.env.VITE_SIGN_STATIC_SECRET || 'clipsync-admin-static-sign-secret-v1'

export interface SignParams {
  /** 大写 HTTP 方法，如 GET / POST / PUT / DELETE */
  method: string
  /** 去掉 baseURL 的相对路径，如 /auth/me（不含 query） */
  path: string
  /** 按 key 字典序排列的 k1=v1&k2=v2 串；无 query 传空串 */
  query: string
  /** 毫秒时间戳字符串 */
  timestamp: string
  /** 随机串 */
  nonce: string
  /** 请求体字符串（GET / 无 body 传空串） */
  bodyStr: string
  /** 签名密钥：登录前用 STATIC_SIGN_SECRET，登录后用动态 signSecret */
  secret: string
}

/**
 * calcSign 计算请求签名。
 *
 * 待签串格式（用 \n 分隔）：
 *   METHOD\nPATH\nQUERY\nTIMESTAMP\nNONCE\nBODY_MD5
 *
 * 签名 = HMAC-SHA256(secret, 待签串) 的 hex 小写。
 *
 * 必须与后端 auth.CalcSign 计算规则完全一致。
 */
export function calcSign({ method, path, query, timestamp, nonce, bodyStr, secret }: SignParams): string {
  const bodyMD5 = bodyStr ? CryptoJS.MD5(bodyStr).toString() : ''
  const payload = [method, path, query, timestamp, nonce, bodyMD5].join('\n')
  return CryptoJS.HmacSHA256(payload, secret).toString()
}

/**
 * buildSortedQuery 将 params 对象按 key 字典序拼成 k1=v1&k2=v2 串。
 * 与后端 auth.BuildSortedQuery 规则一致，确保签名匹配。
 * 空对象返回空串。
 */
export function buildSortedQuery(params?: Record<string, any>): string {
  if (!params || typeof params !== 'object') return ''
  const keys = Object.keys(params).filter((k) => {
    const v = params[k]
    return v !== undefined && v !== null && v !== ''
  })
  if (keys.length === 0) return ''
  keys.sort()
  return keys.map((k) => `${k}=${params[k]}`).join('&')
}

/** genNonce 生成 16 字节随机 hex nonce。 */
export function genNonce(): string {
  return CryptoJS.lib.WordArray.random(16).toString()
}
