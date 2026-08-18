<h1 align="center">ClipSync Admin Web</h1>

<p align="center">
  <b>ClipSync 管理コンソール —— ユーザー、デバイス、ロール権限を一箇所で。</b><br/>
  <a href="README.md">简体中文</a> ·
  <a href="README.en.md">English</a> ·
  <a href="README.ja.md">日本語</a>
</p>

---

ClipSync Admin Web は、自己ホスト型クリップボード同期システム [ClipSync](https://github.com/JH-Clipsync/ClipSync-Server) の**管理コンソールフロントエンド**です。**Vue 3 + TypeScript + Vite + Element Plus + Pinia** で開発され、ビルド成果物は純粋な静的ファイルとして Nginx から `/clipsync/admin/` サブパスで配信されます。

[ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) バックエンドと連携し、アカウント管理、デバイス管理、RBAC 権限、操作監査などの管理機能を提供します。

---

## ✨ 主な機能

| モジュール | 説明 |
|------|------|
| 🔐 **管理者ログイン** | アカウントとパスワードでログイン、JWT Bearer Token 認証、リプレイ攻撃対策付きリクエスト署名 |
| 📊 **ダッシュボード概要** | ユーザー総数、アクティブユーザー、管理者数、ロール数などの主要指標を一目で把握 |
| 👤 **ユーザー管理** | ユーザー一覧 / 詳細 / 新規作成 / 編集 / 有効・無効化 / パスワードリセット / 削除 |
| 📱 **デバイス管理** | アカウント配下の全デバイス、オンライン状態、最終ログイン IP を表示。無効化、名前変更、強制ログアウトに対応 |
| 🛡️ **RBAC 権限** | 管理者、ロール、メニュー、API 権限の4次元管理。ボタンレベル権限は `v-permission` ディレクティブで制御 |
| 🧑‍💼 **管理者管理** | 管理者アカウントの CRUD、ロール割り当て、パスワードリセット、ロック / ロック解除 |
| 🎛️ **メニュー管理** | ディレクトリ / メニュー / ボタンの3種類のノードタイプをサポートする動的メニューツリー。フィールドレベルの列制御 |
| 🚦 **API 権限** | HTTP メソッド + パスでマッチングする、バックエンドのルートインターセプトルールを設定 |
| ⚙️ **プロフィール** | プロフィール、アバター、パスワードの変更。ログインセッションは自動更新 |
| 🔄 **シームレスな Token リフレッシュ** | レスポンスヘッダー `x-refresh-token` で自動更新。有効期限が近づくとローカルの Token を自動的に差し替え |

---

## 🧱 技術スタック

- **Vue 3.5**（`<script setup>` + Composition API）
- **TypeScript 5.6**
- **Vite 5.4**（開発サーバー + ビルド）
- **Vue Router 4.4**（History モード、base = `/clipsync/admin/`）
- **Pinia 2.2**（状態管理）
- **Element Plus 2.8** + `@element-plus/icons-vue`
- **Axios 1.7**（HTTP クライアント。署名 / エラー / 認証を統一インターセプターで処理）
- **crypto-js 4.2**（HMAC-SHA256 リクエスト署名）

---

## 📁 ディレクトリ構成

```
ClipSync-Admin-Web/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/                      # API ラッパー
│   │   ├── http.ts               # axios インスタンス + 署名/認証/エラーインターセプター
│   │   ├── auth.ts               # ログイン / ログアウト / 現在の管理者 / パスワード変更
│   │   ├── data.ts               # ダッシュボード、ユーザー、デバイスなどの業務 API
│   │   └── rbac.ts               # 管理者/ロール/メニュー/権限 API
│   ├── composables/
│   │   └── useBatchSelect.ts     # テーブル一括選択フック
│   ├── directives/
│   │   └── permission.ts         # v-permission ボタンレベル権限ディレクティブ
│   ├── layout/
│   │   └── AdminLayout.vue       # サイドバー + トップバー + コンテンツエリアのメインフレーム
│   ├── router/
│   │   └── index.ts              # ルーティング + ログインガード
│   ├── stores/
│   │   └── admin.ts              # 管理者 / Token / 権限 / メニューの状態
│   ├── styles/
│   │   └── table.css             # グローバルテーブルスタイル
│   ├── utils/
│   │   ├── format.ts             # 時間 / フィールドフォーマット
│   │   └── sign.ts               # 署名、nonce、クエリソート
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
├── .github/workflows/docker-image.yml   # CI：静的ファイルのビルド + scp デプロイ
├── Dockerfile                           # 任意：Nginx イメージでパッケージング
├── nginx.conf
├── docker-entrypoint.sh
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 クイックスタート

### 必要環境

- **Node.js 18+**（20.x を推奨。CI では Node 20 を使用）
- **npm 9+**（Node に付属）
- アクセス可能な [ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) バックエンド（デフォルトローカルポート `28002`）

### インストールと実行

```bash
# 1. 依存関係をインストール
npm install

# 2. 開発サーバーを起動（デフォルト http://localhost:5175/clipsync/admin/）
npm run dev
```

開発サーバーのプロキシは [vite.config.ts](vite.config.ts) に設定済みです：

| フロントエンドのリクエスト | プロキシ先 |
|----------|----------|
| `/clipsync/admin/api/*` | `http://localhost:28002/api/admin/*` |
| `/clipsync/admin/static/*` | `http://localhost:28002/static/*` |

そのため、バックエンドが `28002` ポートで起動していれば、**ローカル開発で CORS を気にする必要はありません**。

### 本番ビルド

```bash
npm run build
```

- まず `vue-tsc --noEmit` で型チェックを実行
- その後 Vite でバンドルし、`dist/` に出力
- すべての静的リソースのパスは `/clipsync/admin/` プレフィックス付きなので、**必ず**このサブパスにデプロイする必要があります

### 本番ビルドをローカルでプレビュー

```bash
npm run preview
```

---

## 🌐 デプロイ

### サブパスの規約

アプリケーション全体は **`/clipsync/admin/`** 配下に固定でマウントされます：

- Vite `base = '/clipsync/admin/'`
- Vue Router `createWebHistory(import.meta.env.BASE_URL)`
- Axios `baseURL = '/clipsync/admin/api'`

そのため本番環境では Nginx（または他のリバースプロキシ）で以下の2点を設定する必要があります：

1. `/clipsync/admin/` への静的リクエストを `dist/` ディレクトリに向ける
2. `/clipsync/admin/api/` を ClipSync-Admin バックエンドにリバースプロキシし、パスを `/api/admin/` にリライトする

リポジトリルートの [nginx.conf](nginx.conf) に、すぐに参考にできる設定例があります。

### Docker イメージ（任意）

リポジトリには [Dockerfile](Dockerfile) と [docker-entrypoint.sh](docker-entrypoint.sh) が用意されており、公式 Nginx イメージをベースにしています。起動時に `dist/` を Nginx の web ディレクトリにコピーします。

### CI/CD

[.github/workflows/docker-image.yml](.github/workflows/docker-image.yml) に自動化フローが定義されています：

- **`main` への push**：`npm ci && npm run build` を実行してビルドを検証
- **`v*` タグの push**：静的ファイルをビルド → `dist.tar.gz` にパッケージ → `scp` でサーバーにアップロード → SSH で `/app/ClipSync/admin/web` に展開し、前バージョンを `.bak` として自動バックアップ

GitHub リポジトリの Secrets に以下を設定する必要があります：

| Secret | 説明 |
|--------|------|
| `DEPLOY_SSH_HOST` | デプロイ先サーバーのアドレス |
| `DEPLOY_SSH_USER` | SSH ユーザー名 |
| `DEPLOY_SSH_KEY` | SSH 秘密鍵 |
| `DEPLOY_SSH_PORT` | SSH ポート（任意、デフォルト 22） |
| `DEPLOY_ADMIN_DIR` | バックエンドディレクトリ（任意。フロントエンドは `/app/ClipSync/admin/web` に固定デプロイ） |

---

## 🔐 リクエスト署名

すべてのリクエスト（ログインを含む）には、以下のヘッダーが自動的に付与されます：

| Header | 説明 |
|--------|------|
| `Authorization` | `Bearer <token>`（ログイン後） |
| `X-Timestamp` | ミリ秒タイムスタンプ |
| `X-Nonce` | リプレイ攻撃対策用ランダム文字列 |
| `X-Signature` | `HMAC-SHA256(secret, method + path + query + timestamp + nonce + body)` |

- ログイン前は**静的シークレット**を使用（`VITE_SIGN_STATIC_SECRET` で注入）
- ログイン成功後、バックエンドから動的な `signSecret` が返され、`sessionStorage` に保存されます。タブを閉じると無効になります
- 実装は [src/utils/sign.ts](src/utils/sign.ts) と [src/api/http.ts](src/api/http.ts) を参照してください

---

## 🧩 関連プロジェクト

| プロジェクト | 技術スタック | リンク |
|------|--------|------|
| 管理バックエンド | Go + Gin + GORM | [JH-Clipsync/ClipSync-Admin](https://github.com/JH-Clipsync/ClipSync-Admin) |
| 同期サーバー | Go + gorilla/websocket | [JH-Clipsync/ClipSync-Server](https://github.com/JH-Clipsync/ClipSync-Server) |
| Windows クライアント | .NET 8 + WPF | [JH-Clipsync/ClipSync-Windows](https://github.com/JH-Clipsync/ClipSync-Windows) |
| macOS クライアント | Swift + SwiftUI | [JH-Clipsync/ClipSync-Mac](https://github.com/JH-Clipsync/ClipSync-Mac) |
| Android クライアント | Kotlin + OkHttp | [JH-Clipsync/ClipSync-Android](https://github.com/JH-Clipsync/ClipSync-Android) |

---

## 📄 License

個人利用のプロジェクトです。コードは自由に参考・改変いただけます。

---

**Made with ❤️ · セルフホスト管理 · データはすべてあなたの手の中に**
