/**
 * 将 ISO 8601 / 日期字符串格式化为 YYYY-MM-DD HH:mm:ss
 */
export function formatTime(v?: string | null): string {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * 修复图片 URL 前缀：后端返回 /static/xxx，前端在根路径部署时直接透传
 */
export function formatImageUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  if (url.startsWith('/')) return base + url
  return base + '/' + url
}

/**
 * 判断 URL 是否是图片（以常见图片扩展名结尾）
 */
export function isImageUrl(url?: string | null): boolean {
  if (!url) return false
  const lower = url.toLowerCase()
  const ext = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']
  return ext.some(e => lower.endsWith(e))
}
