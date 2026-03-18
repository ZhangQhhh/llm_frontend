<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <!-- HUD Decorations -->
      <template v-if="!shouldReduceEffects">
        <div class="hud-corner top-left"></div>
        <div class="hud-corner top-right"></div>
        <div class="hud-corner bottom-left"></div>
        <div class="hud-corner bottom-right"></div>
        <div class="scan-line"></div>
      </template>

      <!-- 3D Canvas Background -->
      <canvas v-show="!shouldDisable3DBackground" ref="threeCanvas" class="three-canvas"></canvas>
      
      <!-- Video Background -->
      <video
        v-if="!shouldReduceEffects"
        class="video-background" 
        :src="require('@/assets/allPic/public/tech.mp4')"
        autoplay 
        loop 
        muted 
        playsinline
      ></video>
      
      <!-- Animated Grid Background -->
      <div v-if="!shouldReduceEffects" class="grid-background"></div>
      
      <!-- Glowing Orbs -->
      <template v-if="!shouldReduceEffects">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </template>
      
      <div class="hero-content">
        <!-- <div class="hero-badge">
          <span class="badge-icon">🛡</span>
          <span class="badge-text">安徽出入境边防检查总站智能助手</span>
          <span class="badge-pulse"></span>
        </div> -->
        <h1 class="hero-title">
          <span class="cyber-glitch" data-text="皖美智脑">皖美智脑</span>
        </h1>
        <p class="hero-subtitle">
          <span class="typing-text">基于大语言模型的专业知识库，为边防检查工作提供智能问答服务</span>
        </p>
        <!-- <div class="hero-decorations">
          <div class="decoration-item">
            <div class="decoration-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div class="decoration-label">智能问答</div>
          </div>
          <div class="decoration-item">
            <div class="decoration-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21L16.65 16.65"/>
              </svg>
            </div>
            <div class="decoration-label">知识检索</div>
          </div>
          <div class="decoration-item">
            <div class="decoration-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            </div>
            <div class="decoration-label">专业解答</div>
          </div>
        </div> -->
        <div class="hero-actions">
          <router-link to="/knowledge-qa" class="btn btn-module home-module-qa">
            <span class="btn-shine"></span>
            <el-icon class="module-icon"><Search /></el-icon>
            <span>业务问答</span>
          </router-link>
          <router-link to="/conversation" class="btn btn-module home-module-conversation">
            <span class="btn-shine"></span>
            <el-icon class="module-icon"><ChatDotRound /></el-icon>
            <span>智能对话</span>
          </router-link>
          <router-link to="/exam" class="btn btn-module home-module-exam">
            <span class="btn-shine"></span>
            <el-icon class="module-icon"><Reading /></el-icon>
            <span>边检智学</span>
          </router-link>
          <router-link to="/smart-office-v2" class="btn btn-module">
          <router-link to="/smart-office" class="btn btn-module home-module-office">
            <span class="btn-shine"></span>
            <el-icon class="module-icon"><Document /></el-icon>
            <span>公文助手</span>
          </router-link>
          <router-link to="/immigration-12367" class="btn btn-module home-module-immigration">
            <span class="btn-shine"></span>
            <el-icon class="module-icon"><Phone /></el-icon>
            <span>12367 助手</span>
          </router-link>
          <router-link to="/data-analysis" class="btn btn-module home-module-analysis">
            <span class="btn-shine"></span>
            <el-icon class="module-icon"><DataLine /></el-icon>
            <span>数研报告</span>
          </router-link>
          <!-- <a href="javascript:void(0)" class="btn btn-secondary" @click="handleHelpClick"> -->
            <!-- <span class="btn-shine"></span> -->
            <!-- <span class="icon">❓</span> -->
            <!-- <span>帮助中心</span> -->
          <!-- </a> -->
        </div>
      </div>

      <div class="hero-visual">
        <a href="/docx/" class="floating-card card-1">
          <div class="card-glow"></div>
          <div class="card-icon"><el-icon><Document /></el-icon></div>
          <div class="card-text">数研报告</div>
          <div class="card-progress"></div>
        </a>
        <router-link to="/smart-office-v2" class="floating-card card-2">
          <div class="card-glow"></div>
          <div class="card-icon"><el-icon><OfficeBuilding /></el-icon></div>
          <div class="card-text">公文助手</div>
          <div class="card-progress"></div>
        </router-link>
        <router-link to="/exam" class="floating-card card-3">
          <div class="card-glow"></div>
          <div class="card-icon"><el-icon><Reading /></el-icon></div>
          <div class="card-text">边检智学</div>
          <div class="card-progress"></div>
        </router-link>
      </div>
      
      <!-- Scroll Indicator 已移除 -->
    </section>

    <!-- Tech Advantages Section -->
    <!-- <section class="tech-advantages">
      <div class="container">
        <div class="section-header">
          <div class="section-badge">⚡ TECHNOLOGY</div>
          <h2 class="section-title">
            <span class="gradient-text">技术优势</span>
          </h2>
          <p class="section-subtitle">基于前沿AI技术，打造专业可靠的智能问答系统</p>
        </div> -->
