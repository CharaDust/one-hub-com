# Docker 构建与镜像加速

当执行 `docker compose up -d --build` 时若出现拉取基础镜像失败（如 `registry-1.docker.io` 或其它镜像站返回 **EOF**），多为当前网络无法稳定访问镜像仓库，可按以下方式处理。

## 方式一：配置 Docker 镜像加速（推荐）

通过 Docker Desktop 让拉取 `alpine`、`node`、`golang` 等镜像时走国内镜像站，**无需改 Dockerfile 或环境变量**。

1. 打开 **Docker Desktop** → 右上角 **Settings (齿轮)** → **Docker Engine**。
2. 在 JSON 配置中增加或修改 `registry-mirrors`（保留其它已有配置）：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io"
  ]
}
```

3. 点击 **Apply and restart**，等待 Docker 重启完成。
4. 在项目根目录执行（**不要**设置 `BASE` 环境变量）：

```bash
docker compose up -d --build
```

若上述镜像站仍不稳定，可逐个尝试替换为：

- `https://docker.1ms.run`
- `https://registry.docker-cn.com`
- `https://dockerpull.org`

改完后同样 **Apply and restart**，再执行 `docker compose up -d --build`。

## 方式二：在可访问 Docker Hub 的网络下预拉镜像

在能正常访问 Docker Hub 的网络下（如手机热点、VPN、另一台机器）：

```bash
docker pull alpine:3.19
```

拉取成功后，回到当前网络再执行：

```bash
docker compose up -d --build
```

构建会使用本地已缓存的 `alpine:3.19`，不再向镜像仓库发请求。

## 方式三：使用代理

若本机已配置 HTTP/HTTPS 代理（如 `http://127.0.0.1:7890`）：

1. **Docker Desktop** → **Settings** → **Resources** → **Proxies**。
2. 开启 **Manual proxy configuration**，填写代理地址。
3. **Apply and restart** 后执行：

```bash
docker compose up -d --build
```

Docker 拉取镜像时会通过代理访问 Docker Hub。

## 构建参数 BASE（可选）

Dockerfile 支持通过构建参数 `BASE` 指定基础镜像，默认 `alpine:3.19`。若你有一个**可稳定拉取**的 Alpine 镜像地址（如自建或其它私有镜像仓），可这样用：

```bash
BASE=你的镜像地址/alpine:3.19 docker compose up -d --build
```

或在项目根目录创建 `.env`，写入：

```
BASE=你的镜像地址/alpine:3.19
```

再执行 `docker compose up -d --build`。若未配置镜像加速且无法访问 Docker Hub，优先使用方式一或二。
