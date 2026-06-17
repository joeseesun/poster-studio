# 开发文档

## 项目概述

这是一个基于 Next.js 15 + Fabric.js 的乔木画布海报设计工作台，提供直观的可视化编辑界面。

## 技术架构

### 核心技术栈

- **框架**: Next.js 15.5.5 (App Router)
- **语言**: TypeScript
- **画布库**: Fabric.js 5.3.0
- **样式**: Tailwind CSS
- **字体**: Noto Sans SC (思源黑体), Noto Serif SC (思源宋体)

### 项目结构

```
poster-studio/
├── app/
│   ├── components/          # React 组件 (每个文件 < 150 行)
│   │   ├── Header.tsx       # 头部组件 (30 行)
│   │   ├── VersionBar.tsx   # 版本栏组件 (60 行)
│   │   ├── Toolbar.tsx      # 工具栏组件 (35 行)
│   │   └── PropertyPanel.tsx # 属性面板组件 (140 行)
│   ├── page.tsx             # 主页面 (187 行)
│   ├── layout.tsx           # 布局文件 (34 行)
│   └── globals.css          # 全局样式 (34 行)
├── lib/
│   ├── types.ts             # 类型定义 (35 行)
│   ├── canvas-manager.ts    # 画布管理器 (160 行)
│   └── version-manager.ts   # 版本管理器 (120 行)
└── package.json
```

## 代码架构设计

### 设计原则

1. **单一职责**: 每个组件和类只负责一个功能
2. **文件行数限制**:
   - TypeScript/JavaScript 文件不超过 200 行
   - 实际实现中，大部分文件都在 150 行以内
3. **模块化**: 将复杂页面拆分为多个小组件
4. **类型安全**: 使用 TypeScript 确保类型安全

### 核心模块

#### 1. CanvasManager (画布管理器)

负责所有画布相关操作：
- 添加文本和高亮文本
- 更新对象属性
- 导出/导入 JSON
- 生成图片和缩略图

#### 2. VersionManager (版本管理器)

负责版本管理：
- 创建、复制、删除版本
- 切换版本
- 自动保存到 localStorage

#### 3. 组件层次

```
Page (主页面)
├── Header (头部)
├── VersionBar (版本栏)
├── Toolbar (工具栏)
├── Canvas (画布区域)
└── PropertyPanel (属性面板)
```

## 核心功能实现

### 1. 高亮文字

三种高亮样式：
- **荧光笔**: 半透明矩形背景 (opacity: 0.4)
- **下划线**: 文字下方线条
- **边框**: 文字周围边框

实现方式：使用 Fabric.js 的 Group 将高亮效果和文字组合

### 2. 版本管理

- 最多支持 5 个版本
- 每 2 秒自动保存当前版本
- 切换版本时保存缩略图
- 数据存储在 localStorage

### 3. 导出功能

- **下载**: 导出为 PNG 文件
- **复制**: 复制到系统剪贴板

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 浏览器兼容性

- Chrome/Edge: ✅ 完全支持
- Firefox: ✅ 完全支持
- Safari: ✅ 完全支持
- 移动端浏览器: ⚠️ 部分功能受限（剪贴板 API）

## 性能优化

1. **自动保存节流**: 2 秒间隔，避免频繁操作 localStorage
2. **缩略图压缩**: quality: 0.3, multiplier: 0.2
3. **组件懒加载**: 使用 Next.js 的自动代码分割
4. **Canvas 优化**: 使用 Fabric.js 的内置优化

## 已知限制

1. 版本数量限制为 5 个
2. 移动端剪贴板 API 支持有限
3. localStorage 存储限制（通常 5-10MB）

## 未来改进方向

1. 添加更多高亮样式
2. 支持图片上传
3. 支持更多字体
4. 添加模板功能
5. 云端存储支持
6. 移动端适配优化

## 故障排查

### 问题: Fabric.js 导入错误

**解决方案**: 确保使用 Fabric.js 5.3.0 版本
```bash
npm uninstall fabric
npm install fabric@5.3.0
```

### 问题: 字体未加载

**解决方案**: 检查 `app/local-google-fonts.css` 和 `public/fonts/google/` 是否完整

### 问题: localStorage 数据丢失

**解决方案**:
1. 检查浏览器隐私设置
2. 确保未使用无痕模式
3. 定期导出重要版本

## 贡献指南

1. 遵循代码行数限制
2. 保持组件单一职责
3. 添加适当的 TypeScript 类型
4. 更新相关文档

## License

MIT
