const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  
  // 设置公共路径，确保打包后的资源路径正确
  publicPath: '/',
  
  // 输出目录
  outputDir: 'dist',
  
  // 静态资源目录
  assetsDir: 'static',
  
  // 生产环境不生成 source map，减小打包体积
  productionSourceMap: false,
  
  // 开发服务器配置
  devServer: {
    host: '0.0.0.0',       
    port: 8080,
    allowedHosts: 'all',      // ✅ 防止 "Invalid Host header"
    proxy: {
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
      overlay: {
        // 忽略 ResizeObserver 错误，这是浏览器的无害警告
        runtimeErrors: (error) => {
          if (error.message.includes('ResizeObserver')) {
            return false
          }
          return true
        }
      }
    }
  }
})