<!-- 
        <div class="advantages-grid"> -->
          <!-- 大语言模型 -->
          <!-- <div class="advantage-card large">
            <div class="card-header">
              <div class="card-icon-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <div class="card-title-group">
                <h3>大语言模型驱动</h3>
                <span class="tech-badge">核心技术</span>
              </div>
            </div>
            <p>集成 Qwen、DeepSeek 等多种先进大模型，支持思考链推理，提供专业、准确的智能回答</p>
            <div class="tech-tags">
              <span class="tech-tag">Qwen-32B</span>
              <span class="tech-tag">DeepSeek-R1</span>
              <span class="tech-tag">思考模式</span>
            </div>
          </div> -->

          <!-- 向量检索 -->
          <!-- <div class="advantage-card">
            <div class="card-header">
              <div class="card-icon-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3>智能检索引擎</h3>
            </div>
            <p>高召回率检索技术，让您的问题得到全面、精准的解答</p>
          </div> -->

          <!-- 多轮对话 -->
          <!-- <div class="advantage-card">
            <div class="card-header">
              <div class="card-icon-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h3>上下文记忆</h3>
            </div>
            <p>支持多轮对话，自动管理上下文，实现连续自然的交互体验</p>
            <div class="feature-list">
              <div class="feature-item-mini">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                会话管理
              </div>
              <div class="feature-item-mini">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                历史追溯
              </div>
            </div>
          </div> -->

          <!-- 来源追溯 -->
          <!-- <div class="advantage-card">
            <div class="card-header">
              <div class="card-icon-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <h3>来源可追溯</h3>
            </div>
            <p>每个回答标注参考来源和置信度分数，确保信息透明可靠</p>
            <div class="feature-list">
              <div class="feature-item-mini">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                文档引用
              </div>
              <div class="feature-item-mini">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                评分展示
              </div>
            </div>
          </div> -->

          <!-- 智能评测 -->
          <!-- <div class="advantage-card accent">
            <div class="card-header">
              <div class="card-icon-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h3>智能评测系统</h3>
            </div> -->
            <!-- <p>在线考试、自动评分、详细解析，助力专业能力提升</p>
            <div class="accent-badge">NEW</div> -->
          <!-- </div> -->
        <!-- </div> -->
      <!-- </div> -->
    <!-- </section> -->

    <!-- CTA Section -->
    <!-- <section class="cta">
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
    </section> -->

    <!-- Footer -->
    <!-- <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>皖美智脑</h4>
            <p>为边防检查工作提供专业智能支持</p>
          </div> -->
          <!-- <div class="footer-section"> -->
            <!-- <h4>快速链接</h4> -->
            <!-- <ul>
              <li><router-link to="/knowledge-qa">知识问答</router-link></li>
              <li><router-link to="/conversation">多轮对话</router-link></li>
              <li><router-link to="/exam">智能家教</router-link></li>
              <li><router-link to="/test-explain">题目解析</router-link></li>
              <li><router-link to="/login">登录</router-link></li> -->
            <!-- </ul> -->
          <!-- </div> -->
          <!-- <div class="footer-section">
            <h4>关于</h4>
            <p>© 2025 边检知识问答系统<br>保留所有权利</p>
          </div>
        </div>
      </div>
    </footer> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import * as THREE from 'three';
import { 
  Document,
  OfficeBuilding, 
  Reading,
  Search,
  ChatDotRound,
  Phone,
  DataLine
} from '@element-plus/icons-vue';

