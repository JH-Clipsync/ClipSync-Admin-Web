<template>
  <div>
    <el-card shadow="never">
      <div class="toolbar">
        <div class="tb-left">
          <el-input v-model="q.keyword" placeholder="搜索用户名/昵称" style="width: 240px" clearable @keyup.enter="load(1)" />
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="load()"><el-icon><Refresh /></el-icon>刷新</el-button>
        </div>
        <el-button v-if="store.hasPerm('biz:users:create')" type="primary" @click="openCreate">
          <el-icon><Plus /></el-icon>新建用户
        </el-button>
      </div>
      <el-table :data="rows" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column label="昵称" min-width="120">
          <template #default="{ row }">
            <span>{{ row.nickname || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
              {{ row.disabled ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备总数" width="90" align="center">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="openDevices(row)">{{ row.device_count ?? 0 }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="在线数" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.online_count > 0" type="success" size="small">{{ row.online_count }}</el-tag>
            <span v-else class="muted">0</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="300">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDevices(row)">设备</el-button>
            <el-button
              v-if="store.hasPerm('data:user:write')"
              link
              type="warning"
              size="small"
              @click="onKickUser(row)"
            >
              踢下线
            </el-button>
            <el-button
              v-if="store.hasPerm('data:user:write')"
              link
              size="small"
              @click="openReset(row)"
            >
              重置密码
            </el-button>
            <el-button
              v-if="store.hasPerm('data:user:write')"
              link
              size="small"
              @click="onToggle(row)"
            >
              {{ row.disabled ? '启用' : '禁用' }}
            </el-button>
            <el-button
              v-if="store.hasPerm('data:user:write')"
              link
              type="danger"
              size="small"
              @click="onDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="q.page"
          v-model:page-size="q.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          background
          @size-change="load(1)"
          @current-change="load()"
        />
      </div>
    </el-card>

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

    <!-- 新建用户 -->
    <el-dialog v-model="createDialog" title="新建用户" width="440px" @closed="resetCreateForm">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="3-32 个字符，用于登录" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="createForm.nickname" placeholder="选填，最多 32 个字符" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="至少 6 位" show-password maxlength="64" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 设备列表抽屉 -->
    <el-drawer
      v-model="devicesDrawer"
      :title="`设备列表 · ${deviceTarget?.username ?? ''}`"
      size="560px"
      direction="rtl"
    >
      <div class="device-toolbar">
        <el-switch
          v-model="onlyOnline"
          active-text="只看在线"
          inline-prompt
        />
        <el-button text @click="refreshDevices"><el-icon><Refresh /></el-icon>刷新</el-button>
      </div>
      <div v-loading="devicesLoading" class="device-list">
        <el-empty v-if="!devicesLoading && filteredDevices.length === 0" description="暂无设备记录" />
        <el-card
          v-for="d in filteredDevices"
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
              <span class="device-name">{{ d.name || platformLabel(d) }}</span>
            </div>
            <el-tag v-if="d.disabled" size="small" type="danger">已禁用</el-tag>
          </div>
          <div class="device-row">
            <span class="label">设备 ID</span>
            <code class="device-id">{{ d.device_id }}</code>
          </div>
          <div v-if="d.platform" class="device-row">
            <span class="label">平台</span>
            <span>{{ d.platform }}</span>
          </div>
          <div v-if="d.role" class="device-row">
            <span class="label">角色</span>
            <span>{{ d.role }}</span>
          </div>
          <div v-if="d.last_ip" class="device-row">
            <span class="label">最近 IP</span>
            <span>{{ d.last_ip }}</span>
          </div>
          <div class="device-row">
            <span class="label">最近上线</span>
            <span>{{ formatTime(d.last_seen_at) }}</span>
          </div>
          <div class="device-row">
            <span class="label">首次出现</span>
            <span>{{ formatTime(d.created_at) }}</span>
          </div>
          <div class="device-actions">
            <el-button size="small" @click="onRenameDevice(d)">重命名</el-button>
            <el-button
              size="small"
              :type="d.disabled ? 'success' : 'warning'"
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
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Refresh, DocumentCopy, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  listUsersApi,
  deleteUserApi,
  updateUserStatusApi,
  resetUserPasswordApi,
  createUserApi,
  kickUserApi,
  listDevicesApi,
  setDeviceStatusApi,
  renameDeviceApi,
  kickDeviceApi,
  type User,
  type DeviceVO,
} from '@/api/data'
import { useAdminStore } from '@/stores/admin'
import { formatTime } from '@/utils/format'

const store = useAdminStore()
const router = useRouter()

const rows = ref<User[]>([])
const loading = ref(false)
const total = ref(0)
const q = reactive({ keyword: '', page: 1, pageSize: 20 })

const resetDialog = ref(false)
const resetTarget = ref<User | null>(null)
const newPwd = ref('')

const createDialog = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({ username: '', nickname: '', password: '' })
const createRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 32, message: '用户名长度为 3-32 个字符', trigger: 'blur' },
  ],
  nickname: [{ max: 32, message: '昵称不能超过 32 个字符', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

const devicesDrawer = ref(false)
const deviceTarget = ref<User | null>(null)
const devices = ref<DeviceVO[]>([])
const devicesLoading = ref(false)
const onlyOnline = ref(false)
const filteredDevices = computed(() =>
  onlyOnline.value ? devices.value.filter((d) => d.online) : devices.value,
)

async function load(p?: number) {
  if (p) q.page = p
  loading.value = true
  try {
    const { data } = await listUsersApi({
      keyword: q.keyword,
      page: q.page,
      pageSize: q.pageSize,
    })
    rows.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function openCreate() {
  createDialog.value = true
}
function resetCreateForm() {
  createForm.username = ''
  createForm.nickname = ''
  createForm.password = ''
  createFormRef.value?.clearValidate()
}
async function submitCreate() {
  if (!createFormRef.value) return
  await createFormRef.value.validate()
  creating.value = true
  try {
    await createUserApi({
      username: createForm.username.trim(),
      nickname: createForm.nickname.trim(),
      password: createForm.password,
    })
    ElMessage.success('用户创建成功')
    createDialog.value = false
    load(1)
  } finally {
    creating.value = false
  }
}

async function onToggle(row: User) {
  const next = !row.disabled
  const tip = next
    ? `确定禁用用户「${row.username}」？禁用后该用户所有在线设备会被强制下线，且无法再次登录。`
    : `确定启用用户「${row.username}」？启用后即可正常登录。`
  await ElMessageBox.confirm(tip, '操作确认', { type: 'warning' })
  await updateUserStatusApi(row.id, next ? 1 : 0)
  ElMessage.success('已更新')
  load()
}

async function onDelete(row: User) {
  await ElMessageBox.confirm(`确定删除用户「${row.username}」？此操作不可恢复！`, '删除确认', {
    type: 'error',
  })
  await deleteUserApi(row.id)
  ElMessage.success('已删除')
  load()
}

async function openReset(row: User) {
  await ElMessageBox.confirm(`确定重置「${row.username}」的密码？`, '操作确认', { type: 'warning' })
  const { data } = await resetUserPasswordApi(row.id)
  resetTarget.value = row
  newPwd.value = data.password
  resetDialog.value = true
  load()
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
  await kickUserApi(row.id)
  ElMessage.success('已踢下线')
  load()
}

function goDevices(row: User) {
  router.push({ path: '/devices', query: { user_id: String(row.id) } })
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
    const { data } = await listDevicesApi(row.id)
    devices.value = data
  } finally {
    devicesLoading.value = false
  }
}

async function refreshDevices() {
  if (!deviceTarget.value) return
  devicesLoading.value = true
  try {
    const { data } = await listDevicesApi(deviceTarget.value.id)
    devices.value = data
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
  await setDeviceStatusApi(deviceTarget.value.id, d.device_id, next)
  ElMessage.success(next ? '设备已禁用' : '设备已解禁')
  openDevices(deviceTarget.value)
}

async function onKickDevice(d: DeviceVO) {
  if (!deviceTarget.value) return
  await ElMessageBox.confirm(
    `确定踢该设备下线？\n不会禁用设备，客户端会自动重连。`,
    '踢下线',
    { type: 'warning' },
  )
  await kickDeviceApi(deviceTarget.value.id, d.device_id)
  ElMessage.success('已踢下线')
  openDevices(deviceTarget.value)
}

async function onRenameDevice(d: DeviceVO) {
  if (!deviceTarget.value) return
  const { value } = await ElMessageBox.prompt('请输入新的设备名称（最多 32 个字符）', '重命名设备', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: d.name || '',
    inputValidator: (v) => {
      const s = (v || '').trim()
      if (!s) return '名称不能为空'
      if (s.length > 32) return '不能超过 32 个字符'
      return true
    },
  })
  await renameDeviceApi(deviceTarget.value.id, d.device_id, value.trim())
  ElMessage.success('已重命名')
  openDevices(deviceTarget.value)
}

onMounted(load)
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.tb-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
.newpwd {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin: 12px 0;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-border-radius-base);
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
.muted {
  color: var(--el-text-color-secondary);
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 4px 24px;
}
.device-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}
.device-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.device-card {
  border-radius: var(--el-border-radius-base);
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
