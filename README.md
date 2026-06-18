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

- **HiAPI**：默认端点 `https://api.hiapi.ai/v1/tasks`，默认模型 `gpt-image-2-beta`；模型下拉会从 HiAPI 模型接口刷新图片 task 模型，API Key 获取入口为 [https://www.hiapi.ai/zh/register?aff=NIWx](https://www.hiapi.ai/zh/register?aff=NIWx)
- **即梦 API**：线上 `ps.qiaomu.ai` 由乔木服务端内置；开源自部署不会获得乔木密钥，需要配置自己的服务端 Key，或切换到 HiAPI / Seedream / 自定义接口。模型可在设置里从 `jimeng-5.0`、`jimeng-4.6`、`jimeng-4.5`、`jimeng-4.1`、`jimeng-4.0`、`jimeng-3.1`、`jimeng-3.0` 下拉选择
- **火山方舟 / Seedream**：保留现有 Seedream 兼容请求格式
- **自定义兼容接口**：手动填写 Endpoint、Model ID、认证方式和请求格式

如果希望由服务端统一保存密钥，可复制 `.env.example` 为 `.env.local` 并填写：

```bash
NEXT_PUBLIC_SITE_URL=https://ps.qiaomu.ai
NEXT_PUBLIC_UMAMI_SRC=https://umami.qiaomu.ai/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id

NEXT_PUBLIC_ENABLE_BUILT_IN_JIMENG=false

AI_IMAGE_PROVIDER_ID=hiapi
JIMENG_API_KEY=your_server_side_jimeng_key
JIMENG_API_ENDPOINT=https://api.qiaomu.ai/jimeng-auth/v1/images/generations
JIMENG_BUILT_IN_ENABLED=false
JIMENG_MODEL_ID=jimeng-4.5
JIMENG_AUTH_HEADER=x-api-key
JIMENG_REQUEST_FORMAT=jimeng
```

如果你要在自己的部署里提供“服务端内置即梦”，需要同时显式开启前端入口和后端能力，并建议限制来源与频率：

```bash
NEXT_PUBLIC_ENABLE_BUILT_IN_JIMENG=true
JIMENG_BUILT_IN_ENABLED=true
AI_BUILTIN_IMAGE_ALLOWED_ORIGINS=https://your-domain.example.com
AI_BUILTIN_IMAGE_RATE_LIMIT_PER_HOUR=20
```

图片上传、AI 生成图转存、分享图和去背景结果会通过服务端七牛上传接口处理，需要配置：

```bash
QINIU_ACCESS_KEY=your_qiniu_access_key
QINIU_SECRET_KEY=your_qiniu_secret_key
QINIU_BUCKET=your_bucket
QINIU_DOMAIN=https://your-cdn-domain.example.com
```

Remove.bg 默认可由服务端统一内置，用户也可以在设置里填自己的 Key 覆盖：

```bash
REMOVE_BG_API_KEY=your_removebg_key
```

分享链接、公开模板和公开素材会优先使用 Vercel KV 兼容的 REST 环境变量：

```bash
KV_REST_API_URL=your_kv_rest_url
KV_REST_API_TOKEN=your_kv_rest_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
```

如果没有配置 KV，服务端会自动回退到本地文件存储。可通过 `POSTER_STUDIO_DATA_DIR` 指定持久化目录；未指定时使用项目根目录下的 `.data/`。

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