export default defineComponent({
  name: 'HomeView',
  components: {
    Document,
    OfficeBuilding,
    Reading,
    Search,
    ChatDotRound,
    Phone,
    DataLine
  },
  setup() {
    const store = useStore();
    const shouldDisable3DBackground = computed(
      () => store.getters['performance/shouldDisable3DBackground']
    );
    const shouldReduceEffects = computed(
      () => store.getters['performance/shouldReduceEffects']
    );
    const shouldDisableAnimations = computed(
      () => store.getters['performance/shouldDisableAnimations']
    );
    const shouldDisableScrollEffects = computed(
      () => shouldReduceEffects.value || shouldDisableAnimations.value
    );
    const threeCanvas = ref<HTMLCanvasElement | null>(null);
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    let renderer: THREE.WebGLRenderer | null = null;
    let particles: THREE.Points | null = null;
    let animationId: number | null = null;
    let particlesGeometry: THREE.BufferGeometry | null = null;
    let particlesMaterial: THREE.PointsMaterial | null = null;
    let isThreeActive = false;
    let scrollEffectsEnabled = false;

    const handleResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    // 粒子样式生成
    const getParticleStyle = () => {
      const size = Math.random() * 4 + 2;
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * 5;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      
      return {
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}%`,
        top: `${y}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      };
    };


    // 初始化Three.js场景
    const initThree = () => {
      if (!threeCanvas.value || isThreeActive) return;
      animationId = null;

      // 创建场景
      scene = new THREE.Scene();

      // 创建相机
      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 50;

      // 创建渲染器
      renderer = new THREE.WebGLRenderer({
        canvas: threeCanvas.value,
        alpha: true,
        antialias: true
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // 创建粒子系统
      particlesGeometry = new THREE.BufferGeometry();
      const particlesCount = 1000;
      const posArray = new Float32Array(particlesCount * 3);

      for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 100;
      }

      particlesGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(posArray, 3)
      );

      particlesMaterial = new THREE.PointsMaterial({
        size: 0.15,
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);

      // 动画循环
      const animate = () => {
        animationId = requestAnimationFrame(animate);

        if (!scene || !camera || !renderer || !particles) {
          return;
        }

        // 旋转粒子
        particles.rotation.x += 0.0005;
        particles.rotation.y += 0.0008;

        renderer.render(scene, camera);
      };

      animate();

      // 窗口大小调整
      window.addEventListener('resize', handleResize);
      isThreeActive = true;
    };

    const cleanupThree = () => {
      if (!isThreeActive) return;

      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (renderer) {
        renderer.dispose();
      }
      if (particlesGeometry) {
        particlesGeometry.dispose();
        particlesGeometry = null;
      }
      if (particlesMaterial) {
        particlesMaterial.dispose();
        particlesMaterial = null;
      }

      window.removeEventListener('resize', handleResize);

      renderer = null;
      camera = null;
      scene = null;
      particles = null;
      isThreeActive = false;
    };

    // 滚动动画处理
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // 视差效果 - 背景网格
      const gridBackground = document.querySelector('.grid-background') as HTMLElement;
      if (gridBackground) {
        gridBackground.style.transform = `translateY(${scrollY * 0.5}px)`;
      }
      
      // 视差效果 - Hero内容
      const heroContent = document.querySelector('.hero-content') as HTMLElement;
      if (heroContent) {
        heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
        heroContent.style.opacity = (1 - (scrollY / window.innerHeight)).toString();
      }
      
      // 视差效果 - 粒子
      const particles = document.querySelectorAll('.particle');
      particles.forEach((particle, index) => {
        const speed = 0.1 + (index * 0.05);
        (particle as HTMLElement).style.transform = `translateY(${scrollY * speed}px)`;
      });
      
      // 元素渐入动画
      const elements = document.querySelectorAll('.tech-advantages, .cta');
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.8;
        
        if (isVisible) {
          element.classList.add('visible');
        }
      });
    };

    const resetScrollEffects = () => {
      const gridBackground = document.querySelector('.grid-background') as HTMLElement;
      if (gridBackground) {
        gridBackground.style.transform = '';
      }

      const heroContent = document.querySelector('.hero-content') as HTMLElement;
      if (heroContent) {
        heroContent.style.transform = '';
        heroContent.style.opacity = '';
      }

      const particles = document.querySelectorAll('.particle');
      particles.forEach((particle) => {
        (particle as HTMLElement).style.transform = '';
      });

      const elements = document.querySelectorAll('.tech-advantages, .cta');
      elements.forEach((element) => {
        element.classList.add('visible');
      });
    };

    const enableScrollEffects = () => {
      if (scrollEffectsEnabled) return;
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      scrollEffectsEnabled = true;
    };

    const disableScrollEffects = () => {
      if (!scrollEffectsEnabled) {
        resetScrollEffects();
        return;
      }
      window.removeEventListener('scroll', handleScroll);
      scrollEffectsEnabled = false;
      resetScrollEffects();
    };

    onMounted(() => {
      if (!shouldDisable3DBackground.value) {
        initThree();
      }
      if (shouldDisableScrollEffects.value) {
        disableScrollEffects();
      } else {
        enableScrollEffects();
      }
    });

    onUnmounted(() => {
      cleanupThree();
      disableScrollEffects();
    });

    watch(shouldDisable3DBackground, (value) => {
      if (value) {
        cleanupThree();
      } else {
        initThree();
      }
    });

    watch(shouldDisableScrollEffects, (value) => {
      if (value) {
        disableScrollEffects();
      } else {
        enableScrollEffects();
      }
    });

    // 帮助中心暂未开放
    const handleHelpClick = () => {
      ElMessage.info('帮助中心文档正在完善中，敬请期待...');
    };

    return {
      threeCanvas,
      getParticleStyle,
      handleHelpClick,
      shouldReduceEffects,
      shouldDisable3DBackground
    };
  }
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #0a0e27;
  scroll-behavior: smooth;
  margin-top: -60px;  /* 向上延伸覆盖导航栏 */
  padding-top: 60px;  /* 补偿内容位置 */
}

