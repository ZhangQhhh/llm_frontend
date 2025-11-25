import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// 声明 Driver 类型以避免 TypeScript 错误
declare class DriverClass {
  constructor(options?: any);
  setSteps(steps: any[]): void;
  drive(step?: number): void;
  moveNext(): void;
  movePrevious(): void;
  destroy(): void;
  hasNextStep(): boolean;
  hasPreviousStep(): boolean;
  refresh(): void;
}

export interface TourStep {
  element: string;
  title: string;
  description: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

export class TourGuide {
  private driver: any;
  private currentTour: string = '';

  constructor() {
    this.driver = driver({
      animate: true,
      opacity: 0.75,
      padding: 10,
      allowClose: true,
      overlayClickNext: false,
      showProgress: true,
      doneBtnText: '完成',
      closeBtnText: '关闭',
      nextBtnText: '下一步',
      prevBtnText: '上一步'
    });
  }

  // 首页导览
  startHomeTour() {
    const steps: TourStep[] = [
      {
        element: '.navbar-brand',
        title: '欢迎来到皖美边检-智慧大脑',
        description: '这是您的智能工作助手平台，集成了多种AI服务功能，让您的工作更加高效便捷。接下来我将为您详细介绍各项功能。'
      },
      {
        element: '.navbar-menu .el-menu-item[index="/help"]',
        title: '帮助中心',
        description: '这里是您的学习起点！包含详细的功能介绍、使用指南和常见问题解答。遇到问题时可以随时查阅。'
      },
      {
        element: '.navbar-menu .el-menu-item[index="/knowledge-qa"]',
        title: '知识问答 - 核心功能',
        description: '智能问答系统，可以回答边检相关的各种问题。支持复杂查询，提供准确答案和参考来源。适合快速获取专业知识。'
      },
      {
        element: '.navbar-menu .el-menu-item[index="/conversation"]',
        title: '多轮对话 - 深度交流',
        description: '支持连续对话的AI助手，能理解上下文，记住对话历史。适合深入探讨复杂问题或进行长时间的专业咨询。'
      },
      {
        element: '.navbar-menu .el-menu-item[index="/exam"]',
        title: '边检智能家教 - 学习助手',
        description: 'AI驱动的个性化学习系统，提供题目练习、详细解析和知识点梳理。帮助您系统性地学习边检业务知识。'
      },
      {
        element: '.navbar-menu .el-menu-item[index="/smart-office"]',
        title: '智慧办公 - 效率工具',
        description: '集成多种办公工具，包括文档处理、数据分析、报告生成等功能，大幅提升日常工作效率。'
      },
      {
        element: '.navbar-menu .el-menu-item[index="/immigration-12367"]',
        title: '移民局12367 - 专业咨询',
        description: '专门针对移民局12367咨询热线的智能助手，提供准确的政策解读和业务指导。'
      },
      {
        element: '.navbar-right .user-dropdown',
        title: '个人中心 - 账户管理',
        description: '管理您的个人信息、查看使用历史、访问专业工具。根据您的权限级别，这里还可能包含管理功能。'
      },
      {
        element: 'body',
        title: '开始您的智能工作之旅',
        description: '导览完成！建议您从"知识问答"开始体验，然后根据需要探索其他功能。如有疑问，随时可以访问帮助中心或重新启动导览。'
      }
    ];

    this.startTour('home', steps);
  }

