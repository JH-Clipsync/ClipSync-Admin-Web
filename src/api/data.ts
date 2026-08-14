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
  device_id: string
  role: string
  platform: string
  disabled: boolean
  online: boolean
  last_seen_at: string
  created_at: string
}

export interface User {
  id: number
  username: string
  disabled: number
  createdAt: string
  updatedAt: string
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
export function updateUserApi(id: number, data: { username?: string; disabled?: number }) {
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
  return http.get<ApiResult<UserStatVO>>('/users/stat').then((r) => r.data)
}

export function listDevices(userId: number) {
  return http.get<ApiResult<DeviceVO[]>>(`/users/${userId}/devices`).then((r) => r.data)
}

export function setDeviceStatus(userId: number, deviceId: string, disabled: boolean) {
  return http
    .put<ApiResult<null>>(`/users/${userId}/devices/${encodeURIComponent(deviceId)}`, {
      disabled,
    })
    .then((r) => r.data)
}

export function kickDevice(userId: number, deviceId: string) {
  return http
    .post<ApiResult<null>>(`/users/${userId}/devices/${encodeURIComponent(deviceId)}/kick`)
    .then((r) => r.data)
}

export function kickUser(userId: number) {
  return http.post<ApiResult<null>>(`/users/${userId}/kick`).then((r) => r.data)
}