/* Hero Section */
.hero {
  /* Main hero section styling */
  min-height: 100vh;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  padding-bottom: 12rem;
  position: relative;
  overflow: hidden;
}

/* 3D Canvas Background */
.three-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.6;
}

/* Video Background */
.video-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  z-index: 0;
  opacity: 0.4;
}

/* Animated Grid Background - 科幻网格 */
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 212, 255, 0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.15) 1px, transparent 1px);
  background-size: 60px 60px;
  animation: gridMove 25s linear infinite;
  z-index: 1;
  transition: transform 0.1s ease-out;
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

/* Floating Particles */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  animation: particleFloat 15s infinite ease-in-out;
}

@keyframes particleFloat {
  0%, 100% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(50px);
    opacity: 0;
  }
}

/* Glowing Orbs - 科幻风格 */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.4;
  animation: orbFloat 20s infinite ease-in-out;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #00d4ff 0%, #0066ff 40%, transparent 70%);
  top: -15%;
  left: -15%;
  animation-delay: 0s;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #a855f7 0%, #6366f1 40%, transparent 70%);
  bottom: -15%;
  right: -15%;
  animation-delay: 7s;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #22d3ee 0%, #0ea5e9 40%, transparent 70%);
  top: 40%;
  left: 60%;
  animation-delay: 14s;
}

@keyframes orbFloat {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(50px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-50px, 50px) scale(0.9);
  }
}

.hero-content {
  max-width: 100%;
  text-align: center;
  position: relative;
  z-index: 10;
  transition: all 0.3s ease-out;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  backdrop-filter: blur(20px);
  color: #60a5fa;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2rem;
  border: 1px solid rgba(96, 165, 250, 0.3);
  position: relative;
  overflow: hidden;
  animation: badgeGlow 3s ease-in-out infinite;
}

.badge-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.4) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes badgeGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(96, 165, 250, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(96, 165, 250, 0.6);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

.hero-title {
  font-size: 180px;
  font-weight: 900;
  margin: 0 0 1.5rem 0;
  line-height: 1.1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  letter-spacing: 15px;
  white-space: nowrap;
  position: relative;
  z-index: 1;
}

/* 赛博朋克故障风格 */
.cyber-glitch {
  position: relative;
  color: #f0f8ff; /* 冷白色 (AliceBlue) */
  
  /* 强立体凹凸感 + 科技冷光 */
  text-shadow: 
    /* 强高光层 - 顶部左侧 */
    -2px -2px 1px rgba(255, 255, 255, 0.9),
    /* 深阴影层 - 底部右侧 */
    3px 3px 5px rgba(0, 0, 0, 0.9),
    /* 中间过渡层 */
    1px 1px 2px rgba(0, 0, 0, 0.5),
    /* 外发光 - 冷蓝色 */
    0 0 20px rgba(64, 158, 255, 0.6),
    0 0 40px rgba(64, 158, 255, 0.3);
  
  /* 全息扫描线效果 - 调整为冷蓝色 */
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(64, 158, 255, 0.1) 2px,
    rgba(64, 158, 255, 0.1) 4px
  );
  
  /* 电磁干扰动画 */
  animation: holographic-flicker 4s infinite alternate;
}