  // 知识问答页面导览
  startKnowledgeQATour() {
    const steps: TourStep[] = [
      {
        element: '.page-header',
        title: '知识问答系统',
        description: '欢迎使用智能问答功能！这里可以快速获取边检相关的专业知识和准确答案。'
      },
      {
        element: '.question-input, .el-textarea, textarea',
        title: '问题输入区',
        description: '在这里输入您的问题。支持复杂查询，可以询问法规条文、业务流程、操作指南等各类边检相关问题。'
      },
      {
        element: '.submit-button, .el-button--primary',
        title: '提交问题',
        description: '点击提交后，AI将分析您的问题并提供详细回答。通常几秒钟内就能得到结果。'
      },
      {
        element: '.answer-container, .answer-display',
        title: '智能回答区',
        description: 'AI的回答将在这里实时显示，支持富文本格式，包括列表、表格等结构化内容，便于理解。'
      },
      {
        element: '.source-references, .references-section',
        title: '参考来源',
        description: '每个回答都会显示参考来源和依据，确保信息的准确性和可追溯性。您可以查看具体的文档来源。'
      },
      {
        element: '.history-panel, .question-history',
        title: '问答历史',
        description: '系统会保存您的问答历史，方便回顾之前的查询结果。支持搜索和分类管理。'
      },
      {
        element: 'body',
        title: '使用技巧',
        description: '提示：问题越具体，答案越准确。可以使用关键词搜索，也可以描述具体场景。试试问一个边检相关的问题吧！'
      }
    ];

    this.startTour('knowledge-qa', steps);
  }

  // 多轮对话页面导览
  startConversationTour() {
    const steps: TourStep[] = [
      {
        element: '.page-header, .conversation-header',
        title: '多轮对话系统',
        description: '这里是智能对话中心！支持连续对话，AI能记住上下文，适合深入探讨复杂问题。'
      },
      {
        element: '.conversation-sidebar, .session-list',
        title: '对话会话列表',
        description: '左侧显示您的所有对话会话。每个会话都是独立的，可以创建新会话或继续之前的对话。'
      },
      {
        element: '.new-conversation, .new-session-btn',
        title: '新建对话',
        description: '点击这里开始新的对话会话。每个新会话都是全新的上下文，适合讨论不同的主题。'
      },
      {
        element: '.conversation-history, .message-list',
        title: '对话历史记录',
        description: '这里显示当前会话的完整对话历史。AI会记住之前的所有对话内容，实现真正的连续交流。'
      },
      {
        element: '.thinking-display, .ai-thinking',
        title: 'AI思考过程',
        description: 'AI在回答时会显示思考过程，让您了解它是如何分析问题和生成答案的，增加透明度。'
      },
      {
        element: '.message-input-area, .input-container',
        title: '消息输入区',
        description: '在这里输入您的消息。支持长文本输入，可以进行复杂的对话交流。按Ctrl+Enter快速发送。'
      },
      {
        element: '.send-button, .submit-btn',
        title: '发送消息',
        description: '点击发送您的消息。AI会基于整个对话历史来理解您的问题并给出相应回答。'
      },
      {
        element: '.conversation-settings, .session-options',
        title: '对话设置',
        description: '可以管理对话会话，包括重命名、删除、导出对话记录等功能。'
      },
      {
        element: 'body',
        title: '对话技巧',
        description: '提示：可以说"继续上个话题"、"换个角度分析"等，AI会理解上下文。适合深入讨论和连续咨询！'
      }
    ];

    this.startTour('conversation', steps);
  }

  // 考试页面导览
  startExamTour() {
    const steps: TourStep[] = [
      {
        element: '.page-header, .exam-header',
        title: '边检智能家教系统',
        description: '欢迎使用AI学习助手！这里提供个性化的学习体验，包括题目练习、详细解析和知识点梳理。'
      },
      {
        element: '.exam-categories, .category-selector',
        title: '题库分类选择',
        description: '选择不同的学习模块和题目分类。包括法律法规、业务流程、案例分析等多个专业领域。'
      },
      {
        element: '.difficulty-selector, .level-options',
        title: '难度级别设置',
        description: '根据您的学习水平选择合适的难度：基础入门、进阶提升、专家级别。系统会智能推荐适合的题目。'
      },
      {
        element: '.question-display, .question-container',
        title: '题目展示区',
        description: '当前题目将在这里清晰显示。支持多种题型：单选、多选、判断、案例分析等。'
      },
      {
        element: '.answer-options, .options-list',
        title: '答案选项区',
        description: '仔细阅读各个选项，选择您认为正确的答案。支持多选题的多个选项选择。'
      },
      {
        element: '.submit-answer, .answer-submit-btn',
        title: '提交答案',
        description: '选择完答案后点击提交。系统会立即显示正确答案和详细解析。'
      },
      {
        element: '.explanation-panel, .answer-analysis',
        title: '详细解析面板',
        description: 'AI提供的详细解析，包括正确答案、解题思路、相关知识点和延伸学习内容。'
      },
      {
        element: '.knowledge-points, .related-concepts',
        title: '相关知识点',
        description: '每道题都会关联相关的知识点和概念，帮助您建立完整的知识体系。'
      },
      {
        element: '.progress-tracker, .learning-progress',
        title: '学习进度跟踪',
        description: '实时跟踪您的学习进度、正确率和薄弱环节，提供个性化的学习建议。'
      },
      {
        element: '.next-question, .continue-btn',
        title: '继续学习',
        description: '点击继续下一题。系统会根据您的表现智能推荐后续题目，优化学习路径。'
      },
      {
        element: 'body',
        title: '学习建议',
        description: '建议：认真阅读解析，理解知识点。可以收藏重要题目，定期复习巩固。坚持练习，提升专业能力！'
      }
    ];

    this.startTour('exam', steps);
  }

