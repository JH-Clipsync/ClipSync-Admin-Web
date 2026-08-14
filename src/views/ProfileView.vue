<template>
  <el-card class="profile-card">
    <template #header>
      <span>个人中心</span>
    </template>
    <el-form :model="form" label-width="100" style="max-width: 480px">
      <el-form-item label="账号">
        <el-input v-model="form.account" disabled />
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" disabled placeholder="—" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveProfile">保存资料</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { updateProfileApi } from '@/api/auth'
import { useAdminStore } from '@/stores/admin'

const store = useAdminStore()

const form = reactive({
  account: store.admin?.account || '',
  name: store.admin?.name || '',
  avatar: store.admin?.avatar || '',
  remark: store.admin?.remark || '',
})

async function saveProfile() {
  if (!form.name) return ElMessage.warning('请填写姓名')
  await updateProfileApi(form.name, form.avatar)
  ElMessage.success('资料已更新')
  // 更新本地 store
  if (store.admin) {
    store.admin.name = form.name
  }
}
</script>

<style scoped>
.profile-card {
  max-width: 640px;
}
</style>