@keyframes holographic-flicker {
  0%, 100% { opacity: 1; filter: brightness(1); letter-spacing: 15px; }
  3% { opacity: 0.9; filter: brightness(1.1); letter-spacing: 15px; }
  6% { opacity: 1; filter: brightness(1); letter-spacing: 15px; }
  7% { opacity: 0.7; filter: brightness(0.9); letter-spacing: 14px; } /* 微微缩放 */
  8% { opacity: 1; filter: brightness(1); letter-spacing: 15px; }
  70% { opacity: 1; filter: brightness(1); letter-spacing: 15px; }
  72% { opacity: 0.8; filter: brightness(1.2); letter-spacing: 16px; } /* 微微扩张 */
  74% { opacity: 1; filter: brightness(1); letter-spacing: 15px; }
}

.cyber-glitch::before,
.cyber-glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  opacity: 0.7; /* 降低故障层不透明度，让主体更清晰 */
}

/* 青色偏移层 */
.cyber-glitch::before {
  left: 2px;
  text-shadow: -2px 0 #00ffff;
  clip: rect(24px, 550px, 90px, 0);
  animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
}

/* 品红偏移层 */
.cyber-glitch::after {
  left: -2px;
  text-shadow: -2px 0 #ff00ff;
  clip: rect(85px, 550px, 140px, 0);
  animation: glitch-anim-2 3s infinite linear alternate-reverse;
}

@keyframes glitch-anim-1 {
  0% { clip: rect(20px, 9999px, 80px, 0); transform: skew(0.5deg); }
  5% { clip: rect(90px, 9999px, 100px, 0); transform: skew(0.5deg); }
  10% { clip: rect(10px, 9999px, 85px, 0); transform: skew(0.5deg); }
  15% { clip: rect(60px, 9999px, 120px, 0); transform: skew(0.5deg); }
  20% { clip: rect(20px, 9999px, 50px, 0); transform: skew(0); }
  25% { clip: rect(100px, 9999px, 140px, 0); transform: skew(0.5deg); }
  30% { clip: rect(40px, 9999px, 90px, 0); transform: skew(0.5deg); }
  35% { clip: rect(120px, 9999px, 160px, 0); transform: skew(0); }
  40% { clip: rect(10px, 9999px, 60px, 0); transform: skew(0.5deg); }
  45% { clip: rect(80px, 9999px, 130px, 0); transform: skew(0.5deg); }
  50% { clip: rect(30px, 9999px, 70px, 0); transform: skew(0); }
  55% { clip: rect(110px, 9999px, 150px, 0); transform: skew(0.5deg); }
  60% { clip: rect(5px, 9999px, 40px, 0); transform: skew(0.5deg); }
  65% { clip: rect(70px, 9999px, 110px, 0); transform: skew(0); }
  70% { clip: rect(25px, 9999px, 95px, 0); transform: skew(0.5deg); }
  75% { clip: rect(130px, 9999px, 170px, 0); transform: skew(0.5deg); }
  80% { clip: rect(50px, 9999px, 100px, 0); transform: skew(0); }
  85% { clip: rect(15px, 9999px, 55px, 0); transform: skew(0.5deg); }
  90% { clip: rect(95px, 9999px, 125px, 0); transform: skew(0.5deg); }
  95% { clip: rect(35px, 9999px, 75px, 0); transform: skew(0); }
  100% { clip: rect(65px, 9999px, 115px, 0); transform: skew(0.5deg); }
}

