# 支付回调（计全等）未到账排查

扫码/异步支付完成后，若**二维码不消失、积分未增加**，说明支付网关的**异步通知没有成功到达本系统**。

## 1. 确认回调地址是公网可访问的

计全会向「通知地址」发起 **POST** 请求，该地址必须能从公网访问。

- **支付网关里的「通知域名」**：在 管理后台 → 支付 → 编辑对应网关 → **通知域名** 填你的**公网访问地址**（如 `https://your-domain.com`），不要填 `localhost` 或内网 IP。
- 若通知域名为空，系统会使用 **设置 → 服务器地址 (ServerAddress)**。请将该选项改为公网地址（如 `https://your-domain.com`）。

下单时日志会输出当前使用的 notify 地址，例如：

```text
jeepay unified order notify_url=https://your-domain.com/api/payment/notify/xxx (must be publicly reachable)
```

若这里出现 `http://localhost:...` 或内网地址，说明配置有误，计全无法访问，自然不会回调。

## 2. 确认计全侧配置

- 若计全商户后台有「异步通知地址」等配置，需与上述地址一致（协议、域名、路径均一致）。
- 回调路径格式：`{通知域名}/api/payment/notify/{该支付网关的 UUID}`。

## 3. 确认请求能到达本机

- 若前面有 **Nginx/反向代理**：确保 `POST /api/payment/notify/:uuid` 被转发到后端，且不改写路径。
- 若使用 **Docker**：确保端口映射或代理把 80/443 的该路径转到运行本系统的容器。

收到回调时，应用日志会出现类似：

```text
jeepay notify received, mchOrderNo=xxx, state=2
```

若始终没有这条日志，说明 POST 请求未到达本应用（仍可能是 URL 错误、代理或防火墙问题）。

## 4. 验签失败

若已有 `jeepay notify received` 但随后出现 `sign mismatch`，说明密钥或签名算法与计全不一致，需核对网关配置中的**密钥**与计全商户后台一致。
