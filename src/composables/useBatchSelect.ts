import { ref, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'

export function useBatchSelect(table: string, rows: Ref<any[]>, onDone: () => void) {
  const selectedRows = ref<any[]>([])
  const tableRef = ref<any>(null)

  function handleSelectionChange(selection: any[]) {
    selectedRows.value = selection
  }

  function selectAll() {
    if (!tableRef.value) return
    if (selectedRows.value.length === rows.value.length && rows.value.length > 0) {
      tableRef.value.clearSelection()
    } else {
      rows.value.forEach((row: any) => tableRef.value?.toggleRowSelection(row, true))
    }
  }

  function invertSelection() {
    if (!tableRef.value) return
    const selectedIds = new Set(selectedRows.value.map((r: any) => r.id))
    rows.value.forEach((row: any) => {
      tableRef.value?.toggleRowSelection(row, !selectedIds.has(row.id))
    })
  }

  async function batchAction(action: string, label: string) {
    const ids = selectedRows.value.map((r: any) => r.id)
    if (ids.length === 0) {
      ElMessage.warning('请先选择记录')
      return
    }
    try {
      await http.post('/batch', { table, action, ids })
      ElMessage.success(`已${label} ${ids.length} 条记录`)
      selectedRows.value = []
      onDone()
    } catch {
      /* http interceptor 已提示 */
    }
  }

  async function batchEnable() {
    const count = selectedRows.value.length
    if (count === 0) { ElMessage.warning('请先选择记录'); return }
    try {
      await ElMessageBox.confirm(`确定批量启用 ${count} 条记录？`, '确认操作', { type: 'info' })
      await batchAction('enable', '启用')
    } catch { /* 取消不处理 */ }
  }

  async function batchDisable() {
    const count = selectedRows.value.length
    if (count === 0) { ElMessage.warning('请先选择记录'); return }
    try {
      await ElMessageBox.confirm(`确定批量禁用 ${count} 条记录？`, '确认操作', { type: 'warning' })
      await batchAction('disable', '禁用')
    } catch { /* 取消不处理 */ }
  }

  async function batchDelete() {
    const count = selectedRows.value.length
    if (count === 0) { ElMessage.warning('请先选择记录'); return }
    try {
      await ElMessageBox.confirm(`确定批量删除 ${count} 条记录？此操作不可恢复！`, '确认删除', { type: 'error' })
      await batchAction('delete', '删除')
    } catch { /* 取消不处理 */ }
  }

  return {
    tableRef,
    selectedRows,
    handleSelectionChange,
    selectAll,
    invertSelection,
    batchEnable,
    batchDisable,
    batchDelete,
  }
}