@keyframes glitch-anim-2 {
  0% { clip: rect(90px, 9999px, 150px, 0); transform: skew(-0.5deg); }
  5% { clip: rect(10px, 9999px, 50px, 0); transform: skew(-0.5deg); }
  10% { clip: rect(120px, 9999px, 160px, 0); transform: skew(-0.5deg); }
  15% { clip: rect(30px, 9999px, 70px, 0); transform: skew(-0.5deg); }
  20% { clip: rect(80px, 9999px, 110px, 0); transform: skew(0); }
  25% { clip: rect(40px, 9999px, 90px, 0); transform: skew(-0.5deg); }
  30% { clip: rect(130px, 9999px, 170px, 0); transform: skew(-0.5deg); }
  35% { clip: rect(20px, 9999px, 60px, 0); transform: skew(0); }
  40% { clip: rect(100px, 9999px, 140px, 0); transform: skew(-0.5deg); }
  45% { clip: rect(50px, 9999px, 80px, 0); transform: skew(-0.5deg); }
  50% { clip: rect(140px, 9999px, 180px, 0); transform: skew(0); }
  55% { clip: rect(10px, 9999px, 40px, 0); transform: skew(-0.5deg); }
  60% { clip: rect(110px, 9999px, 150px, 0); transform: skew(-0.5deg); }
  65% { clip: rect(60px, 9999px, 100px, 0); transform: skew(0); }
  70% { clip: rect(25px, 9999px, 65px, 0); transform: skew(-0.5deg); }
  75% { clip: rect(95px, 9999px, 135px, 0); transform: skew(-0.5deg); }
  80% { clip: rect(45px, 9999px, 85px, 0); transform: skew(0); }
  85% { clip: rect(125px, 9999px, 165px, 0); transform: skew(-0.5deg); }
  90% { clip: rect(15px, 9999px, 55px, 0); transform: skew(-0.5deg); }
  95% { clip: rect(85px, 9999px, 125px, 0); transform: skew(0); }
  100% { clip: rect(35px, 9999px, 75px, 0); transform: skew(-0.5deg); }
}

.hero-subtitle {
  font-size: 30px;
  color: rgba(255, 255, 255, 0.8);
  margin: 1.5rem 0 2.5rem 0;
  line-height: 1.8;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  letter-spacing: 0px;
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
}

