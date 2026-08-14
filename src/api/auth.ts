import http, { type ApiResult } from './http'
import type { Menu } from './rbac'

export interface Admin {
  id: number
  account: string
  name: string
  avatar: string
  status: number
  isLock: number
  remark: string
  lastLoginTime?: string | null
  createTime?: string
  updateTime?: string
}

export interface LoginResp {
  token: string
  admin: Admin
  /** 会话签名密钥，存内存不进 localStorage，登出即清 */
  signSecret: string
}

export interface MeResp {
  admin: Admin
  roleIds: number[]
  isSuper: boolean
  permIds: number[]
  builtinSuperAccount: string
}

export function loginApi(account: string, password: string) {
  return http.post<any, ApiResult<LoginResp>>('/auth/login', { account, password })
}

export function logoutApi() {
  return http.post<any, ApiResult<null>>('/auth/logout')
}

export function meApi() {
  return http.get<any, ApiResult<MeResp>>('/auth/me')
}

export function myMenusApi() {
  return http.get<any, ApiResult<Menu[]>>('/auth/menus')
}

export function changeMyPasswordApi(oldPassword: string, newPassword: string) {
  return http.put<any, ApiResult<null>>('/auth/password', { oldPassword, newPassword })
}

export function updateProfileApi(name: string, avatar: string) {
  return http.put<any, ApiResult<null>>('/auth/profile', { name, avatar })
}
