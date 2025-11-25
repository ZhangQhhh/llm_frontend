<template>
  <div class="help-center">
    <div class="help-header">
      <div class="header-content">
        <h1 class="help-title">
          <el-icon><QuestionFilled /></el-icon>
          帮助中心
        </h1>
        <p class="help-subtitle">快速了解如何使用皖美边检-智慧大脑的各项功能</p>
      </div>
    </div>

    <div class="help-content">
      <div class="help-sidebar">
        <el-menu 
          :default-active="activeSection" 
          @select="handleSectionSelect"
          class="help-menu"
        >
          <el-menu-item index="getting-started">
            <el-icon><Guide /></el-icon>
            <span>快速入门</span>
          </el-menu-item>
          <el-menu-item index="features">
            <el-icon><Menu /></el-icon>
            <span>功能介绍</span>
          </el-menu-item>
          <el-menu-item index="faq">
            <el-icon><ChatDotRound /></el-icon>
            <span>常见问题</span>
          </el-menu-item>
          <el-menu-item index="shortcuts">
            <el-icon><Position /></el-icon>
            <span>快捷键</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="help-main">
        <!-- 快速入门 -->
        <div v-show="activeSection === 'getting-started'" class="help-section">
          <h2>快速入门</h2>
          <div class="getting-started-cards">
            <div class="guide-card" v-for="guide in gettingStartedGuides" :key="guide.id">
              <div class="card-icon">
                <el-icon><component :is="guide.icon" /></el-icon>
              </div>
              <h3>{{ guide.title }}</h3>
              <p>{{ guide.description }}</p>
              <div class="card-actions">
                <el-button type="primary" @click="startTour(guide.tour)">
                  开始导览
                </el-button>
                <el-button @click="viewDetails(guide.id)">查看详情</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 功能介绍 -->
        <div v-show="activeSection === 'features'" class="help-section">
          <h2>功能介绍</h2>
          <div class="feature-list">
            <div class="feature-item" v-for="feature in features" :key="feature.id">
              <div class="feature-header">
                <el-icon class="feature-icon"><component :is="feature.icon" /></el-icon>
                <div class="feature-info">
                  <h3>{{ feature.name }}</h3>
                  <p class="feature-desc">{{ feature.description }}</p>
                </div>
                <div class="feature-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="viewDetailedDoc(feature.id)"
                    :loading="loadingDoc === feature.id"
                  >
                    查看详细文档
                  </el-button>
                </div>
              </div>
              <div class="feature-details">
                <h4>主要功能：</h4>
                <ul>
                  <li v-for="item in feature.features" :key="item">{{ item }}</li>
                </ul>
                <h4>适用场景：</h4>
                <p>{{ feature.useCase }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 详细文档 -->
        <div v-show="activeSection === 'detailed-docs'" class="help-section">
          <div class="doc-header">
            <el-button @click="backToFeatures" type="text" class="back-btn">
              <el-icon><ArrowLeft /></el-icon>
              返回功能介绍
            </el-button>
            <h2>{{ currentDocTitle }}</h2>
          </div>
          <div class="doc-content">
            <div v-if="loadingDocContent" class="doc-loading">
              <el-skeleton :rows="10" animated />
            </div>
            <div v-else-if="docError" class="doc-error">
              <el-alert
                title="文档加载失败"
                :description="docError"
                type="error"
                show-icon
              />
            </div>
            <div v-else class="markdown-content" v-html="renderedDocContent"></div>
          </div>
        </div>


        <!-- 常见问题 -->
        <div v-show="activeSection === 'faq'" class="help-section">
          <h2>常见问题</h2>
          <el-collapse v-model="activeFaq">
            <el-collapse-item 
              v-for="faq in faqs" 
              :key="faq.id"
              :title="faq.question" 
              :name="faq.id"
            >
              <div class="faq-answer" v-html="faq.answer"></div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 快捷键 -->
        <div v-show="activeSection === 'shortcuts'" class="help-section">
          <h2>快捷键指南</h2>
          <div class="shortcut-table">
            <table>
              <thead>
                <tr>
                  <th>快捷键</th>
                  <th>功能</th>
                  <th>适用页面</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="shortcut in shortcuts" :key="shortcut.key">
                  <td><kbd>{{ shortcut.key }}</kbd></td>
                  <td>{{ shortcut.description }}</td>
                  <td>{{ shortcut.page }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tourGuide } from '@/utils/tourGuide'
import { marked } from 'marked'
import { docs } from '@/docs/index'
import { 
  QuestionFilled, 
  Guide, 
  Menu, 
  ChatDotRound, 
  Position,
  Reading,
  ChatDotRound as ChatIcon,
  EditPen,
  Briefcase,
  Service,
  Setting,
  ArrowLeft
} from '@element-plus/icons-vue'

export default defineComponent({
  name: 'HelpCenterView',
  components: {
    QuestionFilled,
    Guide,
    Menu,
    ChatDotRound,
    Position,
    Reading,
    ChatIcon,
    EditPen,
    Briefcase,
    Service,
    Setting,
    ArrowLeft
  },
  setup() {
    const router = useRouter()
    const activeSection = ref('getting-started')
    const activeFaq = ref<string[]>([])
    
    // 文档相关状态
    const loadingDoc = ref<string | null>(null)
    const loadingDocContent = ref(false)
    const docError = ref<string | null>(null)
    const currentDocTitle = ref('')
    const renderedDocContent = ref('')

    const gettingStartedGuides = [
      {
        id: 'home',
        title: '系统概览',
        description: '了解系统整体布局和主要功能入口',
        icon: 'Guide',
        tour: 'home'
      },
      {
        id: 'knowledge-qa',
        title: '知识问答',
        description: '学习如何使用智能问答功能',
        icon: 'Reading',
        tour: 'knowledge-qa'
      },
      {
        id: 'conversation',
        title: '多轮对话',
        description: '掌握与AI进行连续对话的技巧',
        icon: 'ChatIcon',
        tour: 'conversation'
      },
      {
        id: 'exam',
        title: '智能家教',
        description: '使用AI辅助学习和题目练习',
        icon: 'EditPen',
        tour: 'exam'
      }
    ]

    const features = [
      {
        id: 'knowledge-qa',
        name: '知识问答',
        description: '基于AI的智能问答系统，提供准确的边检相关知识答案',
        icon: 'Reading',
        features: [
          '智能搜索和精准回答',
          '支持多种问题类型',
          '提供参考来源和依据',
          '实时流式输出'
        ],
        useCase: '适用于快速获取边检法规、流程、业务知识等问题的答案'
      },
      {
        id: 'conversation',
        name: '多轮对话',
        description: '支持上下文理解的连续对话，提供更自然的交互体验',
        icon: 'ChatIcon',
        features: [
          '多轮连续对话',
          '上下文理解',
          '思考过程展示',
          '对话历史管理'
        ],
        useCase: '适用于需要深入探讨和连续交流的复杂问题'
      },
      {
        id: 'exam',
        name: '边检智能家教',
        description: 'AI驱动的学习助手，提供个性化学习体验',
        icon: 'EditPen',
        features: [
          '智能题目生成',
          '详细解析讲解',
          '知识点梳理',
          '学习进度跟踪'
        ],
        useCase: '适用于边检业务学习和考试准备'
      },
      {
        id: 'smart-office',
        name: '智慧办公',
        description: '提升工作效率的智能工具集合',
        icon: 'Briefcase',
        features: [
          '文档智能处理',
          '数据分析工具',
          '报告自动生成',
          '办公流程优化'
        ],
        useCase: '适用于日常办公和业务处理场景'
      },
      {
        id: 'immigration-12367',
        name: '移民局12367咨询助手',
        description: '专业的移民局咨询服务AI助手',
        icon: 'Service',
        features: [
          '政策智能搜索',
          '专业咨询解答',
          '案例库管理',
          '服务信息查询'
        ],
        useCase: '适用于移民局12367咨询热线业务'
      }
    ]

    const faqs = [
      {
        id: '1',
        question: '如何开始使用知识问答功能？',
        answer: '1. 登录系统后，点击导航栏的"知识问答"<br>2. 在输入框中输入您的问题<br>3. 点击提交按钮，等待AI回答<br>4. 查看答案和参考来源'
      },
      {
        id: '2',
        question: '多轮对话和知识问答有什么区别？',
        answer: '知识问答适合获取具体问题的答案，而多轮对话支持连续交流，能够理解上下文，适合深入探讨复杂问题。'
      },
      {
        id: '3',
        question: '如何查看我的使用历史？',
        answer: '在多轮对话页面，您可以查看所有的对话历史记录。在个人设置中，您可以管理您的账户信息和使用偏好。'
      }
    ]

    const shortcuts = [
      {
        key: 'Ctrl + Enter',
        description: '快速提交问题',
        page: '知识问答、多轮对话'
      },
      {
        key: 'Ctrl + /',
        description: '显示/隐藏快捷键帮助',
        page: '全局'
      },
      {
        key: 'Esc',
        description: '关闭当前弹窗或取消操作',
        page: '全局'
      },
      {
        key: 'Ctrl + N',
        description: '新建对话',
        page: '多轮对话'
      }
    ]

    const handleSectionSelect = (section: string) => {
      activeSection.value = section
    }

    const startTour = (tourType: string) => {
      // 跳转到对应页面并开始导览
      const pageRoutes: Record<string, string> = {
        'home': '/',
        'knowledge-qa': '/knowledge-qa',
        'conversation': '/conversation',
        'exam': '/exam'
      }

      if (pageRoutes[tourType]) {
        router.push(pageRoutes[tourType])
        // 延迟启动导览，等待页面加载完成
        setTimeout(() => {
          switch (tourType) {
            case 'home':
              tourGuide.startHomeTour()
              break
            case 'knowledge-qa':
              tourGuide.startKnowledgeQATour()
              break
            case 'conversation':
              tourGuide.startConversationTour()
              break
            case 'exam':
              tourGuide.startExamTour()
              break
          }
        }, 500)
      }
    }

    const viewDetails = (guideId: string) => {
      // 可以跳转到更详细的教程页面
      console.log('查看详情:', guideId)
    }

    // 文档映射
    const docMapping: Record<string, { title: string; key: keyof typeof docs }> = {
      'knowledge-qa': { title: '知识问答系统详细使用指南', key: 'knowledge-qa' },
      'conversation': { title: '多轮对话系统详细使用指南', key: 'conversation' },
      'exam': { title: '边检智能家教系统详细使用指南', key: 'exam-system' },
      'smart-office': { title: '智慧办公工具详细使用指南', key: 'smart-office' },
      'immigration-12367': { title: '移民局12367咨询助手详细使用指南', key: 'immigration-12367' }
    }

    // 查看详细文档
    const viewDetailedDoc = async (featureId: string) => {
      const docInfo = docMapping[featureId]
      if (!docInfo) {
        console.error('未找到对应的文档:', featureId)
        return
      }

      loadingDoc.value = featureId
      loadingDocContent.value = true
      docError.value = null
      currentDocTitle.value = docInfo.title

      try {
        // 从文档索引获取 Markdown 内容
        const markdownContent = docs[docInfo.key]
        if (!markdownContent) {
          throw new Error('文档内容不存在')
        }
        
        // 渲染 Markdown
        renderedDocContent.value = await marked(markdownContent, {
          breaks: true,
          gfm: true
        })

        // 切换到文档视图
        activeSection.value = 'detailed-docs'
      } catch (error) {
        console.error('加载文档失败:', error)
        docError.value = '文档加载失败，请稍后重试'
      } finally {
        loadingDoc.value = null
        loadingDocContent.value = false
      }
    }

    // 返回功能介绍页面
    const backToFeatures = () => {
      activeSection.value = 'features'
      currentDocTitle.value = ''
      renderedDocContent.value = ''
      docError.value = null
    }

    onMounted(() => {
      // 可以在这里记录用户访问帮助中心的行为
    })

    return {
      activeSection,
      activeFaq,
      gettingStartedGuides,
      features,
      faqs,
      shortcuts,
      loadingDoc,
      loadingDocContent,
      docError,
      currentDocTitle,
      renderedDocContent,
      handleSectionSelect,
      startTour,
      viewDetails,
      viewDetailedDoc,
      backToFeatures
    }
  }
})
</script>

<style scoped>
.help-center {
  min-height: 100vh;
  background: #f5f7fa;
}

.help-header {
  background: linear-gradient(135deg, #a8d8ea 0%, #dfc9e8 100%);
  color: #2c3e50;
  padding: 3rem 0;
  text-align: center;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.help-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.help-subtitle {
  font-size: 1.2rem;
  opacity: 0.8;
  color: #555;
}

.help-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 2rem;
}

.help-sidebar {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.help-menu {
  border: none;
}

.help-main {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.help-section h2 {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: #1f2937;
}

/* 快速入门卡片 */
.getting-started-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.guide-card {
  background: #fcfdfe;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: transform 0.3s, box-shadow 0.3s;
}

.guide-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(168, 216, 234, 0.3);
  border-color: #a8d8ea;
}

.card-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #a8d8ea 0%, #c5d9e8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #4a5f7f;
  font-size: 1.5rem;
}

.guide-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1f2937;
}

.guide-card p {
  color: #6b7280;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

/* 功能列表 */
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.feature-item {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem;
  transition: box-shadow 0.3s;
}

.feature-item:hover {
  box-shadow: 0 4px 15px rgba(168, 216, 234, 0.2);
  border-color: #c5d9e8;
}

.feature-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: #e8f4f8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5a9fb8;
  font-size: 1.2rem;
}

.feature-info h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.feature-desc {
  color: #6b7280;
  line-height: 1.6;
}

.feature-details h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem;
  color: #374151;
}