  // 管理员中心导览
  startAdminTour() {
    const steps: TourStep[] = [
      {
        element: '.admin-header, .management-header',
        title: '管理员控制中心',
        description: '欢迎进入管理员中心！这里是系统管理的核心区域，您可以管理用户、监控系统和配置各项功能。'
      },
      {
        element: '.admin-sidebar, .management-menu',
        title: '管理功能菜单',
        description: '左侧菜单包含所有管理功能模块。根据您的权限级别，可以访问不同的管理工具。'
      },
      {
        element: '.user-management, .user-admin-panel',
        title: '用户管理系统',
        description: '管理系统中的所有用户账户，包括用户注册审核、权限分配、账户状态管理等功能。'
      },
      {
        element: '.user-list, .user-table',
        title: '用户列表视图',
        description: '查看所有用户的详细信息，包括注册时间、最后登录、使用状态等。支持搜索和筛选功能。'
      },
      {
        element: '.user-actions, .user-operations',
        title: '用户操作工具',
        description: '对用户进行各种操作：审核通过、拒绝申请、修改权限、重置密码、禁用账户等。'
      },
      {
        element: '.role-management, .permission-settings',
        title: '角色权限管理',
        description: '配置不同用户角色的权限：普通用户、管理员、超级管理员。控制功能访问权限。'
      },
      {
        element: '.system-settings, .config-panel',
        title: '系统配置中心',
        description: '配置系统的各项参数和功能选项，包括安全设置、功能开关、性能参数等。'
      },
      {
        element: '.audit-logs, .activity-monitor',
        title: '系统监控日志',
        description: '查看系统使用情况、用户活动日志、错误记录等。帮助监控系统运行状态。'
      },
      {
        element: '.feedback-management, .feedback-panel',
        title: '反馈管理中心',
        description: '处理用户反馈和建议，跟踪问题解决进度，提升用户体验。'
      },
      {
        element: 'body',
        title: '管理员职责',
        description: '提醒：管理员权限重大，请谨慎操作。定期检查用户活动，及时处理反馈，确保系统安全稳定运行。'
      }
    ];

    this.startTour('admin', steps);
  }

