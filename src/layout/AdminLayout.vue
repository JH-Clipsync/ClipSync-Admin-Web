<template>
  <el-container class="admin-layout">
    <el-aside width="220px" class="aside">
      <div class="brand">ClipSync 管理台</div>
      <el-menu
        :default-active="activeMenu"
        router
        class="side-menu"
        background-color="#001529"
        text-color="#c9d1d9"
        active-text-color="#409eff"
      >
        <template v-for="node in sideMenu" :key="node.id">
          <!-- 有子菜单 -->
          <el-sub-menu v-if="node.children && node.children.length" :index="'g-' + node.id">
            <template #title>
              <el-icon v-if="getIcon(node.icon)"><component :is="getIcon(node.icon)" /></el-icon>
              <span>{{ node.title || node.name }}</span>
            </template>
            <el-menu-item
              v-for="c in node.children"
              :key="c.id"
              :index="c.path"
            >
              <el-icon v-if="getIcon(c.icon)"><component :is="getIcon(c.icon)" /></el-icon>
              <span>{{ c.title || c.name }}</span>
            </el-menu-item>
          </el-sub-menu>
          <!-- 叶子菜单 -->
          <el-menu-item v-else :index="node.path">
            <el-icon v-if="getIcon(node.icon)"><component :is="getIcon(node.icon)" /></el-icon>
            <span>{{ node.title || node.name }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="crumbs">{{ (route.meta as any).title || currentMenuTitle }}</div>
        <el-dropdown @command="onCommand">
          <span class="user">
            <el-avatar :size="28" :src="store.admin?.avatar || ''" style="margin-right: 6px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">{{ (store.admin?.name || store.admin?.account || 'A').slice(0, 1) }}</el-avatar>
            {{ store.admin?.name || store.admin?.account }}
            <el-tag v-if="store.isSuper" type="danger" size="small" style="margin-left: 6px">超管</el-tag>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="password">修改密码</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import type { Menu } from '@/api/rbac'
import { User, Lock, HomeFilled, Avatar } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const store = useAdminStore()

const iconMap: Record<string, any> = {
  User,
  Lock,
  HomeFilled,
  Avatar,
}

function getIcon(name: string) {
  return iconMap[name] || null
}

// 菜单类型：1 顶部/2 左侧
// 侧边栏只渲染 type=1/2 的菜单节点。
type NodeItem = Menu & { children: NodeItem[] }

const HIDDEN_MENU_PATHS = new Set(['/profile', '/profile/password'])

const sideMenu = computed<NodeItem[]>(() => {
  const list = (store.menus || []).filter((m) => (m.type === 1 || m.type === 2) && !HIDDEN_MENU_PATHS.has(m.path))
  const map = new Map<number, NodeItem>()
  const roots: NodeItem[] = []
  list.forEach((m) => map.set(m.id, { ...m, children: [] }))
  list.forEach((m) => {
    const node = map.get(m.id)!
    if (m.parentId && map.has(m.parentId)) {
      map.get(m.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  const sortFn = (a: NodeItem, b: NodeItem) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id
  roots.sort(sortFn)
  roots.forEach((n) => n.children.sort(sortFn))
  return roots
})

const activeMenu = computed(() => route.path)

const currentMenuTitle = computed(() => {
  const m = (store.menus || []).find((x) => x.path === route.path)
  return m?.title || m?.name || ''
})

async function onCommand(cmd: string) {
  if (cmd === 'logout') {
    await store.logout()
    router.push({ name: 'login' })
  } else if (cmd === 'profile') {
    router.push('/profile')
  } else if (cmd === 'password') {
    router.push('/profile/password')
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}
.aside {
  background: #001529;
  color: #fff;
}
.brand {
  height: 60px;
  line-height: 60px;
  color: #fff;
  text-align: center;
  font-size: 16px;
  border-bottom: 1px solid #0b2545;
}
.side-menu {
  border-right: none;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #eef0f3;
}
.crumbs {
  font-size: 16px;
  color: #303133;
}
.user {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
.main {
  background: #f5f7fa;
}
</style>
