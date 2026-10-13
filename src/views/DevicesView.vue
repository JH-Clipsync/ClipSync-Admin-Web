<template>
  <div>
    <el-card shadow="never">
      <div class="toolbar">
        <div class="tb-left">
          <el-input
            v-model="q.keyword"
            placeholder="搜索用户名 / 设备名 / ID / IP"
            style="width: 280px"
            clearable
            @keyup.enter="load(1)"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="q.status" style="width: 120px" @change="load(1)">
            <el-option label="全部状态" :value="-1" />
            <el-option label="正常" :value="0" />
            <el-option label="已禁用" :value="1" />
          </el-select>
          <el-switch
            v-model="onlyOnline"
            active-text="只看在线"
            inline-prompt
            @change="onFilterOnline"
          />
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button @click="onReset"><el-icon><Refresh /></el-icon>重置</el-button>
        </div>
        <el-tag v-if="userFilterId" closable type="primary" @close="clearUserFilter">
          仅看用户 ID：{{ userFilterId }}
        </el-tag>
        <el-button
          type="danger"
          plain
          :disabled="selected.length === 0"
          @click="onBatchDelete"
        >
          批量删除<template v-if="selected.length">（{{ selected.length }}）</template>
        </el-button>
      </div>
      <el-table
        ref="tableRef"
        :data="rows"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="44" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.online ? 'success' : 'info'" size="small">
              {{ row.online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户" min-width="120" />
        <el-table-column label="设备名称" min-width="160">
          <template #default="{ row }">
            <span class="cell-name">{{ row.name || platformLabel(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备 ID" min-width="200">
          <template #default="{ row }">
            <code class="cell-id">{{ row.device_id }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="平台" width="100" />
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column prop="last_ip" label="最近 IP" width="140" />
        <el-table-column label="禁用" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.disabled" type="danger" size="small">已禁用</el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="最近上线" width="170">
          <template #default="{ row }">{{ formatTime(row.last_seen_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="store.hasPerm('data:user:write')"
              link
              size="small"
              @click="onRenameDevice(row)"
            >
              重命名
            </el-button>
            <el-button
              v-if="store.hasPerm('data:user:write')"
              link
              size="small"
              :type="row.disabled ? 'success' : 'warning'"
              @click="onToggleDevice(row)"
            >
              {{ row.disabled ? '解禁' : '禁用' }}
            </el-button>
            <el-button
              v-if="store.hasPerm('data:user:write')"
              link
              type="danger"
              size="small"
              :disabled="!row.online"
              @click="onKickDevice(row)"
            >
              踢下线
            </el-button>
            <el-button
              v-if="store.hasPerm('data:user:write')"
              link
              type="danger"
              size="small"
              @click="onDeleteDevice(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="q.page"
          v-model:page-size="q.size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          background
          @size-change="load(1)"
          @current-change="load()"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TableInstance } from 'element-plus'
import {
  listAllDevicesApi,
  setDeviceStatusApi,
  renameDeviceApi,
  kickDeviceApi,
  deleteDeviceApi,
  batchDeleteDevicesApi,
  type DeviceVO,
} from '@/api/data'
import { useAdminStore } from '@/stores/admin'
import { formatTime } from '@/utils/format'

const store = useAdminStore()
const route = useRoute()
const router = useRouter()

const rows = ref<DeviceVO[]>([])
const loading = ref(false)
const total = ref(0)
const onlyOnline = ref(false)
const userFilterId = ref(0)
const q = reactive({ keyword: '', status: -1, page: 1, size: 20 })
const tableRef = ref<TableInstance>()
const selected = ref<DeviceVO[]>([])

function onSelectionChange(sel: DeviceVO[]) {
  selected.value = sel
}

function deviceLabel(d: DeviceVO): string {
  return d.name || d.platform || d.device_id
}

function platformLabel(d: DeviceVO): string {
  if (d.platform) return d.platform
  if (d.device_id.startsWith('android-')) return 'Android'
  if (d.device_id.startsWith('mac-')) return 'macOS'
  if (d.device_id.startsWith('win-')) return 'Windows'
  return '未知设备'
}

async function load(p?: number) {
  if (p) q.page = p
  loading.value = true
  try {
    const { data } = await listAllDevicesApi({
      keyword: q.keyword,
      status: q.status,
      user_id: userFilterId.value || undefined,
      page: q.page,
      size: q.size,
    })
    let list = data.list || []
    if (onlyOnline.value) list = list.filter((d) => d.online)
    rows.value = list
    total.value = onlyOnline.value ? list.length : data.total
    tableRef.value?.clearSelection()
  } finally {
    loading.value = false
  }
}

function onFilterOnline() {
  load(1)
}

function clearUserFilter() {
  userFilterId.value = 0
  router.replace({ query: {} })
  load(1)
}

function onReset() {
  q.keyword = ''
  q.status = -1
  onlyOnline.value = false
  userFilterId.value = 0
  router.replace({ query: {} })
  load(1)
}

async function onToggleDevice(row: DeviceVO) {
  const next = !row.disabled
  const tip = next
    ? `确定禁用设备「${row.name || row.device_id}」？\n禁用后这台设备会立即下线，且无法再连接，直到解禁。`
    : `确定解禁设备「${row.name || row.device_id}」？解禁后该设备即可重新连接。`
  await ElMessageBox.confirm(tip, '设备操作', { type: 'warning' })
  await setDeviceStatusApi(row.user_id, row.device_id, next)
  ElMessage.success(next ? '设备已禁用' : '设备已解禁')
  load()
}

async function onKickDevice(row: DeviceVO) {
  await ElMessageBox.confirm(
    `确定踢设备「${row.name || row.device_id}」下线？\n不会禁用设备，客户端会自动重连。`,
    '踢下线',
    { type: 'warning' },
  )
  await kickDeviceApi(row.user_id, row.device_id)
  ElMessage.success('已踢下线')
  load()
}

async function onRenameDevice(row: DeviceVO) {
  const { value } = await ElMessageBox.prompt('请输入新的设备名称（最多 32 个字符）', '重命名设备', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputValue: row.name || '',
    inputValidator: (v) => {
      const s = (v || '').trim()
      if (!s) return '名称不能为空'
      if (s.length > 32) return '不能超过 32 个字符'
      return true
    },
  })
  await renameDeviceApi(row.user_id, row.device_id, value.trim())
  ElMessage.success('已重命名')
  load()
}

async function onDeleteDevice(row: DeviceVO) {
  const label = deviceLabel(row)
  const extra = row.disabled
    ? '该设备已禁用。'
    : '该设备当前未禁用，删除前会先自动禁用并将其踢下线。'
  await ElMessageBox.confirm(
    `确定删除设备「${label}」？\n${extra}\n删除只清除登记记录，设备下次连接会重新出现在列表中。`,
    '删除设备',
    { type: 'error', confirmButtonText: '删除', cancelButtonText: '取消' },
  )
  await deleteDeviceApi(row.user_id, row.device_id)
  ElMessage.success('设备已删除')
  load()
}

async function onBatchDelete() {
  const items = selected.value.map((d) => ({ user_id: d.user_id, device_id: d.device_id }))
  if (items.length === 0) {
    ElMessage.warning('请先选择设备')
    return
  }
  const enabled = selected.value.filter((d) => !d.disabled).length
  const tip =
    `确定删除选中的 ${items.length} 台设备？\n` +
    (enabled > 0 ? `其中 ${enabled} 台未禁用，删除前会先自动禁用并踢下线。\n` : '') +
    '删除只清除登记记录，设备下次连接会重新出现。'
  await ElMessageBox.confirm(tip, '批量删除设备', {
    type: 'error',
    confirmButtonText: '全部删除',
    cancelButtonText: '取消',
  })
  const { data } = await batchDeleteDevicesApi(items)
  if (data.failed.length === 0) {
    ElMessage.success(`已删除 ${data.success} 台设备`)
  } else {
    ElMessageBox.alert(
      `成功 ${data.success} 台，失败 ${data.failed.length} 台：\n${data.failed
        .map((id) => id.slice(0, 16))
        .join('\n')}`,
      '部分删除失败',
      { type: 'warning' },
    )
  }
  load()
}

onMounted(() => {
  const uid = Number(route.query.user_id)
  if (uid > 0) userFilterId.value = uid
  load(1)
})
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
.cell-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.cell-id {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  word-break: break-all;
  color: var(--el-text-color-regular);
}
.muted {
  color: var(--el-text-color-secondary);
}
</style>
