import type { App, Directive } from 'vue'
import { useAdminStore } from '@/stores/admin'

// v-permission="'biz:users:update'"  或  v-permission="['a','b']"
// 缺失权限时移除该 DOM。
const permission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const codes = binding.value
    if (!codes) return
    const store = useAdminStore()
    if (!store.hasPerm(codes)) {
      el.parentNode?.removeChild(el)
    }
  },
}

export function registerDirectives(app: App) {
  app.directive('permission', permission)
}
