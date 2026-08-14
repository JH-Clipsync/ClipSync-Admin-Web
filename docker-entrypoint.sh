#!/bin/sh
set -e

# 默认上游地址（docker-compose 中通过环境变量覆盖）
UPSTREAM="${ADMIN_UPSTREAM:-http://host.docker.internal:18082}"

# 把模板中的占位符替换为实际上游地址
sed -i "s#__ADMIN_UPSTREAM__#${UPSTREAM}#g" /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
