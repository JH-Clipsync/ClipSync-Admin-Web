<template>
  <div class="page">
    <PageHeader
      title="用户管理"
      subtitle="管理 C 端用户账号。踢下线只强制重新登录，禁用账号或设备才会真正阻止使用。"
    >
      <el-button type="primary" v-ripple @click="openCreate">
        <el-icon><Plus /></el-icon>新建用户
      </el-button>
      <el-button v-ripple @click="reload"><el-icon><Refresh /></el-icon>刷新</el-button>
    </PageHeader>

    <el-card class="card" shadow="never">
      <TableToolbar
        :search-model="search"
        :search-fields="searchFields"
        :can-create="can('data:user:write')"
        create-label="新建用户"
        @search="onSearch"
        @reset="onReset"
        @create="openCreate"
      />
      <el-table :data="users" v-loading="loading" stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ fmtTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">{{ fmtTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDevices(row)">
              设备
            </el-button>
            <el-button
              v-if="can('data:user:write')"
              link
              type="warning"
              size="small"
              @click="onKickUser(row)"
            >
              踢下线
            </el-button>
            <el-button link size="small" @click="openReset(row)" v-if="can('data:user:write')">
              重置密码
            </el-button>
            <el-button link size="small" @click="onToggle(row)" v-if="can('data:user:write')">
              {{ row.disabled ? '启用' : '禁用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="onDelete(row)" v-if="can('data:user:write')">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pager"
        background
        layout="total, sizes, prev, pager, next"
        :total="total"
        v-model:current-page="search.page"
        v-model:page-size="search.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="reload"
        @size-change="reload"
      />
    </el-card>

    <!-- 新建用户 -->
    <el-dialog v-model="createDialog" title="新建用户" width="420px">
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item label="初始密码">
          <el-input v-model="form.password" placeholder="留空则使用 123456" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">确认新建</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码结果 -->
    <el-dialog v-model="resetDialog" title="密码已重置" width="420px">
      <el-alert
        type="success"
        :closable="false"
        title="新密码"
        :description="`账号「${resetTarget?.username}」的新密码为：`"
        show-icon
      />
      <div class="newpwd">
        <code>{{ newPwd }}</code>
        <el-button text type="primary" @click="copyPwd">
          <el-icon><DocumentCopy /></el-icon>复制
        </el-button>
      </div>
      <p class="reset-tip">重置后该用户的所有已连接设备会被强制下线，需要用新密码重新登录。</p>
      <template #footer>
        <el-button type="primary" @click="resetDialog = false">知道了</el-button>
      </template>
    </el-dialog>

    <!-- 设备管理抽屉 -->
    <el-drawer
      v-model="devicesDrawer"
      :title="`设备列表 · ${deviceTarget?.username ?? ''}`"
      size="560px"
      direction="rtl"
    >
      <div v-loading="devicesLoading" class="device-list">
        <el-empty v-if="!devicesLoading && devices.length === 0" description="暂无设备记录" />
        <el-card
          v-for="d in devices"
          :key="d.device_id"
          class="device-card"
          shadow="never"
          :class="{ 'device-disabled': d.disabled }"
        >
          <div class="device-head">
            <div class="device-title">
              <el-tag size="small" :type="d.online ? 'success' : 'info'">
                {{ d.online ? '在线' : '离线' }}
              </el-tag>
              <span class="device-platform">{{ platformLabel(d) }}</span>
              <el-tag v-if="d.role" size="small" type="info">{{ d.role }}</el-tag>
            </div>
            <el-tag v-if="d.disabled" size="small" type="danger">已禁用</el-tag>
          </div>
          <div class="device-row">
            <span class="label">设备 ID</span>
            <code class="device-id">{{ d.device_id }}</code>
          </div>
          <div class="device-row">
            <span class="label">最近上线</span>
            <span>{{ fmtTime(d.last_seen_at) }}</span>
          </div>
          <div class="device-row">
            <span class="label">首次出现</span>
            <span>{{ fmtTime(d.created_at) }}</span>
          </div>
          <div class="device-actions">
            <el-button
              size="small"
              :type="d.disabled ? 'success' : 'warning'"
              :disabled="!d.online && !d.disabled"
              @click="onToggleDevice(d)"
            >
              {{ d.disabled ? '解禁设备' : '禁用设备' }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="!d.online"
              @click="onKickDevice(d)"
            >
              踢下线
            </el-button>
          </div>
        </el-card>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import {
  Plus,
  Refresh,
  DocumentCopy,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/layout/components/PageHeader.vue'
import TableToolbar from '@/layout/components/TableToolbar.vue'
import {
  listUsers,
  createUser,
  deleteUser,
  updateUserStatus,
  resetUserPassword,
  listDevices,
  setDeviceStatus,
  kickDevice as apiKickDevice,
  kickUser as apiKickUser,
  type User,
  type DeviceVO,
} from '@/api/data'
import { useAuth } from '@/stores/admin'
import { fmtTime } from '@/utils/format'

const auth = useAuth()
const can = (p: string) => auth.hasPerm(p)

const users = ref<User[]>([])
const loading = ref(false)
const total = ref(0)
const search = reactive({ keyword: '', page: 1, pageSize: 20 })
const searchFields = [{ key: 'keyword', label: '用户名', placeholder: '搜索用户名' }]

const createDialog = ref(false)
const form = reactive({ username: '', password: '' })

const resetDialog = ref(false)
const resetTarget = ref<User | null>(null)
const newPwd = ref('')

const devicesDrawer = ref(false)
const deviceTarget = ref<User | null>(null)
const devices = ref<DeviceVO[]>([])
const devicesLoading = ref(false)

async function reload() {
  loading.value = true
  try {
    const res = await listUsers({
      keyword: search.keyword,
      page: search.page,
      pageSize: search.pageSize,
    })
    users.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  search.page = 1
  reload()
}
function onReset() {
  search.keyword = ''
  search.page = 1
  reload()
}

function openCreate() {
  form.username = ''
  form.password = ''
  createDialog.value = true
}
async function submitCreate() {
  if (!form.username) {
    ElMessage.warning('请填写用户名')
    return
  }
  await createUser({ username: form.username, password: form.password })
  ElMessage.success('用户已创建')
  createDialog.value = false
  reload()
}

async function onToggle(row: User) {
  const next = !row.disabled
  const tip = next
    ? `确定禁用用户「${row.username}」？禁用后该用户所有在线设备会被强制下线，且无法再次登录。`
    : `确定启用用户「${row.username}」？启用后即可正常登录。`
  await ElMessageBox.confirm(tip, '操作确认', { type: 'warning' })
  await updateUserStatus(row.id, next)
  ElMessage.success('已更新')
  reload()
}

async function onDelete(row: User) {
  await ElMessageBox.confirm(`确定删除用户「${row.username}」？此操作不可恢复！`, '删除确认', {
    type: 'error',
  })
  await deleteUser(row.id)
  ElMessage.success('已删除')
  reload()
}

async function openReset(row: User) {
  await ElMessageBox.confirm(`确定重置「${row.username}」的密码？`, '操作确认', { type: 'warning' })
  const pwd = await resetUserPassword(row.id)
  resetTarget.value = row
  newPwd.value = pwd
  resetDialog.value = true
  reload()
}
async function copyPwd() {
  try {
    await navigator.clipboard.writeText(newPwd.value)
    ElMessage.success('已复制新密码')
  } catch {
    ElMessage.warning('复制失败，请手动选择')
  }
}

async function onKickUser(row: User) {
  await ElMessageBox.confirm(
    `确定踢用户「${row.username}」全部设备下线？\n不会改密码，客户端会立即断开并自动重连。`,
    '踢下线',
    { type: 'warning' },
  )
  await apiKickUser(row.id)
  ElMessage.success('已踢下线')
  reload()
}

function platformLabel(d: DeviceVO): string {
  if (d.platform) return d.platform
  if (d.device_id.startsWith('android-')) return 'Android'
  if (d.device_id.startsWith('mac-')) return 'macOS'
  if (d.device_id.startsWith('win-')) return 'Windows'
  return '未知设备'
}

async function openDevices(row: User) {
  deviceTarget.value = row
  devicesDrawer.value = true
  devicesLoading.value = true
  devices.value = []
  try {
    devices.value = await listDevices(row.id)
  } finally {
    devicesLoading.value = false
  }
}

async function onToggleDevice(d: DeviceVO) {
  if (!deviceTarget.value) return
  const next = !d.disabled
  const tip = next
    ? `确定禁用该设备？\n禁用后这台设备会立即下线，且无法再连接，直到解禁。`
    : `确定解禁该设备？解禁后该设备即可重新连接。`
  await ElMessageBox.confirm(tip, '设备操作', { type: 'warning' })
  await setDeviceStatus(deviceTarget.value.id, d.device_id, next)
  ElMessage.success(next ? '设备已禁用' : '设备已解禁')
  // 刷新本地状态
  devices.value = devices.value.map((x) =>
    x.device_id === d.device_id ? { ...x, disabled: next, online: next ? false : x.online } : x,
  )
  if (deviceTarget.value) openDevices(deviceTarget.value)
}

async function onKickDevice(d: DeviceVO) {
  if (!deviceTarget.value) return
  await ElMessageBox.confirm(
    `确定踢该设备下线？\n不会禁用设备，客户端会自动重连。`,
    '踢下线',
    { type: 'warning' },
  )
  await apiKickDevice(deviceTarget.value.id, d.device_id)
  ElMessage.success('已踢下线')
  devices.value = devices.value.map((x) =>
    x.device_id === d.device_id ? { ...x, online: false } : x,
  )
  if (deviceTarget.value) openDevices(deviceTarget.value)
}

onMounted(reload)
</script>

<style scoped>
.page {
  padding: 0 0 24px;
}
.card {
  border-radius: var(--radius-card);
}
.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
.newpwd {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin: 12px 0;
  background: var(--clr-primary-50);
  border: 1px solid var(--clr-primary-100);
  border-radius: var(--radius-base);
}
.newpwd code {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--el-color-primary);
  flex: 1;
}
.reset-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 4px 24px;
}
.device-card {
  border-radius: var(--radius-card);
}
.device-card.device-disabled {
  opacity: 0.7;
  background: var(--el-fill-color-light);
}
.device-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.device-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.device-platform {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.device-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-regular);
  padding: 4px 0;
}
.device-row .label {
  color: var(--el-text-color-secondary);
}
.device-id {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  word-break: break-all;
}
.device-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}
</style>
