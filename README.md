# 乔木画布 Poster Studio

一个基于 Next.js 15 + Fabric.js 的在线海报设计工作台，当前重点支持小红书封面、知识卡片和社媒配图制作。

线上站点：[https://ps.qiaomu.ai](https://ps.qiaomu.ai)

## ✨ 核心功能

- **画布编辑**：1242×1660px 标准小红书封面尺寸
- **多比例画布**：支持 3:4、1:1、4:3、16:9、21:9、9:16 等常用发布比例
- **文字高亮**：支持荧光笔、下划线、边框三种高亮样式
- **版本管理**：最多支持 5 个版本，可自由切换和复制
- **导出功能**：下载 PNG 图片或复制到剪贴板
- **AI 生图**：支持 HiAPI、即梦 API、火山方舟 / Seedream 和自定义兼容接口
- **素材转存**：上传、生成图、去背景结果可通过服务端七牛配置转存
- **自动保存**：每 2 秒自动保存当前版本

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 配置 AI 生图服务

应用支持在设置弹窗中切换 AI 生图服务商预设：

- **HiAPI**：默认端点 `https://api.hiapi.ai/v1/images/generations`，默认模型 `qwen-image-2.0`
- **即梦 API**：默认端点 `https://api.qiaomu.ai/jimeng-auth/v1/images/generations`，默认模型 `jimeng-4.5`
- **火山方舟 / Seedream**：保留现有 Seedream 兼容请求格式
- **自定义兼容接口**：手动填写 Endpoint、Model ID、认证方式和请求格式

如果希望由服务端统一保存密钥，可复制 `.env.example` 为 `.env.local` 并填写：

```bash
NEXT_PUBLIC_SITE_URL=https://ps.qiaomu.ai
NEXT_PUBLIC_UMAMI_SRC=https://umami.qiaomu.ai/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id

AI_IMAGE_PROVIDER_ID=hiapi
AI_IMAGE_API_KEY=your_api_key
AI_IMAGE_API_ENDPOINT=https://api.hiapi.ai/v1/images/generations
AI_IMAGE_MODEL_ID=qwen-image-2.0
AI_IMAGE_AUTH_HEADER=bearer
AI_IMAGE_REQUEST_FORMAT=openai-image
```

图片上传、AI 生成图转存、分享图和去背景结果会通过服务端七牛上传接口处理，需要配置：

```bash
QINIU_ACCESS_KEY=your_qiniu_access_key
QINIU_SECRET_KEY=your_qiniu_secret_key
QINIU_BUCKET=your_bucket
QINIU_DOMAIN=https://your-cdn-domain.example.com
```

分享链接、公开模板和公开素材依赖 Vercel KV 兼容的 REST 环境变量：

```bash
KV_REST_API_URL=your_kv_rest_url
KV_REST_API_TOKEN=your_kv_rest_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
```

### 构建生产版本

```bash
npm run build
npm start
```

## 📁 项目结构

```
poster-studio/
├── app/
│   ├── components/          # React 组件
│   │   ├── Header.tsx       # 头部组件
│   │   ├── VersionBar.tsx   # 版本栏组件
│   │   ├── Toolbar.tsx      # 工具栏组件
│   │   └── PropertyPanel.tsx # 属性面板组件
│   ├── page.tsx             # 主页面
│   ├── layout.tsx           # 布局
│   └── globals.css          # 全局样式
├── lib/
│   ├── types.ts             # 类型定义
│   ├── canvas-manager.ts    # 画布管理器
│   └── version-manager.ts   # 版本管理器
└── package.json
```

## 🛠️ 技术栈

- **框架**：Next.js 15 (App Router)
- **语言**：TypeScript
- **画布**：Fabric.js 5.3
- **样式**：Tailwind CSS
- **字体**：思源黑体、思源宋体

## 📖 使用说明

1. **添加文本**：点击左侧工具栏的"添加文本"按钮
2. **添加高亮文字**：在右侧属性面板输入文字，选择样式和颜色，点击"添加到画布"
3. **编辑文本**：双击画布上的文字进行编辑
4. **调整样式**：选中文字后，在右侧属性面板调整字号、字体、颜色
5. **版本管理**：点击顶部版本栏切换版本，点击"+"复制当前版本
6. **导出**：点击右上角"下载"或"复制"按钮

## 🎨 高亮样式

- **荧光笔**：半透明彩色背景
- **下划线**：文字下方彩色线条
- **边框**：文字周围彩色边框

## 💾 数据存储

所有版本数据自动保存在浏览器的 localStorage 中，无需担心数据丢失。

## 📄 License

MIT
