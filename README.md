# 🎬 AI 视频工作室

基于 Next.js 14 构建的智能视频创作平台，集成多家 AI 大模型，实现从文本到视频的全流程自动化生成。

## ✨ 核心功能

- **📝 智能文本分析** - 自动提取角色、场景、分镜信息
- **🎨 AI 图片生成** - 根据分析结果生成角色图和场景图
- **🎥 AI 视频生成** - 将静态图片转换为动态视频片段
- **🎬 自动合成** - 将多个视频片段合成完整视频作品
- **🔄 多模型支持** - 灵活选择不同 AI 提供商的模型

## 🤖 支持的 AI 模型

### 文本分析
- **OpenAI GPT-4o** - 英文能力强，分析精准
- **通义千问 (Qwen)** - 中文理解优秀，速度快
- **豆包 (Doubao)** - 性价比高，响应稳定

### 图片生成
- **DALL·E 3** - OpenAI 旗舰模型，画面精美
- **通义万相 (Wanxiang)** - 阿里云 wanx2.1-t2i-turbo，中文提示词友好
- **即梦 AI (Jimeng)** - 字节跳动即梦，风格多样化
- **豆包 Seedream** - 字节跳动豆包文生图，画质精细（2K 高分辨率）

### 视频生成
- **Stable Video Diffusion** - Replicate 托管，图片转视频
- **通义万相·视频** - 阿里云 wanx-v1 图生视频
- **豆包 Seedance** - 字节跳动图生视频，动态自然流畅

## 🚀 快速开始

### 1. 环境要求

- Node.js 18+ 
- npm / yarn / pnpm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env.local`，填入你的 API Keys：

```bash
cp .env.example .env.local
```

**必需配置（至少选一组）：**

```env
# OpenAI (GPT-4o + DALL·E 3)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# 或 通义千问/万相 (Qwen + Wanxiang)
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx

# 或 豆包/即梦 (Doubao + Jimeng + Seedream + Seedance)
VOLCENGINE_API_KEY=xxxxxxxxxxxxxxxxxxxx
JIMENG_API_KEY=xxxxxxxxxxxxxxxxxxxx
```

**可选配置：**

```env
# Replicate 视频生成
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxx
```

详细配置说明请查看 `.env.example` 文件。

### 4. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 开始创作。

### 5. 生产构建

```bash
npm run build
npm start
```

## 📖 使用流程

1. **输入文本** - 输入故事文本或上传图片
2. **选择模型** - 选择文本分析、图片生成、视频生成的 AI 模型
3. **AI 分析** - 自动提取角色、场景、分镜信息
4. **资源预览** - 查看生成的角色图和场景图，可手动调整
5. **分镜编辑** - 编辑分镜描述、镜头角度、时长等
6. **视频生成** - 为每个分镜生成视频片段
7. **合成导出** - 合成完整视频并下载

## 🏗️ 技术栈

- **框架**: Next.js 14 (App Router)
- **UI**: React 18 + TailwindCSS + Framer Motion
- **图标**: Lucide React
- **AI SDK**: OpenAI SDK + 自定义 Provider 适配层
- **视频处理**: FFmpeg (fluent-ffmpeg)
- **类型安全**: TypeScript

## 📁 项目结构

```
video-studio/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── analyze/       # 文本分析
│   │   │   ├── generate-image/ # 图片生成
│   │   │   ├── generate-video/ # 视频生成
│   │   │   └── composite/     # 视频合成
│   │   ├── create/            # 创作页面
│   │   └── page.tsx           # 首页
│   ├── components/            # React 组件
│   │   ├── steps/             # 创作流程步骤组件
│   │   └── ui/                # 通用 UI 组件
│   ├── context/               # React Context
│   │   ├── ProjectContext.tsx # 项目状态管理
│   │   └── ProviderContext.tsx # 模型选择管理
│   ├── lib/                   # 核心库
│   │   ├── providers/         # AI 模型提供商
│   │   │   ├── openai-provider.ts
│   │   │   ├── qianwen-provider.ts
│   │   │   ├── doubao-provider.ts
│   │   │   ├── types.ts       # 类型定义
│   │   │   └── index.ts       # Provider 工厂
│   │   └── api-client.ts      # 前端 API 客户端
│   └── types/                 # 全局类型定义
├── .env.example               # 环境变量示例
└── README.md                  # 项目文档
```

## 🔧 核心架构

### Provider 抽象层

项目采用 Provider 模式统一管理多家 AI 模型：

```typescript
// 统一接口
interface ITextProvider {
  analyze(text: string): Promise<AnalysisResult>;
}

interface IImageProvider {
  generateImage(prompt: string, size: string): Promise<string>;
}

interface IVideoProvider {
  generateVideo(imageUrl: string): Promise<string>;
}

// 工厂函数
getTextProvider(provider: TextProvider): ITextProvider
getImageProvider(provider: ImageProvider): IImageProvider
getVideoProvider(provider: VideoProvider): IVideoProvider
```

### 状态管理

- **ProjectContext** - 管理项目数据（角色、场景、分镜、视频片段）
- **ProviderContext** - 管理用户选择的 AI 模型配置

## 🎯 最佳实践

### 模型选择建议

**中文内容创作：**
- 文本分析: **通义千问** (qwen-turbo，速度快)
- 图片生成: **豆包 Seedream** (2K 高清) 或 **通义万相** (速度快)
- 视频生成: **豆包 Seedance** (效果好)

**英文内容创作：**
- 文本分析: **OpenAI GPT-4o**
- 图片生成: **DALL·E 3**
- 视频生成: **Stable Video Diffusion**

### 性能优化

- 图片生成支持自动尺寸映射（满足不同模型的分辨率要求）
- 内置限流重试机制（自动处理 API 限流）
- 视频生成采用异步轮询（避免长时间阻塞）

## ⚠️ 注意事项

1. **API 限流** - 各家 AI 服务都有调用频率限制，建议合理控制并发请求
2. **成本控制** - 高分辨率图片和视频生成成本较高，请注意用量
3. **网络要求** - 部分 API 需要稳定的网络连接
4. **视频合成** - 需要服务器安装 FFmpeg

## 🐛 常见问题

**Q: 图片生成失败，提示 "image size must be at least 3686400 pixels"？**  
A: 豆包 Seedream 要求最小分辨率 1920x1920，项目已自动映射尺寸。

**Q: 视频生成失败，提示 "url error"？**  
A: 检查分镜图片是否生成成功，占位图无法用于视频生成。

**Q: 分析步骤卡在 5% 不动？**  
A: 已修复 React Strict Mode 问题，确保使用最新代码。

**Q: 通义千问分析返回 "未提取到角色"？**  
A: 已优化 JSON 解析逻辑，支持 markdown 代码块包裹的响应。

## 📝 开发计划

- [ ] 支持更多 AI 模型（Midjourney、Runway 等）
- [ ] 添加视频编辑功能（剪辑、转场、配乐）
- [ ] 支持批量生成和队列管理
- [ ] 添加用户系统和项目保存
- [ ] 优化移动端体验

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**Made with ❤️ using Next.js & AI**