  // 智慧办公页面导览
  startSmartOfficeTour() {
    const steps: TourStep[] = [
      {
        element: '.page-header, .office-header',
        title: '智慧办公工具中心',
        description: '欢迎使用智慧办公套件！这里集成了多种AI驱动的办公工具，大幅提升您的工作效率。'
      },
      {
        element: '.tool-categories, .office-tools-menu',
        title: '工具分类导航',
        description: '按功能分类的办公工具：文档处理、数据分析、报告生成、流程优化等。选择您需要的工具类型。'
      },
      {
        element: '.document-tools, .doc-processing',
        title: '文档处理工具',
        description: '智能文档处理功能：自动摘要、格式转换、内容提取、批量处理等。支持多种文档格式。'
      },
      {
        element: '.data-analysis, .analytics-panel',
        title: '数据分析中心',
        description: 'AI数据分析工具：自动生成图表、趋势分析、数据洞察、预测模型等。让数据说话。'
      },
      {
        element: '.report-generator, .report-tools',
        title: '智能报告生成',
        description: '自动化报告生成：根据数据自动创建专业报告、图表可视化、模板定制等功能。'
      },
      {
        element: '.workflow-optimizer, .process-tools',
        title: '流程优化助手',
        description: '工作流程优化建议：分析现有流程、识别瓶颈、提供改进方案，提升团队协作效率。'
      },
      {
        element: '.template-library, .templates-panel',
        title: '模板资源库',
        description: '丰富的办公模板库：报告模板、表格模板、演示文稿模板等。一键应用，快速开始。'
      },
      {
        element: 'body',
        title: '效率提升秘诀',
        description: '建议：善用模板和自动化功能，将重复性工作交给AI处理，专注于创造性和决策性工作！'
      }
    ];

    this.startTour('smart-office', steps);
  }

  // 移民局12367页面导览
  startImmigration12367Tour() {
    const steps: TourStep[] = [
      {
        element: '.page-header, .immigration-header',
        title: '移民局12367咨询助手',
        description: '专业的移民局咨询服务AI助手！提供准确的政策解读、业务指导和咨询服务支持。'
      },
      {
        element: '.policy-categories, .policy-menu',
        title: '政策分类导航',
        description: '按政策类型分类：签证政策、居留许可、入籍申请、政策变更等。快速定位相关政策信息。'
      },
      {
        element: '.consultation-input, .inquiry-form',
        title: '咨询问题输入',
        description: '输入具体的咨询问题。支持复杂场景描述，AI会提供针对性的专业解答和指导建议。'
      },
      {
        element: '.policy-search, .search-function',
        title: '政策智能搜索',
        description: '强大的政策搜索功能：关键词搜索、条件筛选、相关政策推荐。快速找到所需信息。'
      },
      {
        element: '.answer-display, .consultation-result',
        title: '专业解答展示',
        description: 'AI提供的专业解答：政策条文引用、操作流程说明、注意事项提醒、相关案例参考。'
      },
      {
        element: '.related-policies, .policy-links',
        title: '相关政策关联',
        description: '智能关联相关政策和法规，帮助您全面了解相关规定，避免遗漏重要信息。'
      },
      {
        element: '.case-examples, .example-cases',
        title: '典型案例参考',
        description: '提供相关的典型案例和处理经验，帮助理解政策应用和实际操作流程。'
      },
      {
        element: '.contact-info, .service-contact',
        title: '联系服务信息',
        description: '提供官方联系方式、服务时间、办事地点等信息，方便后续咨询和办理业务。'
      },
      {
        element: 'body',
        title: '咨询建议',
        description: '提示：描述问题时请尽量详细具体，包含相关背景信息。如需进一步确认，建议联系官方渠道。'
      }
    ];

    this.startTour('immigration-12367', steps);
  }

  private startTour(tourName: string, steps: TourStep[]) {
    this.currentTour = tourName;
    
    // 检查第一个元素是否存在
    const firstElement = document.querySelector(steps[0]?.element);
    if (!firstElement) {
      console.warn(`导览元素未找到: ${steps[0]?.element}`);
      return;
    }
    
    // 简化步骤格式，使用 driver.js 期望的格式
    const driverSteps = steps.map(step => ({
      element: step.element,
      popover: {
        title: step.title,
        description: step.description
      }
    }));

    try {
      this.driver.setSteps(driverSteps);
      this.driver.drive();
    } catch (error) {
      console.error('导览启动失败:', error);
    }
  }

  // 检查是否应该显示新手引导
  shouldShowFirstTimeTour(page: string): boolean {
    const tourKey = `tour_completed_${page}`;
    return !localStorage.getItem(tourKey);
  }

  // 标记引导已完成
  markTourCompleted(page: string) {
    const tourKey = `tour_completed_${page}`;
    localStorage.setItem(tourKey, 'true');
  }

  // 重置所有引导记录
  resetAllTours() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('tour_completed_'));
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const tourGuide = new TourGuide();
