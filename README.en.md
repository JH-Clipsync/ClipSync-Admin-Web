<h1 align="center">ClipSync Admin Web</h1>

<p align="center">
  <b>ClipSync Admin Frontend — Users, devices, roles & permissions, all in one place.</b><br/>
  <a href="README.md">简体中文</a> ·
  <a href="README.en.md">English</a> ·
  <a href="README.ja.md">日本語</a>
</p>

---

ClipSync Admin Web is the **admin frontend** for the self-hosted clipboard sync system [ClipSync](https://github.com/JH-Clipsync/ClipSync-Server). It is built with **Vue 3 + TypeScript + Vite + Element Plus + Pinia**. The build output consists of pure static files, served by Nginx under the `/clipsync/admin/` sub-path.

It works together with the [ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) backend to provide account management, device management, RBAC permissions, operation auditing, and more.

---

## ✨ Core Features

| Module | Description |
|--------|-------------|
| 🔐 **Admin Login** | Account + password login, JWT Bearer Token authentication, request signing to prevent replay attacks |
| 📊 **Dashboard Overview** | Key metrics at a glance: total users, active users, admin count, role count, etc. |
| 👤 **User Management** | User list / detail / create / edit / enable-disable / reset password / delete |
| 📱 **Device Management** | View all devices under an account, online status, last IP; supports disabling, renaming, and force logout |
| 🛡️ **RBAC Permissions** | Four-dimensional management of admins, roles, menus, and API permissions; button-level permission directive `v-permission` |
| 🧑‍💼 **Admin Management** | CRUD for admin accounts, role assignment, password reset, lock/unlock |
| 🎛️ **Menu Management** | Dynamic menu tree supporting three types: directory / menu / button, with field-level column control |
| 🚦 **API Permissions** | Backend route interception rules, matched by HTTP method + path |
| ⚙️ **Profile Center** | Edit profile, avatar, password; automatic session renewal |
| 🔄 **Silent Token Refresh** | Auto-renewal via the `x-refresh-token` response header; local Token is replaced automatically before it expires |

---

## 🧱 Tech Stack

- **Vue 3** (`<script setup>` + Composition API)
- **TypeScript 5**
- **Vite 5** (dev server + build)
- **Vue Router 4** (History mode, base = `/clipsync/admin/`)
- **Pinia 2** (state management)
- **Element Plus 2** + `@element-plus/icons-vue`
- **Axios** (HTTP client with unified interception for signing / errors / auth)
- **crypto-js** (HMAC-SHA256 request signing)

---

## 📁 Project Structure

```
ClipSync-Admin-Web/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/                      # API wrappers
│   │   ├── http.ts               # axios instance + signing/auth/error interceptors
│   │   ├── auth.ts               # login / logout / current admin / change password
│   │   ├── data.ts               # dashboard, user, device, and other business APIs
│   │   └── rbac.ts               # admin/role/menu/permission APIs
│   ├── composables/
│   │   └── useBatchSelect.ts     # table batch-selection hook
│   ├── directives/
│   │   └── permission.ts         # v-permission button-level directive
│   ├── layout/
│   │   └── AdminLayout.vue       # main layout: sidebar + topbar + content area
│   ├── router/
│   │   └── index.ts              # route table + login guard
│   ├── stores/
│   │   └── admin.ts              # admin / Token / permission / menu state
│   ├── styles/
│   │   └── table.css             # global table styles
│   ├── utils/
│   │   ├── format.ts             # time / field formatting
│   │   └── sign.ts               # signing, nonce, query sorting
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
├── .github/workflows/docker-image.yml   # CI: build static files + scp deploy
├── Dockerfile                           # Optional: package with Nginx image
├── nginx.conf
├── docker-entrypoint.sh
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Quick Start

### Requirements

- **Node.js 18+** (20.x recommended; CI uses Node 20)
- **npm 9+** (bundled with Node)
- A reachable [ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) backend (default local port `28082`)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (default http://localhost:5175/clipsync/admin/)
npm run dev
```

The dev server is configured with proxies in [vite.config.ts](vite.config.ts):

| Frontend request | Proxy target |
|------------------|--------------|
| `/clipsync/admin/api/*` | `http://localhost:28082/api/admin/*` |
| `/clipsync/admin/static/*` | `http://localhost:28082/static/*` |

Therefore **no CORS setup is needed for local development**, as long as the backend is running on port `28082`.

### Build for Production

```bash
npm run build
```

- First runs `vue-tsc --noEmit` for type checking
- Then builds with Vite; output goes to `dist/`
- All static asset paths are prefixed with `/clipsync/admin/`, so the app **must** be deployed under that sub-path

### Preview the Production Build Locally

```bash
npm run preview
```

---

## 🌐 Deployment

### Sub-path Convention

The entire application is fixed to mount under **`/clipsync/admin/`**:

- Vite `base = '/clipsync/admin/'`
- Vue Router `createWebHistory(import.meta.env.BASE_URL)`
- Axios `baseURL = '/clipsync/admin/api'`

In production, Nginx (or another reverse proxy) needs to do two things:

1. Serve static requests under `/clipsync/admin/` from the `dist/` directory
2. Reverse-proxy `/clipsync/admin/api/` to the ClipSync-Admin backend, rewriting the path to `/api/admin/`

The [nginx.conf](nginx.conf) in the repo root provides a ready-to-use reference configuration.

### Docker Image (Optional)

The repo provides a [Dockerfile](Dockerfile) and [docker-entrypoint.sh](docker-entrypoint.sh), based on the official Nginx image. On startup it copies `dist/` into the Nginx web directory.

### CI/CD

[.github/workflows/docker-image.yml](.github/workflows/docker-image.yml) defines the automated pipeline:

- **push to `main`**: runs `npm ci && npm run build` to verify the build
- **push `v*` tag**: builds static files → packages them into `dist.tar.gz` → uploads to the server via `scp` → extracts over SSH to `/app/ClipSync/admin/web`, automatically backing up the previous version as `.bak`

The following must be configured in the GitHub repository Secrets:

| Secret | Description |
|--------|-------------|
| `DEPLOY_SSH_HOST` | Deployment server address |
| `DEPLOY_SSH_USER` | SSH username |
| `DEPLOY_SSH_KEY` | SSH private key |
| `DEPLOY_SSH_PORT` | SSH port (optional, default 22) |
| `DEPLOY_ADMIN_DIR` | Backend directory (optional; the frontend is always deployed to `/app/ClipSync/admin/web`) |

---

## 🔐 Request Signing

All requests (including login) are automatically signed with the following headers:

| Header | Description |
|--------|-------------|
| `Authorization` | `Bearer <token>` (after login) |
| `X-Timestamp` | Millisecond timestamp |
| `X-Nonce` | Random string to prevent replay |
| `X-Signature` | `HMAC-SHA256(secret, method + path + query + timestamp + nonce + body)` |

- Before login, a **static secret** is used (injected via `VITE_SIGN_STATIC_SECRET`)
- After a successful login, the backend returns a dynamic `signSecret`, stored in `sessionStorage`, which expires when the tab is closed
- See [src/utils/sign.ts](src/utils/sign.ts) and [src/api/http.ts](src/api/http.ts) for the implementation

---

## 🧩 Related Projects

| Project | Tech Stack | Link |
|---------|-----------|------|
| Admin Backend | Go + Gin + GORM | [JH-Clipsync/ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) |
| Sync Server | Go + gorilla/websocket | [JH-Clipsync/ClipSync-Server](https://github.com/JH-Clipsync/ClipSync-Server) |
| Windows Client | .NET 8 + WPF | [JH-Clipsync/ClipSync-Windows](https://github.com/JH-Clipsync/ClipSync-Windows) |
| macOS Client | Swift + SwiftUI | [JH-Clipsync/ClipSync-Mac](https://github.com/JH-Clipsync/ClipSync-Mac) |
| Android Client | Kotlin + OkHttp | [JH-Clipsync/ClipSync-Android](https://github.com/JH-Clipsync/ClipSync-Android) |

---

## 📄 License

This is a personal, self-use project. Feel free to reference and modify the code.

---

**Made with ❤️ · Self-hosted admin · Your data stays in your hands**
