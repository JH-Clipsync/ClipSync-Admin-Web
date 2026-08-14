#!/bin/sh
set -e

CONF=/etc/nginx/conf.d/default.conf

# 如果设置了 ADMIN_UPSTREAM，启用容器内 API 反代；否则删除反代块（纯静态模式，由外层反代处理 API）
if [ -n "$ADMIN_UPSTREAM" ]; then
  # 去掉标记注释，保留反代块，替换上游地址
  sed -i "s#__ADMIN_UPSTREAM__#${ADMIN_UPSTREAM}#g" "$CONF"
  sed -i "/# __PROXY_BLOCK/d" "$CONF"
else
  # 删除从 START 到 END 之间的整块（含标记行）
  sed -i "/# __PROXY_BLOCK_START__/,/# __PROXY_BLOCK_END__/d" "$CONF"
fi

exec nginx -g 'daemon off;'
