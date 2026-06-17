# 形状工具更新 - 线条、箭头、画笔

## 📋 更新概览

参考 **Figma** 的最佳实践,新增了以下形状工具:

### 新增工具
1. ✅ **线条工具** (Line) - 快捷键 `L`
2. ✅ **箭头工具** (Arrow) - 快捷键 `Shift + L`
3. ✅ **画笔工具** (Pencil) - 快捷键 `P`

---

## 🎯 Figma 快捷键对照

| Figma | 本应用 | 功能 |
|-------|--------|------|
| `L` | `L` | 线条工具 |
| `Shift + L` | `Shift + L` | 箭头工具 |
| `P` | `P` | 钢笔/画笔工具 |
| `V` | `V` | 选择工具 |
| `R` | `R` | 矩形工具 |
| `O` | `O` | 圆形工具 |
| `T` | `T` | 文本工具 |
| `H` | `H` | 手型工具 |

---

## 🛠️ 技术实现

### 1. canvas-manager.ts

**新增形状类型:**

```typescript
case 'line':
  // 创建直线
  shape = new fabric.Line([centerX - 100, centerY, centerX + 100, centerY], {
    stroke: defaultStroke,
    strokeWidth: 3,
    selectable: true,
    evented: true,
  });
  break;

case 'arrow':
  // 创建箭头(使用Path绘制带箭头的线)
  const arrowPath = this.createArrowPath(200, 3);
  shape = new fabric.Path(arrowPath, {
    left: centerX - 100,
    top: centerY - 10,
    fill: defaultStroke,
    stroke: defaultStroke,
    strokeWidth: 0,
  });
  break;
```

**新增箭头路径生成方法:**

```typescript
private createArrowPath(length: number, strokeWidth: number): string {
  const headWidth = strokeWidth * 4; // 箭头宽度
  const headLength = strokeWidth * 5; // 箭头长度
  const halfStroke = strokeWidth / 2;

  // 绘制箭头: 线条 + 三角形箭头
  const path = `
    M 0,${halfStroke}
    L ${length - headLength},${halfStroke}
    L ${length - headLength},${halfStroke + headWidth}
    L ${length},0
    L ${length - headLength},${-halfStroke - headWidth}
    L ${length - headLength},${-halfStroke}
    L 0,${-halfStroke}
    Z
  `;
  return path;
}
```

**新增画笔模式方法:**

```typescript
// 画笔模式状态
private isDrawingMode = false;

// 启用画笔模式
enableDrawingMode(color = '#1e40af', width = 3) {
  this.canvas.isDrawingMode = true;
  this.isDrawingMode = true;

  if (this.canvas.freeDrawingBrush) {
    this.canvas.freeDrawingBrush.color = color;
    this.canvas.freeDrawingBrush.width = width;
  }
}

// 禁用画笔模式
disableDrawingMode() {
  this.canvas.isDrawingMode = false;
  this.isDrawingMode = false;
}

// 切换画笔模式
toggleDrawingMode() {
  if (this.isDrawingMode) {
    this.disableDrawingMode();
  } else {
    this.enableDrawingMode();
  }
  return this.isDrawingMode;
}

// 获取画笔模式状态
getDrawingMode() {
  return this.isDrawingMode;
}
```

---

### 2. ShapeDialog.tsx

**新增形状选项:**

```typescript
import { Square, Circle, Triangle, Star, Heart, Hexagon, Minus, ArrowRight, Pencil } from 'lucide-react';

const shapes = [
  { id: 'rect', label: '矩形', icon: Square },
  { id: 'circle', label: '圆形', icon: Circle },
  { id: 'triangle', label: '三角形', icon: Triangle },
  { id: 'line', label: '线条', icon: Minus },        // 新增
  { id: 'arrow', label: '箭头', icon: ArrowRight },  // 新增
  { id: 'star', label: '五角星', icon: Star },
  { id: 'heart', label: '爱心', icon: Heart },
  { id: 'hexagon', label: '六边形', icon: Hexagon },
  { id: 'pencil', label: '画笔', icon: Pencil },     // 新增
];
```

---

### 3. page.tsx

**新增快捷键处理:**

