# 开发与贡献

**详细步骤（开发环境准备、开发流程、生产部署与常用命令）请见：[开发与生产步骤](./development-and-production)。**

## 目录

- [便捷调试（避免长时间重构）](#便捷调试避免长时间重构)
- [本地构建](#本地构建)
  - [环境配置](#环境配置)
  - [编译流程](#编译流程)
  - [运行说明](#运行说明)
- [Docker 构建](#docker-构建)
  - [环境配置](#环境配置-1)
  - [编译流程](#编译流程-1)
  - [运行说明](#运行说明-1)

## 便捷调试（避免长时间重构）

每次改代码都跑完整 Docker 构建（前端 + Go + 镜像）往往需要 10 分钟以上。日常调试建议用**本地运行 + 热重载**，改完代码几秒内即可看到效果。

### 思路

- **只把 MySQL、Redis 放在 Docker**：`docker-compose up -d` 默认只启动 `db` 和 `redis`（应用服务加了 `profiles: app`，不带 profile 不会构建/启动）。
- **后端**：本机用 [Air](https://github.com/air-verse/air) 跑 Go，改 `.go` 后自动重新编译并重启（约几秒）。
- **前端**：可选；若改前端，用 Vite 开发服务器，支持 HMR，API 已通过 Vite 代理到后端 3000 端口。

### 环境准备

- 本机已安装 **Go**、**Yarn**、**Docker**。
- 安装 Air：`go install github.com/air-verse/air@latest`（或 `brew install air`）。

### 步骤（推荐用根目录脚本）

根目录 **`run.sh`** 统一管理容器与开发命令，`./run.sh help` 可查看全部用法。

**容器（Docker Compose）**

| 命令 | 说明 |
|------|------|
| `./run.sh up`      | 完整启动（db + redis + 应用，会构建镜像） |
| `./run.sh down`   | 停止并移除所有容器 |
| `./run.sh down -v`| 停止并移除容器及数据卷 |
| `./run.sh restart`| 先 down 再 up（完整栈） |
| `./run.sh logs`   | 查看容器日志（可加 `-f` 跟随） |
| `./run.sh ps`     | 查看容器状态 |

**开发调试（本地热重载）**

| 命令 | 说明 |
|------|------|
| `./run.sh deps` | 仅启动 MySQL + Redis（不构建应用） |
| `./run.sh dev`  | 后端热重载（缺 `web/build` 时会先构建前端；改 Go 几秒内生效） |
| `./run.sh web`  | 前端热重载，访问 http://localhost:3010，`/api` 代理到 3000 |

1. **启动依赖（仅 db + redis）**

   ```bash
   ./run.sh deps
   # 或: docker-compose up -d
   ```

   此时不会构建或启动 one-hub 应用。

2. **后端热重载（日常改 Go 代码用）**

   ```bash
   ./run.sh dev
   # 或: make dev
   ```

   首次会检测并构建 `web/build`；使用 Air 监听 `.go` 等文件，保存后几秒内自动重新编译并重启。服务跑在 **http://localhost:3000**。

3. **（可选）前端热重载**

   另开终端：

   ```bash
   ./run.sh web
   # 或: make dev-web
   ```

   访问 **http://localhost:3010**。页面由 Vite 提供（HMR），`/api` 会代理到 `http://127.0.0.1:3000`。

### 完整启动与关闭（含应用容器）

需要连同应用一起用 Docker 时：

```bash
./run.sh up      # 完整启动（构建并启动 db + redis + one-hub）
./run.sh down    # 停止并移除容器（数据卷保留）
./run.sh down -v # 停止并移除容器及数据卷
./run.sh logs -f # 查看日志
```

## 本地构建

### 环境配置

你需要一个 golang 与 yarn 开发环境

#### 直接安装

golang 官方安装指南：https://go.dev/doc/install \
yarn 官方安装指南：https://yarnpkg.com/getting-started/install

#### 通过 conda/mamba 安装 （没错它不只能管理 python）

如果你已有[conda](https://docs.conda.io/projects/conda/en/latest/user-guide/install/index.html)或者[mamba](https://github.com/conda-forge/miniforge)的经验，也可将其用于 golang 环境管理：

```bash
conda create -n goenv go yarn
# mamba create -n goenv go yarn # 如果你使用 mamba
```

### 编译流程

项目根目录已经提供了本地构建的 makefile

```bash
# cd one-hub
# 确保你已经启动了开发环境，比如conda activate goenv
make all
# 更多 make 命令，详见makefile
```

编译成功之后你应当能够在项目根目录找到 `dist` 与 `web/build` 两个文件夹。

### 运行说明

运行

```bash
$ ./dist/one-api -h
Usage of ./dist/one-api:
  -config string
        specify the config.yaml path (default "config.yaml")
  -export
        Exports prices to a JSON file.
  -help
        print help and exit
  -log-dir string
        specify the log directory
  -port int
        the listening port
  -version
        print version and exit
```

根据[使用方法](/use/index)进行具体的项目配置。

## Docker 构建

### 环境配置

你需要 docker 环境，列出下列文档作为安装参考，任选其一即可：

- MirrorZ Help，此为校园网 cernet 镜像站：https://help.mirrors.cernet.edu.cn/docker-ce/
- docker 官方安装文档：https://docs.docker.com/engine/install/

### 编译流程

项目根目录已经提供了 docker 构建的 dockerfile

```bash
# cd one-hub
docker build -t one-hub:dev .
```

编译成功后，运行

```bash
docker images | grep one-hub:dev
```

你应当能找到刚刚编译的镜像，注意与项目官方镜像区分名称。

当然你也可以选择修改 Dockerfile，使用 `docker compose build` 进行编译。

### 运行说明

项目根目录提供了一份 [`docker-compose.yaml`](https://github.com/MartialBE/one-hub/blob/main/docker-compose.yml) 文件。你应当根据上一步 `docker build` 时采用的镜像名称进行修改，比如将`martialbe/one-api:latest`替换`one-hub:dev`。当然你也可以直接利用 `docker compose` 进行 build：

```yaml
image: martialbe/one-api:latest
```

替换为

```yaml
build:
  dockerfile: Dockerfile
  context: .
```

然后进行 `docker compose build` 即可。
