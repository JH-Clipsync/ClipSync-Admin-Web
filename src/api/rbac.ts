import http, { type ApiResult, type PageResult } from './http'
import type { Admin } from './auth'

export function listAdminsApi(params: { keyword?: string; page?: number; pageSize?: number }) {
  return http.get<any, ApiResult<PageResult<Admin>>>('/rbac/admins', { params })
}
export function createAdminApi(body: any) {
  return http.post<any, ApiResult<Admin>>('/rbac/admins', body)
}
export function updateAdminApi(id: number, body: any) {
  return http.put<any, ApiResult<null>>(`/rbac/admins/${id}`, body)
}
export function resetAdminPasswordApi(id: number, password: string) {
  return http.put<any, ApiResult<null>>(`/rbac/admins/${id}/password`, { password })
}
export function deleteAdminApi(id: number) {
  return http.delete<any, ApiResult<null>>(`/rbac/admins/${id}`)
}
export function updateAdminStatusApi(id: number, status: number) {
  return http.put<any, ApiResult<null>>(`/rbac/admins/${id}/status`, { status })
}
export function adminRoleIdsApi(id: number) {
  return http.get<any, ApiResult<number[]>>(`/rbac/admins/${id}/roles`)
}

export interface Role {
  id: number
  name: string
  remark: string
  type: number
  status: number
  sort: number
}

export function listRolesApi() {
  return http.get<any, ApiResult<Role[]>>('/rbac/roles')
}
export function createRoleApi(body: Partial<Role>) {
  return http.post<any, ApiResult<Role>>('/rbac/roles', body)
}
export function updateRoleApi(id: number, body: Partial<Role>) {
  return http.put<any, ApiResult<null>>(`/rbac/roles/${id}`, body)
}
export function deleteRoleApi(id: number) {
  return http.delete<any, ApiResult<null>>(`/rbac/roles/${id}`)
}
export function roleMenuIdsApi(id: number) {
  return http.get<any, ApiResult<number[]>>(`/rbac/roles/${id}/menus`)
}
export function assignRoleMenusApi(id: number, menuIds: number[]) {
  return http.put<any, ApiResult<null>>(`/rbac/roles/${id}/menus`, { menuIds })
}

export interface Menu {
  id: number
  parentId: number
  name: string
  title: string
  path: string
  icon: string
  isLink: number
  code: string
  include: string
  type: number
  fieldValueKey: string
  fieldValueWidth: string
  fieldValueEllipsis: number
  remark: string
  status: number
  sort: number
}

export function listMenusApi() {
  return http.get<any, ApiResult<Menu[]>>('/rbac/menus')
}
export function createMenuApi(body: Partial<Menu>) {
  return http.post<any, ApiResult<Menu>>('/rbac/menus', body)
}
export function updateMenuApi(id: number, body: Partial<Menu>) {
  return http.put<any, ApiResult<null>>(`/rbac/menus/${id}`, body)
}
export function deleteMenuApi(id: number) {
  return http.delete<any, ApiResult<null>>(`/rbac/menus/${id}`)
}
export function assignMenuPermsApi(id: number, permIds: number[]) {
  return http.put<any, ApiResult<null>>(`/rbac/menus/${id}/perms`, { permIds })
}

export interface Perm {
  id: number
  name: string
  parentId: number
  method: number
  route: string
  isIntercept: number
  status: number
  sort: number
  remark: string
}

export function listPermsApi(params: { keyword?: string; page?: number; pageSize?: number }) {
  return http.get<any, ApiResult<PageResult<Perm>>>('/rbac/perms', { params })
}
export function createPermApi(body: Partial<Perm>) {
  return http.post<any, ApiResult<Perm>>('/rbac/perms', body)
}
export function updatePermApi(id: number, body: Partial<Perm>) {
  return http.put<any, ApiResult<null>>(`/rbac/perms/${id}`, body)
}
export function deletePermApi(id: number) {
  return http.delete<any, ApiResult<null>>(`/rbac/perms/${id}`)
}
