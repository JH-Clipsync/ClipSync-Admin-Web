<template>
  <div>
    <el-card shadow="never">
      <div class="toolbar">
        <div class="tb-left">
          <el-button v-permission="'rbac:menus:create'" type="success" @click="openCreate">新增菜单</el-button>
        </div>
        <div class="tb-right" v-show="selectedRows.length">
          <el-button type="success" @click="batchEnable">启用 ({{ selectedRows.length }})</el-button>
          <el-button type="warning" @click="batchDisable">禁用 ({{ selectedRows.length }})</el-button>
        </div>
      </div>
      <el-table
        border
        :data="tree"
        v-loading="loading"
        row-key="id"
        style="width: 100%"
        :tree-props="{ children: 'children', hasChildren: false }"
        :indent="40"
        ref="tableRef"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="name" label="路由 name" width="160" show-overflow-tooltip />
        <el-table-column prop="path" label="路径" min-width="160" show-overflow-tooltip />
        <el-table-column label="菜单类型" width="100">
          <template #default="{ row }">{{ typeText(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag :type="row.status === 0 ? 'success' : 'info'">{{ row.status === 0 ? '启用' : '禁用' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="操作" width="320">
          <template #default="{ row }">
            <el-button v-permission="'rbac:menus:create'" size="small" @click="openAddChild(row)">添加子项</el-button>
            <el-button v-permission="'rbac:menus:update'" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-permission="'rbac:menus:assign-perm'" size="small" type="primary" @click="openBindPerms(row)">绑权限</el-button>
            <el-button v-permission="'rbac:menus:delete'" size="small" type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dlgVisible" :title="dialogTitle" width="600">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120">
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择菜单类型">
            <el-option :value="1" label="顶部菜单" />
            <el-option :value="2" label="左侧菜单" />
            <el-option :value="3" label="操作按钮" />
            <el-option :value="4" label="数据按钮" />
            <el-option :value="5" label="数据表列" />
            <el-option :value="6" label="详情" />
            <el-option :value="7" label="其他" />
          </el-select>
        </el-form-item>

        <!-- 行内"添加子项"时：父级已锁定，隐藏"是否顶级"和"父级"字段，展示只读父级 -->
        <template v-if="mode === 'child'">
          <el-form-item label="父级菜单">
            <el-input :model-value="lockedParentTitle" disabled />
          </el-form-item>
        </template>

        <!-- 顶栏"新增"或"编辑"时：允许选顶级 / 选父级 -->
        <template v-else>
          <el-form-item label="是否顶级菜单">
            <el-radio-group v-model="isTopLevel" @change="onToggleTopLevel">
              <el-radio :value="true">是</el-radio>
              <el-radio :value="false">否</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="!isTopLevel" label="父级" prop="parentId">
            <el-tree-select
              v-model="form.parentId"
              :data="parentOptions"
              node-key="id"
              :props="{ label: 'title', children: 'children' }"
              :render-after-expand="false"
              check-strictly
              default-expand-all
              placeholder="请选择父级菜单"
              filterable
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <el-form-item label="标题" prop="title"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="路由 name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="路径"><el-input v-model="form.path" /></el-form-item>
        <el-form-item label="组件"><el-input v-model="form.include" /></el-form-item>
        <el-form-item label="图标"><el-input v-model="form.icon" /></el-form-item>
        <el-form-item label="外链"><el-radio-group v-model="form.isLink"><el-radio :value="0">否</el-radio><el-radio :value="1">是</el-radio></el-radio-group></el-form-item>
        <el-form-item label="唯一 code"><el-input v-model="form.code" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio :value="0">启用</el-radio><el-radio :value="1">禁用</el-radio></el-radio-group></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bindVisible" title="绑定接口权限" width="600">
      <el-transfer
        v-model="checkedPerms"
        :data="permOptions"
        filterable
        :titles="['未绑定', '已绑定']"
      />
      <template #footer>
        <el-button @click="bindVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBinds">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  listMenusApi, createMenuApi, updateMenuApi, deleteMenuApi,
  listPermsApi, assignMenuPermsApi,
  type Menu, type Perm,
} from '@/api/rbac'
import { useBatchSelect } from '@/composables/useBatchSelect'

const rows = ref<Menu[]>([])
const loading = ref(false)
const { selectedRows, handleSelectionChange, batchEnable, batchDisable, tableRef } = useBatchSelect('menus', rows, () => load())

interface TreeNode extends Menu {
  children: TreeNode[]
}

function buildTree(list: Menu[]): TreeNode[] {
  const map = new Map<number, TreeNode>()
  const roots: TreeNode[] = []
  list.forEach((m) => map.set(m.id, { ...m, children: [] }))
  list.forEach((m) => {
    const node = map.get(m.id)!
    if (m.parentId && map.has(m.parentId)) map.get(m.parentId)!.children.push(node)
    else roots.push(node)
  })
  // 每一层按 sort 升序，与后端 sort 语义保持一致
  function sortChildren(nodes: TreeNode[]) {
    nodes.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    nodes.forEach((n) => sortChildren(n.children))
  }
  sortChildren(roots)
  return roots
}

const tree = ref<TreeNode[]>([])

function typeText(t: number) {
  return ['', '顶部菜单', '左侧菜单', '操作按钮', '数据按钮', '数据表列', '详情', '其他'][t] || String(t)
}

async function load() {
  loading.value = true
  try {
    const { data } = await listMenusApi()
    rows.value = data
    tree.value = buildTree(data)
  } finally {
    loading.value = false
  }
}

