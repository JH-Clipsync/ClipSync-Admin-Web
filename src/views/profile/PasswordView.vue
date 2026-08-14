<template>
  <el-card class="pw-card">
    <template #header>
      <span>修改密码</span>
    </template>
    <el-form :model="form" label-width="100" style="max-width: 480px">
      <el-form-item label="账号">
        <el-input :model-value="store.admin?.account" disabled />
      </el-form-item>
      <el-form-item label="旧密码" required>
        <el-input v-model="form.oldPassword" show-password placeholder="请输入旧密码" />
      </el-form-item>
      <el-form-item label="新密码" required>
        <el-input v-model="form.newPassword" show-password placeholder="请输入新密码" />
      </el-form-item>
      <el-form-item label="确认新密码" required>
        <el-input v-model="form.confirmPassword" show-password placeholder="请再次输入" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAdminStore } from '@/stores/admin'
import { changeMyPasswordApi } from '@/api/auth'

const store = useAdminStore()
const router = useRouter()
const submitting = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function reset() {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirmPassword = ''
}

async function submit() {
  if (!form.oldPassword) return ElMessage.warning('请输入旧密码')
  if (!form.newPassword) return ElMessage.warning('请输入新密码')
  if (form.newPassword.length < 6) return ElMessage.warning('新密码不少于 6 位')
  if (form.newPassword !== form.confirmPassword) return ElMessage.warning('两次密码不一致')
  if (form.newPassword === form.oldPassword) return ElMessage.warning('新密码不能与旧密码相同')

  submitting.value = true
  try {
    await changeMyPasswordApi(form.oldPassword, form.newPassword)
    await ElMessageBox.alert('密码已修改，请重新登录', '成功', {
      type: 'success',
      confirmButtonText: '去登录',
    })
    store.logoutLocal()
    router.push({ name: 'login' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.pw-card {
  max-width: 640px;
}
</style>
