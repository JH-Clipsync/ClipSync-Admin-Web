<h1 align="center">ClipSync Admin Web</h1>

<p align="center">
  <b>ClipSync Admin Console — users, devices, roles and permissions in one place.</b><br/>
  <a href="README.md">简体中文</a> ·
  <a href="README.en.md">English</a> ·
  <a href="README.ja.md">日本語</a>
</p>

---

ClipSync Admin Web is the **admin console frontend** of the self-hosted [ClipSync](https://github.com/JH-Clipsync/ClipSync-Server) clipboard sync system. It is built with **Vue 3 + TypeScript + Vite + Element Plus + Pinia**, produces pure static assets, and is served by Nginx under the `/clipsync/admin/` sub-path.

It works together with the [ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) backend to provide account management, device management, RBAC permissions and audit logging.

---

## ✨ Core Features

| Module | Description |
|------|------|
| 🔐 **Admin Login** | Username/password login, JWT Bearer Token auth, request signing with replay protection |
| 📊 **Dashboard Overview** | Key metrics at a glance: total users, active users, admin count, role count, etc. |
| 👤 **User Management** | User list / detail / create / edit / enable-disable / reset password / delete |
| 📱 **Device Management** | View all devices under an account, online status, last login IP; supports disable, rename and force-logout |
| 🛡️ **RBAC Permissions** | Four-dimensional management: admins, roles, menus and API permissions; button-level permission via the `v-permission` directive |
| 🧑‍💼 **Admin Management** | CRUD for admin accounts, role assignment, password reset, lock/unlock |
| 🎛️ **Menu Management** | Dynamic menu tree supporting directory / menu / button node types with field-level column control |
| 🚦 **API Permissions** | Backend route interception rules, matched by HTTP method + path |
| ⚙️ **Profile** | Edit profile, avatar and password; session auto-renewal |
| 🔄 **Silent Token Refresh** | Auto-renewal via the `x-refresh-token` response header; local Token is replaced transparently as it nears expiry |

---

## 🧱 Tech Stack

- **Vue 3.5** (`<script setup>` + Composition API)
- **TypeScript 5.6**
- **Vite 5.4** (dev server + build)
- **Vue Router 4.4** (History mode, base = `/clipsync/admin/`)
- **Pinia 2.2** (state management)
- **Element Plus 2.8** + `@element-plus/icons-vue`
- **Axios 1.7** (HTTP client with unified interceptors for signing / errors / auth)
- **crypto-js 4.2** (HMAC-SHA256 request signing)

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
│   │   ├── data.ts               # dashboard, users, devices and other business APIs
│   │   └── rbac.ts               # admin/role/menu/permission APIs
│   ├── composables/
│   │   └── useBatchSelect.ts     # table batch-selection hook
│   ├── directives/
│   │   └── permission.ts         # v-permission button-level directive
│   ├── layout/
│   │   └── AdminLayout.vue       # sidebar + top bar + content shell
│   ├── router/
│   │   └── index.ts              # routes + login guard
│   ├── stores/
│   │   └── admin.ts              # admin / Token / permissions / menu state
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
├── .github/workflows/docker-image.yml   # CI: build static assets + scp deploy
├── Dockerfile                           # Optional: package with the Nginx image
├── nginx.conf
├── docker-entrypoint.sh
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** (20.x recommended; CI uses Node 20)
- **npm 9+** (bundled with Node)
- A reachable [ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) backend (default local port `28002`)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (defaults to http://localhost:5175/clipsync/admin/)
npm run dev
```

The dev server proxies are preconfigured in [vite.config.ts](vite.config.ts):

| Frontend request | Proxied target |
|----------|----------|
| `/clipsync/admin/api/*` | `http://localhost:28002/api/admin/*` |
| `/clipsync/admin/static/*` | `http://localhost:28002/static/*` |

As a result, **no CORS setup is needed during local development** as long as the backend is running on port `28002`.

### Build for Production

```bash
npm run build
```

- Runs `vue-tsc --noEmit` for type checking first
- Then bundles with Vite; output goes to `dist/`
- All static asset paths are prefixed with `/clipsync/admin/`, so the app **must** be deployed under that sub-path

### Preview the Production Build Locally

```bash
npm run preview
```

---

## 🌐 Deployment

### Sub-path Convention

The entire application is mounted under **`/clipsync/admin/`**:

- Vite `base = '/clipsync/admin/'`
- Vue Router `createWebHistory(import.meta.env.BASE_URL)`
- Axios `baseURL = '/clipsync/admin/api'`

Therefore, in production Nginx (or another reverse proxy) must do two things:

1. Serve static requests for `/clipsync/admin/` from the `dist/` directory
2. Reverse-proxy `/clipsync/admin/api/` to the ClipSync-Admin backend, rewriting the path to `/api/admin/`

A ready-to-use reference configuration is provided in [nginx.conf](nginx.conf) at the repo root.

### Docker Image (Optional)

The repo provides [Dockerfile](Dockerfile) and [docker-entrypoint.sh](docker-entrypoint.sh), based on the official Nginx image. On startup, `dist/` is copied into the Nginx web directory.

### CI/CD

[.github/workflows/docker-image.yml](.github/workflows/docker-image.yml) defines the automation pipeline:

- **Push to `main`**: runs `npm ci && npm run build` to verify the build
- **Push a `v*` tag**: builds static assets → packages them as `dist.tar.gz` → uploads via `scp` → SSH-extracts to `/app/ClipSync/admin/web`, automatically backing up the previous version as `.bak`

The following Secrets must be configured in the GitHub repository:

| Secret | Description |
|--------|------|
| `DEPLOY_SSH_HOST` | Deployment server address |
| `DEPLOY_SSH_USER` | SSH username |
| `DEPLOY_SSH_KEY` | SSH private key |
| `DEPLOY_SSH_PORT` | SSH port (optional, default 22) |
| `DEPLOY_ADMIN_DIR` | Backend directory (optional; frontend is always deployed to `/app/ClipSync/admin/web`) |

---

## 🔐 Request Signing

Every request (including login) is automatically augmented with the following headers:

| Header | Description |
|--------|------|
| `Authorization` | `Bearer <token>` (after login) |
| `X-Timestamp` | Millisecond timestamp |
| `X-Nonce` | Random string for replay protection |
| `X-Signature` | `HMAC-SHA256(secret, method + path + query + timestamp + nonce + body)` |

- Before login, a **static secret** is used (injected via `VITE_SIGN_STATIC_SECRET`)
- After a successful login, the backend returns a dynamic `signSecret` which is stored in `sessionStorage` and invalidated when the tab is closed
- See [src/utils/sign.ts](src/utils/sign.ts) and [src/api/http.ts](src/api/http.ts) for the implementation

---

## 🧩 Related Projects

| Project | Stack | Link |
|------|--------|------|
| Admin Backend | Go + Gin + GORM | [JH-Clipsync/ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) |
| Sync Server | Go + gorilla/websocket | [JH-Clipsync/ClipSync-Server](https://github.com/JH-Clipsync/ClipSync-Server) |
| Windows Client | .NET 8 + WPF | [JH-Clipsync/ClipSync-Windows](https://github.com/JH-Clipsync/ClipSync-Windows) |
| macOS Client | Swift + SwiftUI | [JH-Clipsync/ClipSync-Mac](https://github.com/JH-Clipsync/ClipSync-Mac) |
| Android Client | Kotlin + OkHttp | [JH-Clipsync/ClipSync-Android](https://github.com/JH-Clipsync/ClipSync-Android) |

---

## 📄 License

A personal, self-use project. Feel free to reference and modify the code.

---

**Made with ❤️ · Self-hosted admin · Your data stays in your hands**
