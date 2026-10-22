<template>
  <div>
    <el-card shadow="never">
      <div class="toolbar">
        <div class="tb-left">
          <el-select
            v-model="filterUserId"
            filterable
            remote
            clearable
            reserve-keyword
            placeholder="按用户过滤（留空=全部）"
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 260px"
            @change="load"
            @clear="load"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.id"
              :label="u.nickname ? `${u.username}（${u.nickname}）` : u.username"
              :value="u.id"
            />
          </el-select>
          <el-button @click="load">刷新</el-button>
        </div>
        <el-button
          v-if="store.hasPerm('biz:apikeys')"
          type="primary"
          @click="openCreate"
        >
          签发 ApiKey
        </el-button>
      </div>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin: 12px 0"
        title="ApiKey 为账户级凭证、不绑定手机号：同一把 Key 可查该用户名下所有接码卡，具体取哪张卡由调用请求的 receiver（接收号码）参数决定。开放接口只返回短信密文，服务端不接触验证码明文，调用方取回后用同步密码自行解密提取验证码。"
      />

      <el-table :data="rows" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="用户" min-width="120">
          <template #default="{ row }">
            <span>{{ row.username || '—' }}</span>
            <span class="muted">（#{{ row.user_id }}）</span>
          </template>
        </el-table-column>
        <el-table-column label="密钥前缀" min-width="160">
          <template #default="{ row }"><code>{{ row.key_prefix }}</code></template>
        </el-table-column>
        <el-table-column prop="name" label="备注" min-width="120">
          <template #default="{ row }">{{ row.name || '—' }}</template>
        </el-table-column>
        <el-table-column label="限定设备" min-width="140">
          <template #default="{ row }">
            <code v-if="row.device_id" class="cell-id">{{ row.device_id }}</code>
            <span v-else class="muted">不限</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="170">
          <template #default="{ row }">
            <el-tag v-if="!row.expires_at" type="success" size="small">无限期</el-tag>
            <span v-else>{{ formatTime(row.expires_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.expired" type="danger" size="small">已过期</el-tag>
            <el-tag v-else-if="row.disabled" type="info" size="small">已禁用</el-tag>
            <el-tag v-else type="success" size="small">有效</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近使用" min-width="160">
          <template #default="{ row }">
            {{ row.last_used_at ? formatTime(row.last_used_at) : '—' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              title="确定吊销该 ApiKey？吊销后立即失效且不可恢复。"
              confirm-button-text="吊销"
              cancel-button-text="取消"
              @confirm="onRevoke(row)"
            >
              <template #reference>
                <el-button
                  v-if="store.hasPerm('biz:apikeys')"
                  link
                  type="danger"
                  size="small"
                >
                  吊销
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 签发弹窗 -->
    <el-dialog v-model="createVisible" title="签发开放接口 ApiKey" width="520px">
      <el-form :model="form" label-width="96px">
        <el-form-item label="用户" required>
          <el-select
            v-model="form.userId"
            filterable
            remote
            reserve-keyword
            placeholder="搜索用户名 / 昵称"
            :remote-method="searchUsers"
            :loading="userLoading"
            style="width: 100%"
          >
            <el-option
              v-for="u in userOptions"
              :key="u.id"
              :label="u.nickname ? `${u.username}（${u.nickname}）` : u.username"
              :value="u.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.name" placeholder="用途，如：自动注册脚本" />
        </el-form-item>
        <el-form-item label="限定设备 ID">
          <el-input v-model="form.deviceId" placeholder="可选，留空=该用户任意设备" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-radio-group v-model="form.expireMode">
            <el-radio value="never">无限期</el-radio>
            <el-radio value="date">指定到期时间</el-radio>
          </el-radio-group>
          <el-date-picker
            v-if="form.expireMode === 'date'"
            v-model="form.expireAt"
            type="datetime"
            placeholder="选择到期时间"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%; margin-top: 8px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onCreate">签发</el-button>
      </template>
    </el-dialog>

    <!-- 明文一次性展示弹窗 -->
    <el-dialog v-model="createdVisible" title="ApiKey 已生成（仅显示一次）" width="560px">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="请立即复制保存。关闭后将无法再次查看完整密钥，只能吊销重签。"
        style="margin-bottom: 12px"
      />
      <el-input v-model="createdKey" type="textarea" :rows="3" readonly />
      <template #footer>
        <el-button @click="copyKey">复制</el-button>
        <el-button type="primary" @click="createdVisible = false">我已保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useAdminStore } from '@/stores/admin'
import {
  listAllApiKeysApi,
  listUserApiKeysApi,
  createApiKeyApi,
  revokeApiKeyApi,
  listUsersApi,
  type ApiKeyVO,
  type CreatedApiKeyVO,
  type User,
} from '@/api/data'

const store = useAdminStore()
const rows = ref<ApiKeyVO[]>([])
const loading = ref(false)
const filterUserId = ref<number | undefined>(undefined)

// 可搜索用户下拉（顶部过滤 + 签发弹窗共用）
const userOptions = ref<User[]>([])
const userLoading = ref(false)
let lastUserQuery = ''
async function searchUsers(query: string) {
  const q = (query || '').trim()
  lastUserQuery = q
  userLoading.value = true
  try {
    const res = await listUsersApi({ keyword: q, page: 1, pageSize: 20 })
    // 落后的响应不覆盖最新结果
    if (q === lastUserQuery) userOptions.value = res.data.list ?? []
  } catch {
    // 静默，下拉保留已有选项
  } finally {
    userLoading.value = false
  }
}

const createVisible = ref(false)
const submitting = ref(false)
const form = reactive({
  userId: undefined as number | undefined,
  name: '',
  deviceId: '',
  expireMode: 'never' as 'never' | 'date',
  expireAt: '' as string | Date,
})

const createdVisible = ref(false)
const createdKey = ref('')

function formatTime(s: string): string {
  if (!s) return '—'
  const d = dayjs(s)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : s
}

async function load() {
  loading.value = true
  try {
    const res = filterUserId.value
      ? await listUserApiKeysApi(filterUserId.value)
      : await listAllApiKeysApi()
    rows.value = res.data.items ?? []
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.userId = undefined
  form.name = ''
  form.deviceId = ''
  form.expireMode = 'never'
  form.expireAt = ''
  // 打开时预载一批用户，避免下拉空白
  if (userOptions.value.length === 0) searchUsers('')
  createVisible.value = true
}

async function onCreate() {
  if (!form.userId || form.userId <= 0) {
    ElMessage.warning('请选择用户')
    return
  }
  let expiresAt = ''
  if (form.expireMode === 'date') {
    if (!form.expireAt) {
      ElMessage.warning('请选择到期时间')
      return
    }
    expiresAt = typeof form.expireAt === 'string' ? form.expireAt : dayjs(form.expireAt).format()
  }
  submitting.value = true
  try {
    const res = await createApiKeyApi(form.userId, {
      name: form.name.trim(),
      device_id: form.deviceId.trim(),
      expires_at: expiresAt,
    })
    const data: CreatedApiKeyVO = res.data
    createdKey.value = data.api_key
    createVisible.value = false
    createdVisible.value = true
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '签发失败')
  } finally {
    submitting.value = false
  }
}

async function copyKey() {
  try {
    await navigator.clipboard.writeText(createdKey.value)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败，请手动选择复制')
  }
}

async function onRevoke(row: ApiKeyVO) {
  try {
    await revokeApiKeyApi(row.id)
    ElMessage.success('已吊销')
    await load()
  } catch (e: any) {
    ElMessage.error(e?.message || '吊销失败')
  }
}

onMounted(() => {
  searchUsers('')
  load()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.tb-left {
  display: flex;
  gap: 8px;
  align-items: center;
}
.muted {
  color: var(--el-text-color-secondary);
}
.cell-id {
  font-size: 12px;
  word-break: break-all;
}
</style>
