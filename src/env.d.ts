/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  /** 登录前签名密钥，与后端 config.yaml 的 security.sign_static_secret 一致 */
  readonly VITE_SIGN_STATIC_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
