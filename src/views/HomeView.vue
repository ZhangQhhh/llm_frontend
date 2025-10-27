<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">🛡️ 边境检查站智能助手</div>
        <h1 class="hero-title">
          边检知识问答系统
        </h1>
        <p class="hero-subtitle">
          基于大语言模型的专业知识库，为边境检查工作提供精准、高效的智能问答服务
        </p>
        <div class="hero-actions">
          <router-link to="/knowledge-qa" class="btn btn-primary">
            <span class="icon">🎓</span>
            知识问答
          </router-link>
          <router-link to="/conversation" class="btn btn-secondary">
            <span class="icon">💬</span>
            多轮对话
          </router-link>
        </div>
      </div>

      <div class="hero-visual">
        <div class="floating-card card-1">
          <div class="card-icon">🤖</div>
          <div class="card-text">AI智能分析</div>
        </div>
        <div class="floating-card card-2">
          <div class="card-icon">📚</div>
          <div class="card-text">知识库检索</div>
        </div>
        <div class="floating-card card-3">
          <div class="card-icon">⚡</div>
          <div class="card-text">实时响应</div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <h2 class="section-title">核心功能</h2>
        <p class="section-subtitle">专业的AI能力，为边检工作提供全方位的智能支持</p>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>精准检索</h3>
            <p>基于向量检索和重排序技术，快速定位最相关的知识内容</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">💭</div>
            <h3>思考过程可视化</h3>
            <p>展示AI的推理过程，让回答更加透明可信</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h3>多轮对话</h3>
            <p>支持上下文理解，实现连续、自然的对话交互</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📖</div>
            <h3>来源追溯</h3>
            <p>每个回答都标注参考来源，确保信息可追溯</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🚀</div>
            <h3>多模型支持</h3>
            <p>集成多种先进大模型，满足不同场景需求</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🎨</div>
            <h3>优雅界面</h3>
            <p>现代化的UI设计，提供流畅的用户体验</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="cta-content">
        <h2>准备好开始了吗？</h2>
        <p>立即体验AI驱动的智能问答系统</p>
        <div class="cta-actions">
          <router-link to="/login" class="btn btn-light">
            登录使用
          </router-link>
          <router-link to="/knowledge-qa" class="btn btn-outline">
            免费试用
          </router-link>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>边检知识问答系统</h4>
            <p>为边境检查工作提供专业智能支持</p>
          </div>
          <div class="footer-section">
            <h4>快速链接</h4>
            <ul>
              <li><router-link to="/knowledge-qa">知识问答</router-link></li>
              <li><router-link to="/conversation">多轮对话</router-link></li>
              <li><router-link to="/login">登录</router-link></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>关于</h4>
            <p>© 2025 边检知识问答系统<br>保留所有权利</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HomeView'
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #ffffff;
}

/* Hero Section */
.hero {
  min-height: 90vh;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #1f2937 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
  opacity: 0.3;
}

.hero-content {
  max-width: 600px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.hero-title {
  font-size: 64px;
  font-weight: 800;
  color: white;
  margin: 0 0 1.5rem 0;
  line-height: 1.2;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 3rem 0;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(245, 158, 11, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-4px);
}

.btn .icon {
  font-size: 24px;
}

/* Hero Visual */
.hero-visual {
  position: absolute;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
  display: none;
}

@media (min-width: 1200px) {
  .hero {
    justify-content: space-between;
    padding: 4rem 10%;
  }

  .hero-content {
    text-align: left;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .hero-visual {
    display: block;
  }
}

.floating-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
  animation: float 3s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-1 {
  animation-delay: 0s;
  margin-bottom: 2rem;
}

.card-2 {
  animation-delay: 1s;
  margin-bottom: 2rem;
  margin-left: 2rem;
}

.card-3 {
  animation-delay: 2s;
  margin-left: 1rem;
}

.card-icon {
  font-size: 32px;
}

.card-text {
  font-size: 16px;
  font-weight: 600;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Features Section */
.features {
  padding: 6rem 2rem;
  background: #f9fafb;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  text-align: center;
  font-size: 42px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.section-subtitle {
  text-align: center;
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 4rem 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  transition: all 0.3s;
  border: 1px solid #e5e7eb;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: #2563eb;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 1.5rem;
}

.feature-card h3 {
  font-size: 22px;
  color: #1f2937;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.feature-card p {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}

/* CTA Section */
.cta {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  padding: 6rem 2rem;
  text-align: center;
}

.cta-content h2 {
  font-size: 42px;
  font-weight: 700;
  color: white;
  margin: 0 0 1rem 0;
}

.cta-content p {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 3rem 0;
}

.cta-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-light {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-light:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(245, 158, 11, 0.4);
}

.btn-outline {
  background: transparent;
  color: white;
  border-color: white;
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
}

/* Footer */
.footer {
  background: #1f2937;
  color: white;
  padding: 4rem 2rem 2rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
  margin-bottom: 2rem;
}

.footer-section h4 {
  font-size: 18px;
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.footer-section p {
  color: #9ca3af;
  line-height: 1.6;
  margin: 0;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section ul li {
  margin-bottom: 0.75rem;
}

.footer-section ul li a {
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-section ul li a:hover {
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 42px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .section-title {
    font-size: 32px;
  }

  .cta-content h2 {
    font-size: 32px;
  }
}
</style>
