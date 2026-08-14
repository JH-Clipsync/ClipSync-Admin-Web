import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: '概览' } },
      { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue'), meta: { title: '用户管理' } },
      { path: 'rbac/admins', name: 'rbac-admins', component: () => import('@/views/rbac/AdminsView.vue'), meta: { title: '管理员' } },
      { path: 'rbac/roles', name: 'rbac-roles', component: () => import('@/views/rbac/RolesView.vue'), meta: { title: '角色' } },
      { path: 'rbac/perms', name: 'rbac-perms', component: () => import('@/views/rbac/PermsView.vue'), meta: { title: '接口权限' } },
      { path: 'rbac/menus', name: 'rbac-menus', component: () => import('@/views/rbac/MenusView.vue'), meta: { title: '菜单管理' } },
      { path: 'profile', name: 'profile', component: () => import('@/views/ProfileView.vue'), meta: { title: '个人中心' } },
      { path: 'profile/password', name: 'profile-password', component: () => import('@/views/profile/PasswordView.vue'), meta: { title: '修改密码', hidden: true } },
    ],
  },
]

const router = createRouter({
  // 部署在 /clipsync/admin/ 子路径下
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const store = useAdminStore()
  if (to.meta.public) return true
  if (!store.token) return { name: 'login', query: { redirect: to.fullPath } }
  // token 在但签名密钥丢失（关闭标签页重开会清空 sessionStorage），视为会话失效
  if (!store.signSecret) {
    store.logoutLocal()
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (!store.admin) {
    try {
      await store.fetchMe()
    } catch {
      store.logoutLocal()
      return { name: 'login' }
    }
  }
  return true
})

export default router
