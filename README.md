<h1 align="center">ClipSync Admin Web</h1>

<p align="center">
  <b>ClipSync 管理后台前端 —— 用户、设备、角色权限，一站搞定。</b><br/>
  <a href="README.md">简体中文</a> ·
  <a href="README.en.md">English</a> ·
  <a href="README.ja.md">日本語</a>
</p>

---

ClipSync Admin Web 是 [ClipSync](https://github.com/JH-Clipsync/ClipSync-Server) 自建剪贴板同步系统的**管理后台前端**，基于 **Vue 3 + TypeScript + Vite + Element Plus + Pinia** 开发，构建产物为纯静态文件，由 Nginx 托管在 `/clipsync/admin/` 子路径下。

它与 [ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) 后端配合，负责账号体系、设备管理、RBAC 权限、操作审计等管理能力。

---

## ✨ 核心功能

| 模块 | 说明 |
|------|------|
| 🔐 **管理员登录** | 账号密码登录，JWT Bearer Token 鉴权，接口签名防重放 |
| 📊 **仪表盘概览** | 用户总数、活跃用户、管理员数、角色数等关键指标一目了然 |
| 👤 **用户管理** | 用户列表 / 详情 / 新建 / 编辑 / 启用禁用 / 重置密码 / 删除 |
| 📱 **设备管理** | 查看账号下所有设备、在线状态、最后登录 IP；支持禁用、重命名、踢下线 |
| 🛡️ **RBAC 权限** | 管理员、角色、菜单、接口权限四维管理；按钮级权限指令 `v-permission` |
| 🧑‍💼 **管理员管理** | 管理员账号增删改查、分配角色、重置密码、锁定/解锁 |
| 🎛️ **菜单管理** | 动态菜单树，支持目录 / 菜单 / 按钮三种节点类型，字段级列控制 |
| 🚦 **接口权限** | 后端路由拦截规则配置，按 HTTP 方法 + 路径匹配 |
| ⚙️ **个人中心** | 修改资料、头像、密码；登录态自动续期 |
| 🔄 **Token 无感刷新** | 响应头 `x-refresh-token` 自动续签，接近过期自动替换本地 Token |

---

## 🧱 技术栈

- **Vue 3.5**（`<script setup>` + Composition API）
- **TypeScript 5.6**
- **Vite 5.4**（开发服务器 + 构建）
- **Vue Router 4.4**（History 模式，base = `/clipsync/admin/`）
- **Pinia 2.2**（状态管理）
- **Element Plus 2.8** + `@element-plus/icons-vue`
- **Axios 1.7**（HTTP 客户端，统一拦截签名 / 错误 / 鉴权）
- **crypto-js 4.2**（HMAC-SHA256 接口签名）

---

## 📁 目录结构

```
ClipSync-Admin-Web/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/                      # 接口封装
│   │   ├── http.ts               # axios 实例 + 签名/鉴权/错误拦截
│   │   ├── auth.ts               # 登录 / 登出 / 当前管理员 / 修改密码
│   │   ├── data.ts               # 仪表盘、用户、设备等业务接口
│   │   └── rbac.ts               # 管理员/角色/菜单/权限接口
│   ├── composables/
│   │   └── useBatchSelect.ts     # 表格批量选择 hook
│   ├── directives/
│   │   └── permission.ts         # v-permission 按钮级权限指令
│   ├── layout/
│   │   └── AdminLayout.vue       # 侧边栏 + 顶栏 + 内容区主框架
│   ├── router/
│   │   └── index.ts              # 路由表 + 登录守卫
│   ├── stores/
│   │   └── admin.ts              # 管理员 / Token / 权限 / 菜单状态
│   ├── styles/
│   │   └── table.css             # 全局表格样式
│   ├── utils/
│   │   ├── format.ts             # 时间 / 字段格式化
│   │   └── sign.ts               # 签名、nonce、query 排序
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── DashboardView.vue
│   │   ├── UsersView.vue
│   │   ├── DevicesView.vue
│   │   ├── ProfileView.vue
│   │   ├── profile/
│   │   │   └── PasswordView.vue
│   │   └── rbac/
│   │       ├── AdminsView.vue
│   │       ├── RolesView.vue
│   │       ├── MenusView.vue
│   │       └── PermsView.vue
│   ├── App.vue
│   ├── main.ts
│   └── env.d.ts
├── .github/workflows/docker-image.yml   # CI：构建静态文件 + scp 部署
├── Dockerfile                           # 可选：用 Nginx 镜像打包
├── nginx.conf
├── docker-entrypoint.sh
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 快速开始

### 环境要求

- **Node.js 18+**（推荐 20.x，CI 使用 Node 20）
- **npm 9+**（随 Node 附带）
- 可访问的 [ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) 后端（默认本地端口 `28002`）

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（默认 http://localhost:5175/clipsync/admin/）
npm run dev
```

开发服务器已在 [vite.config.ts](vite.config.ts) 中配置代理：

| 前端请求 | 代理目标 |
|----------|----------|
| `/clipsync/admin/api/*` | `http://localhost:28002/api/admin/*` |
| `/clipsync/admin/static/*` | `http://localhost:28002/static/*` |

因此**本地开发无需关心跨域**，只要后端启动在 `28002` 端口即可。

### 构建生产产物

```bash
npm run build
```

- 先执行 `vue-tsc --noEmit` 做类型检查
- 再用 Vite 打包，产物输出到 `dist/`
- 所有静态资源路径以 `/clipsync/admin/` 为前缀，**必须**部署在该子路径下

### 本地预览构建产物

```bash
npm run preview
```

---

## 🌐 部署说明

### 子路径约定

整个应用固定挂载在 **`/clipsync/admin/`** 下：

- Vite `base = '/clipsync/admin/'`
- Vue Router `createWebHistory(import.meta.env.BASE_URL)`
- Axios `baseURL = '/clipsync/admin/api'`

因此生产环境需要 Nginx（或其他反向代理）做两件事：

1. 把 `/clipsync/admin/` 的静态请求指向 `dist/` 目录
2. 把 `/clipsync/admin/api/` 反代到 ClipSync-Admin 后端，并将路径重写为 `/api/admin/`

仓库根目录的 [nginx.conf](nginx.conf) 提供了一份可直接参考的配置。

### 用 Docker 镜像（可选）

仓库提供了 [Dockerfile](Dockerfile) 和 [docker-entrypoint.sh](docker-entrypoint.sh)，基于 Nginx 官方镜像，启动时会把 `dist/` 拷贝到 Nginx web 目录。

### CI/CD

[.github/workflows/docker-image.yml](.github/workflows/docker-image.yml) 定义了自动化流程：

- **push 到 `main`**：执行 `npm ci && npm run build` 验证能否通过
- **push `v*` tag**：构建静态文件 → 打包成 `dist.tar.gz` → 通过 `scp` 上传到服务器 → SSH 解压到 `/app/ClipSync/admin/web`，并自动备份上一版为 `.bak`

需要在 GitHub 仓库 Secrets 中配置：

| Secret | 说明 |
|--------|------|
| `DEPLOY_SSH_HOST` | 部署服务器地址 |
| `DEPLOY_SSH_USER` | SSH 用户名 |
| `DEPLOY_SSH_KEY` | SSH 私钥 |
| `DEPLOY_SSH_PORT` | SSH 端口（可选，默认 22） |
| `DEPLOY_ADMIN_DIR` | 后端目录（可选，前端固定部署到 `/app/ClipSync/admin/web`） |

---

## 🔐 接口签名

所有请求（包括登录）都会被自动加上以下请求头：

| Header | 说明 |
|--------|------|
| `Authorization` | `Bearer <token>`（登录后） |
| `X-Timestamp` | 毫秒时间戳 |
| `X-Nonce` | 随机串，防重放 |
| `X-Signature` | `HMAC-SHA256(secret, method + path + query + timestamp + nonce + body)` |

- 登录前使用**静态密钥**（由 `VITE_SIGN_STATIC_SECRET` 注入）
- 登录成功后，后端返回动态 `signSecret`，保存在 `sessionStorage`，关闭标签页即失效
- 相关实现见 [src/utils/sign.ts](src/utils/sign.ts) 与 [src/api/http.ts](src/api/http.ts)

---

## 🧩 相关项目

| 项目 | 技术栈 | 链接 |
|------|--------|------|
| 管理后端 | Go + Gin + GORM | [JH-Clipsync/ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) |
| 同步服务端 | Go + gorilla/websocket | [JH-Clipsync/ClipSync-Server](https://github.com/JH-Clipsync/ClipSync-Server) |
| Windows 客户端 | .NET 8 + WPF | [JH-Clipsync/ClipSync-Windows](https://github.com/JH-Clipsync/ClipSync-Windows) |
| macOS 客户端 | Swift + SwiftUI | [JH-Clipsync/ClipSync-Mac](https://github.com/JH-Clipsync/ClipSync-Mac) |
| Android 客户端 | Kotlin + OkHttp | [JH-Clipsync/ClipSync-Android](https://github.com/JH-Clipsync/ClipSync-Android) |

---

## 📄 License

个人自用项目，代码可自由参考修改。

---

**Made with ❤️ · 后台自托管 · 数据全在你手里**
