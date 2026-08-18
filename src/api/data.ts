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

export function kickUserApi(userId: number) {
  return http.post<any, ApiResult<null>>(`/users/${userId}/kick`)
}

export function listAllDevicesApi(params: {
  keyword?: string
  status?: number
  page?: number
  size?: number
}) {
  return http.get<any, ApiResult<PageResult<DeviceVO>>>('/devices', { params })
}
