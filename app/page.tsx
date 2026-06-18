'use client';

import { useEffect, useRef, useState } from 'react';
import { CanvasManager } from '@/lib/canvas-manager';
import { VersionManager } from '@/lib/version-manager';
import { AIImageGenerator } from '@/lib/ai-image-generator';
import { ImageToImageGenerator } from '@/lib/image-to-image-generator';
import { CanvasVersion, CanvasSize, DEFAULT_CANVAS_SIZE } from '@/lib/types';
import Topbar from './components/home/Topbar';
import Sidebar from './components/home/Sidebar';
import Canvas from './components/home/Canvas';
import FontPanel from './components/home/FontPanel';
import { AIImageDialog } from './components/home/AIImageDialog';
import ImageDialog from './components/home/ImageDialog';
import ShapeDialog from './components/home/ShapeDialog';
import ImageToImageDialog from './components/home/ImageToImageDialog';
import KeyboardShortcutsHelp from './components/home/KeyboardShortcutsHelp';
import ShapePropertiesPanel from './components/home/properties/ShapePropertiesPanel';
import PathPropertiesPanel from './components/home/properties/PathPropertiesPanel';
import ConfirmDialog from './components/ui/ConfirmDialog';
import Toast, { ToastType } from './components/ui/Toast';
import { HexColorPicker } from 'react-colorful';
import SettingsDialog, { hasApiKeyConfigured } from './components/home/SettingsDialog';
import DonationDialog from './components/home/DonationDialog';
import WeChatDialog from './components/home/WeChatDialog';
import TemplateLibraryDialog from './components/home/TemplateLibraryDialog';
import SaveTemplateDialog from './components/home/SaveTemplateDialog';
import IconLibraryDialog from './components/home/IconLibraryDialog';
import SVGPropertiesPanel from './components/home/properties/SVGPropertiesPanel';
import ImagePropertiesPanel from './components/properties/ImagePropertiesPanel';
import { getTemplateManager, TemplateCategory } from '@/lib/template-manager';
import { IconConfig } from '@/lib/icon-library';
import { updateSVGColor, updateSVGStrokeWidth } from '@/lib/svg-to-fabric';
import { fabric } from 'fabric';
import { getImageLibrary } from '@/lib/image-library';
import ShareDialog from './components/ShareDialog';
import ShareMaterialDialog from './components/home/ShareMaterialDialog';

