<template>
  <div class="login-wrap">
    <el-card class="login-card">
      <div class="title">ClipSync 管理后台</div>
      <el-form :model="form" @submit.prevent="submit" size="large">
        <el-form-item>
          <el-input v-model="form.account" placeholder="账号" clearable prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" placeholder="密码" show-password type="password" prefix-icon="Lock" @keyup.enter="submit" />
        </el-form-item>
        <el-button type="primary" :loading="loading" style="width: 100%" @click="submit">登录</el-button>
      </el-form>
      <div class="hint">默认超级管理员：admin / Admin**8</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAdminStore } from '@/stores/admin'

const form = reactive({ account: 'admin', password: '' })
const loading = ref(false)
const router = useRouter()
const route = useRoute()
const store = useAdminStore()

async function submit() {
  if (!form.account || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await store.login(form.account, form.password)
    await store.fetchMe()
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (e) {
    // http interceptor already toasted
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f2c4e 0%, #14487d 100%);
}
.login-card {
  width: 360px;
  padding: 8px;
}
.title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 8px 0 24px;
}
.hint {
  margin-top: 16px;
  color: #909399;
  font-size: 12px;
  text-align: center;
}
</style>
