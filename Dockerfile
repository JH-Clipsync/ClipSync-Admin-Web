# ===== 阶段 1: 构建静态资源 =====
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖文件，最大化缓存命中
COPY package.json package-lock.json ./
RUN npm ci

# 签名密钥通过构建参数传入（与后端 security.sign_static_secret 一致）
ARG VITE_SIGN_STATIC_SECRET=clipsync-admin-static-sign-secret-v1
ENV VITE_SIGN_STATIC_SECRET=$VITE_SIGN_STATIC_SECRET

# 复制源码并构建
COPY . .
RUN npm run build

# ===== 阶段 2: nginx 托管静态文件 =====
FROM nginx:1.27-alpine

# 拷贝自定义 nginx 配置（SPA history 路由 + 静态资源缓存）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 拷贝构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# 健康检查：首页能返回 200 即认为正常
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