function normalizeCanvasSize(size?: CanvasSize | null): CanvasSize {
  const width = Number(size?.width);
  const height = Number(size?.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return DEFAULT_CANVAS_SIZE;
  }

  return {
    name: size?.name || `${width}×${height}`,
    width,
    height,
    ratio: size?.ratio || (width === height ? '1:1' : `${width}:${height}`),
  };
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<CanvasManager | null>(null);
  const versionRef = useRef<VersionManager | null>(null);

  const [versions, setVersions] = useState<CanvasVersion[]>([]);
  const [activeId, setActiveId] = useState('');
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [activeTool, setActiveTool] = useState('text');
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(DEFAULT_CANVAS_SIZE);
  const canvasSizeRef = useRef<CanvasSize>(DEFAULT_CANVAS_SIZE);
  const [userZoom, setUserZoom] = useState(100); // 用户手动缩放（50-200%）
  const [isPanMode, setIsPanMode] = useState(false); // 拖拽模式锁定状态
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showShapeFillPicker, setShowShapeFillPicker] = useState(false);
  const [showShapeStrokePicker, setShowShapeStrokePicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAIImageDialog, setShowAIImageDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showShapeDialog, setShowShapeDialog] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [showWeChatDialog, setShowWeChatDialog] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showIconLibrary, setShowIconLibrary] = useState(false);
  const [showShareMaterialDialog, setShowShareMaterialDialog] = useState(false); // 🆕 分享素材对话框
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'success' });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showImageToImageDialog, setShowImageToImageDialog] = useState(false);
  const aiImageGeneratorRef = useRef<AIImageGenerator | null>(null);
  const imageToImageGeneratorRef = useRef<ImageToImageGenerator | null>(null);

  // 分享功能状态
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    canvasSizeRef.current = canvasSize;
  }, [canvasSize]);

  // 初始化 - 只在组件挂载时执行一次
  useEffect(() => {
    if (!canvasRef.current) return;

    versionRef.current = new VersionManager();
    aiImageGeneratorRef.current = new AIImageGenerator();
    imageToImageGeneratorRef.current = new ImageToImageGenerator();

    const allVersions = versionRef.current.getAll();
    const activeVersion = versionRef.current.getActive();
    const initialCanvasSize = normalizeCanvasSize(activeVersion?.canvasSize);

    canvasSizeRef.current = initialCanvasSize;
    setCanvasSize(initialCanvasSize);

    managerRef.current = new CanvasManager(
      canvasRef.current,
      initialCanvasSize.width,
      initialCanvasSize.height
    );
    // 🆕 启用历史记录（构造函数中默认禁用）
    managerRef.current.setLoadingTemplate(false);

    console.log('🔍 初始化加载:', {
      版本数量: allVersions.length,
      所有版本: allVersions.map(v => ({ id: v.id, name: v.name, updatedAt: new Date(v.updatedAt).toLocaleString() })),
      当前激活版本: activeVersion ? { id: activeVersion.id, name: activeVersion.name, updatedAt: new Date(activeVersion.updatedAt).toLocaleString() } : null,
      初始画布尺寸: `${initialCanvasSize.width}×${initialCanvasSize.height}`,
    });

    setVersions(allVersions);
    setActiveId(activeVersion!.id);

    if (activeVersion?.data) {
      console.log('📥 初始化加载画布数据，长度:', activeVersion.data.length);
      managerRef.current.loadFromJSON(activeVersion.data);
      // ✅ 不再需要 migrateOldGroups，因为 rebindGroupEvents 已经处理了双击编辑
    } else {
      console.log('📄 初始化空白画布');
      // 如果没有数据，直接启用历史记录
      managerRef.current.setLoadingTemplate(false);
    }

    // 监听选择事件
    // 🔥 保存完整的 activeObject（可能是单个对象或 activeSelection）
    managerRef.current.canvas.on('selection:created', (e: any) => {
      const target = e.selected?.[0] || e.target;
      setSelectedObject(target);
      console.log('🎯 selection:created:', target?.type, 'selected count:', e.selected?.length);
    });
    managerRef.current.canvas.on('selection:updated', (e: any) => {
      const target = e.selected?.[0] || e.target;
      setSelectedObject(target);
      console.log('🎯 selection:updated:', target?.type, 'selected count:', e.selected?.length);
    });
    managerRef.current.canvas.on('selection:cleared', () => {
      setSelectedObject(null);
      console.log('🎯 selection:cleared');
    });

    // 在Fabric.js的upperCanvasEl上监听右键
    const upperCanvas = (managerRef.current.canvas as any).upperCanvasEl;
    const handleCanvasContextMenu = (e: MouseEvent) => {
      console.log('🟡🟡🟡 upperCanvasEl contextmenu触发!');
      e.preventDefault();
      e.stopPropagation();

      const currentActiveObject = managerRef.current!.canvas.getActiveObject();

      // 🔥 如果当前是多选状态，直接显示菜单，不改变选择
      if (currentActiveObject?.type === 'activeSelection') {
        console.log('🖱️ 右键点击多选对象');
        setContextMenu({ x: e.pageX, y: e.pageY });
        // 保存当前多选对象
        (setContextMenu as any).clickedObject = currentActiveObject;
        console.log('✅ 显示多选菜单');
        return;
      }

      // 单选或无选择状态：查找点击的对象
      const pointer = managerRef.current!.canvas.getPointer(e);
      const allObjects = managerRef.current!.canvas.getObjects();
      let target = null;

      // 从上到下查找鼠标位置的对象（包括锁定的对象）
      for (let i = allObjects.length - 1; i >= 0; i--) {
        const obj = allObjects[i];
        // 创建 Fabric.js Point 对象
        const point = new fabric.Point(pointer.x, pointer.y);
        if (obj.containsPoint(point)) {
          target = obj;
          break;
        }
      }

      console.log('🖱️ 右键点击:', {
        target: target?.type,
        locked: (target as any)?.locked,
        currentActive: currentActiveObject?.type,
        pointer
      });

      if (target) {
        // 如果对象未锁定，设置为选中状态
        if (!(target as any).locked) {
          managerRef.current!.canvas.setActiveObject(target);
          managerRef.current!.canvas.renderAll();
        }

        // 使用 pageX/pageY 而不是 clientX/clientY，避免高 DPI 屏幕缩放问题
        setContextMenu({ x: e.pageX, y: e.pageY });
        // 保存右键点击的对象（用于锁定对象的菜单）
        (setContextMenu as any).clickedObject = target;
        console.log('✅ 显示菜单');
      } else {
        setContextMenu(null);
        console.log('⚠️ 关闭菜单');
      }
    };

    upperCanvas.addEventListener('contextmenu', handleCanvasContextMenu);



    // 点击画布空白区域取消选中
    managerRef.current.canvas.on('mouse:down', (e) => {
      if (!e.target) {
        managerRef.current?.canvas.discardActiveObject();
        managerRef.current?.canvas.renderAll();
      }
    });

    // 监听画布变化，更新撤销/重做状态
    const updateUndoRedoState = () => {
      if (managerRef.current) {
        setCanUndo(managerRef.current.canUndo());
        setCanRedo(managerRef.current.canRedo());
      }
    };
    managerRef.current.canvas.on('object:added', updateUndoRedoState);
    managerRef.current.canvas.on('object:modified', updateUndoRedoState);
    managerRef.current.canvas.on('object:removed', updateUndoRedoState);

    // 全局点击事件：只有点击画布容器的灰色背景区域时才取消选中
    const handleGlobalClick = (e: MouseEvent) => {
      if (!managerRef.current) return;

      const target = e.target as HTMLElement;
      const canvasContainer = document.getElementById('canvas-container');

      if (!canvasContainer) return;

      // 只有直接点击画布容器的灰色背景区域时才取消选中
      // 不包括点击画布本身、Topbar、Sidebar、FontPanel 等其他 UI 元素
      if (target === canvasContainer) {
        const activeObject = managerRef.current.canvas.getActiveObject();
        if (activeObject && !(activeObject as any).isEditing) {
          managerRef.current.canvas.discardActiveObject();
          managerRef.current.canvas.renderAll();
        }
      }
    };

    // 键盘事件：删除选中对象、图层调整、工具快捷键
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('⌨️ keydown 事件:', e.key, 'metaKey:', e.metaKey, 'ctrlKey:', e.ctrlKey);

      // 检查是否有输入框获得焦点
      const target = e.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // 平台检测
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // 工具快捷键(不需要Cmd/Ctrl修饰键,但要避免在输入框中触发)
      if (!isInputFocused && managerRef.current) {
        // Enter - 进入文本编辑模式（仅当选中文本对象时）
        if (e.key === 'Enter') {
          const activeObject = managerRef.current.canvas.getActiveObject();
          if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'textbox')) {
            e.preventDefault();
            // 进入编辑模式
            (activeObject as any).enterEditing();
            (activeObject as any).selectAll();
            return;
          }
        }

        // T - 文本工具
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          handleToolChange('text');
          return;
        }

        // R - 矩形工具
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          managerRef.current.addShape('rect');
          setActiveTool('shape');
          return;
        }

        // O - 圆形工具
        if (e.key === 'o' || e.key === 'O') {
          e.preventDefault();
          managerRef.current.addShape('circle');
          setActiveTool('shape');
          return;
        }

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

        // P - 画笔工具（持久化模式）
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          managerRef.current.enableDrawingMode();
          setActiveTool('pencil');
          setToast({
            show: true,
            message: '画笔模式已启用 (按 V 或 ESC 退出)',
            type: 'success'
          });
          return;
        }

        // V - 选择工具(取消当前工具,退出画笔模式和形状绘制模式)
        // 🔑 排除 Cmd/Ctrl+V (粘贴快捷键)
        if ((e.key === 'v' || e.key === 'V') && !cmdOrCtrl) {
          e.preventDefault();
          // 如果在画笔模式,先退出
          if (managerRef.current.getDrawingMode()) {
            managerRef.current.disableDrawingMode();
          }
          // 如果在形状绘制模式,先退出
          if (managerRef.current.getShapeDrawingMode()) {
            managerRef.current.exitShapeDrawingMode();
          }
          setActiveTool('select');
          return;
        }

        // Esc - 退出当前模式
        if (e.key === 'Escape') {
          e.preventDefault();
          // 退出画笔模式
          if (managerRef.current.getDrawingMode()) {
            managerRef.current.disableDrawingMode();
            setActiveTool('select');
          }
          // 退出形状绘制模式
          if (managerRef.current.getShapeDrawingMode()) {
            managerRef.current.exitShapeDrawingMode();
            setActiveTool('select');
          }
          return;
        }

        // H - 手型工具(拖拽模式)
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          setIsPanMode(!isPanMode);
          return;
        }

        // ? - 快捷键帮助
        if (e.key === '?' || e.key === '/') {
          e.preventDefault();
          setShowKeyboardHelp(true);
          return;
        }
      }

      // Cmd/Ctrl + / - 快捷键帮助
      if (cmdOrCtrl && e.key === '/') {
        e.preventDefault();
        setShowKeyboardHelp(true);
        return;
      }

      // 删除键处理
      if ((e.key === 'Delete' || e.key === 'Backspace') && managerRef.current) {
        // 如果输入框获得焦点,不处理删除键,让浏览器处理
        if (isInputFocused) {
          return;
        }

        const activeObject = managerRef.current.canvas.getActiveObject();
        if (activeObject) {
          // 检查是否处于编辑状态
          const isEditing = (activeObject as any).isEditing;

          // 只有在非编辑状态下才删除整个对象
          if (!isEditing) {
            e.preventDefault(); // 阻止默认行为
            managerRef.current.deleteActive(); // 使用 deleteActive 方法支持多选删除
          }
          // 如果处于编辑状态,让浏览器处理默认的删除行为（删除选中的文字）
        }
      }

      // 撤销/重做快捷键
      if (cmdOrCtrl && e.key === 'z' && managerRef.current) {
        e.preventDefault();
        if (e.shiftKey) {
          // Cmd/Ctrl + Shift + Z = 重做
          managerRef.current.redo();
        } else {
          // Cmd/Ctrl + Z = 撤销
          managerRef.current.undo();
        }
        return;
      }

      // 锁定/解锁快捷键 Cmd/Ctrl + Shift + L
      if (cmdOrCtrl && e.shiftKey && e.key === 'l' && managerRef.current) {
        e.preventDefault();
        const activeObject = managerRef.current.canvas.getActiveObject();
        if (activeObject) {
          const isLocked = managerRef.current.toggleLock(activeObject);
          setToast({
            show: true,
            message: isLocked ? '对象已锁定' : '对象已解锁',
            type: 'success'
          });
        }
        return;
      }

      // Tab键 - 打开图片转换对话框（需要选中对象且不在编辑状态）
      if (e.key === 'Tab' && managerRef.current) {
        const activeObject = managerRef.current.canvas.getActiveObject();
        const activeObjects = managerRef.current.canvas.getActiveObjects();

        // 检查是否处于文本编辑状态
        const isEditing = activeObject && (activeObject as any).isEditing;

        if (activeObjects.length > 0 && !isEditing) {
          e.preventDefault();

          // 检查是否配置了 API Key
          if (!hasApiKeyConfigured()) {
            setShowSettingsDialog(true);
            setToast({ show: true, message: '请先配置 API Key', type: 'info' });
            return;
          }

          setShowImageToImageDialog(true);
          return;
        }
      }

      // 复制快捷键 Cmd/Ctrl + C (需要选中对象)
      if (cmdOrCtrl && e.key === 'c' && managerRef.current) {
        const activeObject = managerRef.current.canvas.getActiveObject();
        if (activeObject) {
          // 检查是否有输入框获得焦点
          const target = e.target as HTMLElement;
          const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

          // 如果输入框获得焦点,不处理复制,让浏览器处理
          if (!isInputFocused) {
            e.preventDefault();
            managerRef.current.copy();
            setToast({ show: true, message: '已复制', type: 'success' });
            return;
          }
        }
      }

      // 粘贴快捷键 Cmd/Ctrl + V
      if (cmdOrCtrl && e.key === 'v' && managerRef.current) {
        // 检查是否有输入框获得焦点
        const target = e.target as HTMLElement;
        const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

        // 如果输入框获得焦点,不处理粘贴,让浏览器处理
        if (!isInputFocused) {
          const hasContent = managerRef.current.hasClipboardContent();
          console.log('🔍 Cmd/Ctrl+V 按下, 内部剪贴板有内容:', hasContent);

          // 如果有内部剪贴板内容，粘贴画布对象
          if (hasContent) {
            console.log('✂️ 粘贴画布对象');
            e.preventDefault();
            managerRef.current.paste();
            return;
          }

          // 🔑 不阻止默认行为，让 paste 事件触发
          console.log('💡 等待 paste 事件处理图片粘贴');
          // 不调用 e.preventDefault()，让浏览器触发 paste 事件
        }
      }

      // 图层调整快捷键和复制快捷键（需要选中对象）
      if (managerRef.current && managerRef.current.canvas.getActiveObject()) {
        // 下载对象快捷键 Cmd/Ctrl + Shift + D
        if (cmdOrCtrl && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          managerRef.current.downloadObject().then(() => {
            setToast({ show: true, message: '下载成功', type: 'success' });
          }).catch(() => {
            setToast({ show: true, message: '下载失败', type: 'error' });
          });
          return;
        }

        // 原地复制快捷键 Cmd/Ctrl + D
        if (cmdOrCtrl && e.key === 'd') {
          e.preventDefault();
          managerRef.current.duplicateActive();
          return;
        }

        if (cmdOrCtrl && e.key === ']') {
          e.preventDefault();
          if (e.shiftKey) {
            managerRef.current.bringToFront(); // Cmd/Ctrl + Shift + ]
          } else {
            managerRef.current.bringForward(); // Cmd/Ctrl + ]
          }
        } else if (cmdOrCtrl && e.key === '[') {
          e.preventDefault();
          if (e.shiftKey) {
            managerRef.current.sendToBack(); // Cmd/Ctrl + Shift + [
          } else {
            managerRef.current.sendBackwards(); // Cmd/Ctrl + [
          }
        }
      }
    };

    // 剪贴板粘贴事件：支持粘贴图片
    const handlePaste = async (e: ClipboardEvent) => {
      console.log('📋 paste 事件触发');
      if (!managerRef.current) return;

      const items = e.clipboardData?.items;
      if (!items) {
        console.log('⚠️ 没有剪贴板数据');
        return;
      }

      console.log('📋 剪贴板项数量:', items.length);

      // 检查是否有图片
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`📋 剪贴板项 ${i}:`, item.type);

        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            try {
              console.log('✅ 找到图片，开始粘贴:', blob.type, blob.size, 'bytes');

              // 显示上传提示
              setToast({ show: true, message: '上传粘贴图片中...', type: 'info' });

              await managerRef.current.addImageFromClipboard(blob);

              // 上传成功提示
              setToast({ show: true, message: '图片已粘贴', type: 'success' });
            } catch (error) {
              console.error('❌ 粘贴图片失败:', error);
              setToast({
                show: true,
                message: '粘贴图片失败',
                type: 'error'
              });
            }
          }
          break;
        }
      }
    };

    // 监听形状绘制完成事件
    const handleShapeCompleted = () => {
      console.log('🎨 收到形状绘制完成事件，切换回选择工具');
      setActiveTool('select');
    };

    window.addEventListener('click', handleGlobalClick);
    // 🔑 使用 capture 阶段监听，优先于浏览器扩展
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('paste', handlePaste, true);
    document.addEventListener('shape:completed', handleShapeCompleted);

    console.log('✅ 事件监听器已注册（使用 capture 阶段），包括 paste 事件');

    return () => {
      upperCanvas.removeEventListener('contextmenu', handleCanvasContextMenu);
      managerRef.current?.dispose();
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('shape:completed', handleShapeCompleted);
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 页面卸载前保存数据
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (managerRef.current && versionRef.current && activeId) {
        // 🔥 检查是否正在加载模板，避免保存空数据
        if (managerRef.current.getLoadingTemplate()) {
          console.log('⚠️ 正在加载模板，跳过页面卸载前保存');
          return;
        }

        const data = managerRef.current.toJSON();
        const currentCanvasSize = canvasSizeRef.current;
        versionRef.current.update(activeId, data, undefined, currentCanvasSize);
        console.log('💾 页面卸载前保存:', {
          版本ID: activeId,
          数据大小: data.length,
          画布尺寸: `${currentCanvasSize.width}×${currentCanvasSize.height}`,
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // 组件卸载时也保存一次
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeId]);

  // 自动保存（增加间隔，减少 localStorage 写入）
  useEffect(() => {
    let lastSavedData = '';

    const timer = setInterval(() => {
      if (managerRef.current && versionRef.current && activeId) {
        // 🔥 检查是否正在加载模板，避免保存空数据
        if (managerRef.current.getLoadingTemplate()) {
          return;
        }

        const data = managerRef.current.toJSON();

        // 只有数据变化时才保存，避免重复写入
        if (data !== lastSavedData) {
          try {
            // 自动保存时不保存缩略图，减少 localStorage 占用
            versionRef.current.update(activeId, data, undefined, canvasSizeRef.current);
            lastSavedData = data;
            // 🔇 降低日志级别，避免控制台刷屏
            if (process.env.NODE_ENV === 'development') {
              console.debug('💾 自动保存:', activeId, `${(data.length / 1024).toFixed(1)}KB`);
            }
          } catch (error) {
            console.error('❌ 自动保存失败:', error);
            // 如果 localStorage 满了，清理旧版本
            if (error instanceof Error && error.name === 'QuotaExceededError') {
              console.warn('⚠️ localStorage 已满，请考虑删除一些版本');
            }
          }
        }
      }
    }, 2000); // 2 秒自动保存一次，确保数据及时保存

    return () => clearInterval(timer);
  }, [activeId]);

  // 工具切换
  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    if (tool === 'text' && managerRef.current) {
      managerRef.current.addText(); // 单行文本
    } else if (tool === 'textbox' && managerRef.current) {
      managerRef.current.addTextbox(); // 多行文本
    } else if (tool === 'pencil' && managerRef.current) {
      // 🆕 启用画笔模式（持久化，不会自动退出）
      managerRef.current.enableDrawingMode();
      setToast({
        show: true,
        message: '画笔模式已启用 (按 V 或 ESC 退出)',
        type: 'success'
      });
    } else if (tool === 'select' && managerRef.current) {
      // 🆕 切换到选择模式，退出画笔/形状绘制模式
      if (managerRef.current.getDrawingMode()) {
        managerRef.current.disableDrawingMode();
      }
      if (managerRef.current.getShapeDrawingMode()) {
        managerRef.current.exitShapeDrawingMode();
      }
    } else if (tool === 'image' && managerRef.current) {
      // 显示图片对话框
      setShowImageDialog(true);
    } else if (tool === 'ai-image') {
      // 检查是否配置了 API Key
      if (!hasApiKeyConfigured()) {
        setShowSettingsDialog(true);
        setToast({ show: true, message: '请先配置 API Key', type: 'info' });
        return;
      }
      // 打开 AI 生图对话框
      setShowAIImageDialog(true);
    } else if (tool === 'emoji') {
      // 切换 Emoji 选择器
      setShowEmojiPicker(!showEmojiPicker);
    } else if (tool === 'shape') {
      // 显示形状选择对话框
      setShowShapeDialog(true);
    } else if (tool === 'icon') {
      // 显示图标库对话框
      setShowIconLibrary(true);
    }
  };

  // AI 生成图片（异步）
  const handleAIImageGenerate = async (prompt: string, size: string) => {
    if (!aiImageGeneratorRef.current || !managerRef.current) return;

    try {
      // 1. 立即添加占位图到画布
      console.log('🎨 添加占位图到画布...');
      const placeholderImage = await managerRef.current.addAIPlaceholder(size);

      // 2. 异步生成图片（不阻塞UI）
      console.log('🚀 开始异步生成图片...');
      aiImageGeneratorRef.current.generateImage(prompt, size)
        .then(async (imageUrl) => {
          // 3. 生成成功，替换占位图
          console.log('✅ 图片生成成功，替换占位图:', imageUrl);
          await managerRef.current?.replaceAIPlaceholder(placeholderImage, imageUrl);
          console.log('✅ AI 生成的图片已添加到画布');
        })
        .catch((error) => {
          // 4. 生成失败，移除占位图并提示
          console.error('❌ AI 生图失败:', error);
          managerRef.current?.removeAIPlaceholder(placeholderImage);
          alert(`生成图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
        });

      // 立即返回，不等待生成完成
      console.log('💡 占位图已添加，图片正在后台生成...');
    } catch (error) {
      console.error('❌ 添加占位图失败:', error);
      throw error;
    }
  };

  // 从图库选择图片
  const handleSelectImageFromLibrary = async (url: string) => {
    if (!managerRef.current) return;

    try {
      // 从图库选择时不需要再次保存到图库
      await managerRef.current.addImageFromURL(url, false);
      console.log('✅ 图库图片已添加到画布');
    } catch (error) {
      console.error('❌ 添加图库图片失败:', error);
    }
  };

  // 选择形状
  const handleSelectShape = (shapeType: string) => {
    if (!managerRef.current) return;

    // 直接添加形状
    managerRef.current.addShape(shapeType);
  };

  // 图片转图片生成（异步模式）
  const handleImageToImageGenerate = async (prompt: string, size: '1K' | '2K' | '4K') => {
    if (!managerRef.current || !imageToImageGeneratorRef.current) return;

    try {
      // 1. 立即添加占位图到画布
      console.log('🎨 添加占位图到画布...');
      const sizeMap = { '1K': '1024x1024', '2K': '2048x2048', '4K': '4096x4096' };
      const placeholderImage = await managerRef.current.addAIPlaceholder(sizeMap[size]);

      // 2. 异步转换和生成（不阻塞UI）
      console.log('🚀 开始异步转换和生成图片...');

      // 将选中的对象转换为图片URL
      managerRef.current.getSelectedObjectsAsImages()
        .then(async (imageUrls) => {
          console.log('✅ 对象已转换为图片:', imageUrls);

          // 调用API生成新图片
          let generatedImageUrl: string;
          if (imageUrls.length === 1) {
            generatedImageUrl = await imageToImageGeneratorRef.current!.generateFromSingleImage(
              prompt,
              imageUrls[0],
              size
            );
          } else {
            generatedImageUrl = await imageToImageGeneratorRef.current!.generateFromMultipleImages(
              prompt,
              imageUrls,
              size
            );
          }

          console.log('✅ 新图片已生成:', generatedImageUrl);

          // 替换占位图为真实图片
          await managerRef.current?.replaceAIPlaceholder(placeholderImage, generatedImageUrl);
          console.log('✅ 图片转换完成');

          setToast({ show: true, message: '图片生成成功!', type: 'success' });
        })
        .catch((error) => {
          // 生成失败，移除占位图并提示
          console.error('❌ 图片转换失败:', error);
          managerRef.current?.removeAIPlaceholder(placeholderImage);
          setToast({
            show: true,
            message: error instanceof Error ? error.message : '图片转换失败',
            type: 'error'
          });
        });

      // 立即返回，不等待生成完成
      console.log('💡 占位图已添加，图片正在后台生成...');
    } catch (error) {
      console.error('❌ 添加占位图失败:', error);
      throw error;
    }
  };

  // 本地上传图片
  const handleLocalUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && managerRef.current) {
        try {
          await managerRef.current.addImage(file);
        } catch (error) {
          console.error('Failed to add image:', error);
        }
      }
    };
    input.click();
  };

  // 添加 Emoji 到画布
  const handleEmojiSelect = (emoji: string) => {
    if (managerRef.current) {
      managerRef.current.addText(emoji);
      setShowEmojiPicker(false);
    }
  };

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('🎯🎯🎯 handleContextMenu 被调用了!', e.type, e.button);
    e.preventDefault(); // 阻止默认右键菜单
    e.stopPropagation(); // 阻止事件冒泡

    if (!managerRef.current) {
      console.log('❌ managerRef.current 不存在');
      return;
    }

    // 获取点击位置的对象
    const pointer = managerRef.current.canvas.getPointer(e.nativeEvent);
    const target = managerRef.current.canvas.findTarget(e.nativeEvent as any, false);

    console.log('🖱️ 右键点击:', { target: target?.type, pointer, pageX: e.pageX, pageY: e.pageY });

    if (target) {
      // 如果点击了对象,选中它并显示菜单
      managerRef.current.canvas.setActiveObject(target);
      managerRef.current.canvas.renderAll();
      // 使用 pageX/pageY 而不是 clientX/clientY，避免高 DPI 屏幕缩放问题
      setContextMenu({ x: e.pageX, y: e.pageY });
      console.log('✅ 菜单应该显示了');
    } else {
      // 点击空白区域,关闭菜单
      setContextMenu(null);
      console.log('⚠️ 点击了空白区域,关闭菜单');
    }
  };

  // 撤销
  const handleUndo = () => {
    if (managerRef.current) {
      managerRef.current.undo();
      setCanUndo(managerRef.current.canUndo());
      setCanRedo(managerRef.current.canRedo());
    }
  };

  // 重做
  const handleRedo = () => {
    if (managerRef.current) {
      managerRef.current.redo();
      setCanUndo(managerRef.current.canUndo());
      setCanRedo(managerRef.current.canRedo());
    }
  };

  // 版本管理
  const switchVersion = (id: string) => {
    if (!managerRef.current || !versionRef.current) return;

    // 🔥 保存当前版本前，先确保不在加载状态
    managerRef.current.setLoadingTemplate(false);

    console.log('📊 切换前画布状态:', {
      对象数量: managerRef.current.canvas.getObjects().length,
      画布尺寸: `${managerRef.current.width}x${managerRef.current.height}`,
    });

    const currentData = managerRef.current.toJSON();
    const currentThumbnail = managerRef.current.toThumbnail();
    versionRef.current.update(activeId, currentData, currentThumbnail, canvasSizeRef.current);

    console.log('💾 保存当前版本:', {
      版本ID: activeId,
      数据长度: currentData.length,
      画布尺寸: `${canvasSizeRef.current.width}×${canvasSizeRef.current.height}`,
      数据预览: currentData.substring(0, 100),
    });

    // 切换版本
    versionRef.current.setActive(id); // ✅ 更新 VersionManager 的 activeId
    const version = versionRef.current.getById(id);

    console.log('🔄 切换版本:', {
      从: activeId,
      到: id,
      版本名称: version?.name,
      更新时间: version ? new Date(version.updatedAt).toLocaleString() : null,
      数据是否为空: !version?.data,
      数据长度: version?.data?.length || 0,
    });

    if (version) {
      const nextCanvasSize = normalizeCanvasSize(version.canvasSize);
      canvasSizeRef.current = nextCanvasSize;
      setCanvasSize(nextCanvasSize);
      managerRef.current.resize(nextCanvasSize.width, nextCanvasSize.height);

      // 如果版本数据为空，清空画布；否则加载数据
      if (!version.data || version.data === '') {
        console.log('📄 新建空白画布');
        managerRef.current.clear();
        // 清空后启用历史记录
        managerRef.current.setLoadingTemplate(false);
      } else {
        console.log('📥 加载画布数据，长度:', version.data.length);
        // loadFromJSON 会自动启用历史记录
        managerRef.current.loadFromJSON(version.data);
      }
    } else {
      console.error('❌ 未找到版本:', id);
    }

    setActiveId(id);
    setVersions(versionRef.current.getAll());
  };

  const createNewVersion = () => {
    if (!versionRef.current) return;
    const newVersion = versionRef.current.create(`画布 ${versions.length + 1}`, canvasSizeRef.current);
    setVersions(versionRef.current.getAll());
    switchVersion(newVersion.id);
  };

  const duplicateVersion = () => {
    if (!managerRef.current || !versionRef.current) return;
    const data = managerRef.current.toJSON();
    const newVersion = versionRef.current.duplicate(activeId, data, canvasSizeRef.current);
    setVersions(versionRef.current.getAll());
    switchVersion(newVersion.id);
  };

  const renameVersion = (id: string, newName: string) => {
    if (!versionRef.current) return;
    versionRef.current.rename(id, newName);
    setVersions(versionRef.current.getAll());
  };

  const deleteVersion = (id: string) => {
    if (!versionRef.current) return;
    try {
      versionRef.current.delete(id);
      setVersions(versionRef.current.getAll());
      // 如果删除的是当前版本，切换到第一个版本
      if (id === activeId) {
        const firstVersion = versionRef.current.getAll()[0];
        if (firstVersion) {
          switchVersion(firstVersion.id);
        }
      }
    } catch (error: any) {
      alert(error.message);
    }
  };



  // 图形属性更新处理函数
  const handleShapeFillColorChange = (color: string) => {
    if (!managerRef.current) return;
    managerRef.current.updateShapeFillColor(color);
  };

  const handleShapeStrokeColorChange = (color: string) => {
    if (!managerRef.current) return;
    managerRef.current.updateShapeStrokeColor(color);
  };

  const handleShapeStrokeWidthChange = (width: number) => {
    if (!managerRef.current) return;
    managerRef.current.updateShapeStrokeWidth(width);
  };

  const handleObjectOpacityChange = (opacity: number) => {
    if (!managerRef.current) return;
    managerRef.current.updateObjectOpacity(opacity);
  };

  const handleCornerRadiusChange = (radius: number) => {
    if (!managerRef.current) return;
    managerRef.current.updateRectCornerRadius(radius);
  };

  // SVG 图标属性处理
  const handleSVGFillColorChange = (color: string) => {
    if (!selectedObject) return;
    updateSVGColor(selectedObject, color, undefined);
    managerRef.current?.canvas.renderAll();
  };

  const handleSVGStrokeColorChange = (color: string) => {
    if (!selectedObject) return;
    updateSVGColor(selectedObject, undefined, color);
    managerRef.current?.canvas.renderAll();
  };

  const handleSVGStrokeWidthChange = (width: number) => {
    if (!selectedObject) return;
    updateSVGStrokeWidth(selectedObject, width);
    managerRef.current?.canvas.renderAll();
  };

  const handleSVGScaleChange = (scale: number) => {
    if (!selectedObject) return;
    selectedObject.set({ scaleX: scale, scaleY: scale });
    managerRef.current?.canvas.renderAll();
  };

  // ==================== 图片处理 ====================

  const handleImageBorderRadiusChange = (radius: number) => {
    if (!managerRef.current) return;
    managerRef.current.setImageBorderRadius(radius);
  };

  const handleImageFlipHorizontal = () => {
    if (!managerRef.current) return;
    managerRef.current.flipImageHorizontal();
  };

  const handleImageFlipVertical = () => {
    if (!managerRef.current) return;
    managerRef.current.flipImageVertical();
  };

  const handleImageShadowChange = (shadow: { enabled: boolean; color: string; blur: number; offsetX: number; offsetY: number }) => {
    if (!managerRef.current) return;
    managerRef.current.setImageShadow(shadow);
  };

  const handleImageStrokeChange = (stroke: { enabled: boolean; color: string; width: number; style?: 'solid' | 'dashed' }) => {
    if (!managerRef.current) return;
    managerRef.current.setImageStroke(stroke);
  };

  const handleImageFilterChange = (filterType: string, value?: number) => {
    if (!managerRef.current) return;
    managerRef.current.applyImageFilter(filterType, value);
  };

  const handleImageBrightnessChange = (value: number) => {
    if (!managerRef.current) return;
    managerRef.current.setImageBrightness(value);
  };

  const handleImageContrastChange = (value: number) => {
    if (!managerRef.current) return;
    managerRef.current.setImageContrast(value);
  };

  const handleImageSaturationChange = (value: number) => {
    if (!managerRef.current) return;
    managerRef.current.setImageSaturation(value);
  };

  // 去背景（Remove.bg API - 异步模式，不删除原图）
  const handleRemoveBackground = async (imageUrl: string) => {
    if (!managerRef.current) return;

    try {
      const apiKey = localStorage.getItem('removebg_api_key')?.trim();

      console.log('🎨 开始去除背景...', imageUrl);

      // 1. 立即添加占位图到画布（不删除原图）
      console.log('🎨 添加占位图到画布...');
      const placeholderImage = await managerRef.current.addAIPlaceholder('2048x2048');

      // 2. 异步去背景（不阻塞UI）
      console.log('🚀 开始异步去背景...', { imageUrl });

      // 调用后端 API
      fetch('/api/remove-bg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          apiKey: apiKey || undefined,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '去背景失败');
          }
          return response.json();
        })
        .then(async (result) => {
          console.log('✅ 去背景成功:', result.url);

          // 添加到图片库
          const library = getImageLibrary();
          const fileName = result.url.split('/').pop() || 'no-bg.png';
          const isNew = library.addImage(result.url, fileName);
          console.log('📚 去背景图片已保存到图库:', fileName, '是否新图片:', isNew);

          // 替换占位图
          await managerRef.current?.replaceAIPlaceholder(placeholderImage, result.url);
          console.log('✅ 去背景图片已生成并添加到画布');
          setToast({ show: true, message: '去背景成功!', type: 'success' });
        })
        .catch((error) => {
          console.error('❌ 去背景失败:', error);
          managerRef.current?.removeAIPlaceholder(placeholderImage);
          setToast({
            show: true,
            message: error instanceof Error ? error.message : '去背景失败',
            type: 'error'
          });
        });

      // 立即返回，不等待去背景完成
      console.log('💡 占位图已添加，图片正在后台去背景...');
    } catch (error) {
      console.error('❌ 添加占位图失败:', error);
      throw error;
    }
  };

  // 本地去背景（@imgly/background-removal - 异步模式，不删除原图）
  const handleRemoveBackgroundLocal = async (imageUrl: string) => {
    if (!managerRef.current) return;

    try {
      console.log('🎨 开始本地去除背景...', imageUrl);

      // 1. 立即添加占位图到画布（不删除原图）
      console.log('🎨 添加占位图到画布...');
      const placeholderImage = await managerRef.current.addAIPlaceholder('2048x2048');

      // 2. 异步去背景（不阻塞UI）
      console.log('🚀 开始异步本地去背景...', { imageUrl });

      // 动态导入 removeBackground（避免 SSR 问题）
      const { removeBackground } = await import('@imgly/background-removal');

      // 调用本地 AI 去背景
      // 使用官方 CDN: https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/
      removeBackground(imageUrl, {
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        debug: true,
        model: 'isnet_fp16', // 使用默认模型 (medium, ~80MB)
        progress: (key: string, current: number, total: number) => {
          const progress = Math.round((current / total) * 100);
          console.log(`📊 处理进度 [${key}]: ${progress}%`);
        },
      })
        .then(async (blob) => {
          console.log('✅ 本地去背景成功，大小:', (blob.size / 1024).toFixed(2), 'KB');

          // 上传到七牛云
          const qiniuUploader = managerRef.current!.qiniuUploader;
          const file = new File([blob], 'local-no-bg.png', { type: 'image/png' });
          const qiniuUrl = await qiniuUploader.uploadFile(file);

          console.log('✅ 上传到七牛云成功:', qiniuUrl);

          // 添加到图片库
          const library = getImageLibrary();
          const fileName = qiniuUrl.split('/').pop() || 'local-no-bg.png';
          const isNew = library.addImage(qiniuUrl, fileName);
          console.log('📚 去背景图片已保存到图库:', fileName, '是否新图片:', isNew);

          // 替换占位图
          await managerRef.current?.replaceAIPlaceholder(placeholderImage, qiniuUrl);
          console.log('✅ 去背景图片已生成并添加到画布');
          setToast({ show: true, message: '免费去背景成功!', type: 'success' });
        })
        .catch((error) => {
          console.error('❌ 本地去背景失败:', error);
          managerRef.current?.removeAIPlaceholder(placeholderImage);
          setToast({
            show: true,
            message: error instanceof Error ? error.message : '本地去背景失败',
            type: 'error'
          });
        });

      // 立即返回，不等待去背景完成
      console.log('💡 占位图已添加，图片正在后台去背景...');
    } catch (error) {
      console.error('❌ 添加占位图失败:', error);
      throw error;
    }
  };

  // AI 改图（图片转换 - 异步模式，不删除原图）
  const handleAIImageTransform = async (imageUrl: string, prompt: string) => {
    if (!managerRef.current || !imageToImageGeneratorRef.current) return;

    // 检查是否配置了 API Key
    if (!hasApiKeyConfigured()) {
      setShowSettingsDialog(true);
      setToast({ show: true, message: '请先配置 API Key', type: 'info' });
      throw new Error('未配置 API Key');
    }

    try {
      // 1. 立即添加占位图到画布（不删除原图）
      console.log('🎨 添加占位图到画布...');
      const placeholderImage = await managerRef.current.addAIPlaceholder('2048x2048');

      // 2. 异步生成图片（不阻塞UI）
      console.log('🚀 开始异步生成图片...', { imageUrl, prompt });

      imageToImageGeneratorRef.current.generateFromSingleImage(
        prompt,
        imageUrl,
        '2K'
      )
        .then(async (generatedImageUrl) => {
          console.log('✅ AI 改图成功:', generatedImageUrl);

          // 替换占位图为真实图片
          await managerRef.current?.replaceAIPlaceholder(placeholderImage, generatedImageUrl);
          console.log('✅ 图片已生成并添加到画布');

          setToast({ show: true, message: 'AI 改图成功!', type: 'success' });
        })
        .catch((error) => {
          // 生成失败，移除占位图并提示
          console.error('❌ AI 改图失败:', error);
          managerRef.current?.removeAIPlaceholder(placeholderImage);
          setToast({
            show: true,
            message: error instanceof Error ? error.message : 'AI 改图失败',
            type: 'error'
          });
        });

      // 立即返回，不等待生成完成
      console.log('💡 占位图已添加，图片正在后台生成...');
    } catch (error) {
      console.error('❌ 添加占位图失败:', error);
      throw error;
    }
  };

  // 导出
  const handleDownload = async () => {
    if (!managerRef.current) return;

    try {
      const blob = await managerRef.current.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `xiaohongshu-cover-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setToast({ show: true, message: '下载成功', type: 'success' });
    } catch (error) {
      setToast({ show: true, message: '下载失败', type: 'error' });
    }
  };

  const handleCopy = async () => {
    if (!managerRef.current) return;

    try {
      const blob = await managerRef.current.toBlob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setToast({ show: true, message: '已复制到剪贴板', type: 'success' });
    } catch (error) {
      setToast({ show: true, message: '复制失败，请使用下载功能', type: 'error' });
    }
  };

  // 分享功能 - 直接创建分享
  const handleShareClick = async () => {
    if (!managerRef.current) return;

    setIsSharing(true);

    try {
      // 1. 生成画布图片
      console.log('🎨 开始生成分享图片...');
      const blob = await managerRef.current.toBlob();

      // 2. 上传到七牛云
      console.log('☁️ 上传到七牛云...');
      const qiniuUploader = managerRef.current.qiniuUploader;
      const file = new File([blob], `share-${Date.now()}.png`, { type: 'image/png' });
      const imageUrl = await qiniuUploader.uploadFile(file);
      console.log('✅ 上传成功:', imageUrl);

      // 3. 生成默认标题（格式：我的海报-20250122）
      const now = new Date();
      const dateStr = now.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '');
      const title = `我的海报-${dateStr}`;

      // 4. 创建分享
      console.log('🔗 创建分享链接...');
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          title,
        }),
      });

      if (!response.ok) {
        throw new Error('创建分享失败');
      }

      const data = await response.json();
      console.log('✅ 分享创建成功:', data.url);

      // 5. 显示分享链接
      setShareUrl(data.url);
      setShowShareDialog(true);

      // 6. 自动复制到剪贴板
      await navigator.clipboard.writeText(data.url);
      setToast({ show: true, message: '分享链接已复制!', type: 'success' });
    } catch (error) {
      console.error('❌ 分享失败:', error);
      setToast({
        show: true,
        message: error instanceof Error ? error.message : '分享失败',
        type: 'error'
      });
    } finally {
      setIsSharing(false);
    }
  };

  // 切换拖拽模式
  const handlePanModeToggle = () => {
    setIsPanMode(!isPanMode);
  };

  // 监听ESC键退出拖拽模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanMode) {
        setIsPanMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanMode]);

  // 画布尺寸改变
  const handleCanvasSizeChange = (newSize: CanvasSize) => {
    if (!managerRef.current) return;

    // 🔥 先确保不在加载状态，再保存数据
    managerRef.current.setLoadingTemplate(false);
    const currentData = managerRef.current.toJSON();

    console.log('📐 改变画布尺寸:', {
      从: `${canvasSize.width}×${canvasSize.height}`,
      到: `${newSize.width}×${newSize.height}`,
      数据长度: currentData.length,
    });

    canvasSizeRef.current = newSize;
    setCanvasSize(newSize);

    managerRef.current.resize(newSize.width, newSize.height);
    versionRef.current?.update(activeId, currentData, undefined, newSize);
  };

  // 缩放控制
  const handleZoomIn = () => {
    setUserZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setUserZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setUserZoom(100);
  };

  // 应用模板（确认已在模板库对话框中完成）
  const handleApplyTemplate = async (templateId: string) => {
    if (!managerRef.current || !canvasRef.current) return;

    try {
      const templateManager = getTemplateManager();
      let template = templateManager.getById(templateId);

      // 🔥 如果本地找不到，尝试从公开模板 API 获取
      if (!template) {
        console.log('📥 本地未找到模板，尝试从公开模板获取:', templateId);
        try {
          const response = await fetch(`/api/templates/public/get?id=${templateId}`);
          const data = await response.json();

          if (data.success && data.template) {
            template = data.template;
            console.log('✅ 从公开模板获取成功:', template?.name);
          }
        } catch (error) {
          console.error('❌ 获取公开模板失败:', error);
        }
      }

      if (!template) {
        setToast({ show: true, message: '模板不存在', type: 'error' });
        return;
      }

      // 🔥 TypeScript 类型守卫：确保 template 不为 undefined
      const validTemplate = template;
      if (!validTemplate) {
        setToast({ show: true, message: '模板数据无效', type: 'error' });
        return;
      }

      // 创建完整的 CanvasSize 对象
      const newCanvasSize: CanvasSize = {
        name: `${validTemplate.canvasSize.width}×${validTemplate.canvasSize.height}`,
        width: validTemplate.canvasSize.width,
        height: validTemplate.canvasSize.height,
        ratio: validTemplate.canvasSize.width > validTemplate.canvasSize.height ? '4:3' : '3:4',
      };

      // 更新画布尺寸
      canvasSizeRef.current = newCanvasSize;
      setCanvasSize(newCanvasSize);

      // 重新创建 CanvasManager
      if (managerRef.current) {
        managerRef.current.dispose();
      }
      if (!canvasRef.current) return;

      // 创建新的 CanvasManager
      managerRef.current = new CanvasManager(
        canvasRef.current,
        validTemplate.canvasSize.width,
        validTemplate.canvasSize.height
      );

      // 🆕 立即设置加载模板标志，禁用历史记录保存
      // 必须在应用模板之前设置，因为会触发事件
      managerRef.current.setLoadingTemplate(true);
      console.log('🎨 开始应用模板...');

      try {
        // 🔥 直接应用模板 JSON 数据，不依赖 templateManager
        // 这样可以支持公开模板（不在本地存储中）
        const canvasData = JSON.parse(validTemplate.canvasJSON);
        console.log('📦 模板数据:', canvasData);

        // 清空画布
        managerRef.current.canvas.clear();

        // 设置背景色（如果有）
        if (validTemplate.canvasJSON.includes('backgroundColor')) {
          const bgColor = canvasData.backgroundColor || '#ffffff';
          managerRef.current.canvas.setBackgroundColor(bgColor, () => {
            managerRef.current?.canvas.renderAll();
          });
        }

        // 加载对象
        await new Promise<void>((resolve) => {
          managerRef.current!.canvas.loadFromJSON(canvasData, () => {
            console.log('✅ 模板对象加载完成');
            managerRef.current!.canvas.renderAll();
            resolve();
          }, (o: any, object: any) => {
            // 对象加载回调
            console.log('📦 加载对象:', object.type);
          });
        });

        console.log('✅ 模板应用完成');
      } catch (error) {
        console.error('❌ 模板应用失败:', error);
        setToast({ show: true, message: '模板应用失败', type: 'error' });
      } finally {
        // 🆕 无论成功失败都要恢复历史记录保存
        managerRef.current.setLoadingTemplate(false);
        console.log('✅ 已恢复历史记录保存');
      }

      // 重新绑定事件
      managerRef.current.canvas.on('selection:created', (e) => {
        setSelectedObject(e.selected?.[0]);
      });
      managerRef.current.canvas.on('selection:updated', (e) => {
        setSelectedObject(e.selected?.[0]);
      });
      managerRef.current.canvas.on('selection:cleared', () => {
        setSelectedObject(null);
      });

      // 等待足够长的时间确保 canvas 完全初始化
      // 使用 setTimeout 而不是 requestAnimationFrame，因为需要更长的延迟
      setTimeout(() => {
        if (versionRef.current && managerRef.current) {
          try {
            console.log('💾 开始保存到版本历史...');
            const canvasJSON = managerRef.current.toJSON();
            versionRef.current.update(activeId, canvasJSON, undefined, newCanvasSize);
            console.log('✅ 模板应用后已保存到版本历史');
          } catch (error) {
            console.error('❌ 保存版本历史失败:', error);
          }
        }
      }, 300); // 延迟 300ms

      setToast({ show: true, message: '模板应用成功', type: 'success' });
    } catch (error) {
      console.error('❌ 应用模板失败:', error);
      setToast({ show: true, message: '应用模板失败', type: 'error' });
    }
  };

  // 保存为模板
  const handleSaveAsTemplate = async (name: string, category: TemplateCategory, isPublic: boolean) => {
    if (!managerRef.current) return;

    try {
      const templateManager = getTemplateManager();
      const template = await templateManager.saveFromCanvas(managerRef.current.canvas, name, category, isPublic);

      // 如果选择公开分享，上传到云端
      if (isPublic) {
        try {
          const response = await fetch('/api/templates/public/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: template.name,
              category: template.category,
              canvasSize: template.canvasSize,
              canvasJSON: template.canvasJSON,
              thumbnail: template.thumbnail,
            }),
          });

          const data = await response.json();
          if (data.success) {
            setToast({ show: true, message: '模板已保存并公开分享', type: 'success' });
          } else {
            setToast({ show: true, message: '模板已保存，但公开分享失败', type: 'warning' });
          }
        } catch (error) {
          console.error('❌ 上传公开模板失败:', error);
          setToast({ show: true, message: '模板已保存，但公开分享失败', type: 'warning' });
        }
      } else {
        setToast({ show: true, message: '模板保存成功', type: 'success' });
      }
    } catch (error) {
      console.error('❌ 保存模板失败:', error);
      setToast({ show: true, message: '保存模板失败', type: 'error' });
    }
  };

  // 处理图标选择
  const handleIconSelect = async (iconConfig: IconConfig) => {
    if (!managerRef.current) return;

    try {
      await managerRef.current.addSVGIcon(iconConfig.component, {
        size: 60,
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 2,
      });
      setToast({ show: true, message: '图标已添加', type: 'success' });
    } catch (error) {
      console.error('❌ 添加图标失败:', error);
      setToast({ show: true, message: '添加图标失败', type: 'error' });
    }
  };

  // 🆕 处理分享素材
  const handleShareMaterial = async (name: string) => {
    if (!managerRef.current) return;

    const activeObject = managerRef.current.canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'image') {
      setToast({ show: true, message: '请选择一个图片', type: 'error' });
      return;
    }

    try {
      setToast({ show: true, message: '正在分享素材...', type: 'info' });

      const imageObj = activeObject as fabric.Image;

      // 获取图片的原始 URL（如果有的话）
      const imageSrc = (imageObj as any).getSrc?.() || (imageObj as any)._originalElement?.src;

      if (!imageSrc) {
        setToast({ show: true, message: '无法获取图片源', type: 'error' });
        return;
      }

      // 直接使用图片 URL 创建共享素材
      const createResponse = await fetch('/api/materials/public/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          imageUrl: imageSrc,
          width: imageObj.width || 0,
          height: imageObj.height || 0,
        }),
      });

      const createData = await createResponse.json();
      if (createData.success) {
        setToast({ show: true, message: '素材已分享', type: 'success' });
      } else {
        throw new Error('创建共享素材失败');
      }
    } catch (error) {
      console.error('❌ 分享素材失败:', error);
      setToast({ show: true, message: '分享素材失败', type: 'error' });
    }
  };

  // 🆕 复制图片到剪贴板
  const handleCopyImageToClipboard = async () => {
    if (!managerRef.current) return;

    const activeObject = managerRef.current.canvas.getActiveObject();
    if (!activeObject || activeObject.type !== 'image') {
      setToast({ show: true, message: '请选择一个图片', type: 'error' });
      return;
    }

    try {
      setToast({ show: true, message: '正在复制...', type: 'info' });

      const imageObj = activeObject as fabric.Image;

      // 导出图片为 blob
      const dataURL = imageObj.toDataURL({
        format: 'png',
        quality: 1,
        enableRetinaScaling: false,
      });

      // 将 base64 转换为 blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      setToast({ show: true, message: '已复制到剪贴板', type: 'success' });
    } catch (error) {
      console.error('❌ 复制到剪贴板失败:', error);
      setToast({ show: true, message: '复制失败，请重试', type: 'error' });
    }
  };

  // 字体面板操作
  const handleFontChange = (fontFamily: string) => {
    console.log('🎨 handleFontChange 被调用:', fontFamily);
    managerRef.current?.updateProperty('fontFamily', fontFamily);
  };

  const handleFontSizeChange = (size: number) => {
    managerRef.current?.updateProperty('fontSize', size);
  };

  const handleColorChange = (color: string) => {
    managerRef.current?.updateProperty('fill', color);
  };

  const handleLineHeightChange = (lineHeight: number) => {
    managerRef.current?.updateProperty('lineHeight', lineHeight);
  };

  const handleLetterSpacingChange = (letterSpacing: number) => {
    managerRef.current?.updateProperty('charSpacing', letterSpacing);
  };

  const handleTextAlignChange = (align: 'left' | 'center' | 'right') => {
    managerRef.current?.updateTextAlign(align);
  };

  // 🆕 处理文本描边变化
  const handleStrokeChange = (enabled: boolean, color?: string, width?: number) => {
    managerRef.current?.setTextStroke(enabled, color, width);
  };

  const handleCanvasBackgroundChange = (type: 'solid' | 'gradient' | 'image', value: string) => {
    if (!managerRef.current) return;

    if (type === 'solid') {
      // 纯色背景
      managerRef.current.setBackgroundColor(value);
    } else if (type === 'gradient') {
      // 渐变背景
      managerRef.current.setBackgroundGradient(value);
    } else if (type === 'image') {
      // 图片背景
      managerRef.current.setBackgroundImage(value);
    }
  };

  const handleBackgroundChange = (
    style: 'none' | 'solid',
    color?: string,
    opacity?: number
  ) => {
    managerRef.current?.updateBackground(style, color, opacity);
  };

  const handleUnderlineChange = (
    style: 'none' | 'solid' | 'wavy' | 'dotted',
    width?: number,
    color?: string
  ) => {
    managerRef.current?.updateUnderline(style, width, color);
  };

  const handleBorderChange = (
    style: 'none' | 'solid' | 'dashed',
    width?: number,
    color?: string
  ) => {
    managerRef.current?.updateBorder(style, width, color);
  };

  // 获取选中对象的属性（支持多选）
  const getSelectedObjectProperty = (property: string, defaultValue: any) => {
    if (!selectedObject) return defaultValue;

    // 如果是多选，获取第一个对象的属性
    if (selectedObject.type === 'activeSelection') {
      const objects = (selectedObject as any).getObjects();
      if (objects.length === 0) return defaultValue;

      const firstObj = objects[0];
      // 如果是 Group，获取内部文本对象的属性
      if (firstObj.type === 'group') {
        const textObj = (firstObj as any)._objects?.find((o: any) => o.type === 'i-text');
        return textObj?.[property] || defaultValue;
      }
      return firstObj[property] || defaultValue;
    }

    // 单个对象
    if (selectedObject.type === 'group') {
      const textObj = (selectedObject as any)._objects?.find((o: any) => o.type === 'i-text');
      return textObj?.[property] || defaultValue;
    }

    return selectedObject[property] || defaultValue;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部导航 */}
      <Topbar
        versions={versions}
        activeVersionId={activeId}
        canvasSize={canvasSize}
        canvasScale={canvasScale}
        isPanMode={isPanMode}
        onVersionChange={switchVersion}
        onNewVersion={createNewVersion}
        onDuplicateVersion={duplicateVersion}
        onRenameVersion={renameVersion}
        onDeleteVersion={deleteVersion}
        onCanvasSizeChange={handleCanvasSizeChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onPanModeToggle={handlePanModeToggle}
        onDownload={handleDownload}
        onCopy={handleCopy}
        onShare={handleShareClick}
        isSharing={isSharing}
        onOpenSettings={() => setShowSettingsDialog(true)}
        onOpenDonation={() => setShowDonationDialog(true)}
        onOpenWeChat={() => setShowWeChatDialog(true)}
        onOpenTemplateLibrary={() => setShowTemplateLibrary(true)}
        onSaveAsTemplate={() => setShowSaveTemplateDialog(true)}
      />

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧工具栏 */}
        <Sidebar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />

        {/* Emoji 选择器 */}
        {showEmojiPicker && (
          <>
            {/* 背景遮罩 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowEmojiPicker(false)}
            />
            {/* Emoji 弹层 */}
            <div
              className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-4"
              style={{ left: '72px', top: '50%', transform: 'translateY(-50%)', maxHeight: '400px', overflowY: 'auto' }}
            >
              <div className="grid grid-cols-8 gap-2">
                {[
                  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
                  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
                  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
                  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
                  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
                  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
                  '🤢', '🤮', '🤧', '🥵', '🥶', '😵', '🤯', '🤠',
                  '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️',
                  '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
                  '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
                  '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
                  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
                  '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪',
                  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                  '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬',
                  '👁️', '🗨️', '🗯️', '💭', '💤', '⭐', '🌟', '✨',
                  '🔥', '💧', '🌈', '☀️', '🌙', '⚡', '☁️', '❄️',
                  '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉',
                ].map((emoji) => (
                  <button
                    key={emoji}
                    className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 画布区域 */}
        <Canvas
          canvasRef={canvasRef}
          canvasSize={canvasSize}
          userZoom={userZoom}
          isPanMode={isPanMode}
          onScaleChange={setCanvasScale}
          onUserZoomChange={setUserZoom}
          onContextMenu={handleContextMenu}
        />

        {/* 右侧属性面板 - 根据选中对象类型动态切换 */}
        {(() => {
          // 判断对象类型
          const objectType = selectedObject?.type;
          const shapeType = (selectedObject as any)?.shapeType;
          const isSVGIcon = (selectedObject as any)?.isSVGIcon;

          const isTextObject = objectType === 'i-text' || objectType === 'textbox';
          const isImageObject = objectType === 'image';
          const isShapeObject = objectType === 'rect' || objectType === 'circle' || objectType === 'triangle';
          const isLineObject = objectType === 'line';

          // Path 对象需要区分：箭头和画笔路径 vs 形状（星形、爱心、六边形）
          const isPathShape = objectType === 'path' && ['star', 'heart', 'hexagon'].includes(shapeType);
          const isPathLine = objectType === 'path' && ['arrow'].includes(shapeType);
          const isPathDrawing = objectType === 'path' && !shapeType; // 画笔绘制的路径

          // SVG 图标对象 - 显示 SVG 属性面板
          if (isSVGIcon) {
            return (
              <SVGPropertiesPanel
                selectedObject={selectedObject}
                onFillColorChange={handleSVGFillColorChange}
                onStrokeColorChange={handleSVGStrokeColorChange}
                onStrokeWidthChange={handleSVGStrokeWidthChange}
                onOpacityChange={handleObjectOpacityChange}
                onScaleChange={handleSVGScaleChange}
              />
            );
          }

          // 文本对象 - 显示字体面板
          if (isTextObject) {
            return (
              <FontPanel
                selectedFont={getSelectedObjectProperty('fontFamily', 'LXGW WenKai')}
                fontSize={getSelectedObjectProperty('fontSize', 60)}
                textColor={getSelectedObjectProperty('fill', '#333333')}
                lineHeight={getSelectedObjectProperty('lineHeight', 1.2)}
                letterSpacing={getSelectedObjectProperty('charSpacing', 0)}
                selectedObject={selectedObject}
                onFontChange={handleFontChange}
                onFontSizeChange={handleFontSizeChange}
                onColorChange={handleColorChange}
                onLineHeightChange={handleLineHeightChange}
                onLetterSpacingChange={handleLetterSpacingChange}
                onTextAlignChange={handleTextAlignChange}
                onStrokeChange={handleStrokeChange}
                onBackgroundChange={handleBackgroundChange}
                onUnderlineChange={handleUnderlineChange}
                onBorderChange={handleBorderChange}
                onCanvasBackgroundChange={handleCanvasBackgroundChange}
              />
            );
          }

          // 图片对象 - 显示图片属性面板
          if (isImageObject) {
            return (
              <ImagePropertiesPanel
                selectedObject={selectedObject}
                onOpacityChange={handleObjectOpacityChange}
                onBorderRadiusChange={handleImageBorderRadiusChange}
                onFlipHorizontal={handleImageFlipHorizontal}
                onFlipVertical={handleImageFlipVertical}
                onShadowChange={handleImageShadowChange}
                onStrokeChange={handleImageStrokeChange}
                onFilterChange={handleImageFilterChange}
                onBrightnessChange={handleImageBrightnessChange}
                onContrastChange={handleImageContrastChange}
                onSaturationChange={handleImageSaturationChange}
                onRemoveBackground={handleRemoveBackground}
                onRemoveBackgroundLocal={handleRemoveBackgroundLocal}
                onOpenSettings={() => setShowSettingsDialog(true)}
                onAIImageTransform={handleAIImageTransform}
              />
            );
          }

          // 图形对象 - 显示图形属性面板（包括基础形状和 Path 形状）
          if (isShapeObject || isPathShape) {
            return (
              <ShapePropertiesPanel
                selectedObject={selectedObject}
                onFillColorChange={handleShapeFillColorChange}
                onStrokeColorChange={handleShapeStrokeColorChange}
                onStrokeWidthChange={handleShapeStrokeWidthChange}
                onOpacityChange={handleObjectOpacityChange}
                onCornerRadiusChange={handleCornerRadiusChange}
              />
            );
          }

          // 线条或路径对象 - 显示路径属性面板（线条、箭头、画笔路径）
          if (isLineObject || isPathLine || isPathDrawing) {
            return (
              <PathPropertiesPanel
                selectedObject={selectedObject}
                onStrokeColorChange={handleShapeStrokeColorChange}
                onStrokeWidthChange={handleShapeStrokeWidthChange}
                onOpacityChange={handleObjectOpacityChange}
              />
            );
          }

          // 默认显示字体面板(包含画布背景设置)
          return (
            <FontPanel
              selectedFont={getSelectedObjectProperty('fontFamily', 'LXGW WenKai')}
              fontSize={getSelectedObjectProperty('fontSize', 60)}
              textColor={getSelectedObjectProperty('fill', '#333333')}
              lineHeight={getSelectedObjectProperty('lineHeight', 1.2)}
              letterSpacing={getSelectedObjectProperty('charSpacing', 0)}
              selectedObject={selectedObject}
              onFontChange={handleFontChange}
              onFontSizeChange={handleFontSizeChange}
              onColorChange={handleColorChange}
              onLineHeightChange={handleLineHeightChange}
              onLetterSpacingChange={handleLetterSpacingChange}
              onTextAlignChange={handleTextAlignChange}
              onStrokeChange={handleStrokeChange}
              onBackgroundChange={handleBackgroundChange}
              onUnderlineChange={handleUnderlineChange}
              onBorderChange={handleBorderChange}
              onCanvasBackgroundChange={handleCanvasBackgroundChange}
            />
          );
        })()}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (selectedObject || (setContextMenu as any).clickedObject || managerRef.current?.canvas.getActiveObject()) && (() => {
        // 🔥 获取当前激活的对象（可能是单个对象、多选对象或锁定对象）
        const activeObject = managerRef.current?.canvas.getActiveObject();
        const clickedObject = (setContextMenu as any).clickedObject || selectedObject;
        const isLocked = (clickedObject as any)?.locked === true;
        const isMultiSelect = activeObject?.type === 'activeSelection';

        console.log('🎨 右键菜单渲染:', {
          isMultiSelect,
          activeType: activeObject?.type,
          clickedType: clickedObject?.type,
          isLocked
        });

        return (
          <>
            {/* 背景遮罩，点击关闭菜单 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setContextMenu(null);
                setShowShapeFillPicker(false);
                setShowShapeStrokePicker(false);
              }}
            />
            {/* 菜单 */}
            <div
              className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              {/* 🔒 如果对象已锁定，只显示解锁选项 */}
              {isLocked ? (
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
                  onClick={() => {
                    managerRef.current?.unlockObject(clickedObject);
                    setToast({
                      show: true,
                      message: '对象已解锁',
                      type: 'success'
                    });
                    setContextMenu(null);
                  }}
                >
                  <span>🔒 解锁对象</span>
                  <span className="text-xs text-gray-400">⌘⇧L</span>
                </button>
              ) : (
                // 未锁定对象显示完整菜单
                <>
            {/* AI图片转换 */}
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
              onClick={() => {
                // 检查是否配置了 API Key
                if (!hasApiKeyConfigured()) {
                  setShowSettingsDialog(true);
                  setToast({ show: true, message: '请先配置 API Key', type: 'info' });
                  setContextMenu(null);
                  return;
                }
                setShowImageToImageDialog(true);
                setContextMenu(null);
              }}
            >
              <span>AI图片转换</span>
              <span className="text-xs text-gray-400">Tab</span>
            </button>

            {/* 下载为图片 */}
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
              onClick={async () => {
                try {
                  await managerRef.current?.downloadObject();
                  setToast({ show: true, message: '下载成功', type: 'success' });
                } catch (error) {
                  setToast({ show: true, message: '下载失败', type: 'error' });
                }
                setContextMenu(null);
              }}
            >
              <span>下载为图片</span>
              <span className="text-xs text-gray-400">⌘⇧D</span>
            </button>

            {/* 🆕 图片专属选项 */}
            {selectedObject?.type === 'image' && (
              <>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  onClick={() => {
                    handleCopyImageToClipboard();
                    setContextMenu(null);
                  }}
                >
                  <span>复制到剪贴板</span>
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  onClick={() => {
                    setShowShareMaterialDialog(true);
                    setContextMenu(null);
                  }}
                >
                  <span>分享素材</span>
                </button>
              </>
            )}

            <div className="h-px bg-gray-200 my-1" />

            {/* 🔒 锁定/解锁选项 */}
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
              onClick={() => {
                const isLocked = managerRef.current?.toggleLock(selectedObject);
                setToast({
                  show: true,
                  message: isLocked ? '对象已锁定' : '对象已解锁',
                  type: 'success'
                });
                setContextMenu(null);
              }}
            >
              <span>{(selectedObject as any).locked ? '🔒 解锁对象' : '🔓 锁定对象'}</span>
              <span className="text-xs text-gray-400">⌘⇧L</span>
            </button>

            <div className="h-px bg-gray-200 my-1" />

            {/* 形状专属选项 */}
            {(selectedObject as any).isShape && (
              <>
                <div className="px-4 py-1 text-xs text-gray-500 font-medium">形状设置</div>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  onClick={() => setShowShapeFillPicker(!showShapeFillPicker)}
                >
                  改变填充颜色
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  onClick={() => setShowShapeStrokePicker(!showShapeStrokePicker)}
                >
                  改变边框颜色
                </button>
                <div className="h-px bg-gray-200 my-1" />
              </>
            )}

            {/* 图层操作 */}
            {(selectedObject as any).isShape && (
              <div className="px-4 py-1 text-xs text-gray-500 font-medium">图层</div>
            )}
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
              onClick={() => {
                managerRef.current?.bringToFront();
                setContextMenu(null);
              }}
            >
              <span>置于顶层</span>
              <span className="text-xs text-gray-400">⌘⇧]</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
              onClick={() => {
                managerRef.current?.bringForward();
                setContextMenu(null);
              }}
            >
              <span>上移一层</span>
              <span className="text-xs text-gray-400">⌘]</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
              onClick={() => {
                managerRef.current?.sendBackwards();
                setContextMenu(null);
              }}
            >
              <span>下移一层</span>
              <span className="text-xs text-gray-400">⌘[</span>
            </button>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
              onClick={() => {
                managerRef.current?.sendToBack();
                setContextMenu(null);
              }}
            >
              <span>置于底层</span>
              <span className="text-xs text-gray-400">⌘⇧[</span>
            </button>
                </>
              )}
            </div>

            {/* 填充颜色选择器 */}
            {!isLocked && showShapeFillPicker && (
              <div
                className="fixed z-50 bg-white rounded-lg shadow-lg p-3"
                style={{ left: contextMenu.x + 180, top: contextMenu.y }}
              >
                <HexColorPicker
                  color={(selectedObject as any).fill || '#3b82f6'}
                  onChange={(color) => {
                    if (selectedObject) {
                      selectedObject.set('fill', color);
                      managerRef.current?.canvas.renderAll();
                    }
                  }}
                />
              </div>
            )}

            {/* 边框颜色选择器 */}
            {!isLocked && showShapeStrokePicker && (
              <div
                className="fixed z-50 bg-white rounded-lg shadow-lg p-3"
                style={{ left: contextMenu.x + 180, top: contextMenu.y + 40 }}
              >
                <HexColorPicker
                  color={(selectedObject as any).stroke || '#1e40af'}
                  onChange={(color) => {
                    if (selectedObject) {
                      selectedObject.set('stroke', color);
                      managerRef.current?.canvas.renderAll();
                    }
                  }}
                />
              </div>
            )}
          </>
        );
      })()}

      {/* AI 生图对话框 */}
      <AIImageDialog
        open={showAIImageDialog}
        onOpenChange={setShowAIImageDialog}
        onGenerate={handleAIImageGenerate}
      />

      {/* 图片转图片对话框 */}
      <ImageToImageDialog
        open={showImageToImageDialog}
        onClose={() => setShowImageToImageDialog(false)}
        onGenerate={handleImageToImageGenerate}
        imageCount={managerRef.current?.canvas.getActiveObjects().length || 0}
      />

      {/* 图片对话框 */}
      <ImageDialog
        open={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onLocalUpload={handleLocalUpload}
        onSelectImage={handleSelectImageFromLibrary}
      />

      {/* 形状选择对话框 */}
      <ShapeDialog
        open={showShapeDialog}
        onClose={() => setShowShapeDialog(false)}
        onSelectShape={handleSelectShape}
      />

      {/* 快捷键帮助 */}
      <KeyboardShortcutsHelp
        open={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* 通用确认对话框 */}
      <ConfirmDialog
        open={confirmDialog.open}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ open: false, message: '', onConfirm: () => {} });
        }}
        onCancel={() => setConfirmDialog({ open: false, message: '', onConfirm: () => {} })}
      />

      {/* Toast提示 */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* 设置对话框 */}
      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />

      {/* 打赏对话框 */}
      <DonationDialog
        isOpen={showDonationDialog}
        onClose={() => setShowDonationDialog(false)}
      />

      {/* 公众号对话框 */}
      <WeChatDialog
        isOpen={showWeChatDialog}
        onClose={() => setShowWeChatDialog(false)}
      />

      {/* 模板库对话框 */}
      <TemplateLibraryDialog
        open={showTemplateLibrary}
        onClose={() => setShowTemplateLibrary(false)}
        onApplyTemplate={handleApplyTemplate}
        currentCanvasSize={canvasSize}
      />

      {/* 保存为模板对话框 */}
      <SaveTemplateDialog
        open={showSaveTemplateDialog}
        onClose={() => setShowSaveTemplateDialog(false)}
        onSave={handleSaveAsTemplate}
      />

      {/* 图标库对话框 */}
      <IconLibraryDialog
        open={showIconLibrary}
        onClose={() => setShowIconLibrary(false)}
        onSelectIcon={handleIconSelect}
      />

      {/* 🆕 分享素材对话框 */}
      <ShareMaterialDialog
        open={showShareMaterialDialog}
        onClose={() => setShowShareMaterialDialog(false)}
        onShare={handleShareMaterial}
      />

      {/* 分享成功对话框 */}
      {showShareDialog && (
        <ShareDialog
          shareUrl={shareUrl}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  );
}
