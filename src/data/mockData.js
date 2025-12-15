// 生成近8个月的评分趋势数据（10分制）
const generateTrendData = (baseScore, variation = 0.6) => {
  const months = []
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    // 生成略有波动的评分，但围绕 baseScore（10分制）
    const variationAmount = (Math.random() - 0.5) * variation
    const score = Math.max(0, Math.min(10, baseScore + variationAmount))
    months.push({
      month: monthName,
      score: Number(score.toFixed(2))
    })
  }
  return months
}

// 模拟 AI 数据
export const mockAIs = [
  {
    id: 1,
    name: 'ChatGPT',
    developer: 'OpenAI',
    link: 'https://chat.openai.com',
    description: 'OpenAI 开发的强大对话 AI，支持多种任务，从写作到编程辅助。',
    price: '免费 / $20/月',
    averageScore: 9.0,
    ratingCount: 1250,
    favoriteCount: 320,
    ratings: {
      versatility: 10,
      imageGeneration: 0,
      informationQuery: 9.0,
      studyAssistance: 9.6,
      valueForMoney: 8.4
    },
    tags: ['万能', '最适合学生', '做PPT很强', '中文友好'],
    reactions: {
      thumbUp: 890,
      thumbDown: 45,
      amazing: 234,
      bad: 12
    },
    ratingTrend: generateTrendData(9.0, 0.4)
  },
  {
    id: 2,
    name: 'Midjourney',
    developer: 'Midjourney Inc.',
    link: 'https://www.midjourney.com',
    description: '最强大的 AI 图像生成工具，艺术创作首选。',
    price: '$10/月起',
    averageScore: 9.6,
    ratingCount: 856,
    favoriteCount: 456,
    ratings: {
      versatility: 5.0,
      imageGeneration: 10,
      informationQuery: 2.0,
      studyAssistance: 4.0,
      valueForMoney: 9.0
    },
    tags: ['画图一流', '艺术创作', '贵但好用'],
    reactions: {
      thumbUp: 723,
      thumbDown: 23,
      amazing: 456,
      bad: 8
    },
    ratingTrend: generateTrendData(9.6, 0.3)
  },
  {
    id: 3,
    name: 'Claude',
    developer: 'Anthropic',
    link: 'https://claude.ai',
    description: 'Anthropic 开发的 AI 助手，擅长长文本处理和代码分析。',
    price: '免费 / $20/月',
    averageScore: 9.2,
    ratingCount: 678,
    favoriteCount: 189,
    ratings: {
      versatility: 9.6,
      imageGeneration: 0,
      informationQuery: 9.0,
      studyAssistance: 9.4,
      valueForMoney: 8.6
    },
    tags: ['万能', '最适合学生', '写报告', '中文友好'],
    reactions: {
      thumbUp: 567,
      thumbDown: 34,
      amazing: 189,
      bad: 15
    },
    ratingTrend: generateTrendData(9.2, 0.4)
  },
  {
    id: 4,
    name: 'Stable Diffusion',
    developer: 'Stability AI & 社区',
    link: 'https://stability.ai',
    description: '开源图像生成模型，可本地部署，免费使用。',
    price: '免费',
    averageScore: 7.0,
    ratingCount: 432,
    favoriteCount: 234,
    ratings: {
      versatility: 3.0,
      imageGeneration: 8.0,
      informationQuery: 2.0,
      studyAssistance: 2.5,
      valueForMoney: 9.0
    },
    tags: ['免费', '画图一流', '开源', '难用'],
    reactions: {
      thumbUp: 345,
      thumbDown: 67,
      amazing: 123,
      bad: 45
    },
    ratingTrend: generateTrendData(7.0, 0.5)
  },
  {
    id: 5,
    name: 'Perplexity',
    developer: 'Perplexity AI',
    link: 'https://www.perplexity.ai',
    description: 'AI 搜索引擎，结合搜索和 AI 回答，信息查询神器。',
    price: '免费 / $20/月',
    averageScore: 9.4,
    ratingCount: 523,
    favoriteCount: 167,
    ratings: {
      versatility: 7.0,
      imageGeneration: 0,
      informationQuery: 10,
      studyAssistance: 9.0,
      valueForMoney: 9.6
    },
    tags: ['信息查询', '查资料', '免费', '最适合学生'],
    reactions: {
      thumbUp: 456,
      thumbDown: 12,
      amazing: 234,
      bad: 5
    },
    ratingTrend: generateTrendData(9.4, 0.3)
  },
  {
    id: 6,
    name: 'Notion AI',
    developer: 'Notion',
    link: 'https://www.notion.so/product/ai',
    description: '集成在 Notion 中的 AI 助手，适合笔记和文档整理。',
    price: '$10/月',
    averageScore: 7.5,
    ratingCount: 389,
    favoriteCount: 145,
    ratings: {
      versatility: 6.5,
      imageGeneration: 0,
      informationQuery: 6.0,
      studyAssistance: 8.5,
      valueForMoney: 6.5
    },
    tags: ['做笔记', '最适合学生', '写报告'],
    reactions: {
      thumbUp: 298,
      thumbDown: 23,
      amazing: 89,
      bad: 12
    },
    ratingTrend: generateTrendData(7.5, 0.4)
  },
  {
    id: 7,
    name: 'Gemini Advanced',
    developer: 'Google DeepMind',
    link: 'https://gemini.google.com',
    description: '多模态通用助手，擅长搜索、推理、代码和多模态理解。',
    price: '$19.99/月',
    averageScore: 8.8,
    ratingCount: 342,
    favoriteCount: 201,
    ratings: {
      versatility: 9.2,
      imageGeneration: 7.6,
      informationQuery: 9.8,
      studyAssistance: 8.4,
      valueForMoney: 7.8
    },
    tags: ['搜索能力', '多模态', '代码', '性价比'],
    reactions: {
      thumbUp: 265,
      thumbDown: 19,
      amazing: 133,
      bad: 9
    },
    ratingTrend: generateTrendData(8.8, 0.4)
  },
  {
    id: 8,
    name: 'Moonshot AI',
    developer: '月之暗面',
    link: 'https://www.moonshot.cn',
    description: '中文长文本和工具调用表现突出的模型，适合写作和分析。',
    price: '¥199/月',
    averageScore: 8.6,
    ratingCount: 188,
    favoriteCount: 120,
    ratings: {
      versatility: 8.8,
      imageGeneration: 1.0,
      informationQuery: 8.2,
      studyAssistance: 9.2,
      valueForMoney: 8.0
    },
    tags: ['中文友好', '长文本', '写报告', '国产'],
    reactions: {
      thumbUp: 141,
      thumbDown: 14,
      amazing: 77,
      bad: 6
    },
    ratingTrend: generateTrendData(8.6, 0.5)
  },
  {
    id: 9,
    name: 'Kimi',
    developer: 'Moonshot AI',
    link: 'https://kimi.moonshot.cn',
    description: '超长上下文中文助手，擅长阅读文档、总结与写作。',
    price: '免费 / 会员',
    averageScore: 7.2,
    ratingCount: 260,
    favoriteCount: 133,
    ratings: {
      versatility: 7.0,
      imageGeneration: 0,
      informationQuery: 7.5,
      studyAssistance: 7.8,
      valueForMoney: 7.0
    },
    tags: ['中文友好', '长文本', '总结', '最适合学生'],
    reactions: {
      thumbUp: 172,
      thumbDown: 18,
      amazing: 64,
      bad: 12
    },
    ratingTrend: generateTrendData(7.2, 0.5)
  },
  {
    id: 10,
    name: 'Firefly',
    developer: 'Adobe',
    link: 'https://www.adobe.com/sensei/generative-ai/firefly.html',
    description: '为设计师优化的图片生成模型，与 Photoshop/Express 深度集成。',
    price: 'Creative Cloud 订阅内',
    averageScore: 6.5,
    ratingCount: 145,
    favoriteCount: 88,
    ratings: {
      versatility: 5.5,
      imageGeneration: 8.5,
      informationQuery: 2.5,
      studyAssistance: 4.0,
      valueForMoney: 6.0
    },
    tags: ['画图一流', '设计师', '集成工具'],
    reactions: {
      thumbUp: 96,
      thumbDown: 11,
      amazing: 55,
      bad: 7
    },
    ratingTrend: generateTrendData(6.5, 0.6)
  }
,
  {
    id: 11,
    name: 'Grok',
    developer: 'xAI',
    link: 'https://grok.x.ai',
    description: '强调实时信息检索与轻松语气的对话模型，适合快速问答和热点追踪。',
    price: '订阅制',
    averageScore: 7.0,
    ratingCount: 210,
    favoriteCount: 120,
    ratings: {
      versatility: 7.0,
      imageGeneration: 1.0,
      informationQuery: 8.5,
      studyAssistance: 6.5,
      valueForMoney: 6.8
    },
    tags: ['实时搜索', '聊天', '资讯', '英文友好'],
    reactions: {
      thumbUp: 155,
      thumbDown: 18,
      amazing: 73,
      bad: 9
    },
    ratingTrend: generateTrendData(7.0, 0.5)
  }
]