.feature-details ul {
  margin: 0.5rem 0 1rem;
  padding-left: 1.5rem;
}

.feature-details li {
  color: #6b7280;
  margin-bottom: 0.3rem;
}

.feature-actions {
  margin-left: auto;
}

/* 详细文档样式 */
.doc-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;
}

.back-btn:hover {
  color: #374151;
}

.doc-content {
  max-width: none;
}

.doc-loading {
  padding: 2rem 0;
}

.doc-error {
  padding: 2rem 0;
}

.markdown-content {
  line-height: 1.7;
  color: #374151;
}

.markdown-content h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.markdown-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 2rem 0 1rem;
  color: #1f2937;
}

.markdown-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: #374151;
}

.markdown-content h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
  color: #374151;
}

.markdown-content p {
  margin-bottom: 1rem;
  line-height: 1.7;
}

.markdown-content ul, .markdown-content ol {
  margin: 1rem 0;
  padding-left: 2rem;
}

.markdown-content li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.markdown-content code {
  background: #f3f4f6;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.9em;
  color: #e11d48;
}

.markdown-content pre {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  overflow-x: auto;
  line-height: 1.5;
}

.markdown-content pre code {
  background: none;
  padding: 0;
  color: #1f2937;
}

.markdown-content blockquote {
  border-left: 4px solid #dfc9e8;
  background: #faf9fc;
  padding: 1rem 1.5rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: #6b7280;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.markdown-content th,
.markdown-content td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-content th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.markdown-content tr:hover {
  background: #f9fafb;
}

/* FAQ */
.faq-answer {
  line-height: 1.6;
  color: #4b5563;
}

/* 快捷键表格 */
.shortcut-table {
  overflow-x: auto;
}

.shortcut-table table {
  width: 100%;
  border-collapse: collapse;
}

.shortcut-table th,
.shortcut-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.shortcut-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
}

kbd {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  font-family: monospace;
  font-size: 0.9rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-content {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .help-sidebar {
    position: static;
  }

  .getting-started-cards {
    grid-template-columns: 1fr;
  }

  .help-title {
    font-size: 2rem;
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>
