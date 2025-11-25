# 帮助中心使用指南

## 功能概述

为网站添加了完整的使用引导教程系统，包含以下核心功能：

### 1. 交互式产品导览
- 使用 `driver.js` 实现分步骤的页面导览
- 支持首页、知识问答、多轮对话、考试、管理员中心等页面的专项导览
- 自动检测首次访问用户，提供新手引导

### 2. 帮助中心页面
- 专门的帮助中心页面 (`/help`)
- 包含快速入门、功能介绍、视频教程、常见问题、快捷键等模块
- 提供结构化的学习路径和详细的功能说明

### 3. 智能引导系统
- 首次登录用户显示欢迎引导
- 悬浮导览按钮，随时可启动页面导览
- 记录用户完成状态，避免重复打扰

## 主要组件

### TourGuide 类 (`src/utils/tourGuide.ts`)
核心导览控制器，提供以下方法：
- `startHomeTour()` - 首页导览
- `startKnowledgeQATour()` - 知识问答导览
- `startConversationTour()` - 多轮对话导览
- `startExamTour()` - 考试页面导览
- `startAdminTour()` - 管理员导览

### HelpCenterView (`src/views/HelpCenterView.vue`)
帮助中心主页面，包含：
- 快速入门卡片
- 功能详细介绍
- 视频教程播放
- FAQ 常见问题
- 快捷键指南

### TourGuideButton (`src/components/TourGuideButton.vue`)
悬浮导览按钮组件：
- 智能显示逻辑
- 自动触发新手引导
- 支持手动启动导览

### FirstTimeGuide (`src/components/FirstTimeGuide.vue`)
首次访问引导弹窗：
- 欢迎界面和功能概览
- 三种选择：开始导览、查看帮助、跳过引导
- 记住用户选择的功能

## 使用方法

### 用户端使用
1. **首次访问**：自动显示欢迎引导，可选择学习方式
2. **帮助中心**：点击导航栏"帮助中心"查看详细教程
3. **页面导览**：点击右下角悬浮按钮开始当前页面导览
4. **快捷键**：使用 `Ctrl + /` 快速显示帮助

### 开发者扩展
1. **添加新页面导览**：
   ```typescript
   // 在 tourGuide.ts 中添加新方法
   startNewPageTour() {
     const steps: TourStep[] = [
       {
         element: '.selector',
         title: '标题',
         description: '说明文字'
       }
     ];
     this.startTour('new-page', steps);
   }
   ```

2. **更新帮助中心内容**：
   - 修改 `HelpCenterView.vue` 中的数据
   - 添加新的功能介绍或教程视频

3. **自定义导览样式**：
   - 编辑 `src/styles/driver.css`
   - 调整导览弹窗的外观和动画

## 配置选项

### Driver.js 配置
```typescript
const driver = new Driver({
  className: 'tour-guide',      // 自定义样式类
  animate: true,                // 启用动画
  opacity: 0.75,               // 背景透明度
  padding: 10,                 // 高亮区域内边距
  allowClose: true,            // 允许关闭
  overlayClickNext: false,     // 点击遮罩不进入下一步
  showProgress: true,          // 显示进度
  doneBtnText: '完成',         // 完成按钮文字
  closeBtnText: '关闭',        // 关闭按钮文字
  nextBtnText: '下一步',       // 下一步按钮文字
  prevBtnText: '上一步'        // 上一步按钮文字
});
```

### 本地存储键值
- `tour_completed_{page}` - 记录页面导览完成状态
- `user_has_visited` - 记录用户首次访问状态

## 样式定制

### 导览按钮样式
- 位置：右下角固定悬浮
- 动画：脉冲效果吸引注意
- 响应式：移动端自动调整位置

### 帮助中心样式
- 渐变背景头部
- 卡片式布局
- 响应式网格设计
- 平滑过渡动画

## 最佳实践

1. **导览步骤设计**：
   - 每步聚焦一个功能点
   - 说明文字简洁明了
   - 逻辑顺序符合用户习惯

2. **用户体验优化**：
   - 避免过于频繁的引导
   - 提供跳过选项
   - 记住用户偏好设置

3. **内容维护**：
   - 定期更新功能说明
   - 添加新功能的导览
   - 根据用户反馈优化引导流程

## 技术依赖

- `driver.js` - 页面导览库
- `element-plus` - UI 组件库
- `vue-router` - 路由管理
- `vuex` - 状态管理

## 扩展建议

1. **视频教程**：集成实际的功能演示视频
2. **用户反馈**：添加帮助内容的有用性评价
3. **搜索功能**：在帮助中心添加内容搜索
4. **数据分析**：跟踪用户使用引导的数据
5. **个性化**：根据用户角色显示不同的引导内容