.typing-text {
  display: inline-block;
  overflow: hidden;
  border-right: 3px solid #60a5fa;
  white-space: nowrap;
  animation: typing 5s steps(35, end) forwards, blink-caret 0.75s step-end infinite;
  width: 0;
  max-width: fit-content;
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink-caret {
  from, to { border-color: transparent; }
  50% { border-color: #60a5fa; }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Hero Decorations */
.hero-decorations {
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.decoration-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 2rem;
  background: rgba(59, 130, 246, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 16px;
  transition: all 0.3s ease;
  animation: decorationFloat 3s ease-in-out infinite;
}

.decoration-item:nth-child(1) {
  animation-delay: 0s;
}

.decoration-item:nth-child(2) {
  animation-delay: 0.5s;
}

.decoration-item:nth-child(3) {
  animation-delay: 1s;
}

.decoration-item:hover {
  transform: translateY(-8px);
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(96, 165, 250, 0.4);
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
}

@keyframes decorationFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.decoration-icon {
  width: 48px;
  height: 48px;
  color: #60a5fa;
  filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.5));
  animation: iconPulse 2s ease-in-out infinite;
}

.decoration-icon svg {
  width: 100%;
  height: 100%;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.decoration-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

.hero-actions {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.btn:hover .btn-shine {
  left: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.5);
}

.btn-arrow {
  transition: transform 0.3s;
}

.btn-primary:hover .btn-arrow {
  transform: translateX(5px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 15px 35px rgba(255, 255, 255, 0.1);
}

.btn .icon {
  font-size: 20px;
}

/* HUD Decorations */
.hud-corner {
  position: absolute;
  width: 150px;
  height: 150px;
  border: 2px solid rgba(59, 130, 246, 0.3);
  pointer-events: none;
  z-index: 2;
}

.top-left {
  top: 40px;
  left: 40px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 20px;
}

.top-left::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 2px;
  background: #60a5fa;
  box-shadow: 0 0 10px #60a5fa;
}

.top-left::after {
  content: 'SYS.ONLINE';
  position: absolute;
  top: 10px;
  left: 10px;
  color: rgba(96, 165, 250, 0.8);
  font-family: monospace;
  font-size: 12px;
  letter-spacing: 2px;
  animation: textBlink 2s infinite;
}

.top-right {
  top: 40px;
  right: 40px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 20px;
}

.top-right::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 2px;
  background: #60a5fa;
  box-shadow: 0 0 10px #60a5fa;
}

.top-right::after {
  content: 'AI.CORE';
  position: absolute;
  top: 10px;
  right: 10px;
  color: rgba(96, 165, 250, 0.8);
  font-family: monospace;
  font-size: 12px;
  letter-spacing: 2px;
}

.bottom-left {
  bottom: 40px;
  left: 40px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 20px;
}

.bottom-left::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 2px;
  background: #60a5fa;
  box-shadow: 0 0 10px #60a5fa;
}

.bottom-right {
  bottom: 40px;
  right: 40px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 20px;
}

.bottom-right::before {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 2px;
  background: #60a5fa;
  box-shadow: 0 0 10px #60a5fa;
}

@keyframes textBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Scan Line Effect */
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%);
  background-size: 100% 100%;
  animation: scanMove 8s linear infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes scanMove {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* 增强按钮样式 */
.btn-module {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  backdrop-filter: blur(20px);
  color: white;
  border: 1px solid rgba(96, 165, 250, 0.3);
  padding: 1.5rem 3rem;
  font-size: 32px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
  white-space: nowrap;
  text-align: center;
  min-width: 220px;
  max-width: 300px;
}

.btn-module::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #60a5fa, transparent, #60a5fa);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-module:hover {
  transform: translateY(-4px);
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
  border-color: #60a5fa;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

.btn-module:hover::before {
  opacity: 0.5;
}

.module-icon {
  font-size: 40px;
  color: #60a5fa;
}

/* Hero Visual */
.hero-visual {
  position: absolute;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
  display: none;
  z-index: 10;
}

@media (min-width: 1200px) {
  .hero {
    justify-content: center;
    padding: 4rem 10%;
  }

  .hero-content {
    text-align: center;
    max-width: 900px;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-visual {
    display: none;
  }
}

.floating-card {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 20px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
  animation: float 4s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(59, 130, 246, 0.1);
  position: relative;
  overflow: hidden;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 10;
}

.floating-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 60%);
  opacity: 0;
  transform: rotate(45deg);
  transition: opacity 0.3s ease;
}

.floating-card:hover {
  transform: translateY(-10px) scale(1.05) rotateX(5deg) rotateY(5deg);
  border-color: #60a5fa;
  box-shadow: 0 20px 50px rgba(59, 130, 246, 0.4), inset 0 0 30px rgba(59, 130, 246, 0.2);
  background: rgba(15, 23, 42, 0.8);
}

.floating-card:hover::after {
  opacity: 1;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 70%);
  animation: cardGlow 4s ease-in-out infinite;
}

@keyframes cardGlow {
  0%, 100% {
    transform: translate(0, 0);
    opacity: 0.5;
  }
  50% {
    transform: translate(10%, 10%);
    opacity: 0.8;
  }
}

.card-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  animation: progressBar 3s ease-in-out infinite;
}

@keyframes progressBar {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
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
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
}

.card-icon .el-icon {
  font-size: 32px;
  width: 32px;
  height: 32px;
}

.card-text {
  font-size: 16px;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Scroll Indicator */
.scroll-indicator {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  z-index: 10;
  animation: bounce 2s ease-in-out infinite;
}

.scroll-mouse {
  width: 30px;
  height: 50px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 15px;
  position: relative;
}

.scroll-wheel {
  width: 4px;
  height: 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  animation: scrollWheel 2s ease-in-out infinite;
}

@keyframes scrollWheel {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateX(-50%) translateY(12px);
    opacity: 0;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateX(-50%) translateY(0);
  }
  50% {
    transform: translateX(-50%) translateY(-10px);
  }
}

/* Tech Advantages Section */
.tech-advantages {
  padding: 8rem 2rem;
  background: transparent;
  position: relative;
  transform: translateY(50px);
  opacity: 0;
  transition: all 0.8s ease-out;
}

.tech-advantages.visible {
  transform: translateY(0);
  opacity: 1;
}

.tech-advantages::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-badge {
  display: inline-block;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(147, 197, 253, 0.3) 100%);
  color: #ffffff;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.section-title {
  font-size: 48px;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.section-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
}

