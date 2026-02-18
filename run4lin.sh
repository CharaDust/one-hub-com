#!/usr/bin/env bash
# 项目运行与开发统一入口（Linux 用，请用 bash 运行：bash run4lin.sh 或 ./run4lin.sh）
# 用法: ./run4lin.sh <命令>
#   容器: up | down | restart | logs | ps
#   开发: deps | dev | web

set -e
cd "$(dirname "$0")"

NAME=one-api
WEBDIR=web
VERSION=$(git describe --tags 2>/dev/null || echo "dev")

# 数据库密码修改在此处！！！
# 本地开发用 MySQL：格式 用户名:密码@tcp(host:port)/库名。修改密码时与 docker-compose.yml 中 db.MYSQL_USER/MYSQL_PASSWORD 保持一致
export SQL_DSN="${SQL_DSN:-oneapi:123456@tcp(127.0.0.1:3306)/one-api}"
export REDIS_CONN_STRING="${REDIS_CONN_STRING:-redis://127.0.0.1:6379}"
export SESSION_SECRET="${SESSION_SECRET:-aaaa1111bbbb2222cccc3333dddd5555}"
export USER_TOKEN_SECRET="${USER_TOKEN_SECRET:-aaaa1111bbbb2222cccc3333dddd4444}"

cmd_help() {
  echo "用法: $0 <命令> [选项]"
  echo ""
  echo "  容器（Docker Compose）"
  echo "    up       完整启动（db + redis + 应用，会构建镜像）"
  echo "    down     停止并移除所有容器"
  echo "    down -v  停止并移除容器及数据卷"
  echo "    restart  down 后再次 up（完整栈）"
  echo "    logs     查看容器日志（-f 跟随输出）"
  echo "    ps       查看容器状态"
  echo ""
  echo "  开发调试（本地热重载，避免每次改代码都构建 10+ 分钟）"
  echo "    deps     仅启动 db + redis，不构建应用"
  echo "    dev      后端热重载（需先 deps；改 Go 几秒内生效）"
  echo "    web      前端热重载（http://localhost:3010，/api 代理到 3000）"
  echo ""
  echo "  其他"
  echo "    help     显示本帮助"
}

# ---------- 容器 ----------
cmd_up() {
  docker compose --profile app up -d --build
  echo "已完整启动（db + redis + one-hub），应用端口 3000"
}

cmd_down() {
  if [ "${2:-}" = "-v" ]; then
    docker compose --profile app down -v
    echo "已停止并移除容器及数据卷"
  else
    docker compose --profile app down
    echo "已停止并移除容器（数据卷保留）"
  fi
}

cmd_restart() {
  docker compose --profile app down
  docker compose --profile app up -d --build
  echo "已重启完整栈"
}

cmd_logs() {
  docker compose --profile app logs -f "${@:2}"
}

cmd_ps() {
  docker compose --profile app ps
}

# ---------- 开发 ----------
cmd_deps() {
  docker compose up -d
  echo "已启动 db + redis，可执行 ./run4lin.sh dev 跑后端"
}

cmd_dev() {
  if [ ! -d "$WEBDIR/build" ]; then
    echo "未检测到 web/build，正在构建前端..."
    (cd "$WEBDIR" && yarn install && VITE_APP_VERSION="$VERSION" yarn run build)
    if [ -d "$WEBDIR/dist" ] && [ ! -d "$WEBDIR/build" ]; then
      mv "$WEBDIR/dist" "$WEBDIR/build"
    fi
  fi
  # 开发端口，可通过 PORT=3001 ./run4lin.sh dev 覆盖
  DEV_PORT=${PORT:-3000}
  export PORT=$DEV_PORT
  if port_in_use "$DEV_PORT"; then
    echo "端口 $DEV_PORT 已被占用，无法启动开发服务。"
    echo "  请先执行: ./run4lin.sh down   # 若为 Docker 占用"
    echo "  或使用其他端口: PORT=3001 ./run4lin.sh dev"
    exit 1
  fi
  # go install 默认装到 $GOPATH/bin，可能不在 PATH 中（尤其 sh 环境）
  if ! command -v air >/dev/null 2>&1; then
    go_bin=$(go env GOPATH 2>/dev/null)/bin
    [ -z "$go_bin" ] && go_bin=$HOME/go/bin
    if [ -x "$go_bin/air" ]; then
      export PATH="$go_bin:$PATH"
    fi
  fi
  if ! command -v air >/dev/null 2>&1; then
    echo "未找到 air，请安装: go install github.com/air-verse/air@latest"
    echo "若已安装，请把 \$(go env GOPATH)/bin 加入 PATH，例如在 ~/.bashrc 中添加："
    echo "  export PATH=\"\$PATH:\$(go env GOPATH)/bin\""
    exit 1
  fi
  exec air
}

# 检测端口是否已被占用（macOS / Linux 通用），返回 0 表示占用
port_in_use() {
  port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -i ":$port" -t 2>/dev/null | grep -q . && return 0 || return 1
  fi
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" 2>/dev/null && return 0 || return 1
  fi
  return 1
}

cmd_web() {
  (cd "$WEBDIR" && yarn run dev)
}

# ---------- 分发 ----------
case "${1:-}" in
  up)       cmd_up ;;
  down)     cmd_down "$@" ;;
  restart)  cmd_restart ;;
  logs)     cmd_logs "$@" ;;
  ps)       cmd_ps ;;
  deps)     cmd_deps ;;
  dev)      cmd_dev ;;
  web)      cmd_web ;;
  help|--help|-h) cmd_help ;;
  *)        cmd_help; exit 1 ;;
esac
