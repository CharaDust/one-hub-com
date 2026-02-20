---
title: "开发与生产步骤"
layout: doc
outline: deep
lastUpdated: true
---

# 开发与生产步骤

本文说明在本仓库中**开发调试**与**生产运行**的完整步骤，统一使用根目录脚本 `run.sh`。通用部署方式（单容器、多机等）见 [部署说明](/deployment/index)。

---

## 一、开发流程（本地热重载）

适用于日常改代码、调试，避免每次改动都做完整 Docker 构建（约 10 分钟以上）。

### 1.1 环境准备

| 依赖     | 说明 |
|----------|------|
| **Go**   | 用于编译后端，见 [Go 安装](https://go.dev/doc/install) |
| **Yarn** | 用于构建前端，见 [Yarn 安装](https://yarnpkg.com/getting-started/install) |
| **Docker** | 仅用于运行 MySQL、Redis，见 [Docker 安装](https://docs.docker.com/engine/install/) |
| **Air**  | Go 热重载工具。安装：`go install github.com/air-verse/air@latest`，并确保 `$(go env GOPATH)/bin` 在 PATH 中（或使用 `run.sh dev`，脚本会自动查找） |

### 1.2 开发步骤（推荐顺序）

**第一步：仅启动依赖（MySQL + Redis）**

```bash
./run.sh deps
```

- 只启动 `db` 和 `redis` 容器，**不**构建或启动 one-hub 应用。
- 若 3306/6379 已被占用，请先执行 `./run.sh down` 或关闭占用进程。

**第二步：启动后端（热重载）**

```bash
./run.sh dev
```

- 首次运行如无 `web/build`，会自动构建前端（耗时稍长）。
- 后端监听 **http://localhost:3000**，修改 `.go` 等文件后几秒内自动重新编译并重启。
- 若提示「端口 3000 已被占用」：
  - 先停止容器：`./run.sh down`，再执行 `./run.sh dev`；
  - 或换端口：`PORT=3001 ./run.sh dev`，然后访问 http://localhost:3001。

**第三步（可选）：启动前端开发服务器**

需要改前端时，**另开终端**执行：

```bash
./run.sh web
```

- 访问 **http://localhost:3010**，前端带 HMR；`/api` 已代理到 `http://127.0.0.1:3000`。
- 若后端使用了其他端口（如 `PORT=3001 ./run.sh dev`），需在 `web/vite.config.mjs` 的 `proxy['/api'].target` 中改为对应端口。

### 1.3 开发常用命令速查

| 操作           | 命令 |
|----------------|------|
| 查看脚本用法   | `./run.sh help` |
| 仅起 db+redis  | `./run.sh deps` |
| 后端热重载     | `./run.sh dev` |
| 前端热重载     | `./run.sh web` |
| 换端口起后端   | `PORT=3001 ./run.sh dev` |

### 1.4 开发时常见问题

- **未找到 air**  
  安装：`go install github.com/air-verse/air@latest`。若已安装仍报错，将 `$(go env GOPATH)/bin` 加入 PATH，或在项目根目录执行 `./run.sh dev`（脚本会尝试自动查找）。

- **监听 data 目录失败**  
  已在 `.air.toml` 的 `exclude_dir` 中加入 `data`，正常情况不应再监听 `data/mysql` 等。

- **端口 3000 已被占用**  
  执行 `./run.sh down` 释放端口，或使用 `PORT=3001 ./run.sh dev` 改用 3001。

---

## 二、生产流程（Docker Compose 完整栈）

适用于在单机或服务器上以**容器方式**运行完整服务（应用 + MySQL + Redis）。

### 2.1 环境准备

- 已安装 **Docker** 与 **Docker Compose**。
- 如需自定义数据目录，可修改 `docker-compose.yml` 中 `one-hub` 的 `volumes`（如 `./data:/data`）。

### 2.2 首次部署步骤

**第一步：进入项目根目录**

```bash
cd /path/to/one-hub-com
```

**第二步：按需修改环境变量**

编辑 `docker-compose.yml` 中 `one-hub` 的 `environment`，至少建议设置：

| 变量               | 说明 |
|--------------------|------|
| `USER_TOKEN_SECRET` | 用户令牌密钥，必填，建议随机长字符串 |
| `SESSION_SECRET`   | 会话密钥，建议设置，否则重启后需重新登录 |
| `SQL_DSN`          | MySQL 连接串（示例：`oneapi:密码@tcp(db:3306)/one-api`） |
| `REDIS_CONN_STRING`| Redis 连接（示例：`redis://redis`） |

更多变量见 [环境变量](/deployment/env)。

**第三步：完整启动（构建并运行）**

```bash
./run.sh up
```

- 等价于：`docker-compose --profile app up -d --build`。
- 会构建 one-hub 镜像并启动 **db**、**redis**、**one-hub** 三个服务，应用端口 **3000**。

**第四步：确认状态**

```bash
./run.sh ps
./run.sh logs -f   # 可选，查看日志
```

浏览器访问 **http://\<服务器IP\>:3000**，按提示完成初始化与登录。

### 2.3 生产常用命令速查

| 操作               | 命令 |
|--------------------|------|
| 完整启动（构建+运行） | `./run.sh up` |
| 停止并移除容器     | `./run.sh down` |
| 停止并删除数据卷   | `./run.sh down -v` |
| 重启完整栈         | `./run.sh restart` |
| 查看容器状态       | `./run.sh ps` |
| 查看日志（跟随）   | `./run.sh logs -f` |

### 2.4 与「仅依赖」模式的区别

- **生产**：`./run.sh up` → 启动 **db + redis + one-hub**（应用在容器内）。
- **开发**：`./run.sh deps` 只启动 **db + redis**，应用在本机用 `./run.sh dev` 跑，便于热重载。

默认执行 `docker-compose up -d`（不带 `--profile app`）时**不会**启动 one-hub，仅启动 db 与 redis，便于与本地开发配合使用。

### 2.5 更新应用（代码或镜像）

- **使用本仓库构建**：修改代码或配置后，在项目根目录执行：
  ```bash
  ./run.sh restart
  ```
  或先 `./run.sh down`，再 `./run.sh up`，会重新构建并启动。

- **使用现成镜像**：在 `docker-compose.yml` 中指定镜像并执行 `docker-compose --profile app pull` 后，再 `./run.sh up` 或 `./run.sh restart`。

### 2.6 子路径部署（反向代理挂子路径）

若通过 Nginx 等反向代理将应用挂在子路径下（如 `https://example.com/one-hub/`），且**代理把完整路径转发给后端**（例如请求 `/one-hub/assets/index-xxx.js` 时后端收到的是 `/one-hub/assets/...` 而不是 `/assets/...`），会出现：

- 浏览器报错：`Failed to load module script: Expected a JavaScript module but the server responded with a MIME type of "text/html"`

原因是静态资源请求落到了 SPA 回退逻辑，返回了 `index.html`。需同时做两点：

1. **后端**：设置环境变量 `WEB_BASE_PATH` 与子路径一致（不要末尾斜杠），例如：
   - 在 `docker-compose.yml` 的 `one-hub` 的 `environment` 中增加：`WEB_BASE_PATH: "/one-hub"`
   - 或配置文件中设置：`web_base_path: "/one-hub"`

2. **前端构建**：子路径部署时前端需用相同 base 构建，否则脚本地址仍会错。构建时设置：
   - `VITE_BASE_PATH=/one-hub/`（末尾可带斜杠），例如：
   - `VITE_BASE_PATH=/one-hub/ yarn build`（在 `web` 目录下），或 Docker 构建时传入该构建参数并在 `vite build` 前 export。

若代理已配置为「重写路径」（例如 Nginx `proxy_pass http://backend/;` 带尾部斜杠，使后端收到 `/assets/...`），则无需设置 `WEB_BASE_PATH`，按根路径部署即可。

---

## 三、开发 vs 生产对照

| 项目         | 开发                         | 生产                    |
|--------------|------------------------------|-------------------------|
| 应用运行位置 | 本机（Air 热重载）           | Docker 容器             |
| 数据库/Redis | Docker（`./run.sh deps`）    | Docker（`./run.sh up`） |
| 启动命令     | `./run.sh deps` → `./run.sh dev` | `./run.sh up`       |
| 停止命令     | 停止 dev 进程；可选 `./run.sh down` 停 db/redis | `./run.sh down` |
| 访问地址     | http://localhost:3000（或 PORT 指定） | http://\<主机\>:3000 |
| 前端开发     | 可选 `./run.sh web`（localhost:3010） | 使用已打包前端 |

更多部署方式（单容器、多机、手动部署等）请参考 [部署说明](/deployment/index)。

---

## 四、自定义 Favicon（浏览器标签栏图标）

浏览器标签栏图标由后端 `/favicon.ico` 提供，可通过以下两种方式更改。

### 方式一：配置文件（推荐，无需改代码）

在 `config.yaml` 中设置 `favicon`：

- **本地文件**：填写 `.ico` 文件的绝对路径或相对可执行文件的路径。  
  示例：`favicon: "/path/to/your.ico"` 或 `favicon: "./custom.ico"`
- **网络地址**：填写可公网访问的 `.ico` URL。  
  示例：`favicon: "https://example.com/icon.ico"`

保存后重启服务即可生效。URL 形式的图标会被缓存约 24 小时。

### 方式二：替换默认图标（改源码/资源）

用新的 `.ico` 文件**覆盖** `web/public/favicon.ico`，然后：

- **开发**：若已有 `web/build`，需重新构建前端（如执行 `cd web && npm run build` 或由 `run.sh` 触发），后端会从新的 `web/build/favicon.ico` 读取。
- **生产**：重新构建镜像并部署（如 `./run.sh restart` 或 `./run.sh up`）。

此后未在配置中设置 `favicon` 时，将使用该默认图标。
