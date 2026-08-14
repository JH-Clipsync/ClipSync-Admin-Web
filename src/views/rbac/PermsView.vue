<template>
  <div>
    <el-card shadow="never">
      <div class="toolbar">
        <div class="tb-left">
          <el-input v-model="q.keyword" placeholder="搜索接口名/路由" style="width: 240px" clearable @keyup.enter="load(1)" />
          <el-button type="primary" @click="load(1)">查询</el-button>
          <el-button v-permission="'rbac:perms:create'" type="success" @click="openCreate">新增接口</el-button>
        </div>
        <div class="tb-right" v-show="selectedRows.length">
          <el-button type="success" @click="batchEnable">启用 ({{ selectedRows.length }})</el-button>
          <el-button type="warning" @click="batchDisable">禁用 ({{ selectedRows.length }})</el-button>
        </div>
      </div>
      <el-table ref="tableRef" border :data="rows" v-loading="loading" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" show-overflow-tooltip />
        <el-table-column label="方式" width="100">
          <template #default="{ row }">{{ methodText(row.method) }}</template>
        </el-table-column>
        <el-table-column prop="route" label="路由" min-width="220" show-overflow-tooltip />
        <el-table-column label="拦截" width="90">
          <template #default="{ row }"><el-tag :type="row.isIntercept === 1 ? 'warning' : 'info'">{{ row.isIntercept === 1 ? '是' : '否' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.status === 0 ? 'success' : 'info'">{{ row.status === 0 ? '启用' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" :resizable="false">
          <template #default="{ row }">
            <el-button v-permission="'rbac:perms:update'" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'rbac:perms:delete'" size="small" type="danger" @click="remove(row)">删除</el-button>
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
          @size-change="load(1)"
          @current-change="load()"
        />
      </div>
    </el-card>

    <el-dialog v-model="dlgVisible" :title="form.id ? '编辑权限' : '新增权限'" width="500">
      <el-form :model="form" label-width="100">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="父级ID"><el-input-number v-model="form.parentId" :min="0" /></el-form-item>
        <el-form-item label="请求方式">
          <el-select v-model="form.method">
            <el-option :value="0" label="ANY" />
            <el-option :value="1" label="GET" />
            <el-option :value="2" label="POST" />
            <el-option :value="3" label="PUT" />
            <el-option :value="4" label="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="路由"><el-input v-model="form.route" placeholder="例：/api/admin/rbac/menus" /></el-form-item>
        <el-form-item label="是否拦截"><el-radio-group v-model="form.isIntercept"><el-radio :value="0">否</el-radio><el-radio :value="1">是</el-radio></el-radio-group></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio :value="0">启用</el-radio><el-radio :value="1">禁用</el-radio></el-radio-group></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listPermsApi, createPermApi, updatePermApi, deletePermApi, type Perm } from '@/api/rbac'
import { useBatchSelect } from '@/composables/useBatchSelect'

const rows = ref<Perm[]>([])
const total = ref(0)
const loading = ref(false)
const { selectedRows, handleSelectionChange, batchEnable, batchDisable, tableRef } = useBatchSelect('perms', rows, () => load())
const q = reactive({ keyword: '', page: 1, pageSize: 20 })

const dlgVisible = ref(false)
const form = reactive<Partial<Perm>>({ id: 0, name: '', parentId: 0, method: 2, route: '', isIntercept: 1, status: 0, sort: 0, remark: '' })

function methodText(m: number) {
  return ['ANY', 'GET', 'POST', 'PUT', 'DELETE'][m] || String(m)
}

async function load(p?: number) {
  if (p) q.page = p
  loading.value = true
  try {
    const { data } = await listPermsApi(q)
    rows.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
function openCreate() {
  Object.assign(form, { id: 0, name: '', parentId: 0, method: 2, route: '', isIntercept: 1, status: 0, sort: 0, remark: '' })
  dlgVisible.value = true
}
function openEdit(row: Perm) {
  Object.assign(form, row)
  dlgVisible.value = true
}
async function save() {
  if (!form.route) return ElMessage.warning('请填写路由')
  if (form.id) {
    await updatePermApi(form.id, form)
    ElMessage.success('已更新')
  } else {
    await createPermApi(form)
    ElMessage.success('已新增')
  }
  dlgVisible.value = false
  load()
}
async function remove(row: Perm) {
  try {
    await ElMessageBox.confirm(`确定删除权限"${row.name}"？此操作不可恢复！`, '确认删除', { type: 'error' })
    await deletePermApi(row.id)
    ElMessage.success('已删除')
    load()
  } catch { /* 取消不处理 */ }
}

onMounted(() => load())
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.tb-left { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.tb-right { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.pager { margin-top: 12px; display: flex; justify-content: flex-end; }
</style>