```typescript
// L - 线条工具
if (e.key === 'l' || e.key === 'L') {
  e.preventDefault();
  // Shift+L = 箭头, L = 线条
  if (e.shiftKey) {
    managerRef.current.addShape('arrow');
  } else {
    managerRef.current.addShape('line');
  }
  setActiveTool('shape');
  return;
}

// P - 画笔工具
if (e.key === 'p' || e.key === 'P') {
  e.preventDefault();
  const isDrawing = managerRef.current.toggleDrawingMode();
  setActiveTool(isDrawing ? 'pencil' : 'select');
  setToast({
    show: true,
    message: isDrawing ? '画笔模式已启用' : '画笔模式已禁用',
    type: 'success'
  });
  return;
}

// V - 选择工具(退出画笔模式)
if (e.key === 'v' || e.key === 'V') {
  e.preventDefault();
  // 如果在画笔模式,先退出
  if (managerRef.current.getDrawingMode()) {
    managerRef.current.disableDrawingMode();
  }
  setActiveTool('select');
  return;
}
```

**更新形状选择处理:**

```typescript
const handleSelectShape = (shapeType: string) => {
  if (!managerRef.current) return;

  // 如果是画笔,切换画笔模式
  if (shapeType === 'pencil') {
    const isDrawing = managerRef.current.toggleDrawingMode();
    setActiveTool(isDrawing ? 'pencil' : 'select');
    setToast({
      show: true,
      message: isDrawing ? '画笔模式已启用' : '画笔模式已禁用',
      type: 'success'
    });
  } else {
    // 其他形状直接添加
    managerRef.current.addShape(shapeType);
  }
};
```

---

## 📚 更新的文档

### 1. KeyboardShortcutsHelp.tsx
- ✅ 添加 `L` - 线条工具
- ✅ 添加 `Shift + L` - 箭头工具
- ✅ 添加 `P` - 画笔工具

### 2. KEYBOARD_SHORTCUTS.md
- ✅ 更新工具快捷键表格
- ✅ 新增画笔工具使用技巧
- ✅ 更新所有章节编号

### 3. TEST_SHORTCUTS.md
- ✅ 新增线条工具测试项
- ✅ 新增箭头工具测试项
- ✅ 新增画笔工具测试项
- ✅ 更新选择工具测试(包含退出画笔模式)

---

## 🎨 使用场景

### 线条工具 (L)
- 连接元素
- 分隔线
- 下划线
- 流程图连线

### 箭头工具 (Shift + L)
- 指示方向
- 流程图箭头
- 标注说明
- 引导视线

### 画笔工具 (P)
- 自由手绘
- 涂鸦标注
- 签名
- 手写文字
- 创意绘画

---

## ✅ 测试清单

### 基础功能测试
- [ ] 按 `L` 添加线条
- [ ] 按 `Shift + L` 添加箭头
- [ ] 按 `P` 启用画笔模式
- [ ] 在画笔模式下自由绘制
- [ ] 再按 `P` 退出画笔模式
- [ ] 按 `V` 退出画笔模式

### 形状对话框测试
- [ ] 点击形状工具按钮
- [ ] 查看线条、箭头、画笔选项
- [ ] 点击线条添加线条
- [ ] 点击箭头添加箭头
- [ ] 点击画笔启用画笔模式

### 快捷键帮助测试
- [ ] 按 `?` 打开快捷键帮助
- [ ] 查看新增的 L、Shift+L、P 快捷键
- [ ] 确认说明文字正确

### 边界情况测试
- [ ] 在画笔模式下按 `V` 应该退出画笔模式
- [ ] 在画笔模式下按 `P` 应该退出画笔模式
- [ ] 在文本编辑模式下按 `L`/`P` 不应该触发工具
- [ ] 画笔绘制的路径应该可以选中、移动、删除

---

## 🚀 下一步

测试完成后,如果一切正常:

1. ✅ `git add -A`
2. ✅ `git commit -m "feat: 添加线条、箭头、画笔工具"`
3. ✅ `git push origin main`
4. ✅ `vercel --prod`

---

## 📝 提交信息建议

```
feat: 添加线条、箭头、画笔工具

**新增工具:**
- 线条工具 (L): 添加直线
- 箭头工具 (Shift + L): 添加箭头
- 画笔工具 (P): 自由绘制

**快捷键:**
- L: 线条工具
- Shift + L: 箭头工具
- P: 切换画笔模式
- V: 选择工具(退出画笔模式)

**技术实现:**
- canvas-manager新增line/arrow形状类型
- 新增createArrowPath方法生成箭头路径
- 新增画笔模式管理方法
- Fabric.js isDrawingMode支持自由绘制
- 形状对话框新增3个工具选项

**参考标准:**
- 遵循Figma快捷键规范
- 符合设计软件最佳实践

**文档更新:**
- 更新KeyboardShortcutsHelp组件
- 更新KEYBOARD_SHORTCUTS.md
- 更新TEST_SHORTCUTS.md
- 新增SHAPE_TOOLS_UPDATE.md
```