/* Advantages Grid */
.advantages-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.advantage-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  transform: translateY(30px);
  opacity: 0;
  animation: fadeInUp 0.6s ease-out forwards;
}

.advantage-card:nth-child(1) { animation-delay: 0.1s; }
.advantage-card:nth-child(2) { animation-delay: 0.2s; }
.advantage-card:nth-child(3) { animation-delay: 0.3s; }
.advantage-card:nth-child(4) { animation-delay: 0.4s; }

@keyframes fadeInUp {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.advantage-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  transform: scaleY(0);
  transition: transform 0.3s;
}

.advantage-card:hover::after {
  transform: scaleY(1);
}

.advantage-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.advantage-card.large {
  grid-column: span 2;
  background: rgba(240, 249, 255, 0.9);
  border-color: rgba(186, 230, 253, 0.5);
}

.advantage-card.accent {
  background: rgba(254, 249, 243, 0.9);
  border-color: rgba(254, 215, 170, 0.5);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-icon-large {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  color: #3b82f6;
}

.card-icon-large svg {
  width: 100%;
  height: 100%;
}

.card-icon-medium {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: #6366f1;
}

.card-icon-medium svg {
  width: 100%;
  height: 100%;
}

.card-title-group {
  flex: 1;
}

.card-title-group h3 {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.advantage-card h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.advantage-card p {
  font-size: 15px;
  color: #6b7280;
  line-height: 1.7;
  margin: 0 0 1.5rem 0;
}

.tech-badge {
  display: inline-block;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(96, 165, 250, 0.2);
}

.tech-tags {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tech-tag {
  background: rgba(96, 165, 250, 0.08);
  color: #2563eb;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(96, 165, 250, 0.15);
  transition: all 0.3s;
}

.tech-tag:hover {
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(96, 165, 250, 0.3);
  transform: translateY(-2px);
}

.tech-stats {
  display: flex;
  gap: 2rem;
}

.stat-mini {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.feature-list {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.feature-item-mini {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 13px;
  color: #10b981;
  font-weight: 600;
}

.feature-item-mini svg {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}

.accent-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: linear-gradient(135deg, #fb923c, #f97316);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(251, 146, 60, 0.3);
}

/* CTA Section */
.cta {
  background: transparent;
  padding: 8rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  transform: translateY(50px);
  opacity: 0;
  transition: all 0.8s ease-out;
}

.cta.visible {
  transform: translateY(0);
  opacity: 1;
}

.cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="1" fill="rgba(96,165,250,0.3)"/></svg>');
  opacity: 0.3;
}

.cta-content {
  position: relative;
  z-index: 1;
}

.cta-content h2 {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, #60a5fa 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 1rem 0;
}

.cta-content p {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 3rem 0;
}

.cta-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-light {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
}

.btn-light:hover {
  transform: translateY(-6px) scale(1.05);
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.5);
}

.btn-outline {
  background: transparent;
  color: white;
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
  transform: translateY(-4px);
  box-shadow: 0 15px 35px rgba(255, 255, 255, 0.1);
}

/* Footer */
.footer {
  background: rgba(31, 41, 55, 0.8);
  backdrop-filter: blur(10px);
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
  .hero {
    min-height: 100vh;
    padding: 3rem 1.5rem;
  }

  .hero-title {
    font-size: 48px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .hero-stats {
    gap: 2rem;
  }

  .stat-number {
    font-size: 28px;
  }

  .stat-label {
    font-size: 12px;
  }

  .btn {
    padding: 1rem 1.75rem;
    font-size: 16px;
  }

  .scroll-indicator {
    display: none;
  }

  .section-title {
    font-size: 36px;
  }

  .section-subtitle {
    font-size: 16px;
  }

  .tech-advantages {
    padding: 5rem 1.5rem;
  }

  .advantages-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .advantage-card.large {
    grid-column: span 1;
  }

  .tech-stats {
    gap: 1.5rem;
  }

  .cta {
    padding: 5rem 1.5rem;
  }

  .cta-content h2 {
    font-size: 36px;
  }

  .cta-content p {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 36px;
  }

  .hero-badge {
    font-size: 12px;
    padding: 0.5rem 1rem;
  }

  .hero-stats {
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
