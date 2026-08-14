<template>
  <div v-loading="loading">
    <!-- 顶部欢迎条 -->
    <div class="welcome-bar">
      <div class="welcome-left">
        <el-avatar :size="48" :src="store.admin?.avatar || ''" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-size: 20px; color: #fff;">
          {{ (store.admin?.name || store.admin?.account || 'A').slice(0, 1) }}
        </el-avatar>
        <div>
          <div class="welcome-title">欢迎回来，{{ store.admin?.name || store.admin?.account }}</div>
          <div class="welcome-sub">{{ greeting }}，祝您工作愉快</div>
        </div>
      </div>
      <div class="welcome-right">
        <span class="time-now">{{ currentTime }}</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="14" class="stat-row">
      <el-col v-for="card in statCards" :key="card.key" :xs="12" :sm="12" :md="6" :lg="6">
        <div class="stat-card" :style="{ background: card.bg }" @click="card.path && $router.push(card.path)">
          <div class="stat-icon">
            <el-icon :size="28"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-body">
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-extra" v-if="card.extra">{{ card.extra }}</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { User, Avatar, Medal, Histogram } from '@element-plus/icons-vue'
import { useAdminStore } from '@/stores/admin'
import { getDashboardApi, type DashboardStat } from '@/api/data'

const store = useAdminStore()
const stat = ref<DashboardStat | null>(null)
const loading = ref(false)
const currentTime = ref('')

let timer: number | null = null

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

function tickTime() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  currentTime.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${w} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const statCards = computed(() => {
  const s = stat.value
  return [
    { key: 'user', label: '用户总数', value: s?.userTotal ?? 0, extra: s ? `活跃 ${s.userActive}` : '', icon: User, bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', path: '/users' },
    { key: 'userActive', label: '活跃用户', value: s?.userActive ?? 0, extra: '', icon: Histogram, bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', path: '/users' },
    { key: 'admin', label: '管理员数', value: s?.adminTotal ?? 0, extra: '', icon: Avatar, bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', path: '/rbac/admins' },
    { key: 'role', label: '角色数', value: s?.roleTotal ?? 0, extra: '', icon: Medal, bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', path: '' },
  ]
})

async function load() {
  loading.value = true
  try {
    const { data } = await getDashboardApi()
    stat.value = data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  tickTime()
  timer = window.setInterval(tickTime, 1000)
  load()
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.welcome-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: #fff;
  margin-bottom: 14px;
}
.welcome-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.welcome-title {
  font-size: 18px;
  font-weight: 500;
}
.welcome-sub {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 4px;
}
.welcome-right .time-now {
  font-size: 14px;
  font-family: monospace;
  opacity: 0.9;
}

.stat-row { margin-bottom: 14px; }
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 14px;
  min-height: 90px;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-label { font-size: 13px; opacity: 0.9; }
.stat-value { font-size: 24px; font-weight: 600; margin-top: 2px; }
.stat-extra { font-size: 12px; opacity: 0.8; margin-top: 2px; }
</style>
