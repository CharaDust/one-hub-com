# 微信扫码登录 - 本机测试 Demo

本目录为**独立前端 Demo**，用于在本机测试微信扫码登录流程，并查看返回参数与下一步动作。不依赖对 wechat-sso-bridge 的代码修改。

## 功能

- 一个「登录」按钮，点击后弹框内嵌扫码页
- 扫码完成后自动关闭弹框，并展示 **code**、**openid**、接口原始响应
- 展示**下一步动作**说明（用 openid 写登录态、跳转等）

## 使用步骤

1. **启动 wechat-sso-bridge**（与本目录同级）  
   ```bash
   cd ../wechat-sso-bridge
   go run .
   ```  
   默认端口为 3000。

2. **在本目录启动静态服务**  
   ```bash
   npx serve -l 8080
   ```  
   或安装后执行 `npm start`，也可使用 Python：`python -m http.server 8080`  
   确保通过 `http://localhost:8080` 访问页面（不要用 `file://` 打开）。

3. **打开 Demo 页**  
   浏览器访问：`http://localhost:8080/demo.html`

4. **配置（可选）**  
   展开「配置」：  
   - **登录服务器地址**：默认 `http://localhost:3000`，与 wechat-sso-bridge 一致即可。  
   - **访问凭证**：从 wechat-sso-bridge 的 `.env` 中复制 `WECHAT_API_TOKEN` 填入。

5. **点击「登录」**  
   弹框内会加载扫码页，使用微信扫一扫完成登录。

6. **查看结果**  
   扫码成功后弹框自动关闭，页面会显示：  
   - **参数**：code、openid、接口原始响应  
   - **下一步动作**：用 openid 写登录态、跳转等说明  

## 文件说明

| 文件 | 说明 |
|------|------|
| `demo.html` | 入口页：登录按钮、弹框（内嵌扫码页）、结果展示 |
| `demo-callback.html` | 回调页（在弹框 iframe 内打开）：用 code 换 openid，并通知父页关闭弹框、展示结果 |

## 注意事项

- 必须通过 **HTTP 静态服务**打开 `demo.html`（如 `http://localhost:8080/demo.html`），否则无法完成回调与 postMessage。
- 对接说明与接口约定见 wechat-sso-bridge 目录下的「接口说明-外部系统对接.md」。
