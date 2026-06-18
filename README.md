# 乔木画布 Poster Studio

> 面向小红书封面、知识卡片和社媒海报的在线设计工作台。打开即可排版、生成、去背景、导出。
>
> An online poster studio for Xiaohongshu covers, knowledge cards, and social graphics. Design, generate, remove backgrounds, and export in the browser.

[![Live Demo](https://img.shields.io/badge/Live-ps.qiaomu.ai-111827)](https://ps.qiaomu.ai)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjoeseesun%2Fposter-studio&project-name=poster-studio&repository-name=poster-studio)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![乔木画布预览](public/templates/%E5%BC%95%E7%94%A8%E5%8D%A1%E7%89%87-1280%C3%97720.png)

**中文** | [English](#english)

## 为什么值得用

很多内容创作者并不缺“图像生成”，缺的是一个能快速把标题、引用、图片、画布比例和导出流程串起来的轻量工具。乔木画布把这些日常步骤放在一个浏览器工作台里：

- 适合小红书封面、公众号配图、知识卡片、课程海报、社媒图。
- 不需要设计软件，直接在浏览器里编辑画布。
- 本地自动保存，刷新后继续编辑。
- 可接入自己的 HiAPI、火山方舟 / Seedream、自定义兼容接口，也可以在你自己的部署里开启服务端即梦。
- 线上站点 [ps.qiaomu.ai](https://ps.qiaomu.ai) 使用乔木服务端内置即梦，默认模型 `jimeng-4.5`；开源模板不会包含或暴露乔木的 API Key。

## 核心能力

- **画布编辑**：文本、图片、形状、图层、样式、阴影、圆角、滤镜。
- **多比例尺寸**：支持 3:4、1:1、4:3、16:9、21:9、9:16 等常用比例。
- **文字高亮**：荧光笔、下划线、边框三种样式。
- **版本管理**：最多 5 个版本，可复制当前版本继续改。
- **AI 生图**：支持 HiAPI、即梦、火山方舟 / Seedream、自定义兼容接口。
- **图生图 / 去背景**：支持参考图改写，Remove.bg 或本地背景移除。
- **素材转存**：可通过服务端七牛配置转存上传图、生成图、去背景结果。
- **分享与公开素材**：支持 Vercel KV；未配置时回退到本地文件存储。

## 立即体验

- 在线使用：[https://ps.qiaomu.ai](https://ps.qiaomu.ai)
- 一键部署到 Vercel：

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjoeseesun%2Fposter-studio&project-name=poster-studio&repository-name=poster-studio)

Vercel 一键部署默认是“无私有密钥基础版”：编辑、导出、本地自动保存可用；AI、七牛、Unsplash、Remove.bg、KV 等服务按需在 Vercel Project Settings 里配置环境变量。

## 本地运行

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

生产构建：

```bash
npm run build
npm start
```

## 环境变量

复制 `.env.example` 为 `.env.local`，按需填写。不要把 `.env.local`、`.env.production` 或任何真实 Key 提交到 Git。

### 默认开源配置

开源模板默认不启用乔木内置即梦：

```bash
NEXT_PUBLIC_ENABLE_BUILT_IN_JIMENG=false
AI_IMAGE_PROVIDER_ID=hiapi
JIMENG_BUILT_IN_ENABLED=false
JIMENG_API_KEY=
```

用户可以在浏览器设置里填自己的 HiAPI / Seedream / 自定义接口 Key。线上 `ps.qiaomu.ai` 的乔木内置 Key 只存在于服务器环境变量，不会进入仓库，也不会下发到浏览器。

### AI 生图

```bash
HIAPI_API_KEY=
HIAPI_API_ENDPOINT=https://api.hiapi.ai/v1/tasks
HIAPI_MODEL_ID=gpt-image-2-beta
HIAPI_AUTH_HEADER=bearer
HIAPI_REQUEST_FORMAT=hiapi-task

JIMENG_API_KEY=
JIMENG_API_ENDPOINT=https://api.qiaomu.ai/jimeng-auth/v1/images/generations
JIMENG_MODEL_ID=jimeng-4.5
JIMENG_AUTH_HEADER=x-api-key
JIMENG_REQUEST_FORMAT=jimeng
```

如果你想在自己的部署里提供“服务端内置即梦”，需要显式开启，并建议限制来源与频率：

```bash
NEXT_PUBLIC_ENABLE_BUILT_IN_JIMENG=true
JIMENG_BUILT_IN_ENABLED=true
AI_BUILTIN_IMAGE_ALLOWED_ORIGINS=https://your-domain.example.com
AI_BUILTIN_IMAGE_RATE_LIMIT_PER_HOUR=20
```

### 图片转存、搜索、去背景

```bash
QINIU_ACCESS_KEY=
QINIU_SECRET_KEY=
QINIU_BUCKET=
QINIU_DOMAIN=
QINIU_UPLOAD_URL=https://upload.qiniup.com
QINIU_STORAGE_PATH=xhs-cover

UNSPLASH_ACCESS_KEY=
REMOVE_BG_API_KEY=
```

### 分享 / 公开模板 / 公开素材

Vercel 或其他 serverless 环境建议配置 Vercel KV 兼容变量，否则本地文件存储在无状态平台上不适合长期保存数据。

```bash
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
POSTER_STUDIO_DATA_DIR=
```

## Vercel 部署说明

1. 点击 README 顶部的 **Deploy with Vercel**。
2. Vercel 会克隆本仓库到你的 GitHub/GitLab/Bitbucket，并自动识别 Next.js。
3. 先部署基础版；需要服务端 AI、七牛、Unsplash、Remove.bg、KV 时，再到 Vercel Project Settings -> Environment Variables 填写对应变量。
4. 如果修改了 `NEXT_PUBLIC_*` 变量，需要重新部署才会进入前端构建。

## 数据与密钥边界

- 浏览器侧：画布内容、版本、用户自填 API Key 默认保存在当前浏览器 localStorage。
- 服务端侧：七牛、Unsplash、Remove.bg、服务端即梦 Key 只应放在部署平台环境变量。
- 开源仓库：只保留 `.env.example` 占位符，不包含任何乔木生产密钥。
- 线上乔木站点：`ps.qiaomu.ai` 使用服务端内置即梦，默认 `jimeng-4.5`，并对内置生图接口做来源校验和每 IP 限流。

## 已验证

最近一次发布验证：2026-06-18

- `npm run lint` 通过，只有既有 warning。
- `npm run build` 通过。
- `https://ps.qiaomu.ai/` 返回 HTTP 200。
- 线上内置即梦默认模型已验证为 `jimeng-4.5`。
- 禁止来源调用内置即梦会返回 HTTP 403。

## 贡献

欢迎提交 issue 和 PR。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。如果你发现安全问题，请不要在公开 issue 里贴密钥、日志或可利用细节，先看 [SECURITY.md](SECURITY.md)。

## 关于向阳乔木

这个项目由 [向阳乔木 / Joe](https://github.com/joeseesun) 维护。

- 个人站：[qiaomu.ai](https://qiaomu.ai)
- 博客：[blog.qiaomu.ai](https://blog.qiaomu.ai)
- 乔木推荐：[tuijian.qiaomu.ai](https://tuijian.qiaomu.ai)
- X：[ @vista8 ](https://x.com/vista8)
- 微信公众号：向阳乔木推荐看

## License

[MIT](LICENSE)

---

<a name="english"></a>

# Poster Studio

Poster Studio is a browser-based design workspace for Xiaohongshu covers, quote cards, knowledge cards, and social graphics. It combines canvas editing, preset aspect ratios, AI image generation, background removal, export, and optional asset persistence.

## Try It

- Live demo: [https://ps.qiaomu.ai](https://ps.qiaomu.ai)
- Deploy your own copy:

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fjoeseesun%2Fposter-studio&project-name=poster-studio&repository-name=poster-studio)

The one-click Vercel deploy works as a no-secret base edition. Canvas editing, export, and browser autosave work out of the box. Server-side AI, Qiniu, Unsplash, Remove.bg, and KV features are opt-in through environment variables.

## Key Features

- Fabric.js canvas editor for text, images, shapes, styles, filters, and layers.
- Common social aspect ratios including 3:4, 1:1, 16:9, 21:9, and 9:16.
- Version management and local autosave.
- AI image generation through HiAPI, Jimeng, Seedream, or custom compatible endpoints.
- Optional image-to-image, background removal, Qiniu persistence, and Vercel KV sharing.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

## Open-source Boundary

This repository does not include Qiaomu's production API keys. The default `.env.example` keeps built-in Jimeng disabled and leaves all secret values blank. The hosted Qiaomu site uses server-side environment variables and request guards; self-hosted users must provide their own keys or use browser-configured providers.

## License

[MIT](LICENSE)
