# Rate AI - AI 评分平台

一个现代化的 AI 工具评分和评论平台，帮助用户发现最适合自己的 AI 工具。

## 功能特性

### 核心功能
- ✅ **多维度评分系统**：5 个核心维度（万能性、图像生成、信息查询、学习辅助、性价比）
- ✅ **标签系统**：用户可以给 AI 添加标签，支持搜索和筛选
- ✅ **反应系统**：👍 有用、👎 无用、🤯 超强、😭 烂到哭
- ✅ **评论系统**：支持长评、图片上传、评分、点赞、回复
- ✅ **排行榜**：综合排行榜、最适合学生、性价比最高、最佳图像生成
- ✅ **搜索和筛选**：按名称、标签、评分筛选
- ✅ **收藏功能**：用户可以收藏喜欢的 AI
- ✅ **用户资料页**：查看收藏、评论、评分等

### 设计规范
- 背景色：`#111111`
- 主色：`#3B82F6`（蓝）
- 辅助色：`#6366F1`（紫）
- 字体色：`#F1F5F9`、`#94A3B8`

## 技术栈

- React 18
- React Router DOM
- Vite
- Lucide React（图标库）

## 安装和运行

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 项目结构

```
Rate_AI/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── AICard.jsx       # AI 卡片组件
│   │   ├── CommentSection.jsx  # 评论区域
│   │   ├── CommentForm.jsx     # 评论表单
│   │   ├── FilterPanel.jsx     # 筛选面板
│   │   ├── Navbar.jsx          # 导航栏
│   │   ├── RatingForm.jsx      # 评分表单
│   │   ├── RatingStars.jsx     # 星级评分
│   │   ├── ReactionButtons.jsx # 反应按钮
│   │   ├── SearchBar.jsx       # 搜索栏
│   │   └── TagInput.jsx         # 标签输入
│   ├── pages/              # 页面组件
│   │   ├── Home.jsx        # 首页
│   │   ├── AIDetail.jsx    # AI 详情页
│   │   ├── Rankings.jsx    # 排行榜页
│   │   └── Profile.jsx     # 用户资料页
│   ├── data/               # 模拟数据
│   │   └── mockData.js     # 模拟的 AI 和评论数据
│   ├── App.jsx             # 主应用组件
│   ├── main.jsx            # 入口文件
│   └── index.css           # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 页面说明

### 首页 (/)
- 显示所有 AI 工具列表
- 搜索功能
- 筛选功能（标签、评分）
- AI 卡片展示

### AI 详情页 (/ai/:id)
- AI 详细信息
- 多维度评分展示
- 评分表单
- 标签管理
- 评论列表和评论表单
- 反应按钮

### 排行榜 (/rankings)
- 综合排行榜
- 最适合学生
- 性价比最高
- 最佳图像生成

### 用户资料 (/profile)
- 用户信息展示
- 我的收藏
- 我的评论
- 我的评分
- 账户设置

## 待实现功能

- [ ] 后端 API 集成
- [ ] 用户认证系统
- [ ] 图片上传到服务器
- [ ] 实时数据更新
- [ ] 举报功能后端处理
- [ ] 用户等级系统完整实现

## 开发说明

目前项目使用模拟数据（`src/data/mockData.js`），所有交互功能的前端界面已完成。后续可以接入真实的后端 API。

## License

MIT

