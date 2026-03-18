const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',
  productionSourceMap: false,
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: 'all',
    proxy: {
      '/ws/session': {
        target: 'ws://127.0.0.1:3000',
        ws: true,
        changeOrigin: true
      },
      '/offdo': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        pathRewrite: { '^/offdo': '' }
      },
      '/api/llm': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        pathRewrite: { '^/api/llm': '' }
      },
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      },
      '/llm': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    },
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
      overlay: {
        runtimeErrors: (error) => {
          const msg = error?.message || error?.toString() || String(error)

          if (msg.includes('ResizeObserver')) {
            return false
          }
          if (msg === 'cancel' || msg === 'canceled' || msg.includes('cancel')) {
            return false
          }
          if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
            return false
          }
          return true
        }
      }
    }
  }
})
