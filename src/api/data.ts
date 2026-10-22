import http, { type ApiResult, type PageResult } from './http'

export interface DashboardStat {
  userTotal: number
  userActive: number
  adminTotal: number
  roleTotal: number
}

export function getDashboardApi() {
  return http.get<any, ApiResult<DashboardStat>>('/dashboard')
}

export interface UserStatVO {
  total_user: number
  active_user: number
  online_device: number
  today_sms: number
}

// 设备信息（对应 Server 的 devices 表）
export interface DeviceVO {
  user_id: number
  username?: string
  device_id: string
  role: string
  platform: string
  name: string
  last_ip: string
  disabled: boolean
  online: boolean
  last_seen_at: string
  created_at: string
}

export interface User {
  id: number
  username: string
  nickname?: string
  disabled: boolean
  created_at: string
  updated_at: string
  device_count?: number
  online_count?: number
}

export interface OnlineDevice {
  device_id: string
  role: string
  platform: string
}

export interface UserDetail extends User {
  online_devices: OnlineDevice[]
}

export function listUsersApi(params: { keyword?: string; disabled?: number; page?: number; pageSize?: number }) {
  return http.get<any, ApiResult<PageResult<User>>>('/users', { params })
}
export function getUserApi(id: number) {
  return http.get<any, ApiResult<UserDetail>>(`/users/${id}`)
}
export function createUserApi(data: { username: string; nickname?: string; password: string }) {
  return http.post<any, ApiResult<{ id: number }>>('/users', data)
}
export function updateUserApi(id: number, data: { username?: string; nickname?: string; disabled?: number }) {
  return http.put<any, ApiResult<null>>(`/users/${id}`, data)
}
export function resetUserPasswordApi(id: number) {
  return http.post<any, ApiResult<{ password: string }>>(`/users/${id}/reset-password`)
}
export function updateUserStatusApi(id: number, disabled: number) {
  return http.put<any, ApiResult<null>>(`/users/${id}/status`, { disabled })
}
export function deleteUserApi(id: number) {
  return http.delete<any, ApiResult<null>>(`/users/${id}`)
}

export function listUserStat() {
  return http.get<any, ApiResult<UserStatVO>>('/users/stat')
}

export function listDevicesApi(userId: number) {
  return http.get<any, ApiResult<DeviceVO[]>>(`/users/${userId}/devices`)
}

export function setDeviceStatusApi(userId: number, deviceId: string, disabled: boolean) {
  return http.put<any, ApiResult<null>>(
    `/users/${userId}/devices/${encodeURIComponent(deviceId)}`,
    { disabled },
  )
}

// 重命名设备
export function renameDeviceApi(userId: number, deviceId: string, name: string) {
  return http.put<any, ApiResult<null>>(`/users/${userId}/devices/${encodeURIComponent(deviceId)}/name`, { name })
}

export function kickDeviceApi(userId: number, deviceId: string) {
  return http.post<any, ApiResult<null>>(
    `/users/${userId}/devices/${encodeURIComponent(deviceId)}/kick`,
  )
}

// 删除已禁用设备（未禁用服务端返回 409；服务端会对仍在线的连接兜底踢下线）
export function deleteDeviceApi(userId: number, deviceId: string) {
  return http.delete<any, ApiResult<null>>(
    `/users/${userId}/devices/${encodeURIComponent(deviceId)}`,
  )
}

// 批量启用/禁用设备
export function batchSetDeviceStatusApi(
  disabled: boolean,
  items: { user_id: number; device_id: string }[],
) {
  return http.post<any, ApiResult<{ success: number; failed: string[]; total: number }>>(
    '/devices/batch-status',
    { disabled, items },
  )
}

// 批量删除已禁用设备：仅禁用态可删，未禁用的会进入 failed
export function batchDeleteDevicesApi(items: { user_id: number; device_id: string }[]) {
  return http.post<any, ApiResult<{ success: number; failed: string[]; total: number }>>(
    '/devices/batch-delete',
    { items },
  )
}

export function kickUserApi(userId: number) {
  return http.post<any, ApiResult<null>>(`/users/${userId}/kick`)
}

export function listAllDevicesApi(params: {
  keyword?: string
  status?: number
  online?: boolean
  user_id?: number
  page?: number
  size?: number
}) {
  return http.get<any, ApiResult<PageResult<DeviceVO>>>('/devices', { params })
}

// ===== 开放接口 ApiKey（验证码查询服务） =====

export interface ApiKeyVO {
  id: number
  user_id: number
  username: string
  key_prefix: string
  name: string
  device_id: string
  expires_at: string
  disabled: boolean
  expired: boolean
  last_used_at: string
  created_at: string
}

export interface CreatedApiKeyVO {
  id: number
  api_key: string
  key_prefix: string
  name: string
  device_id: string
  expires_at: string
  created_at: string
  hint: string
}

export function listAllApiKeysApi() {
  return http.get<any, ApiResult<{ items: ApiKeyVO[]; total: number }>>('/api-keys')
}

export function listUserApiKeysApi(userId: number) {
  return http.get<any, ApiResult<{ items: ApiKeyVO[]; total: number }>>(
    `/users/${userId}/api-keys`,
  )
}

export function createApiKeyApi(
  userId: number,
  data: { name?: string; device_id?: string; expires_at?: string },
) {
  return http.post<any, ApiResult<CreatedApiKeyVO>>(`/users/${userId}/api-keys`, data)
}

export function revokeApiKeyApi(id: number) {
  return http.delete<any, ApiResult<null>>(`/api-keys/${id}`)
}
