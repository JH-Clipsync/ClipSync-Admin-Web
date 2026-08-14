import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import './styles/table.css'

import App from './App.vue'
import router from './router'
import { registerDirectives } from './directives/permission'

const app = createApp(App)
for (const [key, comp] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, comp as any)
}
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
registerDirectives(app)
app.mount('#app')
