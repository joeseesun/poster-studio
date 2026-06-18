# Contributing to Poster Studio

感谢你愿意改进乔木画布。这个项目面向真实内容创作场景，提交前请尽量让改动可验证、范围清晰。

## 开发流程

1. Fork 或新建分支。
2. 安装依赖：

   ```bash
   npm install
   ```

3. 启动本地服务：

   ```bash
   npm run dev
   ```

4. 提交前至少运行：

   ```bash
   npm run lint
   npm run build
   ```

## 提交 PR 前

- 说明你解决了什么问题，最好附截图或操作路径。
- 不要提交 `.env.local`、`.env.production`、`.data/`、`.next/`、`node_modules/`。
- 不要在 issue、PR、日志或截图里暴露 API Key、Token、七牛密钥、Remove.bg Key、Unsplash Key。
- 如果改动 AI provider、上传、分享、公开模板或 Vercel 部署，请说明验证过的环境变量组合。

## Scope

适合 PR 的方向：

- 画布编辑体验、排版、导出、模板。
- AI provider 兼容性与错误提示。
- Vercel/self-host 文档。
- 安全边界、限流、密钥处理。
- UI 可访问性和移动端体验。

较大的产品方向请先开 issue 讨论。
