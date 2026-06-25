// 画布管理器
import * as fabric from 'fabric';
import { HighlightConfig, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';
import { QiniuUploader } from './qiniu-uploader';
import { getImageLibrary } from './image-library';
import { iconComponentToFabric } from './svg-to-fabric';

fabric.FabricObject.customProperties = ['data', 'selectable', 'evented'];
fabric.Group.customProperties = ['data', 'selectable', 'evented'];

export class CanvasManager {
  canvas: fabric.Canvas;
  width: number;
  height: number;
  private history: string[] = [];
  private historyIndex: number = -1;
  private isUndoRedoing: boolean = false;
  private isLoadingTemplate: boolean = false; // 🆕 标记是否正在加载模板
  private saveHistoryTimer: NodeJS.Timeout | null = null;
  public qiniuUploader: QiniuUploader; // 改为 public，允许外部访问

  // 图片裁剪相关
  private isCropping: boolean = false;
  private croppingImage: fabric.Image | null = null;
  private cropRect: fabric.Rect | null = null;
  private cropOverlay: fabric.Rect[] = [];

  // 锁定对象相关
  private lockIcons: Map<fabric.Object, fabric.Text> = new Map(); // 存储对象和锁定图标的映射

  constructor(element: HTMLCanvasElement, width = CANVAS_WIDTH, height = CANVAS_HEIGHT) {
    this.width = width;
    this.height = height;
    this.qiniuUploader = new QiniuUploader();

    // 🆕 初始化时禁用历史记录，避免构造过程中的事件触发保存
    // 注意：不要在构造函数中自动启用，由外部调用者控制
    this.isLoadingTemplate = true;

    // 🔥 设置全局 crossOrigin，确保所有图片都支持跨域
    // 这样可以避免画布被污染，允许导出为图片
    (fabric.Image as any).prototype.crossOrigin = 'anonymous';

    this.canvas = new fabric.Canvas(element, {
      width: this.width,
      height: this.height,
      backgroundColor: '#ffffff',
      // 隐藏画布边框
      selection: true, // 允许框选
      selectionBorderColor: 'transparent', // 隐藏选择框边框
      selectionLineWidth: 0, // 选择框边框宽度为 0
      fireRightClick: true, // 允许右键事件
      stopContextMenu: false, // 不阻止contextmenu事件
      preserveObjectStacking: true, // 🔥 保持对象图层顺序,选中时不自动置顶
    });

    // 监听画布变化，保存历史记录（使用防抖）
    this.canvas.on('object:added', () => this.scheduleHistorySave());
    this.canvas.on('object:modified', () => this.scheduleHistorySave());
    this.canvas.on('object:removed', () => this.scheduleHistorySave());

    // 监听画笔绘制完成事件
    this.canvas.on('path:created', (e: any) => {
      console.log('✏️ 画笔路径创建完成');
      const path = e.path;

      // 保存画笔颜色
      if (path.stroke) {
        this.saveLastUsedColor('pencilStroke', path.stroke as string);
      }

      // 🆕 保持画笔模式，不自动退出
      // 用户可以继续画下一笔
      console.log('✅ 画笔路径已创建，保持画笔模式');
    });

    // 全局监听滚动,在任何时候都立即恢复
    let savedScrollPosition = { x: 0, y: 0 };
    let isEditingText = false;

    // 在进入编辑前保存滚动位置
    this.canvas.on('mouse:down', () => {
      savedScrollPosition = { x: window.scrollX, y: window.scrollY };
      console.log('💾 [防滚动] 鼠标按下,保存滚动位置:', savedScrollPosition);
    });

    // 监听所有文本对象进入编辑模式
    this.canvas.on('text:editing:entered', (e: any) => {
      console.log('📝 [防滚动] Text editing entered');
      isEditingText = true;

      // 立即恢复滚动位置
      console.log('🔍 [防滚动] 当前滚动位置:', { x: window.scrollX, y: window.scrollY });

      // 设置overflow: hidden
      const bodyOverflow = document.body.style.overflow;
      const htmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      console.log('🚫 [防滚动] 已设置overflow: hidden');

      // 立即恢复滚动位置
      const restoreScroll = () => {
        const currentX = window.scrollX;
        const currentY = window.scrollY;

        if (currentX !== savedScrollPosition.x || currentY !== savedScrollPosition.y) {
          console.log('🔄 [防滚动] 恢复滚动位置:', {
            from: { x: currentX, y: currentY },
            to: savedScrollPosition,
          });
          window.scrollTo(savedScrollPosition.x, savedScrollPosition.y);
          document.documentElement.scrollTop = savedScrollPosition.y;
          document.documentElement.scrollLeft = savedScrollPosition.x;
          document.body.scrollTop = savedScrollPosition.y;
          document.body.scrollLeft = savedScrollPosition.x;
        }
      };

      // 多次尝试恢复
      restoreScroll();
      setTimeout(restoreScroll, 0);
      setTimeout(restoreScroll, 10);
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 100);

      // 监听退出编辑
      const handleEditingExited = () => {
        console.log('🚪 [防滚动] 退出编辑模式');
        isEditingText = false;
        document.body.style.overflow = bodyOverflow;
        document.documentElement.style.overflow = htmlOverflow;
        console.log('✅ [防滚动] 已恢复overflow样式');
        e.target.off('editing:exited', handleEditingExited);
      };
      e.target.on('editing:exited', handleEditingExited);

      this.setupTextEditingListeners(e.target);
    });

    // 全局滚动监听器,在编辑期间强制恢复滚动位置
    const globalScrollHandler = (e: Event) => {
      if (isEditingText) {
        console.log('⚠️ [防滚动] 编辑期间检测到滚动!');
        e.preventDefault();
        e.stopPropagation();
        window.scrollTo(savedScrollPosition.x, savedScrollPosition.y);
        return false;
      }
    };
    window.addEventListener('scroll', globalScrollHandler, { passive: false, capture: true });
    document.addEventListener('scroll', globalScrollHandler, { passive: false, capture: true });

    // 监听形状绘制的鼠标事件
    this.setupShapeDrawingEvents();

    // 监听图片双击事件，进入裁剪模式
    this.canvas.on('mouse:dblclick', (e) => {
      const target = e.target;
      // 只有直接点击图片时才进入裁剪模式
      // 如果点击的是文本对象（即使文本在图片上），不触发图片裁剪
      if (target && target.type === 'image' && !this.isCropping) {
        // 检查是否点击在文本对象上
        const clickedObject = this.canvas.findTarget(e.e as any).target;

        // 如果点击的对象是文本类型，不进入裁剪模式
        if (clickedObject && (clickedObject.type === 'i-text' || clickedObject.type === 'textbox')) {
          console.log('🚫 点击了文本对象，不进入图片裁剪模式');
          return;
        }

        this.enterCropMode(target as fabric.Image);
      }
    });

    // 监听鼠标移动，显示/隐藏锁定图标
    this.canvas.on('mouse:move', (e) => {
      this.handleLockIconVisibility(e);
    });

    // 监听鼠标离开画布，隐藏所有锁定图标
    this.canvas.on('mouse:out', () => {
      this.hideAllLockIcons();
    });
  }

  // 防止编辑时滚动
  private preventScrollOnEdit() {
    // 保存当前滚动位置
    const savedScrollX = window.scrollX;
    const savedScrollY = window.scrollY;
    console.log('🔍 [防滚动] 保存滚动位置:', { savedScrollX, savedScrollY });

    // 检查当前页面尺寸
    console.log('📏 [防滚动] 页面尺寸:', {
      bodyScrollHeight: document.body.scrollHeight,
      bodyClientHeight: document.body.clientHeight,
      documentScrollHeight: document.documentElement.scrollHeight,
      documentClientHeight: document.documentElement.clientHeight,
      windowInnerHeight: window.innerHeight,
    });

    // 保存body和html的overflow样式
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    console.log('💾 [防滚动] 保存overflow样式:', { bodyOverflow, htmlOverflow });

    // 临时禁用滚动
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    console.log('🚫 [防滚动] 已设置overflow: hidden');

    // 强制阻止滚动的函数
    const preventScroll = (e: Event) => {
      console.log('⚠️ [防滚动] 检测到滚动事件!', {
        target: (e.target as any)?.tagName,
        currentScroll: { x: window.scrollX, y: window.scrollY },
      });
      e.preventDefault();
      e.stopPropagation();
      window.scrollTo(savedScrollX, savedScrollY);
      return false;
    };

    // 在多个事件上阻止滚动
    window.addEventListener('scroll', preventScroll, { passive: false, capture: true });
    document.addEventListener('scroll', preventScroll, { passive: false, capture: true });
    document.body.addEventListener('scroll', preventScroll, { passive: false, capture: true });
    console.log('👂 [防滚动] 已添加滚动监听器');

    // 强制恢复滚动位置(多次尝试)
    const restoreScroll = () => {
      const beforeX = window.scrollX;
      const beforeY = window.scrollY;

      window.scrollTo(savedScrollX, savedScrollY);
      document.documentElement.scrollTop = savedScrollY;
      document.documentElement.scrollLeft = savedScrollX;
      document.body.scrollTop = savedScrollY;
      document.body.scrollLeft = savedScrollX;

      if (beforeX !== savedScrollX || beforeY !== savedScrollY) {
        console.log('🔄 [防滚动] 恢复滚动位置:', {
          before: { x: beforeX, y: beforeY },
          target: { x: savedScrollX, y: savedScrollY },
          after: { x: window.scrollX, y: window.scrollY },
        });
      }
    };

    // 立即恢复一次
    setTimeout(restoreScroll, 0);
    setTimeout(restoreScroll, 10);
    setTimeout(restoreScroll, 50);
    setTimeout(restoreScroll, 100);

    // 延迟移除滚动监听和恢复overflow
    setTimeout(() => {
      console.log('🧹 [防滚动] 准备清理监听器和恢复overflow');

      window.removeEventListener('scroll', preventScroll, { capture: true } as any);
      document.removeEventListener('scroll', preventScroll, { capture: true } as any);
      document.body.removeEventListener('scroll', preventScroll, { capture: true } as any);
      console.log('✅ [防滚动] 已移除滚动监听器');

      // 恢复overflow样式
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      console.log('✅ [防滚动] 已恢复overflow样式:', { bodyOverflow, htmlOverflow });

      // 最后一次恢复滚动位置
      restoreScroll();

      // 最终检查
      console.log('🏁 [防滚动] 最终页面尺寸:', {
        bodyScrollHeight: document.body.scrollHeight,
        bodyClientHeight: document.body.clientHeight,
        documentScrollHeight: document.documentElement.scrollHeight,
        documentClientHeight: document.documentElement.clientHeight,
      });
    }, 300);
  }

  // 设置文本编辑监听器(用于普通IText和Textbox)
  private setupTextEditingListeners(editText: any) {
    console.log('📌 Setting up editing listeners for text object');

    // ESC键退出编辑
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        console.log('⌨️ ESC pressed, exiting editing');
        editText.exitEditing();
      }
    };
    window.addEventListener('keydown', handleEscape, { capture: true });

    // 监听画布容器点击(灰色区域)
    const handleContainerClick = (e: Event) => {
      console.log('🎯 Canvas container clicked (custom event received), exiting editing', e);
      editText.exitEditing();
    };

    // 监听canvas元素点击
    const handleCanvasClick = () => {
      console.log('🖱️ Canvas clicked, checking activeObject');
      // 延迟检查,等待Fabric.js处理完点击事件
      setTimeout(() => {
        const activeObj = this.canvas.getActiveObject();
        console.log('🔍 ActiveObject:', activeObj === editText ? 'still editText' : 'changed');
        // 如果activeObject不再是editText,说明点击了其他地方,退出编辑
        if (activeObj !== editText) {
          console.log('✅ ActiveObject changed, exiting editing');
          editText.exitEditing();
        }
      }, 10);
    };

    // 立即添加监听器
    console.log('📌 Adding click listeners for editing mode');
    // 监听画布容器点击(灰色区域)
    document.addEventListener('canvas-container-click', handleContainerClick);
    console.log('📌 Container click listener added');
    // 监听canvas元素点击 - 需要延迟避免立即触发
    const canvasElement = this.canvas.getElement();
    setTimeout(() => {
      canvasElement.addEventListener('click', handleCanvasClick);
      console.log('📌 Canvas click listener added');
    }, 200);

    // 监听编辑退出,移除所有监听器
    const handleEditingExited = () => {
      console.log('🚪 Exited editing, removing listeners');
      window.removeEventListener('keydown', handleEscape, { capture: true } as any);
      document.removeEventListener('canvas-container-click', handleContainerClick);
      canvasElement.removeEventListener('click', handleCanvasClick);
      editText.off('editing:exited', handleEditingExited);
    };
    editText.on('editing:exited', handleEditingExited);
  }

  // 添加单行文本（IText）
  addText(text = '双击编辑') {
    const obj = new fabric.IText(text, {
      left: this.width / 2,
      top: this.height / 2,
      fontSize: 60,
      fontFamily: 'LXGW WenKai',
      fill: '#333333',
      originX: 'center',
      originY: 'center',
      editable: true,
      selectable: true,
    } as any);

    this.canvas.add(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.renderAll();
    return obj;
  }

  // 添加多行文本（Textbox，支持自动换行）
  addTextbox(text = '双击编辑') {
    const obj = new fabric.Textbox(text, {
      left: this.width / 2,
      top: this.height / 2,
      width: this.width * 0.8, // 画布宽度的80%
      fontSize: 60,
      fontFamily: 'LXGW WenKai',
      fill: '#333333',
      originX: 'center',
      originY: 'center',
      editable: true,
      selectable: true,
      splitByGrapheme: true, // 支持中文字符换行
    } as any);

    this.canvas.add(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.renderAll();
    return obj;
  }

  // 添加形状 - 进入绘制模式或直接生成
  addShape(shapeType: string) {
    // 支持拖拽绘制的形状
    const drawableShapes = ['rect', 'circle', 'triangle', 'line', 'arrow'];
    if (drawableShapes.includes(shapeType)) {
      this.enterShapeDrawingMode(shapeType);
      return;
    }

    // 固定形状（星形、爱心、六边形）- 点击直接生成
    const fixedShapes = ['star', 'heart', 'hexagon'];
    if (fixedShapes.includes(shapeType)) {
      this.createFixedShape(shapeType);
      return;
    }
  }

  // 创建五角星路径
  private createStarPath(points: number, outerRadius: number, innerRadius: number): string {
    const cx = outerRadius;
    const cy = outerRadius;
    let path = '';

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      path += (i === 0 ? 'M ' : 'L ') + x + ',' + y + ' ';
    }
    path += 'Z';
    return path;
  }

  // 创建箭头路径
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

  // 创建正多边形路径
  private createPolygonPath(sides: number, radius: number): string {
    const cx = radius;
    const cy = radius;
    let path = '';

    for (let i = 0; i < sides; i++) {
      const angle = (2 * Math.PI / sides) * i - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      path += (i === 0 ? 'M ' : 'L ') + x + ',' + y + ' ';
    }
    path += 'Z';
    return path;
  }

  // 压缩图片
  private compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 如果图片宽度超过最大宽度，按比例缩小
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // 转换为 JPEG 格式，质量 0.8
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  private async loadFabricImage(imageUrl: string): Promise<fabric.Image> {
    const img = await fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' });
    if (!img) {
      throw new Error('Failed to load image');
    }
    return img;
  }

  // 添加图片（上传到七牛云）
  async addImage(file: File): Promise<fabric.Image> {
    try {
      console.log('📤 开始上传图片到七牛云...');

      // 上传到七牛云
      const imageUrl = await this.qiniuUploader.uploadFile(file);

      console.log('✅ 图片上传成功，URL:', imageUrl);

      // 添加到图片库
      const library = getImageLibrary();
      library.addImage(imageUrl, file.name);

      // 从七牛云 URL 加载图片
      const img = await this.loadFabricImage(imageUrl);

      // 计算缩放比例，确保图片不超过画布的 80%
      const maxWidth = this.width * 0.8;
      const maxHeight = this.height * 0.8;
      const scale = Math.min(
        maxWidth / (img.width || 1),
        maxHeight / (img.height || 1),
        1 // 不放大，只缩小
      );

      img.set({
        left: this.width / 2,
        top: this.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
      });

      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
      return img;
    } catch (error) {
      console.error('❌ 图片上传失败:', error);
      throw error;
    }
  }

  // 从剪贴板添加图片（上传到七牛云）
  async addImageFromClipboard(blob: Blob): Promise<fabric.Image> {
    try {
      console.log('📤 开始上传剪贴板图片到七牛云...');

      // 上传到七牛云
      const imageUrl = await this.qiniuUploader.uploadBlob(blob);

      console.log('✅ 剪贴板图片上传成功，URL:', imageUrl);

      // 添加到图片库
      const library = getImageLibrary();
      library.addImage(imageUrl, `clipboard-${Date.now()}.png`);

      // 从七牛云 URL 加载图片
      const img = await this.loadFabricImage(imageUrl);

      // 计算缩放比例
      const maxWidth = this.width * 0.8;
      const maxHeight = this.height * 0.8;
      const scale = Math.min(
        maxWidth / (img.width || 1),
        maxHeight / (img.height || 1),
        1
      );

      img.set({
        left: this.width / 2,
        top: this.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
      });

      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();
      return img;
    } catch (error) {
      console.error('❌ 剪贴板图片上传失败:', error);
      throw error;
    }
  }

  // 从 URL 添加图片（用于 AI 生图）
  async addImageFromURL(imageUrl: string, saveToLibrary = true): Promise<fabric.Image> {
    console.log('📥 从 URL 加载图片:', imageUrl);

    const img = await this.loadFabricImage(imageUrl);

    // 计算缩放比例
    const maxWidth = this.width * 0.8;
    const maxHeight = this.height * 0.8;
    const scale = Math.min(
      maxWidth / (img.width || 1),
      maxHeight / (img.height || 1),
      1
    );

    img.set({
      left: this.width / 2,
      top: this.height / 2,
      originX: 'center',
      originY: 'center',
      scaleX: scale,
      scaleY: scale,
    });

    this.canvas.add(img);
    this.canvas.setActiveObject(img);
    this.canvas.renderAll();

    // 保存到图片库
    if (saveToLibrary) {
      console.log('📚 准备保存到图库:', imageUrl);
      const library = getImageLibrary();
      const fileName = imageUrl.split('/').pop() || 'ai-generated.jpg';
      const isNew = library.addImage(imageUrl, fileName);
      console.log('✅ 图片已保存到图库:', fileName, '是否新图片:', isNew);
      console.log('📚 当前图库数量:', library.getCount());
    }

    return img;
  }

  /**
   * 添加 SVG 图标到画布
   * @param IconComponent Lucide 图标组件
   * @param options 配置选项
   */
  async addSVGIcon(IconComponent: any, options: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    size?: number;
  } = {}): Promise<fabric.Group | fabric.Path> {
    const {
      fill = '#000000',
      stroke = '#000000',
      strokeWidth = 2,
      size = 60,
    } = options;

    try {
      console.log('🎨 开始添加 SVG 图标...');

      // 转换为 Fabric.js 对象
      const svgObject = await iconComponentToFabric(IconComponent, {
        width: size,
        height: size,
        fill,
        stroke,
        strokeWidth,
        left: this.width / 2,
        top: this.height / 2,
      });

      // 标记为 SVG 图标对象
      (svgObject as any).isSVGIcon = true;

      // 添加到画布
      this.canvas.add(svgObject);
      this.canvas.setActiveObject(svgObject);
      this.canvas.renderAll();

      console.log('✅ SVG 图标添加成功');
      return svgObject;
    } catch (error) {
      console.error('❌ 添加 SVG 图标失败:', error);
      throw error;
    }
  }

  /**
   * 添加AI生成图片的占位符（渐变呼吸效果）
   * @param size 图片尺寸 (1024x1024, 1024x1792, 1792x1024)
   * @returns 占位图对象
   */
  async addAIPlaceholder(size: string): Promise<fabric.Group> {
    // 解析尺寸
    const [width, height] = size.split('x').map(Number);

    // 计算缩放比例（占位图最大不超过画布的80%）
    const maxWidth = this.width * 0.8;
    const maxHeight = this.height * 0.8;
    const scale = Math.min(
      maxWidth / width,
      maxHeight / height,
      1
    );

    const displayWidth = width * scale;
    const displayHeight = height * scale;

    // 计算渐变圆形的基础半径（使用矩形的较小边）
    const baseRadius = Math.min(displayWidth, displayHeight) / 2;

    // 1. 背景矩形 - 半透明白色
    const background = new fabric.Rect({
      width: displayWidth,
      height: displayHeight,
      fill: 'rgba(255, 255, 255, 0.95)',
      stroke: 'rgba(0, 0, 0, 0.08)',
      strokeWidth: 1,
      rx: 12,
      ry: 12,
      shadow: new fabric.Shadow({
        color: 'rgba(0, 0, 0, 0.1)',
        blur: 20,
        offsetX: 0,
        offsetY: 4,
      }),
      left: -displayWidth / 2,
      top: -displayHeight / 2,
    });

    // 2. 创建外层渐变呼吸圆形（马卡龙黄色）
    const outerRadius = baseRadius * 0.6; // 60% 的半径
    const breathCircle = new fabric.Circle({
      radius: outerRadius,
      fill: new fabric.Gradient({
        type: 'radial',
        coords: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          r1: 0,
          r2: outerRadius,
        },
        colorStops: [
          { offset: 0, color: 'rgba(255, 193, 7, 0.25)' },    // 马卡龙黄色中心
          { offset: 0.5, color: 'rgba(255, 235, 59, 0.2)' },  // 浅黄色中间
          { offset: 1, color: 'rgba(255, 245, 157, 0.05)' },  // 淡黄色边缘
        ],
      }),
      left: -outerRadius,
      top: -outerRadius,
      opacity: 0.8,
    });

    // 3. 中层圆（马卡龙粉红色）
    const middleRadius = baseRadius * 0.4; // 40% 的半径
    const middleCircle = new fabric.Circle({
      radius: middleRadius,
      fill: new fabric.Gradient({
        type: 'radial',
        coords: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          r1: 0,
          r2: middleRadius,
        },
        colorStops: [
          { offset: 0, color: 'rgba(255, 138, 128, 0.35)' },  // 马卡龙粉红色
          { offset: 1, color: 'rgba(255, 171, 145, 0.1)' },   // 淡粉色
        ],
      }),
      left: -middleRadius,
      top: -middleRadius,
      opacity: 0.85,
    });

    // 4. 内层小圆（马卡龙橙红色中心点）
    const innerRadius = baseRadius * 0.2; // 20% 的半径
    const innerCircle = new fabric.Circle({
      radius: innerRadius,
      fill: new fabric.Gradient({
        type: 'radial',
        coords: {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: 0,
          r1: 0,
          r2: innerRadius,
        },
        colorStops: [
          { offset: 0, color: 'rgba(255, 112, 67, 0.6)' },    // 马卡龙橙红色
          { offset: 1, color: 'rgba(255, 138, 101, 0.25)' },  // 淡橙色
        ],
      }),
      left: -innerRadius,
      top: -innerRadius,
      opacity: 0.9,
    });

    // 5. 组合成一个Group（可拖拽移动）
    const placeholder = new fabric.Group(
      [background, breathCircle, middleCircle, innerCircle],
      {
        left: this.width / 2,
        top: this.height / 2,
        originX: 'center',
        originY: 'center',
        selectable: true,   // 可以选中
        evented: true,      // 可以响应事件
        hasControls: false, // 不显示缩放控制点
        hasBorders: true,   // 显示边框
        lockRotation: true, // 锁定旋转
        lockScalingX: true, // 锁定水平缩放
        lockScalingY: true, // 锁定垂直缩放
      }
    );

    // 添加自定义属性标记
    (placeholder as any).isAIPlaceholder = true;
    (placeholder as any).targetSize = { width, height };
    (placeholder as any).breathCircle = breathCircle;
    (placeholder as any).middleCircle = middleCircle;
    (placeholder as any).innerCircle = innerCircle;

    // 添加到画布
    this.canvas.add(placeholder);
    this.canvas.renderAll();

    // 启动呼吸动画
    this.startBreathingAnimation(placeholder, breathCircle, middleCircle, innerCircle);

    console.log('✅ AI占位图已添加到画布（渐变呼吸效果）');
    return placeholder;
  }

  /**
   * 启动呼吸动画（渐变圆形的缩放和透明度变化）
   * 使用正弦波实现平滑的呼吸效果
   */
  private startBreathingAnimation(
    placeholder: fabric.Group,
    breathCircle: fabric.Circle,
    middleCircle: fabric.Circle,
    innerCircle: fabric.Circle
  ) {
    const startTime = Date.now();

    const animate = () => {
      // 检查占位图是否还在画布上
      if (!this.canvas.contains(placeholder)) {
        console.log('🛑 占位图已移除，停止呼吸动画');
        return;
      }

      // 计算经过的时间（秒）
      const elapsed = (Date.now() - startTime) / 1000;

      // 使用正弦波计算呼吸效果（周期 2.5 秒，更慢更优雅）
      const breathPhase = Math.sin(elapsed * Math.PI * 0.8); // 0 -> 1 -> 0 -> -1 -> 0

      // 外圆：缩放从 0.95 到 1.05
      const outerScale = 1.0 + breathPhase * 0.05;
      breathCircle.set({
        scaleX: outerScale,
        scaleY: outerScale,
        opacity: 0.7 + breathPhase * 0.15,
      });

      // 中圆：缩放从 0.9 到 1.1
      const middleScale = 1.0 + breathPhase * 0.1;
      middleCircle.set({
        scaleX: middleScale,
        scaleY: middleScale,
        opacity: 0.75 + breathPhase * 0.15,
      });

      // 内圆：缩放从 0.85 到 1.15（变化最大）
      const innerScale = 1.0 + breathPhase * 0.15;
      innerCircle.set({
        scaleX: innerScale,
        scaleY: innerScale,
        opacity: 0.8 + breathPhase * 0.2,
      });

      // 🔑 关键：标记 Group 为 dirty，强制重新渲染
      placeholder.dirty = true;
      placeholder.setCoords();
      this.canvas.requestRenderAll();

      requestAnimationFrame(animate);
    };

    console.log('🎬 启动呼吸动画');
    animate();
  }

  /**
   * 替换AI占位图为真实图片
   * @param placeholder 占位图对象
   * @param imageUrl 真实图片URL
   */
  async replaceAIPlaceholder(placeholder: fabric.Group, imageUrl: string): Promise<void> {
    try {
      // 获取占位图的位置和尺寸信息
      const left = placeholder.left || 0;
      const top = placeholder.top || 0;
      const targetSize = (placeholder as any).targetSize;

      // 加载真实图片
      const img = await this.loadFabricImage(imageUrl);
      if (!img.width || !img.height) {
        console.error('❌ 加载图片失败');
        throw new Error('加载图片失败');
      }

      // 计算缩放比例
      const maxWidth = this.width * 0.8;
      const maxHeight = this.height * 0.8;
      const scale = Math.min(
        maxWidth / (img.width || 1),
        maxHeight / (img.height || 1),
        1
      );

      // 设置图片属性（继承占位图的位置）
      img.set({
        left: left,
        top: top,
        originX: 'center',
        originY: 'center',
        scaleX: scale,
        scaleY: scale,
      });

      // 移除占位图
      this.canvas.remove(placeholder);

      // 添加真实图片
      this.canvas.add(img);
      this.canvas.setActiveObject(img);
      this.canvas.renderAll();

      // 保存到图片库
      console.log('📚 准备保存到图库:', imageUrl);
      const library = getImageLibrary();
      const fileName = imageUrl.split('/').pop() || 'ai-generated.jpg';
      const isNew = library.addImage(imageUrl, fileName);
      console.log('✅ 图片已保存到图库:', fileName, '是否新图片:', isNew);

      void targetSize;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 移除AI占位图（生成失败时调用）
   * @param placeholder 占位图对象
   */
  removeAIPlaceholder(placeholder: fabric.Group): void {
    this.canvas.remove(placeholder);
    this.canvas.renderAll();
    console.log('🗑️ AI占位图已移除');
  }

  // 调整图层顺序
  bringToFront() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      const beforeIndex = this.canvas.getObjects().indexOf(activeObject);
      this.canvas.bringObjectToFront(activeObject);
      this.canvas.requestRenderAll();
      const afterIndex = this.canvas.getObjects().indexOf(activeObject);
      console.log('📌 置于顶层:', {
        type: activeObject.type,
        beforeIndex,
        afterIndex,
        totalObjects: this.canvas.getObjects().length
      });
    }
  }

  sendToBack() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      const beforeIndex = this.canvas.getObjects().indexOf(activeObject);
      this.canvas.sendObjectToBack(activeObject);
      this.canvas.requestRenderAll();
      const afterIndex = this.canvas.getObjects().indexOf(activeObject);
      console.log('📌 置于底层:', {
        type: activeObject.type,
        beforeIndex,
        afterIndex,
        totalObjects: this.canvas.getObjects().length
      });

      // 打印所有对象的顺序
      console.log('📋 当前图层顺序(从底到顶):',
        this.canvas.getObjects().map((obj, i) => `${i}: ${obj.type}`)
      );
    }
  }

  bringForward() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      const beforeIndex = this.canvas.getObjects().indexOf(activeObject);
      this.canvas.bringObjectForward(activeObject);
      this.canvas.requestRenderAll();
      const afterIndex = this.canvas.getObjects().indexOf(activeObject);
      console.log('📌 上移一层:', {
        type: activeObject.type,
        beforeIndex,
        afterIndex
      });
    }
  }

  sendBackwards() {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      const beforeIndex = this.canvas.getObjects().indexOf(activeObject);
      this.canvas.sendObjectBackwards(activeObject);
      this.canvas.requestRenderAll();
      const afterIndex = this.canvas.getObjects().indexOf(activeObject);
      console.log('📌 下移一层:', {
        type: activeObject.type,
        beforeIndex,
        afterIndex
      });
    }
  }

  // 剪贴板存储
  private clipboard: fabric.Object | fabric.Object[] | null = null;

  // 画笔模式状态
  private isDrawingMode = false;

  // 绘制模式状态
  private shapeDrawingMode: string | null = null; // 'rect', 'circle', 'line', 'arrow', etc.
  private isDrawingShape = false;
  private drawingStartPoint: { x: number; y: number } | null = null;
  private tempShape: fabric.Object | null = null;

  // 复制选中的对象到剪贴板
  async copy() {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    // 处理多选
    if (activeObject.type === 'activeSelection') {
      const selection = activeObject as fabric.ActiveSelection;
      const objects = selection.getObjects();

      // 克隆所有对象到剪贴板
      const clonedObjects = await Promise.all(
        objects.map((obj: any) => obj.clone(['data', 'selectable', 'evented']) as Promise<fabric.Object>)
      );

      this.clipboard = clonedObjects;
      console.log('✅ 已复制', clonedObjects.length, '个对象到剪贴板');
      return;
    }

    // 处理单个对象
    const cloned = await activeObject.clone(['data', 'selectable', 'evented']) as fabric.Object;
    this.clipboard = cloned;
    console.log('✅ 已复制对象到剪贴板:', cloned.type);
  }

  // 检查内部剪贴板是否有内容
  hasClipboardContent(): boolean {
    return !!this.clipboard;
  }

  // 从剪贴板粘贴对象
  async paste() {
    if (!this.clipboard) {
      console.log('⚠️ 剪贴板为空');
      return;
    }

    // 取消当前选择
    this.canvas.discardActiveObject();

    // 处理多个对象
    if (Array.isArray(this.clipboard)) {
      const pastedObjects = await Promise.all(
        this.clipboard.map(async (obj: any) => {
          const cloned = await obj.clone(['data', 'selectable', 'evented']) as fabric.Object;
          cloned.set({
            left: (cloned.left || 0) + 20,
            top: (cloned.top || 0) + 20,
          });
          this.canvas.add(cloned);
          return cloned;
        })
      );

      // 选中粘贴的对象
      if (pastedObjects.length > 0) {
        const sel = new fabric.ActiveSelection(pastedObjects, {
          canvas: this.canvas,
        });
        this.canvas.setActiveObject(sel);
        this.canvas.renderAll();
        console.log('✅ 已粘贴', pastedObjects.length, '个对象');
      }

      return;
    }

    // 处理单个对象
    const cloned = await this.clipboard.clone(['data', 'selectable', 'evented']) as fabric.Object;
    cloned.set({
      left: (cloned.left || 0) + 20,
      top: (cloned.top || 0) + 20,
    });
    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.renderAll();

    // 如果是 Group，需要重新绑定事件
    if (cloned.type === 'group') {
      this.rebindGroupEvents();
    }

    console.log('✅ 已粘贴对象:', cloned.type);
  }

  // 启用画笔模式
  enableDrawingMode(color?: string, width?: number) {
    this.canvas.isDrawingMode = true;
    this.isDrawingMode = true;

    // 使用上次的颜色或默认黑色
    const pencilColor = color || this.getLastUsedColor('pencilStroke', '#000000');
    const pencilWidth = width || 7; // 粗线

    // 设置画笔属性
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = pencilColor;
      this.canvas.freeDrawingBrush.width = pencilWidth;
    }

    console.log('✏️ 画笔模式已启用');
  }

  // 禁用画笔模式
  disableDrawingMode() {
    this.canvas.isDrawingMode = false;
    this.isDrawingMode = false;
    console.log('✏️ 画笔模式已禁用');
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

  // ==================== 形状绘制模式 ====================

  /**
   * 进入形状绘制模式
   * @param shapeType 形状类型 (rect, circle, line, arrow, etc.)
   */
  enterShapeDrawingMode(shapeType: string) {
    // 先退出画笔模式
    if (this.isDrawingMode) {
      this.disableDrawingMode();
    }

    // 取消选中
    this.canvas.discardActiveObject();
    this.canvas.renderAll();

    // 设置绘制模式
    this.shapeDrawingMode = shapeType;
    this.canvas.selection = false; // 禁用框选
    this.canvas.defaultCursor = 'crosshair'; // 十字光标

    console.log(`🎨 进入 ${shapeType} 绘制模式`);
  }

  /**
   * 退出形状绘制模式
   */
  exitShapeDrawingMode() {
    this.shapeDrawingMode = null;
    this.isDrawingShape = false;
    this.drawingStartPoint = null;

    // 清理临时形状
    if (this.tempShape) {
      this.canvas.remove(this.tempShape);
      this.tempShape = null;
    }

    this.canvas.selection = true; // 恢复框选
    this.canvas.defaultCursor = 'default';
    this.canvas.renderAll();

    console.log('✅ 退出形状绘制模式');
  }

  /**
   * 获取当前绘制模式
   */
  getShapeDrawingMode() {
    return this.shapeDrawingMode;
  }

  /**
   * 创建固定大小的形状（星形、爱心、六边形）
   */
  private createFixedShape(shapeType: string) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const defaultFill = this.getLastUsedColor('shapeFill', '#D9D9D9');
    const defaultStroke = this.getLastUsedColor('shapeStroke', '#D9D9D9');

    let shape: fabric.Object;

    switch (shapeType) {
      case 'star':
        // 创建五角星路径
        const starPath = this.createStarPath(5, 60, 30);
        shape = new fabric.Path(starPath, {
          left: centerX - 60,
          top: centerY - 60,
          fill: defaultFill,
          stroke: defaultStroke,
          strokeWidth: 0,
        });
        break;

      case 'heart':
        // 创建爱心路径
        const heartPath = 'M 50,30 C 50,20 40,10 30,10 C 20,10 10,20 10,30 C 10,45 25,60 50,80 C 75,60 90,45 90,30 C 90,20 80,10 70,10 C 60,10 50,20 50,30 Z';
        shape = new fabric.Path(heartPath, {
          left: centerX - 50,
          top: centerY - 40,
          fill: '#ef4444', // 红色爱心（保持语义化颜色）
          stroke: '#ef4444',
          strokeWidth: 0,
          scaleX: 1.2,
          scaleY: 1.2,
        });
        break;

      case 'hexagon':
        // 创建六边形路径
        const hexPath = this.createPolygonPath(6, 60);
        shape = new fabric.Path(hexPath, {
          left: centerX - 60,
          top: centerY - 60,
          fill: defaultFill,
          stroke: defaultStroke,
          strokeWidth: 0,
        });
        break;

      default:
        return;
    }

    // 标记为形状对象
    (shape as any).isShape = true;
    (shape as any).shapeType = shapeType;

    this.canvas.add(shape);
    this.canvas.setActiveObject(shape);
    this.canvas.renderAll();

    console.log(`✅ 创建固定形状: ${shapeType}`);
  }

  /**
   * 设置形状绘制的鼠标事件
   */
  private setupShapeDrawingEvents() {
    // 鼠标按下 - 开始绘制
    this.canvas.on('mouse:down', (e) => {
      if (!this.shapeDrawingMode) return;
      const pointer = this.canvas.getScenePoint(e.e);

      this.isDrawingShape = true;
      this.drawingStartPoint = { x: pointer.x, y: pointer.y };

      // 创建临时形状
      this.tempShape = this.createTempShape(this.shapeDrawingMode, pointer.x, pointer.y);
      if (this.tempShape) {
        this.canvas.add(this.tempShape);
      }
    });

    // 鼠标移动 - 更新形状大小
    this.canvas.on('mouse:move', (e) => {
      if (!this.isDrawingShape || !this.tempShape || !this.drawingStartPoint) return;

      const pointer = this.canvas.getScenePoint(e.e);
      this.updateTempShape(this.tempShape, this.shapeDrawingMode!, this.drawingStartPoint, pointer);
      this.canvas.renderAll();
    });

    // 鼠标松开 - 完成绘制
    this.canvas.on('mouse:up', () => {
      if (!this.isDrawingShape || !this.tempShape) return;

      this.isDrawingShape = false;
      this.drawingStartPoint = null;

      // 如果形状太小，删除它
      const minSize = 5;
      if (this.isTempShapeTooSmall(this.tempShape, minSize)) {
        this.canvas.remove(this.tempShape);
        this.tempShape = null;
        return;
      }

      // 恢复形状的可选择和可交互属性
      this.tempShape.set({
        selectable: true,
        evented: true,
      });

      // 标记为形状对象
      (this.tempShape as any).isShape = true;
      (this.tempShape as any).shapeType = this.shapeDrawingMode;

      // 选中新创建的形状
      this.canvas.setActiveObject(this.tempShape);
      this.tempShape = null;

      // 退出绘制模式
      this.exitShapeDrawingMode();

      // 触发自定义事件，通知 page.tsx 切换回选择工具
      const event = new CustomEvent('shape:completed');
      document.dispatchEvent(event);

      this.canvas.renderAll();
      console.log('✅ 形状绘制完成');
    });
  }

  /**
   * 创建临时形状
   */
  private createTempShape(shapeType: string, x: number, y: number): fabric.Object | null {
    const defaultFill = this.getLastUsedColor('shapeFill', '#D9D9D9');
    const defaultStroke = this.getLastUsedColor('shapeStroke', '#D9D9D9');
    const defaultLineStroke = this.getLastUsedColor('lineStroke', '#000000');

    switch (shapeType) {
      case 'rect':
        return new fabric.Rect({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: defaultFill,
          stroke: defaultStroke,
          strokeWidth: 0,
          selectable: false,
          evented: false,
        });

      case 'circle':
        return new fabric.Circle({
          left: x,
          top: y,
          radius: 0,
          fill: defaultFill,
          stroke: defaultStroke,
          strokeWidth: 0,
          selectable: false,
          evented: false,
        });

      case 'triangle':
        return new fabric.Triangle({
          left: x,
          top: y,
          width: 0,
          height: 0,
          fill: defaultFill,
          stroke: defaultStroke,
          strokeWidth: 0,
          selectable: false,
          evented: false,
        });

      case 'line':
        return new fabric.Line([x, y, x, y], {
          stroke: defaultLineStroke,
          strokeWidth: 7,
          selectable: false,
          evented: false,
        });

      case 'arrow':
        // 箭头初始为一个点，后续在 updateTempShape 中更新
        return new fabric.Path('M 0 0 L 0 0', {
          left: x,
          top: y,
          fill: defaultLineStroke,
          stroke: defaultLineStroke,
          strokeWidth: 0,
          selectable: false,
          evented: false,
        });

      default:
        return null;
    }
  }

  /**
   * 更新临时形状的大小
   */
  private updateTempShape(
    shape: fabric.Object,
    shapeType: string,
    startPoint: { x: number; y: number },
    currentPoint: { x: number; y: number }
  ) {
    const width = currentPoint.x - startPoint.x;
    const height = currentPoint.y - startPoint.y;

    switch (shapeType) {
      case 'rect':
        (shape as fabric.Rect).set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width > 0 ? startPoint.x : currentPoint.x,
          top: height > 0 ? startPoint.y : currentPoint.y,
        });
        break;

      case 'circle':
        const radius = Math.sqrt(width * width + height * height) / 2;
        (shape as fabric.Circle).set({
          radius: Math.abs(radius),
          left: startPoint.x,
          top: startPoint.y,
        });
        break;

      case 'triangle':
        (shape as fabric.Triangle).set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width > 0 ? startPoint.x : currentPoint.x,
          top: height > 0 ? startPoint.y : currentPoint.y,
        });
        break;

      case 'line':
        (shape as fabric.Line).set({
          x2: currentPoint.x,
          y2: currentPoint.y,
        });
        break;

      case 'arrow':
        // 更新箭头路径
        const arrowLength = Math.sqrt(width * width + height * height);
        const arrowPath = this.createArrowPath(arrowLength, 7);
        const angle = Math.atan2(height, width) * 180 / Math.PI;

        // 创建新的箭头路径对象
        const newArrowPath = new fabric.Path(arrowPath, {
          left: startPoint.x,
          top: startPoint.y,
          fill: (shape as any).fill,
          stroke: (shape as any).stroke,
          strokeWidth: 0,
          angle: angle,
          selectable: false,
          evented: false,
        });

        // 替换临时形状
        this.canvas.remove(shape);
        this.canvas.add(newArrowPath);
        this.tempShape = newArrowPath;
        break;
    }
  }

  /**
   * 检查临时形状是否太小
   */
  private isTempShapeTooSmall(shape: fabric.Object, minSize: number): boolean {
    if (shape.type === 'rect' || shape.type === 'triangle') {
      const width = (shape as any).width || 0;
      const height = (shape as any).height || 0;
      return width < minSize && height < minSize;
    } else if (shape.type === 'circle') {
      const radius = (shape as any).radius || 0;
      return radius < minSize;
    } else if (shape.type === 'line') {
      const line = shape as fabric.Line;
      const dx = (line.x2 || 0) - (line.x1 || 0);
      const dy = (line.y2 || 0) - (line.y1 || 0);
      const length = Math.sqrt(dx * dx + dy * dy);
      return length < minSize;
    } else if (shape.type === 'path') {
      // Path 类型（箭头）- 检查路径长度
      // 箭头的长度可以通过起点和终点计算
      return false; // 暂时不过滤箭头
    }
    return false;
  }

  // 复制选中的对象(原地复制,Cmd+D)
  async duplicateActive() {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    // 处理多选
    if (activeObject.type === 'activeSelection') {
      const selection = activeObject as fabric.ActiveSelection;
      const objects = selection.getObjects();

      // 取消选择
      this.canvas.discardActiveObject();

      // 复制每个对象
      const clonedObjects = await Promise.all(
        objects.map(async (obj: any) => {
          const cloned = await obj.clone(['data', 'selectable', 'evented']) as fabric.Object;
          cloned.set({
            left: (cloned.left || 0) + 20,
            top: (cloned.top || 0) + 20,
          });
          this.canvas.add(cloned);
          return cloned;
        })
      );

      // 选中复制的对象
      if (clonedObjects.length > 0) {
        const sel = new fabric.ActiveSelection(clonedObjects, {
          canvas: this.canvas,
        });
        this.canvas.setActiveObject(sel);
        this.canvas.renderAll();
      }

      return;
    }

    // 处理单个对象
    const cloned = await activeObject.clone(['data', 'selectable', 'evented']) as fabric.Object;
    cloned.set({
      left: (cloned.left || 0) + 20,
      top: (cloned.top || 0) + 20,
    });
    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.renderAll();

    // 如果是 Group，需要重新绑定事件
    if (cloned.type === 'group') {
      this.rebindGroupEvents();
    }
  }

  // 更新现有高亮文本的背景色
  updateHighlightBackground(
    group: fabric.Group,
    type: 'marker' | 'underline' | 'box',
    color: string
  ) {
    const items = (group as any)._objects || [];
    const textObj = items.find((obj: any) => obj.type === 'i-text');
    const backgroundObj = items.find((obj: any) => obj.type !== 'i-text');

    if (!textObj || !backgroundObj) return;

    const paddingX = 20;
    const paddingY = 12;

    // 根据类型更新背景
    switch (type) {
      case 'marker':
        // 更新荧光笔背景
        if (backgroundObj.type === 'rect') {
          backgroundObj.set({
            fill: color,
            opacity: 0.5,
          });
        } else {
          // 如果类型不匹配，需要重新创建
          this.recreateHighlightText(group, type, color);
          return;
        }
        break;
      case 'underline':
        // 更新下划线
        if (backgroundObj.type === 'line') {
          backgroundObj.set({
            stroke: color,
          });
        } else {
          this.recreateHighlightText(group, type, color);
          return;
        }
        break;
      case 'box':
        // 更新边框
        if (backgroundObj.type === 'rect') {
          backgroundObj.set({
            stroke: color,
            fill: 'transparent',
          });
        } else {
          this.recreateHighlightText(group, type, color);
          return;
        }
        break;
    }

    this.canvas.renderAll();
  }

  // 重新创建高亮文本（当类型改变时）
  recreateHighlightText(
    group: fabric.Group,
    type: 'marker' | 'underline' | 'box',
    color: string
  ) {
    const items = (group as any)._objects || [];
    const textObj = items.find((obj: any) => obj.type === 'i-text');

    if (!textObj) return;

    const config: HighlightConfig = {
      text: textObj.text || '',
      type,
      color,
      fontSize: textObj.fontSize,
      fontFamily: textObj.fontFamily,
      left: group.left,
      top: group.top,
      angle: group.angle,
      scaleX: group.scaleX,
      scaleY: group.scaleY,
    };

    this.canvas.remove(group);
    this.addHighlightText(config);
  }

  // 添加高亮文本（使用 Group 但支持双击编辑）
  addHighlightText(config: HighlightConfig, left?: number, top?: number) {
    // 获取当前选中对象的位置（如果有）
    const activeObj = this.canvas.getActiveObject();
    const finalLeft = left ?? config.left ?? activeObj?.left ?? this.width / 2;
    const finalTop = top ?? config.top ?? activeObj?.top ?? this.height / 2;
    const finalAngle = config.angle ?? 0;
    const finalScaleX = config.scaleX ?? 1;
    const finalScaleY = config.scaleY ?? 1;

    const text = new fabric.IText(config.text, {
      fontSize: config.fontSize || 60,
      fontFamily: config.fontFamily || 'LXGW WenKai',
      fill: '#333333',
      editable: true,
      selectable: true,
      originX: 'center',
      originY: 'center',
      textAlign: 'center',
    });

    let background: fabric.Object | null = null;
    const paddingX = 20; // 左右内边距
    const paddingY = 12; // 上下内边距

    // 根据类型创建背景
    switch (config.type) {
      case 'marker':
        // 荧光笔效果：半透明矩形背景
        background = new fabric.Rect({
          width: (text.width || 0) + paddingX * 2,
          height: (text.height || 0) + paddingY * 2,
          fill: config.color,
          opacity: 0.5,
          rx: 6,
          ry: 6,
          originX: 'center',
          originY: 'center',
        });
        break;
      case 'underline':
        // 下划线效果
        background = new fabric.Line(
          [
            -(text.width || 0) / 2,
            (text.height || 0) / 2 + 6,
            (text.width || 0) / 2,
            (text.height || 0) / 2 + 6,
          ],
          {
            stroke: config.color,
            strokeWidth: 4,
            originX: 'center',
            originY: 'center',
          }
        );
        break;
      case 'box':
        // 边框效果
        background = new fabric.Rect({
          width: (text.width || 0) + paddingX * 2,
          height: (text.height || 0) + paddingY * 2,
          stroke: config.color,
          strokeWidth: 3,
          fill: 'transparent',
          rx: 6,
          ry: 6,
          originX: 'center',
          originY: 'center',
        });
        break;
    }

    // 确保背景和文本的位置都是 (0, 0)，这样它们在 Group 内部就是居中的
    background!.set({ left: 0, top: 0 });
    text.set({ left: 0, top: 0 });

    const group = new fabric.Group([background!, text], {
      left: finalLeft,
      top: finalTop,
      angle: finalAngle,
      scaleX: finalScaleX,
      scaleY: finalScaleY,
      originX: 'center',
      originY: 'center',
      subTargetCheck: true, // 允许选中子对象
    });
    (group as any).data = { isDecoratedText: true }; // ✅ 标记为新的装饰文本，避免被迁移

    // 监听双击事件，进入文本编辑模式
    group.on('mousedblclick', () => {
      // 获取 Group 的实际中心点坐标（考虑所有变换）
      const centerPoint = group.getCenterPoint();
      const savedLeft = centerPoint.x;
      const savedTop = centerPoint.y;
      const savedAngle = group.angle || 0;
      const savedScaleX = group.scaleX || 1;
      const savedScaleY = group.scaleY || 1;

      // 获取文本对象的属性
      const items = (group as any)._objects || [];
      const textObj = items.find((obj: any) => obj.type === 'i-text');

      if (textObj) {
        // 保存文本内容和样式
        const textContent = textObj.text || '';
        const originalFontSize = textObj.fontSize || 60;
        const fontFamily = textObj.fontFamily || 'Noto Sans SC';
        const fill = textObj.fill || '#333333';
        const scaledFontSize = originalFontSize * savedScaleX;

        // 移除 Group
        this.canvas.remove(group);

        // 创建新的文本对象用于编辑
        const editText = new fabric.IText(textContent, {
          left: savedLeft,
          top: savedTop,
          angle: savedAngle,
          fontSize: scaledFontSize,
          fontFamily: fontFamily,
          fill: fill,
          scaleX: 1,
          scaleY: 1,
          originX: 'center',
          originY: 'center',
          editable: true,
          selectable: true,
          textAlign: 'center',
        });

        this.canvas.add(editText);
        this.canvas.setActiveObject(editText);

        // 保存当前滚动位置
        const savedScrollX = window.scrollX;
        const savedScrollY = window.scrollY;
        console.log('🔍 [防滚动] 保存滚动位置:', { savedScrollX, savedScrollY });

        // 检查当前页面尺寸
        console.log('📏 [防滚动] 页面尺寸:', {
          bodyScrollHeight: document.body.scrollHeight,
          bodyClientHeight: document.body.clientHeight,
          documentScrollHeight: document.documentElement.scrollHeight,
          documentClientHeight: document.documentElement.clientHeight,
          windowInnerHeight: window.innerHeight,
        });

        // 保存body和html的overflow样式
        const bodyOverflow = document.body.style.overflow;
        const htmlOverflow = document.documentElement.style.overflow;
        console.log('💾 [防滚动] 保存overflow样式:', { bodyOverflow, htmlOverflow });

        // 临时禁用滚动
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        console.log('🚫 [防滚动] 已设置overflow: hidden');

        // 强制阻止滚动的函数
        const preventScroll = (e: Event) => {
          console.log('⚠️ [防滚动] 检测到滚动事件!', {
            target: (e.target as any)?.tagName,
            currentScroll: { x: window.scrollX, y: window.scrollY },
          });
          e.preventDefault();
          e.stopPropagation();
          window.scrollTo(savedScrollX, savedScrollY);
          return false;
        };

        // 在多个事件上阻止滚动
        window.addEventListener('scroll', preventScroll, { passive: false, capture: true });
        document.addEventListener('scroll', preventScroll, { passive: false, capture: true });
        document.body.addEventListener('scroll', preventScroll, { passive: false, capture: true });
        console.log('👂 [防滚动] 已添加滚动监听器');

        // 延迟进入编辑模式，并立即恢复滚动
        setTimeout(() => {
          console.log('✏️ [防滚动] 准备进入编辑模式');
          editText.enterEditing();
          console.log('✅ [防滚动] 已调用enterEditing()');

          editText.selectAll();
          console.log('✅ [防滚动] 已调用selectAll()');

          // 检查滚动位置是否变化
          console.log('🔍 [防滚动] 进入编辑后滚动位置:', {
            x: window.scrollX,
            y: window.scrollY,
            changed: window.scrollX !== savedScrollX || window.scrollY !== savedScrollY,
          });

          // 强制恢复滚动位置(多次尝试)
          const restoreScroll = () => {
            const beforeX = window.scrollX;
            const beforeY = window.scrollY;

            window.scrollTo(savedScrollX, savedScrollY);
            document.documentElement.scrollTop = savedScrollY;
            document.documentElement.scrollLeft = savedScrollX;
            document.body.scrollTop = savedScrollY;
            document.body.scrollLeft = savedScrollX;

            console.log('🔄 [防滚动] 恢复滚动位置:', {
              before: { x: beforeX, y: beforeY },
              target: { x: savedScrollX, y: savedScrollY },
              after: { x: window.scrollX, y: window.scrollY },
            });
          };

          restoreScroll();
          setTimeout(restoreScroll, 10);
          setTimeout(restoreScroll, 50);

          // 延迟移除滚动监听和恢复overflow，确保编辑模式完全稳定
          setTimeout(() => {
            console.log('🧹 [防滚动] 准备清理监听器和恢复overflow');

            window.removeEventListener('scroll', preventScroll, { capture: true } as any);
            document.removeEventListener('scroll', preventScroll, { capture: true } as any);
            document.body.removeEventListener('scroll', preventScroll, { capture: true } as any);
            console.log('✅ [防滚动] 已移除滚动监听器');

            // 恢复overflow样式
            document.body.style.overflow = bodyOverflow;
            document.documentElement.style.overflow = htmlOverflow;
            console.log('✅ [防滚动] 已恢复overflow样式:', { bodyOverflow, htmlOverflow });

            // 最后一次恢复滚动位置
            restoreScroll();

            // 最终检查
            console.log('🏁 [防滚动] 最终页面尺寸:', {
              bodyScrollHeight: document.body.scrollHeight,
              bodyClientHeight: document.body.clientHeight,
              documentScrollHeight: document.documentElement.scrollHeight,
              documentClientHeight: document.documentElement.clientHeight,
            });
          }, 200);
        }, 0);

        this.canvas.renderAll();

        // 监听ESC键退出编辑
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            editText.exitEditing();
          }
        };
        window.addEventListener('keydown', handleEscape, { capture: true });

        // 监听画布容器点击(灰色区域)
        const handleContainerClick = (e: Event) => {
          console.log('🎯 Canvas container clicked (custom event received), exiting editing', e);
          editText.exitEditing();
        };

        // 监听canvas元素点击
        const handleCanvasClick = () => {
          console.log('🖱️ Canvas clicked, checking activeObject');
          // 延迟检查,等待Fabric.js处理完点击事件
          setTimeout(() => {
            const activeObj = this.canvas.getActiveObject();
            console.log('🔍 ActiveObject:', activeObj === editText ? 'still editText' : 'changed');
            // 如果activeObject不再是editText,说明点击了其他地方,退出编辑
            if (activeObj !== editText) {
              console.log('✅ ActiveObject changed, exiting editing');
              editText.exitEditing();
            }
          }, 10);
        };

        // 延迟添加点击监听，避免立即触发
        setTimeout(() => {
          console.log('📌 Click listeners added for editing mode');
          console.log('   - Adding canvas-container-click listener');
          console.log('   - Adding canvas click listener');
          // 监听画布容器点击(灰色区域)
          document.addEventListener('canvas-container-click', handleContainerClick);
          // 监听canvas元素点击
          const canvasElement = this.canvas.getElement();
          canvasElement.addEventListener('click', handleCanvasClick);
          console.log('✅ All listeners added successfully');
        }, 200);

        // 监听文本编辑完成，重新创建 Group
        editText.on('editing:exited', () => {
          console.log('🚪 Exited editing, removing listeners');
          // 移除所有监听器
          window.removeEventListener('keydown', handleEscape, { capture: true } as any);
          document.removeEventListener('canvas-container-click', handleContainerClick);
          const canvasElement = this.canvas.getElement();
          canvasElement.removeEventListener('click', handleCanvasClick);
          window.removeEventListener('scroll', preventScroll);
          document.removeEventListener('scroll', preventScroll);

          const newConfig = {
            ...config,
            text: editText.text || '',
            fontSize: originalFontSize,
            fontFamily: fontFamily,
            fill: fill,
            left: editText.left,
            top: editText.top,
            angle: editText.angle,
            scaleX: savedScaleX,
            scaleY: savedScaleY,
          };
          this.canvas.remove(editText);
          this.addHighlightText(newConfig);
        });
      }
    });

    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.renderAll();
    return group;
  }

  // 设置背景色
  setBackgroundColor(color: string) {
    this.canvas.backgroundImage = undefined;
    this.canvas.backgroundColor = color;
    this.canvas.renderAll();
  }

  // 设置渐变背景
  setBackgroundGradient(gradientCSS: string) {
    let gradient: fabric.Gradient<'linear' | 'radial'> | null = null;

    // 尝试解析线性渐变
    // 例如: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    const linearMatch = gradientCSS.match(/linear-gradient\(\s*(\d+(?:\.\d+)?)deg,\s*(.+)\)/);

    if (linearMatch) {
      const angle = parseFloat(linearMatch[1]);
      const colorStopsStr = linearMatch[2];

      // 解析颜色停止点
      const colorStops = this.parseColorStops(colorStopsStr);

      if (colorStops.length >= 2) {
        // 将角度转换为Fabric.js的坐标
        const angleRad = (angle - 90) * Math.PI / 180;
        const coords = {
          x1: this.width / 2 - Math.cos(angleRad) * this.width / 2,
          y1: this.height / 2 - Math.sin(angleRad) * this.height / 2,
          x2: this.width / 2 + Math.cos(angleRad) * this.width / 2,
          y2: this.height / 2 + Math.sin(angleRad) * this.height / 2,
        };

        gradient = new fabric.Gradient({
          type: 'linear',
          coords: coords,
          colorStops: colorStops,
        });
      }
    }

    // 尝试解析径向渐变
    // 例如: "radial-gradient(circle 311px at 8.6% 27.9%, rgba(62,147,252,0.57) 12.9%, rgba(239,183,192,0.44) 91.2%)"
    const radialMatch = gradientCSS.match(/radial-gradient\([^,]+,\s*(.+)\)/);

    if (radialMatch && !gradient) {
      const colorStopsStr = radialMatch[1];
      const colorStops = this.parseColorStops(colorStopsStr);

      if (colorStops.length >= 2) {
        // 径向渐变：从中心向外
        gradient = new fabric.Gradient({
          type: 'radial',
          coords: {
            x1: this.width / 2,
            y1: this.height / 2,
            x2: this.width / 2,
            y2: this.height / 2,
            r1: 0,
            r2: Math.max(this.width, this.height) / 2,
          },
          colorStops: colorStops,
        });
      }
    }

    if (gradient) {
      this.canvas.backgroundImage = undefined;
      this.canvas.backgroundColor = gradient as any;
      this.canvas.renderAll();
    }
  }

  // 解析颜色停止点
  private parseColorStops(colorStopsStr: string): Array<{ offset: number; color: string }> {
    const stops: Array<{ offset: number; color: string }> = [];

    // 匹配 rgba(...) 或 rgb(...) 或 #hex 颜色
    const regex = /(rgba?\([^)]+\)|#[0-9a-fA-F]{3,6})\s+([\d.]+)%/g;
    let match;

    while ((match = regex.exec(colorStopsStr)) !== null) {
      // 限制 offset 在 0-1 范围内
      const offset = Math.min(1, Math.max(0, parseFloat(match[2]) / 100));
      stops.push({
        color: match[1],
        offset: offset,
      });
    }

    return stops;
  }

  // 设置图片背景
  async setBackgroundImage(imageUrl: string) {
    try {
      const img = await this.loadFabricImage(imageUrl);
      // 计算缩放比例以填满画布
      const scaleX = this.width / (img.width || 1);
      const scaleY = this.height / (img.height || 1);
      const scale = Math.max(scaleX, scaleY);

      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
        left: this.width / 2,
        top: this.height / 2,
      });

      this.canvas.backgroundImage = img;
      this.canvas.renderAll();
    } catch (error) {
      console.error('❌ 设置背景图片失败:', error);
    }
  }

  // 更新选中对象的属性
  updateProperty(property: string, value: any) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;

    console.log(`🔄 updateProperty: ${property} = ${value}, activeObj type: ${activeObj.type}`);

    // 处理多选
    if (activeObj.type === 'activeSelection') {
      const selection = activeObj as fabric.ActiveSelection;
      const objects = selection.getObjects();

      objects.forEach((obj: any) => {
        this.updateSingleObjectProperty(obj, property, value);
      });

      this.canvas.renderAll();
      this.canvas.fire('object:modified', { target: activeObj });

      // 🔥 对于字体属性，延迟再次渲染，确保字体加载完成
      if (property === 'fontFamily') {
        setTimeout(() => {
          this.canvas.renderAll();
          console.log('🔄 延迟渲染完成（多选）');
        }, 100);
      }
      return;
    }

    // 处理单个对象
    this.updateSingleObjectProperty(activeObj, property, value);
    activeObj.setCoords();
    this.canvas.renderAll();
    this.canvas.fire('object:modified', { target: activeObj });

    // 🔥 对于字体属性，延迟再次渲染，确保字体加载完成
    if (property === 'fontFamily') {
      setTimeout(() => {
        activeObj.setCoords();
        this.canvas.renderAll();
        console.log('🔄 延迟渲染完成（单选）');
      }, 100);
    }
  }

  // 更新图形填充颜色
  updateShapeFillColor(color: string) {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    // 判断是形状还是线条
    const isShape = ['rect', 'circle', 'triangle', 'path'].includes(activeObject.type || '');
    const isLine = activeObject.type === 'line';

    if (isShape && activeObject.fill) {
      // 形状填充色
      this.saveLastUsedColor('shapeFill', color);
    } else if (isLine || (activeObject.type === 'path' && !activeObject.fill)) {
      // 线条颜色
      this.saveLastUsedColor('lineStroke', color);
    }

    this.updateProperty('fill', color);
  }

  // 更新图形描边颜色
  updateShapeStrokeColor(color: string) {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    // 判断是形状还是线条
    const isShape = ['rect', 'circle', 'triangle', 'path'].includes(activeObject.type || '');
    const isLine = activeObject.type === 'line';
    const isArrow = (activeObject as any).shapeType === 'arrow';

    if (isShape) {
      // 形状描边色
      this.saveLastUsedColor('shapeStroke', color);
    } else if (isLine || activeObject.type === 'path') {
      // 线条颜色
      this.saveLastUsedColor('lineStroke', color);
    }

    // 箭头需要同时更新 fill 和 stroke（因为箭头是用 fill 渲染的）
    if (isArrow) {
      activeObject.set('fill', color);
      activeObject.set('stroke', color);
      this.canvas.renderAll();
    } else {
      this.updateProperty('stroke', color);
    }
  }

  // 更新图形描边粗细
  updateShapeStrokeWidth(width: number) {
    this.updateProperty('strokeWidth', width);
  }

  // 更新对象透明度
  updateObjectOpacity(opacity: number) {
    this.updateProperty('opacity', opacity);
  }

  // 更新矩形圆角
  updateRectCornerRadius(radius: number) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'rect') return;

    (activeObj as fabric.Rect).set({
      rx: radius,
      ry: radius,
    });

    activeObj.setCoords();
    this.canvas.renderAll();
    this.canvas.fire('object:modified', { target: activeObj });
  }

  // 更新单个对象的属性
  private updateSingleObjectProperty(obj: any, property: string, value: any) {
    let targetObj = obj;

    // 如果是 Group，需要更新内部的文本对象
    if (obj.type === 'group') {
      const textObj = (obj as any)._objects?.find((o: any) => o.type === 'i-text' || o.type === 'textbox');
      if (textObj) {
        targetObj = textObj;
      }
    }

    const isTextObject = targetObj.type === 'i-text' || targetObj.type === 'textbox' || targetObj.type === 'text';

    // 🔥 对于文本样式属性（颜色、字体等），需要特殊处理以支持多行文本
    if (isTextObject && (property === 'fill' || property === 'fontFamily' || property === 'fontSize' || property === 'fontWeight' || property === 'fontStyle')) {
      console.log(`🔤 开始应用文本样式: ${property} = ${value}`);
      console.log(`📝 应用前 ${property}:`, targetObj.get(property));

      // 1. 设置整体属性
      targetObj.set(property, value);

      console.log(`📝 应用后 ${property}:`, targetObj.get(property));

      // 2. 如果是 i-text 或 textbox，需要清除字符级样式
      if (targetObj.type === 'i-text' || targetObj.type === 'textbox') {
        const textLength = (targetObj as any).text?.length || 0;
        console.log(`📝 文本长度: ${textLength}, 当前 styles:`, targetObj.styles);

        if (textLength > 0) {
          // 🔥 关键修复：完全清除 styles 对象，而不是用 setSelectionStyles 覆盖
          // 这样可以确保所有文本都使用对象级别的属性
          if (property === 'fontFamily') {
            // 对于字体，需要清除所有行的 fontFamily 样式
            if (targetObj.styles) {
              Object.keys(targetObj.styles).forEach((lineIndex) => {
                const lineStyles = targetObj.styles[lineIndex];
                if (lineStyles) {
                  Object.keys(lineStyles).forEach((charIndex) => {
                    if (lineStyles[charIndex]) {
                      delete lineStyles[charIndex].fontFamily;
                      delete lineStyles[charIndex].fontWeight;
                      delete lineStyles[charIndex].fontStyle;
                    }
                  });
                }
              });
            }
            console.log(`✅ 已清除字符级 fontFamily 样式`);
          } else if (property === 'fill') {
            // 对于颜色，清除所有行的 fill 样式
            if (targetObj.styles) {
              Object.keys(targetObj.styles).forEach((lineIndex) => {
                const lineStyles = targetObj.styles[lineIndex];
                if (lineStyles) {
                  Object.keys(lineStyles).forEach((charIndex) => {
                    if (lineStyles[charIndex]) {
                      delete lineStyles[charIndex].fill;
                    }
                  });
                }
              });
            }
            console.log(`✅ 已清除字符级 fill 样式`);
          } else if (property === 'fontSize') {
            // 对于字号，清除所有行的 fontSize 样式
            if (targetObj.styles) {
              Object.keys(targetObj.styles).forEach((lineIndex) => {
                const lineStyles = targetObj.styles[lineIndex];
                if (lineStyles) {
                  Object.keys(lineStyles).forEach((charIndex) => {
                    if (lineStyles[charIndex]) {
                      delete lineStyles[charIndex].fontSize;
                    }
                  });
                }
              });
            }
            console.log(`✅ 已清除字符级 fontSize 样式`);
          }
        }
      }

      // 3. 🔥 强制重新计算文本尺寸（字体变化时很重要）
      if (property === 'fontFamily' || property === 'fontSize') {
        // 🔥 关键修复：设置 dirty = true 强制 Fabric.js 清除缓存
        (targetObj as any).dirty = true;
        (targetObj as any)._clearCache();

        targetObj.initDimensions();
        targetObj.setCoords();
        console.log(`✅ 已重新计算文本尺寸，dirty = true`);
      }

      console.log(`✅ 文本样式应用完成: ${property} = ${value}`);
    } else {
      targetObj.set(property, value);
    }
  }

  // 更新文本对齐方式
  updateTextAlign(align: 'left' | 'center' | 'right') {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;

    console.log('🔄 更新文本对齐:', align, '对象类型:', activeObj.type);

    // 处理多选
    if (activeObj.type === 'activeSelection') {
      const selection = activeObj as fabric.ActiveSelection;
      const objects = selection.getObjects();

      objects.forEach((obj: any) => {
        this.updateSingleObjectTextAlign(obj, align);
      });

      this.canvas.renderAll();
      this.canvas.fire('object:modified', { target: activeObj });
      return;
    }

    // 处理单个对象
    this.updateSingleObjectTextAlign(activeObj, align);
    this.canvas.renderAll();
    this.canvas.fire('object:modified', { target: activeObj });
  }

  // 🆕 设置文本描边
  setTextStroke(enabled: boolean, color: string = '#000000', width: number = 3) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;

    console.log('🎨 设置文本描边:', { enabled, color, width, type: activeObj.type });

    // 处理多选
    if (activeObj.type === 'activeSelection') {
      const selection = activeObj as fabric.ActiveSelection;
      const objects = selection.getObjects();

      objects.forEach((obj: any) => {
        this.updateSingleObjectStroke(obj, enabled, color, width);
      });

      this.canvas.renderAll();
      this.canvas.fire('object:modified', { target: activeObj });
      return;
    }

    // 处理单个对象
    this.updateSingleObjectStroke(activeObj, enabled, color, width);
    this.canvas.renderAll();
    this.canvas.fire('object:modified', { target: activeObj });
  }

  // 🆕 更新单个对象的描边
  private updateSingleObjectStroke(obj: any, enabled: boolean, color: string, width: number) {
    // 只处理文本对象
    if (obj.type !== 'i-text' && obj.type !== 'textbox' && obj.type !== 'text') {
      return;
    }

    if (enabled) {
      obj.set({
        stroke: color,
        strokeWidth: width,
        strokeLineJoin: 'round',  // 圆角连接
        strokeLineCap: 'round',   // 圆角端点
        paintFirst: 'stroke',     // 先绘制描边，再绘制填充（描边不会覆盖文字）
      });
    } else {
      obj.set({
        stroke: '',
        strokeWidth: 0,
      });
    }
  }

  // 更新单个对象的文本对齐
  private updateSingleObjectTextAlign(obj: any, align: 'left' | 'center' | 'right') {
    // 如果是Group,找到内部的文本对象并更新
    if (obj.type === 'group') {
      const textObj = obj._objects?.find((o: any) => o.type === 'i-text' || o.type === 'textbox');
      if (textObj) {
        textObj.set('textAlign', align);
        obj.addWithUpdate(); // 更新Group
        console.log('✅ Group文本对齐已更新:', align);
      }
    } else if (obj.type === 'i-text' || obj.type === 'textbox') {
      // 普通文本对象直接设置
      obj.set('textAlign', align);
      console.log('✅ 文本对齐已更新:', align);
    }
  }

  // 删除选中对象
  deleteActive() {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;

    // 处理多选
    if (activeObj.type === 'activeSelection') {
      const selection = activeObj as fabric.ActiveSelection;
      const objects = selection.getObjects();

      // 批量删除
      objects.forEach((obj: any) => {
        this.canvas.remove(obj);
      });

      // 取消选择
      this.canvas.discardActiveObject();
    } else {
      // 删除单个对象
      this.canvas.remove(activeObj);
    }

    this.canvas.renderAll();
  }

  // 添加/更新背景
  updateBackground(style: 'none' | 'solid', color?: string, opacity?: number) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;

    // 处理多选
    if (activeObj.type === 'activeSelection') {
      const selection = activeObj as fabric.ActiveSelection;
      const objects = selection.getObjects();

      // 取消选择
      this.canvas.discardActiveObject();

      // 批量更新
      objects.forEach((obj: any) => {
        this.updateSingleObjectBackground(obj, style, color, opacity);
      });

      this.canvas.renderAll();
      return;
    }

    // 处理单个对象
    this.updateSingleObjectBackground(activeObj, style, color, opacity);
  }

  // 更新单个对象的背景
  private updateSingleObjectBackground(
    obj: any,
    style: 'none' | 'solid',
    color?: string,
    opacity?: number
  ) {
    const currentConfig = this.extractTextConfig(obj);
    if (!currentConfig) return;

    // 更新背景配置
    currentConfig.backgroundStyle = style;
    currentConfig.backgroundColor = color || currentConfig.backgroundColor || '#FFE066';
    // 更新透明度
    if (opacity !== undefined) {
      currentConfig.backgroundOpacity = opacity;
    } else if (currentConfig.backgroundOpacity === undefined) {
      // 如果之前没有背景，设置默认透明度为1.0(不透明)
      currentConfig.backgroundOpacity = 1.0;
    }

    // 删除旧对象
    this.canvas.remove(obj);

    // 重新创建
    this.createDecoratedText(currentConfig);
  }

  // 添加/更新下划线
  updateUnderline(
    style: 'none' | 'solid' | 'wavy' | 'dotted',
    width?: number,
    color?: string
  ) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;

    // 处理多选
    if (activeObj.type === 'activeSelection') {
      const selection = activeObj as fabric.ActiveSelection;
      const objects = selection.getObjects();

      // 取消选择
      this.canvas.discardActiveObject();

      // 批量更新
      objects.forEach((obj: any) => {
        this.updateSingleObjectUnderline(obj, style, width, color);
      });

      this.canvas.renderAll();
      return;
    }

    // 处理单个对象
    this.updateSingleObjectUnderline(activeObj, style, width, color);
  }

  // 更新单个对象的下划线
  private updateSingleObjectUnderline(
    obj: any,
    style: 'none' | 'solid' | 'wavy' | 'dotted',
    width?: number,
    color?: string
  ) {
    const currentConfig = this.extractTextConfig(obj);
    if (!currentConfig) return;

    // 更新下划线配置
    currentConfig.underlineStyle = style;
    currentConfig.underlineWidth = width || currentConfig.underlineWidth || 2;
    currentConfig.underlineColor = color || currentConfig.underlineColor || '#FF2442';

    // 删除旧对象
    this.canvas.remove(obj);

    // 重新创建
    this.createDecoratedText(currentConfig);
  }

  // 添加/更新边框
  updateBorder(
    style: 'none' | 'solid' | 'dashed',
    width?: number,
    color?: string
  ) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj) return;

    // 处理多选
    if (activeObj.type === 'activeSelection') {
      const selection = activeObj as fabric.ActiveSelection;
      const objects = selection.getObjects();

      // 取消选择
      this.canvas.discardActiveObject();

      // 批量更新
      objects.forEach((obj: any) => {
        this.updateSingleObjectBorder(obj, style, width, color);
      });

      this.canvas.renderAll();
      return;
    }

    // 处理单个对象
    this.updateSingleObjectBorder(activeObj, style, width, color);
  }

  // 更新单个对象的边框
  private updateSingleObjectBorder(
    obj: any,
    style: 'none' | 'solid' | 'dashed',
    width?: number,
    color?: string
  ) {
    const currentConfig = this.extractTextConfig(obj);
    if (!currentConfig) return;

    // 更新边框配置
    currentConfig.borderStyle = style;
    currentConfig.borderWidth = width || currentConfig.borderWidth || 2;
    currentConfig.borderColor = color || currentConfig.borderColor || '#FF2442';

    // 删除旧对象
    this.canvas.remove(obj);

    // 重新创建
    this.createDecoratedText(currentConfig);
  }

  // 提取文本配置
  private extractTextConfig(obj: any): any {
    let textObj: any;
    let config: any = {};

    if (obj.type === 'group') {
      const items = (obj as any)._objects || [];
      textObj = items.find((o: any) => o.type === 'i-text' || o.type === 'textbox');
      if (!textObj) return null;

      config = {
        text: textObj.text,
        fontSize: textObj.fontSize,
        fontFamily: textObj.fontFamily,
        fill: textObj.fill,
        lineHeight: textObj.lineHeight,
        charSpacing: textObj.charSpacing,
        textAlign: textObj.textAlign || 'left', // ✅ 保存文本对齐
        left: obj.left,
        top: obj.top,
        angle: obj.angle,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        textType: textObj.type, // ✅ 保存原始文本类型
      };

      // 提取装饰配置
      items.forEach((item: any) => {
        if (item.type === 'rect') {
          // 矩形可能是背景或边框
          if (item.fill && item.fill !== 'transparent') {
            // 有填充色 = 背景
            config.backgroundStyle = 'solid';
            config.backgroundColor = item.fill;
            config.backgroundOpacity = item.opacity ?? 1.0;  // ✅ 保存透明度，默认 1.0(不透明)
          } else if (item.fill === 'transparent' || item.stroke) {
            // 透明填充或有描边 = 边框
            config.borderStyle = item.strokeDashArray ? 'dashed' : 'solid';
            config.borderWidth = item.strokeWidth;
            config.borderColor = item.stroke;
          }
        } else if (item.type === 'line' || item.type === 'polyline') {
          if (item.type === 'polyline') {
            config.underlineStyle = 'wavy';
          } else if (item.strokeDashArray) {
            config.underlineStyle = 'dotted';
          } else {
            config.underlineStyle = 'solid';
          }
          config.underlineWidth = item.strokeWidth;
          config.underlineColor = item.stroke;
        }
      });
    } else if (obj.type === 'i-text' || obj.type === 'text' || obj.type === 'textbox') {
      config = {
        text: obj.text,
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
        fill: obj.fill,
        lineHeight: obj.lineHeight,
        charSpacing: obj.charSpacing,
        textAlign: obj.textAlign || 'left', // ✅ 保存文本对齐
        left: obj.left,
        top: obj.top,
        angle: obj.angle,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        textType: obj.type, // ✅ 保存原始文本类型
      };
    } else {
      return null;
    }

    return config;
  }

  // 创建带装饰的文本
  private createDecoratedText(config: any) {
    // 根据原始类型决定使用 IText 还是 Textbox
    // 如果没有 textType，默认使用 textbox（向后兼容）
    const useTextbox = config.textType === 'textbox' || !config.textType;

    let text: fabric.IText | fabric.Textbox;

    if (useTextbox) {
      // 多行文本：使用 Textbox，支持固定宽度和自动换行
      const maxTextWidth = this.width * 0.8; // 画布宽度的80%
      text = new fabric.Textbox(config.text || '文字', {
        width: maxTextWidth,
        fontSize: config.fontSize || 60,
        fontFamily: config.fontFamily || 'LXGW WenKai',
        fill: config.fill || '#333333',
        lineHeight: config.lineHeight || 1.2,
        charSpacing: config.charSpacing || 0,
        textAlign: config.textAlign || 'left', // ✅ 使用保存的对齐方式
        editable: true,
        selectable: true,
        originX: 'center',
        originY: 'center',
        splitByGrapheme: true, // 支持中文字符换行
      } as any);
    } else {
      // 单行文本：使用 IText，不自动换行
      text = new fabric.IText(config.text || '文字', {
        fontSize: config.fontSize || 60,
        fontFamily: config.fontFamily || 'LXGW WenKai',
        fill: config.fill || '#333333',
        lineHeight: config.lineHeight || 1.2,
        charSpacing: config.charSpacing || 0,
        textAlign: config.textAlign || 'center', // ✅ 使用保存的对齐方式
        editable: true,
        selectable: true,
        originX: 'center',
        originY: 'center',
      } as any);
    }

    // 强制计算文本尺寸
    text.setCoords();

    const objects: fabric.Object[] = [];
    const paddingX = 20;
    const paddingY = 12;
    const textWidth = text.width || 0;
    const textHeight = text.height || 0;

    // 背景
    if (config.backgroundStyle && config.backgroundStyle !== 'none') {
      const background = new fabric.Rect({
        width: textWidth + paddingX * 2,
        height: textHeight + paddingY * 2,
        fill: config.backgroundColor || '#FFE066',
        opacity: config.backgroundOpacity ?? 1.0,  // ✅ 使用保存的透明度，默认1.0(不透明)
        rx: 6,
        ry: 6,
        originX: 'center',
        originY: 'center',
      });
      objects.push(background);
    }

    // 边框
    if (config.borderStyle && config.borderStyle !== 'none') {
      const border = new fabric.Rect({
        width: textWidth + paddingX * 2,
        height: textHeight + paddingY * 2,
        stroke: config.borderColor || '#FF2442',
        strokeWidth: config.borderWidth || 2,
        strokeDashArray: config.borderStyle === 'dashed' ? [(config.borderWidth || 2) * 3, (config.borderWidth || 2) * 2] : undefined,
        fill: 'transparent',
        rx: 6,
        ry: 6,
        originX: 'center',
        originY: 'center',
      });
      objects.push(border);
    }

    // 下划线
    if (config.underlineStyle && config.underlineStyle !== 'none') {
      const lineY = textHeight / 2 + 8;  // 文本底部 + 8px
      const lineWidth = config.underlineWidth || 2;
      const lineColor = config.underlineColor || '#FF2442';

      let underline: fabric.Object;
      if (config.underlineStyle === 'solid') {
        underline = new fabric.Line(
          [-textWidth / 2, lineY, textWidth / 2, lineY],
          {
            stroke: lineColor,
            strokeWidth: lineWidth,
            originX: 'center',
            originY: 'center',
          }
        );
      } else if (config.underlineStyle === 'dotted') {
        underline = new fabric.Line(
          [-textWidth / 2, lineY, textWidth / 2, lineY],
          {
            stroke: lineColor,
            strokeWidth: lineWidth,
            strokeDashArray: [lineWidth * 2, lineWidth * 2],
            originX: 'center',
            originY: 'center',
          }
        );
      } else {
        // wavy
        const amplitude = lineWidth * 2;
        const frequency = 10;
        const points: any[] = [];

        for (let x = 0; x <= textWidth; x += 2) {
          const y = lineY + Math.sin((x / frequency) * Math.PI) * amplitude;
          points.push({ x: x - textWidth / 2, y });
        }

        underline = new fabric.Polyline(points, {
          stroke: lineColor,
          strokeWidth: lineWidth,
          fill: '',
          originX: 'center',
          originY: 'center',
        });
      }
      objects.push(underline);
    }

    // 添加文本
    objects.push(text);

    // 如果有装饰，创建 Group；否则只添加文本
    if (objects.length > 1) {
      // 确保所有对象的位置都是 (0, 0)，这样它们在 Group 内部就是居中的
      // 但是下划线需要保持其 Y 坐标偏移
      objects.forEach(obj => {
        if (obj.type === 'line' || obj.type === 'polyline') {
          // 下划线：只设置 left: 0，保持 top 为其计算的 Y 坐标
          obj.set({ left: 0 });
        } else {
          // 其他对象：设置 left: 0, top: 0
          obj.set({ left: 0, top: 0 });
        }
      });

      const group = new fabric.Group(objects, {
        left: config.left || this.width / 2,
        top: config.top || this.height / 2,
        angle: config.angle || 0,
        scaleX: config.scaleX || 1,
        scaleY: config.scaleY || 1,
        originX: 'center',
        originY: 'center',
      });

      // 双击编辑
      group.on('mousedblclick', () => {
        // 获取 Group 的实际中心点坐标（考虑所有变换）
        const centerPoint = group.getCenterPoint();
        const savedLeft = centerPoint.x;
        const savedTop = centerPoint.y;
        const savedAngle = group.angle || 0;
        const savedScaleX = group.scaleX || 1;
        const savedScaleY = group.scaleY || 1;

        // 保存文本属性
        const textContent = text.text || '';
        const originalFontSize = text.fontSize || 60;
        const fontFamily = text.fontFamily || 'Noto Sans SC';
        const fill = text.fill || '#333333';
        const lineHeight = text.lineHeight || 1.2;
        const charSpacing = text.charSpacing || 0;
        const scaledFontSize = originalFontSize * savedScaleX;
        const textType = text.type; // 保存原始文本类型

        // 移除 Group
        this.canvas.remove(group);

        // 根据原始类型创建编辑文本对象
        let editText: fabric.IText | fabric.Textbox;

        if (textType === 'textbox') {
          // 多行文本
          const maxTextWidth = this.width * 0.8;
          editText = new fabric.Textbox(textContent, {
            width: maxTextWidth,
            left: savedLeft,
            top: savedTop,
            angle: savedAngle,
            fontSize: scaledFontSize,
            fontFamily: fontFamily,
            fill: fill,
            lineHeight: lineHeight,
            charSpacing: charSpacing,
            scaleX: 1,
            scaleY: 1,
            originX: 'center',
            originY: 'center',
            editable: true,
            selectable: true,
            splitByGrapheme: true,
          } as any);
        } else {
          // 单行文本
          editText = new fabric.IText(textContent, {
            left: savedLeft,
            top: savedTop,
            angle: savedAngle,
            fontSize: scaledFontSize,
            fontFamily: fontFamily,
            fill: fill,
            lineHeight: lineHeight,
            charSpacing: charSpacing,
            scaleX: 1,
            scaleY: 1,
            originX: 'center',
            originY: 'center',
            editable: true,
            selectable: true,
          } as any);
        }

        this.canvas.add(editText);
        this.canvas.setActiveObject(editText);

        // 保存当前滚动位置
        const savedScrollX = window.scrollX;
        const savedScrollY = window.scrollY;

        // 保存body和html的overflow样式
        const bodyOverflow = document.body.style.overflow;
        const htmlOverflow = document.documentElement.style.overflow;

        // 临时禁用滚动
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        // 强制阻止滚动的函数
        const preventScroll = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          window.scrollTo(savedScrollX, savedScrollY);
          return false;
        };

        // 在多个事件上阻止滚动
        window.addEventListener('scroll', preventScroll, { passive: false, capture: true });
        document.addEventListener('scroll', preventScroll, { passive: false, capture: true });
        document.body.addEventListener('scroll', preventScroll, { passive: false, capture: true });

        // 延迟进入编辑模式，并立即恢复滚动
        setTimeout(() => {
          editText.enterEditing();
          editText.selectAll();

          // 强制恢复滚动位置(多次尝试)
          const restoreScroll = () => {
            window.scrollTo(savedScrollX, savedScrollY);
            document.documentElement.scrollTop = savedScrollY;
            document.documentElement.scrollLeft = savedScrollX;
            document.body.scrollTop = savedScrollY;
            document.body.scrollLeft = savedScrollX;
          };

          restoreScroll();
          setTimeout(restoreScroll, 10);
          setTimeout(restoreScroll, 50);

          // 延迟移除滚动监听和恢复overflow，确保编辑模式完全稳定
          setTimeout(() => {
            window.removeEventListener('scroll', preventScroll, { capture: true } as any);
            document.removeEventListener('scroll', preventScroll, { capture: true } as any);
            document.body.removeEventListener('scroll', preventScroll, { capture: true } as any);

            // 恢复overflow样式
            document.body.style.overflow = bodyOverflow;
            document.documentElement.style.overflow = htmlOverflow;

            // 最后一次恢复滚动位置
            restoreScroll();
          }, 200);
        }, 0);

        // 监听ESC键退出编辑
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            editText.exitEditing();
          }
        };
        window.addEventListener('keydown', handleEscape, { capture: true });

        // 监听画布容器点击(灰色区域)
        const handleContainerClick = (e: Event) => {
          console.log('🎯 Canvas container clicked, exiting editing');
          editText.exitEditing();
        };

        // 监听canvas元素点击
        const handleCanvasClick = () => {
          console.log('🖱️ Canvas clicked, checking activeObject');
          // 延迟检查,等待Fabric.js处理完点击事件
          setTimeout(() => {
            const activeObj = this.canvas.getActiveObject();
            console.log('🔍 ActiveObject:', activeObj === editText ? 'still editText' : 'changed');
            // 如果activeObject不再是editText,说明点击了其他地方,退出编辑
            if (activeObj !== editText) {
              console.log('✅ ActiveObject changed, exiting editing');
              editText.exitEditing();
            }
          }, 10);
        };

        // 立即添加监听器
        console.log('📌 Adding click listeners for editing mode');
        // 监听画布容器点击(灰色区域)
        document.addEventListener('canvas-container-click', handleContainerClick);
        console.log('📌 Container click listener added');
        // 监听canvas元素点击 - 需要延迟避免立即触发
        const canvasElement = this.canvas.getElement();
        setTimeout(() => {
          canvasElement.addEventListener('click', handleCanvasClick);
          console.log('📌 Canvas click listener added');
        }, 200);

        editText.on('editing:exited', () => {
          console.log('🚪 Exited editing, removing listeners');
          // 移除所有监听器
          window.removeEventListener('keydown', handleEscape, { capture: true } as any);
          document.removeEventListener('canvas-container-click', handleContainerClick);
          const canvasElement = this.canvas.getElement();
          canvasElement.removeEventListener('click', handleCanvasClick);
          window.removeEventListener('scroll', preventScroll);
          document.removeEventListener('scroll', preventScroll);

          const newConfig = {
            ...config,
            text: editText.text || '',
            fontSize: originalFontSize,
            fontFamily: fontFamily,
            fill: fill,
            lineHeight: lineHeight,
            charSpacing: charSpacing,
            left: editText.left,
            top: editText.top,
            angle: editText.angle,
            scaleX: savedScaleX,
            scaleY: savedScaleY,
            textType: textType, // 保持原始类型
          };
          this.canvas.remove(editText);
          this.createDecoratedText(newConfig);
        });
      });

      this.canvas.add(group);
      this.canvas.renderAll();
      this.canvas.setActiveObject(group);
    } else {
      text.set({
        left: config.left || this.width / 2,
        top: config.top || this.height / 2,
        angle: config.angle || 0,
        scaleX: config.scaleX || 1,
        scaleY: config.scaleY || 1,
      });
      this.canvas.add(text);
      this.canvas.renderAll();
      this.canvas.setActiveObject(text);
    }
  }

  // 导出为 JSON
  toJSON() {
    try {
      // 🔥 移除 isLoadingTemplate 检查，允许在加载过程中导出数据
      // 这样可以避免在画布切换、尺寸改变时丢失数据
      // if (this.isLoadingTemplate) {
      //   console.warn('⚠️ 正在加载模板，跳过 toJSON');
      //   return JSON.stringify({
      //     version: '5.3.0',
      //     objects: [],
      //   });
      // }

      // 确保 canvas 已初始化
      if (!this.canvas) {
        throw new Error('Canvas 未初始化');
      }

      // 确保 canvas 有 _objects 属性
      if (!this.canvas._objects) {
        console.warn('⚠️ Canvas._objects 未初始化，返回空画布 JSON');
        return JSON.stringify({
          version: '5.3.0',
          objects: [],
        });
      }

      // 检查每个对象是否有效
      const objects = this.canvas.getObjects();

      // 检查每个对象的关键属性
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i] as any;
        if (!obj) {
          console.warn(`⚠️ 对象 ${i} 为 null/undefined，跳过序列化`);
          return JSON.stringify({
            version: '5.3.0',
            objects: [],
          });
        }

        // 检查对象是否有必要的属性
        if (obj.type === 'path' && !obj.path) {
          console.warn(`⚠️ Path 对象 ${i} 缺少 path 属性，跳过序列化`);
          return JSON.stringify({
            version: '5.3.0',
            objects: [],
          });
        }
      }

      // 🔇 降低日志级别，避免控制台刷屏
      // console.log('📊 Canvas 对象数量:', objects.length);

      // 尝试序列化 - 使用 try-catch 保护
      let canvasData;
      try {
        canvasData = this.canvas.toJSON();
      } catch (innerError) {
        console.error('❌ canvas.toJSON() 内部错误:', innerError);
        console.error('出错时的对象列表:', objects.map((obj: any, idx) => ({
          index: idx,
          type: obj?.type,
          left: obj?.left,
          top: obj?.top,
          hasPath: obj?.path !== undefined,
          hasFill: obj?.fill !== undefined,
          hasStroke: obj?.stroke !== undefined,
        })));
        // 🔥 不要返回空 JSON，而是抛出错误让外层处理
        throw innerError;
      }

      const jsonString = JSON.stringify(canvasData);

      // 🔇 降低日志级别
      if (process.env.NODE_ENV === 'development') {
        console.debug('📊 toJSON 成功，数据长度:', jsonString.length, 'bytes');
      }

      return jsonString;
    } catch (error) {
      console.error('❌ toJSON 失败:', error);
      console.error('Canvas 状态:', {
        hasCanvas: !!this.canvas,
        hasObjects: !!this.canvas?._objects,
        objectCount: this.canvas?.getObjects?.()?.length || 0,
      });

      // 🔥 尝试使用备用方案：直接序列化画布对象
      try {
        console.warn('⚠️ 尝试备用序列化方案...');
        const objects = this.canvas.getObjects();
        const simpleData = {
          version: '5.3.0',
          objects: objects.map((obj: any) => {
            // 只保存基本属性，避免复杂对象导致序列化失败
            return {
              type: obj.type,
              left: obj.left,
              top: obj.top,
              width: obj.width,
              height: obj.height,
              scaleX: obj.scaleX,
              scaleY: obj.scaleY,
              angle: obj.angle,
              fill: obj.fill,
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth,
            };
          }),
        };
        console.warn('✅ 备用序列化成功，对象数量:', objects.length);
        return JSON.stringify(simpleData);
      } catch (backupError) {
        console.error('❌ 备用序列化也失败:', backupError);
        // 最后的兜底：返回空 JSON
        return JSON.stringify({
          version: '5.3.0',
          objects: [],
        });
      }
    }
  }

  // 从 JSON 加载
  loadFromJSON(json: string, enableHistoryAfterLoad: boolean = true) {
    // 🆕 加载时禁用历史记录，避免触发自动保存
    const wasLoadingTemplate = this.isLoadingTemplate;
    this.isLoadingTemplate = true;

    this.canvas.loadFromJSON(json).then(() => {
      // 加载完成后，重新绑定所有 Group 对象的双击事件
      this.rebindGroupEvents();
      this.canvas.renderAll();

      // 🆕 延迟恢复历史记录状态，确保渲染完成
      setTimeout(() => {
        // 如果 enableHistoryAfterLoad 为 true，则启用历史记录；否则恢复之前的状态
        this.isLoadingTemplate = enableHistoryAfterLoad ? false : wasLoadingTemplate;
        console.log('✅ 画布加载完成, isLoadingTemplate =', this.isLoadingTemplate);
      }, 100);
    }).catch((error) => {
      console.error('❌ 从 JSON 加载画布失败:', error);
      this.isLoadingTemplate = wasLoadingTemplate;
    });
  }

  // 🆕 设置是否正在加载模板
  setLoadingTemplate(loading: boolean) {
    this.isLoadingTemplate = loading;
    console.log('🔄 设置加载模板状态:', loading);
  }

  // 🆕 获取是否正在加载模板
  getLoadingTemplate(): boolean {
    return this.isLoadingTemplate;
  }

  // 重新绑定所有 Group 对象的双击事件
  private rebindGroupEvents() {
    const objects = this.canvas.getObjects();

    objects.forEach((obj: any) => {
      if (obj.type === 'group' && obj._objects) {
        const textObj = obj._objects.find((o: any) => o.type === 'i-text' || o.type === 'textbox');
        if (!textObj) return;

        // 提取配置
        const config = this.extractTextConfig(obj);
        if (!config) return;

        // 绑定双击事件
        obj.on('mousedblclick', () => {
          // 获取 Group 的实际中心点坐标（考虑所有变换）
          const centerPoint = obj.getCenterPoint();
          const savedLeft = centerPoint.x;
          const savedTop = centerPoint.y;
          const savedAngle = obj.angle || 0;
          const savedScaleX = obj.scaleX || 1;
          const savedScaleY = obj.scaleY || 1;

          // 保存文本属性
          const textContent = textObj.text || '';
          const originalFontSize = textObj.fontSize || 60;
          const fontFamily = textObj.fontFamily || 'Noto Sans SC';
          const fill = textObj.fill || '#333333';
          const lineHeight = textObj.lineHeight || 1.2;
          const charSpacing = textObj.charSpacing || 0;
          const scaledFontSize = originalFontSize * savedScaleX;
          const textType = textObj.type; // 保存原始文本类型

          // 移除 Group
          this.canvas.remove(obj);

          // 根据原始类型创建编辑文本对象
          let editText: fabric.IText | fabric.Textbox;

          if (textType === 'textbox') {
            // 多行文本
            const maxTextWidth = this.width * 0.8;
            editText = new fabric.Textbox(textContent, {
              width: maxTextWidth,
              left: savedLeft,
              top: savedTop,
              angle: savedAngle,
              fontSize: scaledFontSize,
              fontFamily: fontFamily,
              fill: fill,
              lineHeight: lineHeight,
              charSpacing: charSpacing,
              scaleX: 1,
              scaleY: 1,
              originX: 'center',
              originY: 'center',
              editable: true,
              selectable: true,
              splitByGrapheme: true,
            } as any);
          } else {
            // 单行文本
            editText = new fabric.IText(textContent, {
              left: savedLeft,
              top: savedTop,
              angle: savedAngle,
              fontSize: scaledFontSize,
              fontFamily: fontFamily,
              fill: fill,
              lineHeight: lineHeight,
              charSpacing: charSpacing,
              scaleX: 1,
              scaleY: 1,
              originX: 'center',
              originY: 'center',
              editable: true,
              selectable: true,
            } as any);
          }

          this.canvas.add(editText);
          this.canvas.setActiveObject(editText);

          // 保存当前滚动位置
          const savedScrollX = window.scrollX;
          const savedScrollY = window.scrollY;

          // 保存body和html的overflow样式
          const bodyOverflow = document.body.style.overflow;
          const htmlOverflow = document.documentElement.style.overflow;

          // 临时禁用滚动
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';

          // 强制阻止滚动的函数
          const preventScroll = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            window.scrollTo(savedScrollX, savedScrollY);
            return false;
          };

          // 在多个事件上阻止滚动
          window.addEventListener('scroll', preventScroll, { passive: false, capture: true });
          document.addEventListener('scroll', preventScroll, { passive: false, capture: true });
          document.body.addEventListener('scroll', preventScroll, { passive: false, capture: true });

          // 延迟进入编辑模式，并立即恢复滚动
          setTimeout(() => {
            editText.enterEditing();
            editText.selectAll();

            // 强制恢复滚动位置(多次尝试)
            const restoreScroll = () => {
              window.scrollTo(savedScrollX, savedScrollY);
              document.documentElement.scrollTop = savedScrollY;
              document.documentElement.scrollLeft = savedScrollX;
              document.body.scrollTop = savedScrollY;
              document.body.scrollLeft = savedScrollX;
            };

            restoreScroll();
            setTimeout(restoreScroll, 10);
            setTimeout(restoreScroll, 50);

            // 延迟移除滚动监听和恢复overflow，确保编辑模式完全稳定
            setTimeout(() => {
              window.removeEventListener('scroll', preventScroll, { capture: true } as any);
              document.removeEventListener('scroll', preventScroll, { capture: true } as any);
              document.body.removeEventListener('scroll', preventScroll, { capture: true } as any);

              // 恢复overflow样式
              document.body.style.overflow = bodyOverflow;
              document.documentElement.style.overflow = htmlOverflow;

              // 最后一次恢复滚动位置
              restoreScroll();
            }, 200);
          }, 0);

          // 监听ESC键退出编辑
          const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              editText.exitEditing();
            }
          };
          window.addEventListener('keydown', handleEscape, { capture: true });

          // 监听画布容器点击(灰色区域)
          const handleContainerClick = (e: Event) => {
            console.log('🎯 Canvas container clicked, exiting editing');
            editText.exitEditing();
          };

          // 监听canvas元素点击
          const handleCanvasClick = () => {
            console.log('🖱️ Canvas clicked, checking activeObject');
            // 延迟检查,等待Fabric.js处理完点击事件
            setTimeout(() => {
              const activeObj = this.canvas.getActiveObject();
              console.log('🔍 ActiveObject:', activeObj === editText ? 'still editText' : 'changed');
              // 如果activeObject不再是editText,说明点击了其他地方,退出编辑
              if (activeObj !== editText) {
                console.log('✅ ActiveObject changed, exiting editing');
                editText.exitEditing();
              }
            }, 10);
          };

          // 立即添加监听器
          console.log('📌 Adding click listeners for editing mode');
          // 监听画布容器点击(灰色区域)
          document.addEventListener('canvas-container-click', handleContainerClick);
          console.log('📌 Container click listener added');
          // 监听canvas元素点击 - 需要延迟避免立即触发
          const canvasElement = this.canvas.getElement();
          setTimeout(() => {
            canvasElement.addEventListener('click', handleCanvasClick);
            console.log('📌 Canvas click listener added');
          }, 200);

          editText.on('editing:exited', () => {
            console.log('🚪 Exited editing, removing listeners');
            // 移除所有监听器
            window.removeEventListener('keydown', handleEscape, { capture: true } as any);
            document.removeEventListener('canvas-container-click', handleContainerClick);
            const canvasElement = this.canvas.getElement();
            canvasElement.removeEventListener('click', handleCanvasClick);
            window.removeEventListener('scroll', preventScroll);
            document.removeEventListener('scroll', preventScroll);

            const newConfig = {
              ...config,
              text: editText.text || '',
              fontSize: originalFontSize,
              fontFamily: fontFamily,
              fill: fill,
              lineHeight: lineHeight,
              charSpacing: charSpacing,
              left: editText.left,
              top: editText.top,
              angle: editText.angle,
              scaleX: savedScaleX,
              scaleY: savedScaleY,
              textType: textType, // 保持原始类型
            };
            this.canvas.remove(editText);

            // 根据配置类型选择创建方法
            if (config.backgroundStyle || config.underlineStyle || config.borderStyle) {
              this.createDecoratedText(newConfig);
            } else if (config.type) {
              this.addHighlightText(newConfig);
            }
          });
        });
      }
    });
  }

  // 导出为 Blob
  async toBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // 使用 toDataURL 然后转换为 Blob（更可靠）
        const dataURL = this.canvas.toDataURL({
          format: 'png',
          quality: 1.0,
          multiplier: 1,
        });

        // 将 DataURL 转换为 Blob
        fetch(dataURL)
          .then(res => res.blob())
          .then(blob => resolve(blob))
          .catch(error => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }

  // 导出选中对象为 Blob
  async exportObjectToBlob(obj?: fabric.Object): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // 如果没有传入对象,使用当前选中的对象
        const targetObj = obj || this.canvas.getActiveObject();
        if (!targetObj) {
          reject(new Error('没有选中的对象'));
          return;
        }

        // 如果是图片对象,直接下载原图
        if (targetObj.type === 'image') {
          const imageObj = targetObj as fabric.Image;
          const imageElement = imageObj.getElement() as HTMLImageElement;

          // 如果图片有src,直接从URL获取
          if (imageElement && imageElement.src) {
            fetch(imageElement.src)
              .then(response => response.blob())
              .then(blob => resolve(blob))
              .catch(error => {
                console.error('❌ 获取图片失败,使用渲染方式:', error);
                // 如果获取失败,降级到渲染方式
                this.renderObjectToBlob(targetObj, false).then(resolve).catch(reject);
              });
            return;
          }
        }

        // 检查是否是 SVG 图标 - SVG 图标应该保留透明背景
        const isSVGIcon = (targetObj as any).isSVGIcon === true;

        // SVG 图标和图片使用透明背景，其他对象（文本、形状等）使用白色背景
        const addBackground = !isSVGIcon;
        this.renderObjectToBlob(targetObj, addBackground).then(resolve).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 渲染对象到Blob的辅助方法
  private renderObjectToBlob(targetObj: fabric.Object, addBackground: boolean): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        const padding = addBackground ? 20 : 0; // 图片不添加内边距

        // 获取对象的边界框
        const boundingRect = targetObj.getBoundingRect();
        tempCanvas.width = boundingRect.width + padding * 2;
        tempCanvas.height = boundingRect.height + padding * 2;

        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas context'));
          return;
        }

        // 只有非图片对象才设置白色背景
        if (addBackground) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }

        // 保存当前状态
        ctx.save();

        // 移动到中心位置
        ctx.translate(
          padding - boundingRect.left,
          padding - boundingRect.top
        );

        // 渲染对象到临时画布
        targetObj.render(ctx);

        ctx.restore();

        // 转换为Blob
        tempCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          1.0
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // 下载选中对象为图片
  async downloadObject(obj?: fabric.Object, filename?: string) {
    try {
      // 如果没有传入对象，使用当前选中的对象
      const targetObj = obj || this.canvas.getActiveObject();
      if (!targetObj) {
        throw new Error('没有选中的对象');
      }

      // 检查是否是多选（ActiveSelection）
      if (targetObj.type === 'activeSelection') {
        console.log('📦 检测到多选对象，导出为合并图片');
        // 多选对象：导出整个选区为一张图片
        const blob = await this.exportSelectionToBlob(targetObj as fabric.ActiveSelection);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename || `selection-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // 单个对象：使用原有逻辑
        const blob = await this.exportObjectToBlob(targetObj);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename || `object-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('❌ 下载对象失败:', error);
      throw error;
    }
  }

  // 导出多选对象为 Blob
  private async exportSelectionToBlob(selection: fabric.ActiveSelection): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // 获取选区的边界框
        const boundingRect = selection.getBoundingRect();
        const padding = 20; // 添加一些内边距

        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = boundingRect.width + padding * 2;
        tempCanvas.height = boundingRect.height + padding * 2;

        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建canvas context'));
          return;
        }

        // 设置白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 保存当前状态
        ctx.save();

        // 移动到中心位置
        ctx.translate(
          padding - boundingRect.left,
          padding - boundingRect.top
        );

        // 渲染选区中的所有对象
        const objects = (selection as any)._objects || [];
        objects.forEach((obj: fabric.Object) => {
          obj.render(ctx);
        });

        ctx.restore();

        // 转换为Blob
        tempCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          1.0
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // 生成缩略图
  toThumbnail() {
    try {
      return this.canvas.toDataURL({
        format: 'jpeg', // 使用 JPEG 格式，比 PNG 小很多
        quality: 0.2,   // 降低质量到 0.2
        multiplier: 0.15, // 降低尺寸到 0.15
      });
    } catch (error) {
      // 如果画布被污染（包含跨域图片），返回空字符串
      console.warn('⚠️ 无法生成缩略图（画布包含跨域图片）:', error);
      return '';
    }
  }

  // 清空画布
  clear() {
    this.canvas.clear();
    this.canvas.backgroundColor = '#ffffff';
    this.canvas.renderAll();
  }

  // 调整画布尺寸，保留当前对象和事件绑定
  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.setDimensions({ width, height });
    this.canvas.calcOffset();
    this.canvas.renderAll();
  }

  // ✅ 已移除 migrateOldGroups 方法
  // 原因：rebindGroupEvents 已经处理了 Group 的双击编辑功能
  // 不再需要将 Group 转换为 IText

  // 调度历史记录保存（防抖）
  private scheduleHistorySave() {
    if (this.saveHistoryTimer) {
      clearTimeout(this.saveHistoryTimer);
    }
    this.saveHistoryTimer = setTimeout(() => {
      this.saveHistory();
    }, 300); // 300ms 防抖
  }

  // 保存历史记录
  private saveHistory() {
    if (this.isUndoRedoing) return;
    if (this.isLoadingTemplate) return; // 🆕 加载模板时不保存历史

    // 确保 canvas 已完全初始化
    if (!this.canvas || !this.canvas._objects) {
      console.warn('⚠️ Canvas 未完全初始化，跳过历史记录保存');
      return;
    }

    try {
      // 再次检查 _objects，因为可能在 try 块内部才出错
      const objects = this.canvas.getObjects();
      if (!objects || objects.length === 0) {
        console.warn('⚠️ Canvas 没有对象，跳过历史记录保存');
        return;
      }

      // 使用更安全的方式调用 toJSON
      let canvasData;
      try {
        // 先检查每个对象是否有效
        const allObjects = this.canvas.getObjects();
        // 🔇 降低日志级别，避免控制台刷屏
        // console.log('🔍 准备序列化对象:', allObjects.map((obj: any) => ({
        //   type: obj.type,
        //   hasStroke: obj.stroke !== undefined,
        //   hasFill: obj.fill !== undefined,
        //   hasPath: obj.path !== undefined,
        // })));

        canvasData = this.canvas.toJSON();
      } catch (innerError) {
        console.error('❌ canvas.toJSON() 内部错误:', innerError);
        console.error('Canvas 对象详情:', this.canvas.getObjects().map((obj: any) => ({
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
        })));
        return; // 直接返回，不保存历史
      }

      const json = JSON.stringify(canvasData);

      // 检查是否与上一个状态相同，避免重复保存
      if (this.history.length > 0 && this.history[this.historyIndex] === json) {
        return;
      }

      // 如果当前不在历史记录的末尾，删除后面的记录
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }

      // 添加新记录
      this.history.push(json);
      this.historyIndex++;

      // 限制历史记录数量（最多 20 条，减少内存占用）
      if (this.history.length > 20) {
        this.history.shift();
        this.historyIndex--;
      }
    } catch (error) {
      console.error('❌ 保存历史记录失败:', error);
      // 静默失败，不影响用户操作
    }
  }

  // 撤销
  undo() {
    if (this.historyIndex > 0) {
      this.isUndoRedoing = true;
      this.historyIndex--;
      // 撤销时不启用历史记录，避免创建新的历史记录
      this.loadFromJSON(this.history[this.historyIndex], false);
      this.isUndoRedoing = false;
    }
  }

  // 重做
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.isUndoRedoing = true;
      this.historyIndex++;
      // 重做时不启用历史记录，避免创建新的历史记录
      this.loadFromJSON(this.history[this.historyIndex], false);
      this.isUndoRedoing = false;
    }
  }

  // 检查是否可以撤销
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  // 检查是否可以重做
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * 将选中的对象转换为图片URL数组
   * @returns 图片URL数组
   */
  async getSelectedObjectsAsImages(): Promise<string[]> {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length === 0) {
      throw new Error('没有选中的对象');
    }

    const imageUrls: string[] = [];

    // 🆕 检查是否所有对象都是图片
    const allImages = activeObjects.every(obj => obj.type === 'image');

    // 🆕 检查是否所有对象都是非图片（文本、形状、画笔路径等）
    const allNonImages = activeObjects.every(obj => obj.type !== 'image');

    // 🆕 如果选中了多个非图片对象，合并成一张图
    if (activeObjects.length > 1 && allNonImages) {
      console.log('🎨 检测到多个非图片对象，合并渲染为一张图');

      try {
        // 获取所有对象的整体边界框
        const activeSelection = this.canvas.getActiveObject();
        if (!activeSelection) {
          throw new Error('无法获取选中对象');
        }

        const boundingRect = activeSelection.getBoundingRect();
        const padding = 20;

        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = boundingRect.width + padding * 2;
        tempCanvas.height = boundingRect.height + padding * 2;

        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          throw new Error('无法创建canvas context');
        }

        // 设置白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 保存当前状态
        ctx.save();

        // 移动到合适的位置，使所有对象都在画布内
        ctx.translate(padding - boundingRect.left, padding - boundingRect.top);

        // 渲染所有对象
        activeObjects.forEach((obj) => {
          obj.render(ctx);
        });

        ctx.restore();

        // 转换为DataURL
        const dataUrl = tempCanvas.toDataURL('image/png');

        // 上传到七牛云
        const uploadedUrl = await this.qiniuUploader.uploadBase64(
          dataUrl.split(',')[1],
          `image-to-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`
        );

        console.log('✅ 合并后的图片已上传到七牛云:', uploadedUrl);
        imageUrls.push(uploadedUrl);

        return imageUrls;
      } catch (error) {
        console.error('❌ 合并渲染对象失败:', error);
        throw error;
      }
    }

    // 🆕 原有逻辑：单个对象或混合对象（图片+非图片）
    for (const obj of activeObjects) {
      try {
        // 如果是图片对象,直接使用它的URL
        if (obj.type === 'image') {
          const imageObj = obj as fabric.Image;
          const imageSrc = (imageObj as any)._originalElement?.src || (imageObj as any).getSrc?.();

          if (imageSrc) {
            console.log('✅ 使用图片对象的原始URL:', imageSrc);
            imageUrls.push(imageSrc);
            continue; // 跳过渲染和上传步骤
          }
        }

        // 对于非图片对象(文本、形状等),需要渲染并上传
        console.log('🎨 渲染对象为图片:', obj.type);

        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        const padding = 20; // 添加一些内边距

        // 获取对象的边界框
        const boundingRect = obj.getBoundingRect();
        tempCanvas.width = boundingRect.width + padding * 2;
        tempCanvas.height = boundingRect.height + padding * 2;

        const ctx = tempCanvas.getContext('2d');
        if (!ctx) {
          throw new Error('无法创建canvas context');
        }

        // 设置白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 保存当前状态
        ctx.save();

        // 移动到中心位置
        ctx.translate(padding - boundingRect.left, padding - boundingRect.top);

        // 渲染对象到临时画布
        obj.render(ctx);

        ctx.restore();

        // 转换为DataURL
        const dataUrl = tempCanvas.toDataURL('image/png');

        // 上传到七牛云
        const uploadedUrl = await this.qiniuUploader.uploadBase64(
          dataUrl.split(',')[1], // 去掉data:image/png;base64,前缀
          `image-to-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`
        );

        console.log('✅ 对象已上传到七牛云:', uploadedUrl);
        imageUrls.push(uploadedUrl);
      } catch (error) {
        console.error('❌ 转换对象为图片失败:', error);
        throw error;
      }
    }

    return imageUrls;
  }

  // ==================== 颜色记忆功能 ====================

  /**
   * 获取上次使用的颜色
   * @param key 颜色类型键名
   * @param defaultColor 默认颜色
   */
  private getLastUsedColor(key: string, defaultColor: string): string {
    try {
      const saved = localStorage.getItem(`canvas_color_${key}`);
      return saved || defaultColor;
    } catch (error) {
      console.warn('读取上次使用的颜色失败:', error);
      return defaultColor;
    }
  }

  /**
   * 保存使用的颜色
   * @param key 颜色类型键名
   * @param color 颜色值
   */
  saveLastUsedColor(key: string, color: string): void {
    try {
      localStorage.setItem(`canvas_color_${key}`, color);
      console.log(`💾 已保存颜色: ${key} = ${color}`);
    } catch (error) {
      console.warn('保存颜色失败:', error);
    }
  }

  // 销毁画布
  dispose() {
    this.canvas.dispose();
  }

  // ==================== 图片处理功能 ====================

  /**
   * 设置图片圆角
   * @param radius 圆角半径（像素值）
   */
  setImageBorderRadius(radius: number) {
    const activeObj = this.canvas.getActiveObject();

    if (!activeObj || activeObj.type !== 'image') {
      return;
    }

    const image = activeObj as fabric.Image;

    if (radius === 0) {
      // 移除圆角
      image.clipPath = undefined;
    } else {
      // 创建圆角裁剪路径
      const width = image.width || 100;
      const height = image.height || 100;

      const clipPath = new fabric.Rect({
        width: width,
        height: height,
        rx: radius,
        ry: radius,
        top: -height / 2,
        left: -width / 2,
      });
      image.clipPath = clipPath;
    }

    // 强制标记对象为 dirty，确保重新渲染
    image.dirty = true;
    this.canvas.requestRenderAll();
    this.saveHistory();
  }

  /**
   * 翻转图片（水平）
   */
  flipImageHorizontal() {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') return;

    activeObj.set('flipX', !activeObj.flipX);
    this.canvas.renderAll();
  }

  /**
   * 翻转图片（垂直）
   */
  flipImageVertical() {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') return;

    activeObj.set('flipY', !activeObj.flipY);
    this.canvas.renderAll();
  }

  /**
   * 设置图片阴影
   */
  setImageShadow(shadow: { enabled: boolean; color: string; blur: number; offsetX: number; offsetY: number }) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') return;

    if (shadow.enabled) {
      activeObj.shadow = new fabric.Shadow({
        color: shadow.color,
        blur: shadow.blur,
        offsetX: shadow.offsetX,
        offsetY: shadow.offsetY,
      });
    } else {
      activeObj.shadow = null;
    }

    this.canvas.renderAll();
  }

  /**
   * 设置图片边框
   */
  setImageStroke(stroke: { enabled: boolean; color: string; width: number; style?: 'solid' | 'dashed' }) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') return;

    if (stroke.enabled) {
      activeObj.set({
        stroke: stroke.color,
        strokeWidth: stroke.width,
        strokeDashArray: stroke.style === 'dashed' ? [10, 5] : undefined,
      });
    } else {
      activeObj.set({
        stroke: undefined,
        strokeWidth: 0,
        strokeDashArray: undefined,
      });
    }

    this.canvas.renderAll();
  }

  /**
   * 应用图片滤镜
   */
  applyImageFilter(filterType: string, value?: number) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') return;

    const image = activeObj as fabric.Image;

    // 重置滤镜
    if (filterType === 'reset') {
      image.filters = [];
      image.applyFilters();
      this.canvas.renderAll();
      return;
    }

    // 快速滤镜（一键应用）
    const quickFilters: { [key: string]: any } = {
      grayscale: new fabric.filters.Grayscale(),
      sepia: new fabric.filters.Sepia(),
      invert: new fabric.filters.Invert(),
      blur: new fabric.filters.Blur({ blur: 0.3 }),
      sharpen: new fabric.filters.Convolute({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      }),
      emboss: new fabric.filters.Convolute({
        matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1],
      }),
    };

    if (quickFilters[filterType]) {
      image.filters = [quickFilters[filterType]];
      image.applyFilters();
      this.canvas.renderAll();
    }
  }

  /**
   * 设置图片亮度
   */
  setImageBrightness(value: number) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') return;

    const image = activeObj as fabric.Image;

    // 移除旧的亮度滤镜
    image.filters = (image.filters || []).filter(
      (f: any) => !(f instanceof fabric.filters.Brightness)
    );

    // 添加新的亮度滤镜
    if (value !== 0) {
      image.filters?.push(new fabric.filters.Brightness({ brightness: value }));
    }

    image.applyFilters();
    this.canvas.renderAll();
  }

  /**
   * 设置图片对比度
   */
  setImageContrast(value: number) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') return;

    const image = activeObj as fabric.Image;

    // 移除旧的对比度滤镜
    image.filters = (image.filters || []).filter(
      (f: any) => !(f instanceof fabric.filters.Contrast)
    );

    // 添加新的对比度滤镜
    if (value !== 0) {
      image.filters?.push(new fabric.filters.Contrast({ contrast: value }));
    }

    image.applyFilters();
    this.canvas.renderAll();
  }

  /**
   * 设置图片饱和度
   */
  setImageSaturation(value: number) {
    const activeObj = this.canvas.getActiveObject();
    if (!activeObj || activeObj.type !== 'image') return;

    const image = activeObj as fabric.Image;

    // 移除旧的饱和度滤镜
    image.filters = (image.filters || []).filter(
      (f: any) => !(f instanceof fabric.filters.Saturation)
    );

    // 添加新的饱和度滤镜
    if (value !== 0) {
      image.filters?.push(new fabric.filters.Saturation({ saturation: value }));
    }

    image.applyFilters();
    this.canvas.renderAll();
  }

  /**
   * 替换当前选中的图片
   */
  replaceSelectedImage(newImageUrl: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const activeObj = this.canvas.getActiveObject();
      if (!activeObj || activeObj.type !== 'image') {
        reject(new Error('没有选中的图片对象'));
        return;
      }

      const oldImg = activeObj as fabric.Image;

      // 加载新图片
      try {
        const newImg = await this.loadFabricImage(newImageUrl);

        // 保持原图片的所有属性
        newImg.set({
          left: oldImg.left,
          top: oldImg.top,
          scaleX: oldImg.scaleX,
          scaleY: oldImg.scaleY,
          angle: oldImg.angle,
          opacity: oldImg.opacity,
          flipX: oldImg.flipX,
          flipY: oldImg.flipY,
          shadow: oldImg.shadow,
          stroke: oldImg.stroke,
          strokeWidth: oldImg.strokeWidth,
          strokeDashArray: oldImg.strokeDashArray,
          clipPath: oldImg.clipPath,
          filters: oldImg.filters,
        });

        // 应用滤镜
        if (newImg.filters && newImg.filters.length > 0) {
          newImg.applyFilters();
        }

        // 移除旧图片
        this.canvas.remove(oldImg);

        // 添加新图片
        this.canvas.add(newImg);
        this.canvas.setActiveObject(newImg);
        this.canvas.renderAll();

        // 保存历史
        this.saveHistory();

        console.log('✅ 图片已替换');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 进入图片裁剪模式
   */
  private enterCropMode(image: fabric.Image) {
    console.log('✂️ 进入裁剪模式');

    this.isCropping = true;
    this.croppingImage = image;

    // 禁用画布选择
    this.canvas.selection = false;

    // 禁用图片的控制点
    image.set({
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      selectable: false,
    });

    // 创建裁剪框（初始大小为图片的 80%）
    const imgWidth = (image.width || 100) * (image.scaleX || 1);
    const imgHeight = (image.height || 100) * (image.scaleY || 1);
    const cropWidth = imgWidth * 0.8;
    const cropHeight = imgHeight * 0.8;

    this.cropRect = new fabric.Rect({
      left: (image.left || 0) - cropWidth / 2,
      top: (image.top || 0) - cropHeight / 2,
      width: cropWidth,
      height: cropHeight,
      fill: 'transparent',
      stroke: '#0066FF',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
    });

    // 创建半透明遮罩（4个矩形覆盖裁剪框外的区域）
    this.createCropOverlay(image, this.cropRect);

    // 添加裁剪框到画布
    this.canvas.add(this.cropRect);
    this.cropOverlay.forEach(rect => this.canvas.add(rect));

    // 设置裁剪框为活动对象
    this.canvas.setActiveObject(this.cropRect);
    this.canvas.renderAll();

    // 监听裁剪框移动/缩放，更新遮罩
    this.cropRect.on('moving', () => this.updateCropOverlay());
    this.cropRect.on('scaling', () => this.updateCropOverlay());
    this.cropRect.on('modified', () => this.updateCropOverlay());

    // 监听键盘事件
    this.setupCropKeyboardListeners();

    console.log('✅ 裁剪模式已启动');
  }

  /**
   * 创建裁剪遮罩
   */
  private createCropOverlay(image: fabric.Image, cropRect: fabric.Rect) {
    const canvasWidth = this.width;
    const canvasHeight = this.height;

    // 清空旧遮罩
    this.cropOverlay.forEach(rect => this.canvas.remove(rect));
    this.cropOverlay = [];

    // 上遮罩
    this.cropOverlay.push(new fabric.Rect({
      left: 0,
      top: 0,
      width: canvasWidth,
      height: cropRect.top || 0,
      fill: 'rgba(0, 0, 0, 0.5)',
      selectable: false,
      evented: false,
    }));

    // 下遮罩
    this.cropOverlay.push(new fabric.Rect({
      left: 0,
      top: (cropRect.top || 0) + (cropRect.height || 0) * (cropRect.scaleY || 1),
      width: canvasWidth,
      height: canvasHeight - ((cropRect.top || 0) + (cropRect.height || 0) * (cropRect.scaleY || 1)),
      fill: 'rgba(0, 0, 0, 0.5)',
      selectable: false,
      evented: false,
    }));

    // 左遮罩
    this.cropOverlay.push(new fabric.Rect({
      left: 0,
      top: cropRect.top || 0,
      width: cropRect.left || 0,
      height: (cropRect.height || 0) * (cropRect.scaleY || 1),
      fill: 'rgba(0, 0, 0, 0.5)',
      selectable: false,
      evented: false,
    }));

    // 右遮罩
    this.cropOverlay.push(new fabric.Rect({
      left: (cropRect.left || 0) + (cropRect.width || 0) * (cropRect.scaleX || 1),
      top: cropRect.top || 0,
      width: canvasWidth - ((cropRect.left || 0) + (cropRect.width || 0) * (cropRect.scaleX || 1)),
      height: (cropRect.height || 0) * (cropRect.scaleY || 1),
      fill: 'rgba(0, 0, 0, 0.5)',
      selectable: false,
      evented: false,
    }));
  }

  /**
   * 更新裁剪遮罩
   */
  private updateCropOverlay() {
    if (!this.cropRect || !this.croppingImage) return;

    this.createCropOverlay(this.croppingImage, this.cropRect);
    this.cropOverlay.forEach(rect => this.canvas.add(rect));
    this.canvas.renderAll();
  }

  /**
   * 设置裁剪模式的键盘监听
   */
  private setupCropKeyboardListeners() {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!this.isCropping) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        this.applyCrop();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelCrop();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // 保存监听器引用，以便后续移除
    (this as any)._cropKeyboardListener = handleKeyDown;
  }

  /**
   * 应用裁剪
   */
  private applyCrop() {
    if (!this.cropRect || !this.croppingImage) return;

    console.log('✂️ 应用裁剪');

    const image = this.croppingImage;
    const cropX = (this.cropRect.left || 0) - (image.left || 0) + ((this.cropRect.width || 0) * (this.cropRect.scaleX || 1)) / 2;
    const cropY = (this.cropRect.top || 0) - (image.top || 0) + ((this.cropRect.height || 0) * (this.cropRect.scaleY || 1)) / 2;
    const cropWidth = (this.cropRect.width || 0) * (this.cropRect.scaleX || 1);
    const cropHeight = (this.cropRect.height || 0) * (this.cropRect.scaleY || 1);

    // 使用 clipPath 实现裁剪
    const clipPath = new fabric.Rect({
      width: cropWidth / (image.scaleX || 1),
      height: cropHeight / (image.scaleY || 1),
      left: cropX / (image.scaleX || 1),
      top: cropY / (image.scaleY || 1),
      originX: 'center',
      originY: 'center',
    });

    image.clipPath = clipPath;

    this.exitCropMode();
    this.saveHistory();
  }

  /**
   * 取消裁剪
   */
  private cancelCrop() {
    console.log('❌ 取消裁剪');
    this.exitCropMode();
  }

  /**
   * 退出裁剪模式
   */
  private exitCropMode() {
    if (!this.croppingImage) return;

    console.log('🚪 退出裁剪模式');

    // 恢复图片的控制点
    this.croppingImage.set({
      hasControls: true,
      hasBorders: true,
      lockMovementX: false,
      lockMovementY: false,
      selectable: true,
    });

    // 移除裁剪框和遮罩
    if (this.cropRect) {
      this.canvas.remove(this.cropRect);
      this.cropRect = null;
    }

    this.cropOverlay.forEach(rect => this.canvas.remove(rect));
    this.cropOverlay = [];

    // 恢复画布选择
    this.canvas.selection = true;

    // 移除键盘监听
    if ((this as any)._cropKeyboardListener) {
      document.removeEventListener('keydown', (this as any)._cropKeyboardListener);
      delete (this as any)._cropKeyboardListener;
    }

    this.isCropping = false;
    this.croppingImage = null;

    this.canvas.renderAll();
    console.log('✅ 已退出裁剪模式');
  }

  // ==================== 锁定功能 ====================

  /**
   * 锁定对象
   */
  lockObject(obj?: fabric.Object): void {
    const target = obj || this.canvas.getActiveObject();
    if (!target) {
      console.warn('⚠️ 没有选中的对象');
      return;
    }

    // 设置锁定属性
    target.set({
      selectable: false,      // 无法选中
      evented: false,         // 无法触发事件
      lockMovementX: true,    // 锁定水平移动
      lockMovementY: true,    // 锁定垂直移动
      lockRotation: true,     // 锁定旋转
      lockScalingX: true,     // 锁定水平缩放
      lockScalingY: true,     // 锁定垂直缩放
      hasControls: false,     // 隐藏控制点
      hasBorders: false,      // 隐藏边框
    });

    // 添加自定义属性标记为已锁定
    (target as any).locked = true;

    // 取消选中
    this.canvas.discardActiveObject();
    this.canvas.renderAll();

    console.log('🔒 对象已锁定');
  }

  /**
   * 解锁对象
   */
  unlockObject(obj?: fabric.Object): void {
    const target = obj || this.canvas.getActiveObject();
    if (!target) {
      console.warn('⚠️ 没有选中的对象');
      return;
    }

    // 恢复可选中和可编辑
    target.set({
      selectable: true,
      evented: true,
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      hasControls: true,
      hasBorders: true,
    });

    // 移除锁定标记
    (target as any).locked = false;

    // 移除锁定图标（如果存在）
    const lockIcon = this.lockIcons.get(target);
    if (lockIcon) {
      this.canvas.remove(lockIcon);
      this.lockIcons.delete(target);
    }

    this.canvas.renderAll();
    console.log('🔓 对象已解锁');
  }

  /**
   * 切换锁定状态
   */
  toggleLock(obj?: fabric.Object): boolean {
    const target = obj || this.canvas.getActiveObject();
    if (!target) {
      console.warn('⚠️ 没有选中的对象');
      return false;
    }

    const isLocked = (target as any).locked === true;
    if (isLocked) {
      this.unlockObject(target);
      return false;
    } else {
      this.lockObject(target);
      return true;
    }
  }

  /**
   * 检查对象是否已锁定
   */
  isObjectLocked(obj: fabric.Object): boolean {
    return (obj as any).locked === true;
  }

  /**
   * 处理锁定图标的显示/隐藏
   */
  private handleLockIconVisibility(e: { target?: fabric.Object }): void {
    // 先隐藏所有锁定图标
    this.hideAllLockIcons();

    // 获取鼠标下的对象
    const target = e.target;
    if (!target) return;

    // 如果对象已锁定，显示锁定图标
    if (this.isObjectLocked(target)) {
      this.showLockIcon(target);
    }
  }

  /**
   * 显示锁定图标
   */
  private showLockIcon(obj: fabric.Object): void {
    // 如果已经有锁定图标，先移除
    const existingIcon = this.lockIcons.get(obj);
    if (existingIcon) {
      this.canvas.remove(existingIcon);
    }

    // 创建锁定图标
    const lockIcon = new fabric.Text('🔒', {
      fontSize: 16,
      left: obj.left! - (obj.width! * obj.scaleX!) / 2 + 8,
      top: obj.top! - (obj.height! * obj.scaleY!) / 2 + 8,
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
    });

    // 添加到画布
    this.canvas.add(lockIcon);
    this.lockIcons.set(obj, lockIcon);
    this.canvas.renderAll();
  }

  /**
   * 隐藏所有锁定图标
   */
  private hideAllLockIcons(): void {
    this.lockIcons.forEach((icon) => {
      this.canvas.remove(icon);
    });
    this.lockIcons.clear();
    this.canvas.renderAll();
  }

  /**
   * 获取所有锁定的对象
   */
  getLockedObjects(): fabric.Object[] {
    return this.canvas.getObjects().filter(obj => this.isObjectLocked(obj));
  }
}
