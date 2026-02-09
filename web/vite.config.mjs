// https://github.com/vitejs/vite/discussions/3448
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

// ----------------------------------------------------------------------

export default defineConfig({
  base: './',
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
