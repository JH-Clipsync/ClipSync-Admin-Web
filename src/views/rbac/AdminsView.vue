<template>
  <div>
    <el-card shadow="never">
      <div class="toolbar">
        <div class="tb-left">
          <el-input v-model="q.keyword" placeholder="搜索账号/姓名" style="width: 240px" clearable @keyup.enter="load(1)" />
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button v-permission="'rbac:admins:create'" type="success" @click="openCreate">新增管理员</el-button>
        </div>
        <div class="tb-right" v-show="selectedRows.length">
          <el-button type="success" @click="batchEnable">启用 ({{ selectedRows.length }})</el-button>
          <el-button type="warning" @click="batchDisable">禁用 ({{ selectedRows.length }})</el-button>
        </div>
      </div>
      <el-table ref="tableRef" border :data="rows" v-loading="loading" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar || ''" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;">{{ row.name?.charAt(0) || row.account?.charAt(0) }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="account" label="账号" show-overflow-tooltip />
        <el-table-column prop="name" label="姓名" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="0"
              :inactive-value="1"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="锁定" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isLock === 0 ? 'success' : 'danger'">{{ row.isLock === 0 ? '否' : '是' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="170">
          <template #default="{ row }">{{ formatTime(row.lastLoginTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" :resizable="false">
          <template #default="{ row }">
            <el-button v-permission="'rbac:admins:update'" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'rbac:admins:reset-pass'" size="small" @click="openReset(row)">重置密码</el-button>
            <template v-if="isBuiltinSuper(row)">
              <el-tooltip content="内置超级管理员不可删除" placement="top">
                <el-button size="small" type="danger" disabled>删除</el-button>
              </el-tooltip>
            </template>
            <el-button v-else v-permission="'rbac:admins:delete'" size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          v-model:current-page="q.page"
          v-model:page-size="q.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="load(1)"
          @current-change="load()"
        />
      </div>
    </el-card>

    <el-dialog v-model="dlgVisible" :title="form.id ? '编辑管理员' : '新增管理员'" width="520">
      <el-form :model="form" label-width="90">
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :action="uploadAction"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="onAvatarSuccess"
          >
            <el-avatar v-if="form.avatar" :size="64" :src="form.avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="账号"><el-input v-model="form.account" :disabled="!!form.id" /></el-form-item>
        <el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item>
        <el-form-item v-if="!form.id" label="密码"><el-input v-model="form.password" show-password /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status"><el-radio :value="0">正常</el-radio><el-radio :value="1">禁用</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="锁定">
          <el-radio-group v-model="form.isLock"><el-radio :value="0">否</el-radio><el-radio :value="1">是</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="选择角色" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetVisible" title="重置密码" width="400">
      <el-input v-model="newPassword" show-password placeholder="新密码" />
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" @click="doReset">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  listAdminsApi, createAdminApi, updateAdminApi, deleteAdminApi, resetAdminPasswordApi, updateAdminStatusApi,
  adminRoleIdsApi, listRolesApi, type Role,
} from '@/api/rbac'
import type { Admin } from '@/api/auth'
import { useBatchSelect } from '@/composables/useBatchSelect'
import { useAdminStore } from '@/stores/admin'
import { formatTime } from '@/utils/format'

const store = useAdminStore()
const uploadHeaders = { Authorization: `Bearer ${store.token}` }
const uploadAction = (import.meta.env.VITE_API_BASE || '/clipsync/admin/api') + '/upload/image'
function onAvatarSuccess(res: any) {
  if (res.code === 1200 && res.data?.url) {
    form.avatar = res.data.url
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

// 判断是否内置超级管理员（不允许删除）
function isBuiltinSuper(row: Admin): boolean {
  return !!store.builtinSuperAccount && row.account === store.builtinSuperAccount
}

const rows = ref<Admin[]>([])
const total = ref(0)
const loading = ref(false)
const { selectedRows, handleSelectionChange, batchEnable, batchDisable, tableRef } = useBatchSelect('admins', rows, () => load())
const q = reactive({ keyword: '', page: 1, pageSize: 20 })

const roles = ref<Role[]>([])
const dlgVisible = ref(false)
const form = reactive<any>({ id: 0, account: '', name: '', avatar: '', password: '', status: 0, isLock: 0, remark: '', roleIds: [] as number[] })

const resetVisible = ref(false)
const resetTargetId = ref(0)
const newPassword = ref('')

async function load(p?: number) {
  if (p) q.page = p
  loading.value = true
  try {
    const { data } = await listAdminsApi(q)
    rows.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function openCreate() {
  Object.assign(form, { id: 0, account: '', name: '', avatar: '', password: '', status: 0, isLock: 0, remark: '', roleIds: [] })
  dlgVisible.value = true
}
async function openEdit(row: Admin) {
  Object.assign(form, row, { password: '', roleIds: [] })
  const { data } = await adminRoleIdsApi(row.id)
  form.roleIds = data || []
  dlgVisible.value = true
}
async function save() {
  if (!form.account) return ElMessage.warning('请填写账号')
  if (!form.id && !form.password) return ElMessage.warning('请填写密码')
  if (form.id) {
    await updateAdminApi(form.id, form)
    ElMessage.success('已更新')
  } else {
    await createAdminApi(form)
    ElMessage.success('已新增')
  }
  dlgVisible.value = false
  load()
}

function openReset(row: Admin) {
  resetTargetId.value = row.id
  newPassword.value = ''
  resetVisible.value = true
}
async function doReset() {
  if (!newPassword.value) return ElMessage.warning('请输入新密码')
  await resetAdminPasswordApi(resetTargetId.value, newPassword.value)
  ElMessage.success('已重置')
  resetVisible.value = false
}
async function toggleStatus(row: Admin) {
  if (isBuiltinSuper(row)) {
    ElMessage.warning('内置超级管理员状态不可变更')
    row.status = 0
    return
  }
  await updateAdminStatusApi(row.id, row.status)
  ElMessage.success('已更新')
}
async function remove(row: Admin) {
  try {
    await ElMessageBox.confirm(`确定删除管理员"${row.name}"？此操作不可恢复！`, '确认删除', { type: 'error' })
    await deleteAdminApi(row.id)
    ElMessage.success('已删除')
    load()
  } catch { /* 取消不处理 */ }
}

async function loadRoles() {
  const { data } = await listRolesApi()
  roles.value = data
}
onMounted(async () => {
  await loadRoles()
  await load()
})
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.tb-left { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.tb-right { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.pager { margin-top: 12px; display: flex; justify-content: flex-end; }
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}
.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 64px;
  height: 64px;
  text-align: center;
  line-height: 64px;
}
</style>
