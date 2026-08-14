<template>
  <div>
    <el-card shadow="never">
      <div class="toolbar">
        <div class="tb-left">
          <el-button v-permission="'rbac:roles:create'" type="success" @click="openCreate">新增角色</el-button>
        </div>
        <div class="tb-right" v-show="selectedRows.length">
          <el-button v-permission="'rbac:roles:update'" @click="batchEnable">启用 ({{ selectedRows.length }})</el-button>
          <el-button v-permission="'rbac:roles:update'" type="warning" @click="batchDisable">禁用 ({{ selectedRows.length }})</el-button>
        </div>
      </div>
      <el-table ref="tableRef" border :data="rows" v-loading="loading" style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" show-overflow-tooltip />
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1" type="danger">超级管理员</el-tag>
            <el-tag v-else type="info">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.status === 0 ? 'success' : 'info'">{{ row.status === 0 ? '启用' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="260">
          <template #default="{ row }">
            <el-button v-permission="'rbac:roles:update'" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'rbac:roles:assign-menu'" size="small" type="primary" @click="openBindMenus(row)">分配菜单</el-button>
            <el-button v-permission="'rbac:roles:delete'" size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dlgVisible" :title="form.id ? '编辑角色' : '新增角色'" width="500">
      <el-form :model="form" label-width="80">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type"><el-option :value="0" label="正常" /><el-option :value="1" label="超级管理员" /></el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status"><el-radio :value="0">启用</el-radio><el-radio :value="1">禁用</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bindVisible" title="分配菜单" width="600">
      <el-tree
        ref="treeRef"
        :data="menuTree"
        node-key="id"
        show-checkbox
        default-expand-all
        :default-checked-keys="checkedMenuIds"
        :props="{ label: (d: any) => d.title || d.name, children: 'children' }"
      />
      <template #footer>
        <el-button @click="bindVisible = false">取消</el-button>
        <el-button type="primary" @click="saveMenus">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listRolesApi, createRoleApi, updateRoleApi, deleteRoleApi,
  listMenusApi, roleMenuIdsApi, assignRoleMenusApi,
  type Role, type Menu,
} from '@/api/rbac'
import { useBatchSelect } from '@/composables/useBatchSelect'

const rows = ref<Role[]>([])
const loading = ref(false)
async function load() {
  loading.value = true
  try {
    const { data } = await listRolesApi()
    rows.value = data
  } finally {
    loading.value = false
  }
}
const { selectedRows, handleSelectionChange, batchEnable, batchDisable, tableRef } = useBatchSelect('roles', rows, () => load())

const dlgVisible = ref(false)
const form = reactive<Partial<Role>>({ id: 0, name: '', type: 0, status: 0, sort: 0, remark: '' })
function openCreate() {
  Object.assign(form, { id: 0, name: '', type: 0, status: 0, sort: 0, remark: '' })
  dlgVisible.value = true
}
function openEdit(row: Role) {
  Object.assign(form, row)
  dlgVisible.value = true
}
async function save() {
  if (!form.name) return ElMessage.warning('请填写名称')
  if (form.id) {
    await updateRoleApi(form.id, form)
    ElMessage.success('已更新')
  } else {
    await createRoleApi(form)
    ElMessage.success('已新增')
  }
  dlgVisible.value = false
  load()
}
async function remove(row: Role) {
  try {
    await ElMessageBox.confirm(`确定删除角色"${row.name}"？此操作不可恢复！`, '确认删除', { type: 'error' })
    await deleteRoleApi(row.id)
    ElMessage.success('已删除')
    load()
  } catch { /* 取消不处理 */ }
}

// bind menus
const bindVisible = ref(false)
const bindRoleId = ref(0)
const menuTree = ref<any[]>([])
const checkedMenuIds = ref<number[]>([])
const treeRef = ref<any>(null)

function buildTree(list: Menu[]): any[] {
  const map = new Map<number, any>()
  const roots: any[] = []
  list.forEach((m) => map.set(m.id, { ...m, children: [] }))
  list.forEach((m) => {
    const node = map.get(m.id)!
    if (m.parentId && map.has(m.parentId)) map.get(m.parentId)!.children.push(node)
    else roots.push(node)
  })
  return roots
}

async function openBindMenus(row: Role) {
  bindRoleId.value = row.id
  const [{ data: menus }, { data: ids }] = await Promise.all([listMenusApi(), roleMenuIdsApi(row.id)])
  menuTree.value = buildTree(menus)
  checkedMenuIds.value = ids || []
  bindVisible.value = true
}
async function saveMenus() {
  const checked = treeRef.value?.getCheckedKeys(true) as number[]
  const half = treeRef.value?.getHalfCheckedKeys() as number[]
  const ids = [...(checked || []), ...(half || [])]
  await assignRoleMenusApi(bindRoleId.value, ids)
  ElMessage.success('已保存')
  bindVisible.value = false
}

onMounted(() => load())
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.tb-left { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.tb-right { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
</style>