// 模拟评论数据
export const mockComments = [
  {
    id: 1,
    aiId: 1,
    author: '学生小王',
    date: '2024-01-15',
    rating: 10,
    content: 'ChatGPT 真的太好用了！帮我写作业、做PPT、查资料，简直是学习神器。虽然有时候会出错，但整体来说非常强大。',
    upvotes: 45,
    helpful: false,
    notHelpful: false,
    replies: [
      {
        id: 1,
        author: 'AI爱好者',
        date: '2024-01-16',
        content: '同意！特别是 GPT-4，写代码的能力也很强。'
      }
    ]
  },
  {
    id: 2,
    aiId: 1,
    author: '职场人士',
    date: '2024-01-14',
    rating: 8,
    content: '用来写报告和邮件很方便，但有时候生成的内容需要自己修改。',
    upvotes: 23,
    helpful: false,
    notHelpful: false,
    replies: []
  },
  {
    id: 3,
    aiId: 2,
    author: '设计师小李',
    date: '2024-01-13',
    rating: 10,
    content: 'Midjourney 生成的图片质量真的没话说，艺术感很强。就是价格有点贵，但值得！',
    images: [],
    upvotes: 67,
    helpful: false,
    notHelpful: false,
    replies: []
  },
  {
    id: 4,
    aiId: 3,
    author: '程序员',
    date: '2024-01-12',
    rating: 9,
    content: 'Claude 处理长文本的能力很强，代码分析也很准确。比 ChatGPT 在某些方面更专业。',
    upvotes: 34,
    helpful: false,
    notHelpful: false,
    replies: []
  },
  {
    id: 5,
    aiId: 5,
    author: '研究生',
    date: '2024-01-11',
    rating: 10,
    content: 'Perplexity 查资料太方便了！直接给出答案和来源，不用自己一个个网站找。',
    upvotes: 56,
    helpful: false,
    notHelpful: false,
    replies: []
  }
]

