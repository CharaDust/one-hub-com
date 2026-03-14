// https://github.com/vitejs/vite/discussions/3448
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

// ----------------------------------------------------------------------
// 使用 '/' 使资源从根路径加载（/assets/xxx.js），这样无论访问 / 还是 /panel/topup，脚本地址都是 /assets/xxx，后端能正确命中静态中间件。
// 子路径部署时设置 VITE_BASE_PATH，例如 /one-hub/，需与后端 WEB_BASE_PATH 一致（如 /one-hub）
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  // 不使用自定义 outDir，Docker 内用默认 dist 再 mv 为 build，避免 build-html 解析失败
  plugins: [react(), jsconfigPaths()],
  // https://github.com/jpuri/react-draft-wysiwyg/issues/1317
  //   define: {
  //     global: 'window'
  //   },
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1')
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1')
      }
    ]
  },
  server: {
    // this ensures that the browser opens upon server start
    open: true,
    // this sets a default port to 3000
    host: true,
    port: 3010,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000', // 设置代理的目标服务器
        changeOrigin: true
      }
    }
  },
  preview: {
    // this ensures that the browser opens upon preview start
    open: true,
    // this sets a default port to 3000
    port: 3010
  }
});
