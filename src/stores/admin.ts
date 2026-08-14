import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loginApi, logoutApi, meApi, myMenusApi, type Admin } from '@/api/auth'
import type { Menu } from '@/api/rbac'

const TOKEN_KEY = 'clipsync_admin_token'
// 签名密钥存 sessionStorage：刷新页面保留，关闭标签页即清空
const SIGN_SECRET_KEY = 'clipsync_admin_sign_secret'

export const useAdminStore = defineStore('admin', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const signSecret = ref<string>(sessionStorage.getItem(SIGN_SECRET_KEY) || '')
  const admin = ref<Admin | null>(null)
  const roleIds = ref<number[]>([])
  const permIds = ref<number[]>([])
  const isSuper = ref<boolean>(false)
  const menus = ref<Menu[]>([])
  const builtinSuperAccount = ref<string>('')

  function setToken(v: string) {
    token.value = v
    if (v) localStorage.setItem(TOKEN_KEY, v)
    else localStorage.removeItem(TOKEN_KEY)
  }

  function setSignSecret(v: string) {
    signSecret.value = v
    if (v) sessionStorage.setItem(SIGN_SECRET_KEY, v)
    else sessionStorage.removeItem(SIGN_SECRET_KEY)
  }

  async function login(account: string, password: string) {
    const { data } = await loginApi(account, password)
    setToken(data.token)
    setSignSecret(data.signSecret || '')
    admin.value = data.admin
  }

  async function fetchMe() {
    const [{ data: me }, { data: myMenus }] = await Promise.all([meApi(), myMenusApi()])
    admin.value = me.admin
    roleIds.value = me.roleIds || []
    permIds.value = me.permIds || []
    isSuper.value = !!me.isSuper
    menus.value = myMenus || []
    builtinSuperAccount.value = me.builtinSuperAccount || ''
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {}
    logoutLocal()
  }

  function logoutLocal() {
    setToken('')
    setSignSecret('')
    admin.value = null
    roleIds.value = []
    permIds.value = []
    isSuper.value = false
    menus.value = []
    builtinSuperAccount.value = ''
  }

  // 菜单 code 集合：用于按钮/数据列的权限判断
  const menuCodes = computed(() => new Set(menus.value.map((m) => m.code).filter(Boolean)))

  // 判断当前登录管理员是否具备指定 code 的按钮/菜单/数据列权限
  function hasPerm(code: string | string[]): boolean {
    if (isSuper.value) return true
    if (!code) return true
    const codes = Array.isArray(code) ? code : [code]
    return codes.some((c) => menuCodes.value.has(c))
  }

  return {
    token,
    signSecret,
    admin,
    roleIds,
    permIds,
    isSuper,
    menus,
    menuCodes,
    builtinSuperAccount,
    login,
    logout,
    logoutLocal,
    fetchMe,
    setToken,
    setSignSecret,
    hasPerm,
  }
})