/** —— 表单 —— **/
type DialogMode = 'root' | 'child' | 'edit'
const mode = ref<DialogMode>('root')
const dlgVisible = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<Partial<Menu>>({})
const isTopLevel = ref(true)
const lockedParentTitle = ref('')

const dialogTitle = computed(() => {
  if (mode.value === 'edit') return '编辑菜单'
  if (mode.value === 'child') return '添加子菜单'
  return '新增菜单'
})

const parentOptions = computed<TreeNode[]>(() => {
  if (!form.id) return tree.value
  return excludeSubtree(tree.value, form.id)
})

function excludeSubtree(nodes: TreeNode[], excludeId: number): TreeNode[] {
  const out: TreeNode[] = []
  for (const n of nodes) {
    if (n.id === excludeId) continue
    out.push({ ...n, children: excludeSubtree(n.children, excludeId) })
  }
  return out
}

const rules: FormRules = {
  type: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  title: [{ required: true, message: '请填写标题', trigger: 'blur' }],
  parentId: [
    {
      validator: (_r, v, cb) => {
        if (mode.value === 'root' && !isTopLevel.value && (!v || v === 0)) {
          cb(new Error('请选择父级菜单'))
        } else {
          cb()
        }
      },
      trigger: 'change',
    },
  ],
}

function onToggleTopLevel(val: string | number | boolean | undefined) {
  if (val === true) {
    form.parentId = 0
  }
}

function resetForm(parentId: number) {
  Object.assign(form, {
    id: 0, parentId, name: '', title: '', path: '', include: '',
    icon: '', code: '', type: 2, isLink: 0, sort: 0, status: 0, remark: '',
  })
}

// 顶栏"新增菜单"：默认顶级，用户可切换
function openCreate() {
  mode.value = 'root'
  resetForm(0)
  isTopLevel.value = true
  lockedParentTitle.value = ''
  dlgVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

// 行内"添加子项"：父级锁定为当前行
function openAddChild(row: Menu) {
  mode.value = 'child'
  resetForm(row.id)
  isTopLevel.value = false
  lockedParentTitle.value = row.title || '(未命名)'
  dlgVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

function openEdit(row: Menu) {
  mode.value = 'edit'
  Object.assign(form, row)
  isTopLevel.value = !row.parentId || row.parentId === 0
  lockedParentTitle.value = ''
  dlgVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

async function save() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  let payload: Partial<Menu> = { ...form }
  if (mode.value === 'root') {
    payload.parentId = isTopLevel.value ? 0 : form.parentId
  }
  // mode === 'child'：parentId 已在 resetForm 里设好
  if (mode.value === 'edit') {
    payload.parentId = isTopLevel.value ? 0 : form.parentId
  }

  // 新增时给 sort 一个合理默认值：兄弟组末尾 + 1000
  if (!form.id) {
    const siblings = rows.value.filter((m) => (m.parentId || 0) === (payload.parentId || 0))
    const maxSort = siblings.reduce((mx, s) => Math.max(mx, s.sort ?? 0), 0)
    payload.sort = maxSort + 1000
  }

  if (form.id) {
    await updateMenuApi(form.id, payload)
    ElMessage.success('已更新')
  } else {
    await createMenuApi(payload)
    ElMessage.success('已新增')
  }
  dlgVisible.value = false
  load()
}

async function remove(row: Menu) {
  try {
    await ElMessageBox.confirm(`确定删除菜单"${row.title}"？此操作不可恢复！`, '确认删除', { type: 'error' })
    await deleteMenuApi(row.id)
    ElMessage.success('已删除')
    load()
  } catch { /* 取消不处理 */ }
}

/** —— 权限绑定 —— **/
const bindVisible = ref(false)
const bindMenuId = ref(0)
const permOptions = ref<{ key: number; label: string }[]>([])
const checkedPerms = ref<number[]>([])
async function openBindPerms(row: Menu) {
  bindMenuId.value = row.id
  const { data } = await listPermsApi({ pageSize: 500 })
  permOptions.value = (data.list as Perm[]).map((p) => {
    const method = ['ANY', 'GET', 'POST', 'PUT', 'DELETE'][p.method] || String(p.method)
    const desc = p.name || '(未命名接口)'
    return { key: p.id, label: `${desc}（${method} ${p.route}）` }
  })
  checkedPerms.value = []
  bindVisible.value = true
}
async function saveBinds() {
  await assignMenuPermsApi(bindMenuId.value, checkedPerms.value)
  ElMessage.success('已保存')
  bindVisible.value = false
}

onMounted(() => load())
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.tb-left { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.tb-right { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }

/* —— 层级视觉区分 —— */
:deep(tr.el-table__row--level-0) > td.el-table__cell { background-color: #ffffff !important; }
:deep(tr.el-table__row--level-1) > td.el-table__cell { background-color: #f0f7ff !important; }
:deep(tr.el-table__row--level-2) > td.el-table__cell { background-color: #dfeeff !important; }
:deep(tr.el-table__row--level-3) > td.el-table__cell { background-color: #cde4ff !important; }
:deep(tr.el-table__row--level-4) > td.el-table__cell { background-color: #b8d6f5 !important; }

:deep(tr.el-table__row--level-0:hover > td.el-table__cell) { background-color: #f5f7fa !important; }
:deep(tr.el-table__row--level-1:hover > td.el-table__cell) { background-color: #e6f0fb !important; }
:deep(tr.el-table__row--level-2:hover > td.el-table__cell) { background-color: #d1e5fa !important; }
:deep(tr.el-table__row--level-3:hover > td.el-table__cell) { background-color: #bfdcf7 !important; }
:deep(tr.el-table__row--level-4:hover > td.el-table__cell) { background-color: #a8ccef !important; }
</style>
