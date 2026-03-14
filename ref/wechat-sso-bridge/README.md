# wechat-sso-bridge

网页展示临时二维码，用户扫码后回调带 `code`，接口用 `code` 换 OpenID，与 wechat-server 的 API 兼容；不建用户体系。

## 已有系统所需配置

| 配置项 | 含义 | 说明 |
|--------|------|------|
| **登录服务器地址** | API 根地址 | 本程序部署后的 base URL（如 `https://wechat-login.example.com`） |
| **访问凭证** | Authorization 头 | 环境变量 `WECHAT_API_TOKEN` 的值 |
| **二维码链接** | 登录页地址 | `{登录服务器地址}/`，重定向时带 `?redirect_uri={urlencode(回调地址)}` |

## 环境变量

| 变量 | 说明 |
|------|------|
| `WECHAT_APP_ID` | 公众号 AppID |
| `WECHAT_APP_SECRET` | 公众号 AppSecret |
| `WECHAT_TOKEN` | 与微信后台「服务器配置」中填写的 Token 一致 |
| `WECHAT_API_TOKEN` | 已有系统调用 `/api/wechat/user`、`/api/wechat/access_token` 时使用的 Authorization 头内容 |
| `PORT` | 服务端口，默认 **3000**（与 wechat-server 一致，便于无感切换） |

## Docker 运行

### 国内服务器拉取镜像超时

若 `docker compose up -d` 或 `docker build` 时出现 `dial tcp ... i/o timeout`（连不上 Docker Hub），需配置**镜像加速**后再构建：

```bash
# 编辑 Docker 配置（路径以 Linux 为例）
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

然后再执行 `docker compose up -d`。若使用阿里云 ECS，可在 [容器镜像服务 - 镜像加速器](https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors) 获取你的专属加速地址并填入 `registry-mirrors`。

### 使用 Docker Compose（推荐）

1. 复制环境变量示例并填写：
   ```bash
   cp .env.example .env
   # 编辑 .env，填入 WECHAT_APP_ID、WECHAT_APP_SECRET、WECHAT_TOKEN、WECHAT_API_TOKEN
   ```

2. 构建并启动：
   ```bash
   docker compose up -d
   ```

3. 查看日志：`docker compose logs -f`

4. 停止：`docker compose down`

### 使用 docker run

构建并运行（端口与 wechat-server 一致，便于替换）：

```bash
docker build -t wechat-sso-bridge .
docker run -d --restart always -p 3000:3000 \
  -e WECHAT_APP_ID=wx... \
  -e WECHAT_APP_SECRET=... \
  -e WECHAT_TOKEN=... \
  -e WECHAT_API_TOKEN=... \
  wechat-sso-bridge
```

或使用 env 文件：

```bash
cp .env.example .env
# 编辑 .env 填入实际值
docker run -d --restart always -p 3000:3000 --env-file .env wechat-sso-bridge
```

## 微信公众平台配置

1. 基本配置：填写 AppID、AppSecret，与上述环境变量一致。
2. 服务器配置：URL 填 `https://<你的域名>/api/wechat`，Token 与 `WECHAT_TOKEN` 一致；EncodingAESKey 随机生成即可；消息加解密方式可选明文。

## API（与 wechat-server 兼容）

- `GET /api/wechat/user?code=<code>` — Header `Authorization: <WECHAT_API_TOKEN>`，返回 `{ "success": true, "data": "<openid>" }`。
- `GET /api/wechat/access_token` — Header `Authorization: <WECHAT_API_TOKEN>`，返回 `access_token` 与 `expiration`。
