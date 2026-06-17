// 字体面板
'use client';

import { useState, useEffect } from 'react';
import { FONTS, FontConfig, LOCAL_OR_SYSTEM_FONTS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, ChevronLeft, ChevronRight, Minus, Plus, X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import ColorPicker from './ColorPicker';
import { HexColorPicker } from 'react-colorful';

// 预设颜色 - 去掉最后两个颜色
const PRESET_COLORS = [
  '#FFE066', '#FFB84D', '#FF9999', '#FF6B9D', '#C77DFF', '#9D84FF',
  '#7DD3FC', '#67E8F9', '#6EE7B7', '#A7F3D0',
];

interface FontPanelProps {
  selectedFont: string;
  fontSize: number;
  textColor: string;
  lineHeight?: number;
  letterSpacing?: number;
  selectedObject: any;
  onFontChange: (fontFamily: string) => void;
  onFontSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onLineHeightChange?: (lineHeight: number) => void;
  onLetterSpacingChange?: (letterSpacing: number) => void;
  // 对齐
  onTextAlignChange?: (align: 'left' | 'center' | 'right') => void;
  // 🆕 描边
  onStrokeChange?: (enabled: boolean, color?: string, width?: number) => void;
  // 背景
  onBackgroundChange?: (style: 'none' | 'solid', color?: string, opacity?: number) => void;
  // 下划线
  onUnderlineChange?: (style: 'none' | 'solid' | 'wavy' | 'dotted', width?: number, color?: string) => void;
  // 边框
  onBorderChange?: (style: 'none' | 'solid' | 'dashed', width?: number, color?: string) => void;
  // 画布背景
  onCanvasBackgroundChange?: (type: 'solid' | 'gradient' | 'image', value: string) => void;
}

const RECENT_FONTS_KEY = 'xhs_recent_fonts';
const MAX_RECENT_FONTS = 3; // 只标记最近使用的 3 个

export default function FontPanel({
  selectedFont,
  fontSize,
  textColor,
  lineHeight = 1.2,
  letterSpacing = 0,
  selectedObject,
  onFontChange,
  onFontSizeChange,
  onColorChange,
  onLineHeightChange,
  onLetterSpacingChange,
  onTextAlignChange,
  onStrokeChange,
  onBackgroundChange,
  onUnderlineChange,
  onBorderChange,
  onCanvasBackgroundChange,
}: FontPanelProps) {
  const [loadingFonts, setLoadingFonts] = useState<Set<string>>(new Set());
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(
    new Set(LOCAL_OR_SYSTEM_FONTS)
  );
  const [recentFontFamilies, setRecentFontFamilies] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // 主 Tab 状态
  const [activeMainTab, setActiveMainTab] = useState<'font' | 'spacing' | 'canvas'>('font');

  // 装饰 Tab 状态
  const [activeDecorationTab, setActiveDecorationTab] = useState<'background' | 'underline' | 'border'>('background');

  // 文本对齐状态
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');

  // 🆕 描边状态
  const [strokeEnabled, setStrokeEnabled] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);

  // 画布背景状态
  const [canvasBackgroundType, setCanvasBackgroundType] = useState<'solid' | 'image' | 'pattern'>('solid');
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState('#FFFFFF');
  const [showCanvasColorPicker, setShowCanvasColorPicker] = useState(false);
  const [uploadedBackgroundImage, setUploadedBackgroundImage] = useState<string | null>(null);
  const [showAllGradients, setShowAllGradients] = useState(false);
  const [showAllSolidColors, setShowAllSolidColors] = useState(false);

  // 字号输入框的本地状态
  const [fontSizeInput, setFontSizeInput] = useState<string>('');

  // 本地状态用于实时显示
  const [localLetterSpacing, setLocalLetterSpacing] = useState(letterSpacing);
  const [localLineHeight, setLocalLineHeight] = useState(lineHeight);

  // 同步 selectedObject 的值到本地状态
  useEffect(() => {
    if (selectedObject) {
      setLocalLetterSpacing(selectedObject.charSpacing ?? letterSpacing);
      setLocalLineHeight(selectedObject.lineHeight ?? lineHeight);

      // 🆕 同步描边状态
      if (selectedObject.type === 'i-text' || selectedObject.type === 'textbox' || selectedObject.type === 'text') {
        const hasStroke = selectedObject.stroke && selectedObject.strokeWidth > 0;
        setStrokeEnabled(hasStroke);
        if (hasStroke) {
          setStrokeColor(selectedObject.stroke || '#000000');
          setStrokeWidth(selectedObject.strokeWidth || 3);
        }
      }

      // 同步背景颜色和不透明度(从Group中提取)
      if (selectedObject.type === 'group') {
        const objects = (selectedObject as any)._objects || [];
        const bgRect = objects.find((obj: any) =>
          obj.type === 'rect' && obj.fill && obj.fill !== 'transparent'
        );

        if (bgRect) {
          setBackgroundStyle('solid');
          setBackgroundColor(bgRect.fill || '#FFE066');
          // Fabric.js的opacity就是不透明度(1=不透明, 0=透明)
          const fabricOpacity = bgRect.opacity ?? 1.0;
          setBackgroundOpacity(fabricOpacity);
          console.log('📋 读取背景:', {
            color: bgRect.fill,
            fabricOpacity,
            displayOpacity: Math.round(fabricOpacity * 100) + '%'
          });
        } else {
          setBackgroundStyle('none');
        }
      } else {
        setBackgroundStyle('none');
      }
    } else {
      setLocalLetterSpacing(letterSpacing);
      setLocalLineHeight(lineHeight);
    }
  }, [selectedObject, letterSpacing, lineHeight]);

  // 背景状态
  const [backgroundStyle, setBackgroundStyle] = useState<'none' | 'solid'>('none');
  const [backgroundColor, setBackgroundColor] = useState('#FFE066');
  // 不透明度: 1=完全不透明, 0=完全透明 (与Fabric.js的opacity一致)
  const [backgroundOpacity, setBackgroundOpacity] = useState(1); // 默认100%不透明
  const [recentBackgroundColors, setRecentBackgroundColors] = useState<string[]>([]);

  // 下划线状态
  const [underlineStyle, setUnderlineStyle] = useState<'none' | 'solid' | 'wavy' | 'dotted'>('none');
  const [underlineWidth, setUnderlineWidth] = useState(5);
  const [underlineColor, setUnderlineColor] = useState('#FF2442');

  // 边框状态
  const [borderStyle, setBorderStyle] = useState<'none' | 'solid' | 'dashed'>('none');
  const [borderWidth, setBorderWidth] = useState(5);
  const [borderColor, setBorderColor] = useState('#FF2442');

  // 加载最近使用的字体（只存储 family 列表）
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_FONTS_KEY);
    if (stored) {
      try {
        const fontFamilies = JSON.parse(stored) as string[];
        setRecentFontFamilies(fontFamilies.slice(0, MAX_RECENT_FONTS));
      } catch (error) {
        console.error('Failed to load recent fonts:', error);
      }
    }

    // 加载最近使用的背景颜色
    const storedColors = localStorage.getItem('recent-background-colors');
    if (storedColors) {
      try {
        const colors = JSON.parse(storedColors) as string[];
        setRecentBackgroundColors(colors.slice(0, 6));
      } catch (error) {
        console.error('Failed to load recent background colors:', error);
      }
    }
  }, []);

  // 预加载第一页的字体
  useEffect(() => {
    const fontsPerPage = 3;
    const firstPageFonts = FONTS.slice(0, fontsPerPage);
    firstPageFonts.forEach((font) => {
      loadFont(font);
    });
  }, []);

  // 添加到最近使用
  const addToRecent = (font: FontConfig) => {
    setRecentFontFamilies((prev) => {
      const filtered = prev.filter((f) => f !== font.family);
      const updated = [font.family, ...filtered].slice(0, MAX_RECENT_FONTS);
      localStorage.setItem(RECENT_FONTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // 添加到最近使用的背景颜色
  const addToRecentBackgroundColors = (color: string) => {
    setRecentBackgroundColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      const updated = [color, ...filtered].slice(0, 6);
      localStorage.setItem('recent-background-colors', JSON.stringify(updated));
      return updated;
    });
  };

  // 懒加载字体
  const loadFont = async (font: FontConfig): Promise<void> => {
    // 如果已经加载完成,直接返回
    if (loadedFonts.has(font.family)) {
      return Promise.resolve();
    }

    // 如果正在加载,等待加载完成
    if (loadingFonts.has(font.family)) {
      // 等待字体加载完成
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (loadedFonts.has(font.family)) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    setLoadingFonts((prev) => new Set(prev).add(font.family));

    try {
      // 🔥 先移除已存在的同名字体 link 标签，避免缓存问题
      const existingLinks = document.querySelectorAll(`link[data-font-family="${font.family}"]`);
      existingLinks.forEach(link => link.remove());

      const link = document.createElement('link');

      // 🆕 优先级：cssPath (npm 包) > customUrl (自定义 CDN) > 本地/系统字体
      if (font.cssPath) {
        // npm 包字体：通过 API 路由提供
        // 添加时间戳避免缓存
        const timestamp = Date.now();
        link.href = `/api/fonts?path=${encodeURIComponent(font.cssPath)}&t=${timestamp}`;
        link.rel = 'stylesheet';
        link.setAttribute('data-font-family', font.family);
        console.log('🔤 加载 npm 包字体:', font.name, font.cssPath);
      } else if (font.customUrl) {
        // 自定义 CDN 字体
        link.href = font.customUrl;
        link.rel = 'stylesheet';
        link.crossOrigin = 'anonymous';
        link.setAttribute('data-font-family', font.family);
        console.log('🔤 加载自定义字体:', font.name, font.customUrl);
      } else {
        setLoadedFonts((prev) => new Set(prev).add(font.family));
        console.log('🔤 使用本地/系统字体:', font.name);
        return;
      }

      // 🔥 等待 CSS 文件加载完成
      await new Promise<void>((resolve, reject) => {
        link.onload = () => {
          console.log('✅ CSS 文件加载完成:', font.name);
          resolve();
        };
        link.onerror = () => {
          console.warn('⚠️ CSS 文件加载失败（可能是网络问题）:', font.name);
          if (!font.cssPath && !font.customUrl) {
            resolve(); // 继续执行，不阻塞
          } else {
            reject(new Error('CSS load failed'));
          }
        };
        document.head.appendChild(link);
      });

      // 🔥 等待字体真正可用 - 使用轮询检查
      // 对于分片字体，我们检查常用字符是否可用
      const testText = '设计'; // 使用预览文本
      const maxAttempts = 50; // 最多尝试 50 次
      const delayMs = 100; // 每次间隔 100ms

      for (let i = 0; i < maxAttempts; i++) {
        // 检查字体是否在 document.fonts 中
        const fontFaces = Array.from(document.fonts).filter(
          (f: any) => f.family === font.family || f.family === `"${font.family}"`
        );

        if (fontFaces.length > 0) {
          console.log(`✅ 字体已在 document.fonts 中: ${font.name}, 找到 ${fontFaces.length} 个 @font-face`);
          // 再等待一小段时间确保字体文件下载
          await new Promise(resolve => setTimeout(resolve, 200));
          break;
        }

        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }

      setLoadedFonts((prev) => new Set(prev).add(font.family));
      console.log('✅ 字体加载完成:', font.name);
    } catch (error) {
      console.error(`❌ 字体加载失败: ${font.family}`, error);
      // 即使失败也标记为已加载，避免重复尝试
      setLoadedFonts((prev) => new Set(prev).add(font.family));
    } finally {
      setLoadingFonts((prev) => {
        const next = new Set(prev);
        next.delete(font.family);
        return next;
      });
    }
  };

  const handleFontClick = async (font: FontConfig) => {
    console.log('🖱️ 点击字体:', font.name, 'family:', font.family);

    // 1. 检查字体是否已加载
    const wasLoaded = loadedFonts.has(font.family);

    if (!wasLoaded) {
      console.log('🔤 字体未加载，开始加载:', font.name);

      // 2. 等待字体加载完成
      await loadFont(font);

      console.log('✅ 字体加载完成，现在应用:', font.name);
    } else {
      console.log('✅ 字体已加载，直接应用:', font.name);
    }

    // 3. 应用字体（在加载完成后）
    onFontChange(font.family);
    addToRecent(font);

    // 4. 🔥 延迟再次应用，确保字体文件真正下载完成
    // 对于分片字体，浏览器需要时间下载所需的字体文件
    setTimeout(() => {
      console.log('🔄 延迟再次应用字体:', font.name);
      onFontChange(font.family);
    }, 300);
  };

  // 计算分页（每页 3 个字体）
  const fontsPerPage = 3;
  const totalPages = Math.ceil(FONTS.length / fontsPerPage);
  const displayFonts = FONTS.slice(
    currentPage * fontsPerPage,
    (currentPage + 1) * fontsPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => {
      const newPage = Math.max(0, prev - 1);
      // 预加载新页面的字体
      const newPageFonts = FONTS.slice(newPage * fontsPerPage, (newPage + 1) * fontsPerPage);
      newPageFonts.forEach((font) => loadFont(font));
      return newPage;
    });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => {
      const newPage = Math.min(totalPages - 1, prev + 1);
      // 预加载新页面的字体
      const newPageFonts = FONTS.slice(newPage * fontsPerPage, (newPage + 1) * fontsPerPage);
      newPageFonts.forEach((font) => loadFont(font));
      return newPage;
    });
  };

  // 获取当前选中对象的字体和颜色
  const getCurrentProperty = (property: string, defaultValue: any) => {
    if (!selectedObject) return defaultValue;

    // 如果是 Group，从内部文本对象获取
    if (selectedObject.type === 'group') {
      const textObj = (selectedObject as any)._objects?.find((o: any) => o.type === 'i-text' || o.type === 'textbox');
      return textObj?.[property] || defaultValue;
    }

    return selectedObject[property] || defaultValue;
  };

  const currentFont = getCurrentProperty('fontFamily', selectedFont);
  const currentColor = getCurrentProperty('fill', textColor);
  const currentFontSize = getCurrentProperty('fontSize', fontSize);

  // 同步字号到输入框
  useEffect(() => {
    setFontSizeInput(String(currentFontSize));
  }, [currentFontSize]);

  // 判断字体是否是最近使用的
  const isRecentFont = (fontFamily: string) => {
    return recentFontFamilies.includes(fontFamily);
  };

  return (
    <aside
      className="flex flex-col overflow-y-auto bg-background"
      style={{ width: '360px', borderLeft: '1px solid hsl(var(--border))' }}
    >
      {/* 主 Tab 组：字体设置 / 对齐与间距 / 画布背景 */}
      <Tabs value={activeMainTab} onValueChange={(value) => setActiveMainTab(value as any)} className="space-y-0">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="font">字体设置</TabsTrigger>
          <TabsTrigger value="spacing">对齐与间距</TabsTrigger>
          <TabsTrigger value="canvas">画布背景</TabsTrigger>
        </TabsList>

        {/* 字体设置 Tab */}
        <TabsContent value="font" className="px-8 py-6 space-y-6">
          {/* 字体网格 */}
          <div>
            <h3 className="text-sm font-semibold mb-4">字体</h3>
            <div className="grid grid-cols-3 gap-3">
              {displayFonts.map((font) => {
                const isSelected = currentFont === font.family;
                const isLoading = loadingFonts.has(font.family);
                const isLoaded = loadedFonts.has(font.family);
                const isRecent = isRecentFont(font.family);

                return (
                  <button
                    key={font.family}
                    onClick={() => handleFontClick(font)}
                    className={`relative h-24 flex flex-col items-center justify-center p-3 rounded-md border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/40 bg-background hover:border-primary/50'
                    }`}
                  >
                    {/* 最近使用标记（小灰点） */}
                    {isRecent && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-gray-400" />
                    )}

                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <div
                          className="text-2xl font-bold mb-1"
                          style={{
                            fontFamily: isLoaded ? font.family : 'inherit',
                          }}
                        >
                          {font.preview}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {font.name}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-xs text-muted-foreground font-medium min-w-[32px] text-center">
                  {currentPage + 1} / {totalPages}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* 字体颜色 + 字号 */}
          <div className="flex items-start gap-4">
            {/* 字体颜色 - 小方块 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground h-[18px] leading-[18px]">颜色</label>
              <ColorPicker
                color={currentColor}
                onChange={onColorChange}
                compact
                disabled={!selectedObject}
              />
            </div>

            {/* 字号 */}
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-xs font-medium text-muted-foreground h-[18px] leading-[18px]">字号</label>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 active:scale-95 transition-transform"
                  onClick={() => {
                    if (!selectedObject) return;
                    const newValue = Math.max(12, currentFontSize - 2);
                    setFontSizeInput(String(newValue));
                    onFontSizeChange(newValue);
                  }}
                  disabled={!selectedObject}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Input
                  type="number"
                  value={fontSizeInput}
                  onChange={(e) => {
                    // 允许任意输入,包括空字符串
                    setFontSizeInput(e.target.value);
                  }}
                  onBlur={() => {
                    // 失焦时验证并应用
                    const value = Number(fontSizeInput);
                    if (!isNaN(value) && value >= 12 && value <= 200) {
                      onFontSizeChange(value);
                    } else {
                      // 如果无效,恢复到当前值
                      setFontSizeInput(String(currentFontSize));
                    }
                  }}
                  onKeyDown={(e) => {
                    // 按Enter时也触发验证
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  disabled={!selectedObject}
                  className="flex-1 text-center h-8 text-base font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={12}
                  max={200}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 active:scale-95 transition-transform"
                  onClick={() => {
                    if (!selectedObject) return;
                    const newValue = Math.min(200, currentFontSize + 2);
                    setFontSizeInput(String(newValue));
                    onFontSizeChange(newValue);
                  }}
                  disabled={!selectedObject}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* 🆕 描边设置 */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">描边</label>
              <Button
                variant={strokeEnabled ? "default" : "outline"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => {
                  const newEnabled = !strokeEnabled;
                  setStrokeEnabled(newEnabled);
                  onStrokeChange?.(newEnabled, strokeColor, strokeWidth);
                }}
                disabled={!selectedObject}
              >
                {strokeEnabled ? '已启用' : '已禁用'}
              </Button>
            </div>

            {strokeEnabled && (
              <div className="space-y-3">
                {/* 描边颜色 */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">颜色</label>
                  <ColorPicker
                    color={strokeColor}
                    onChange={(color) => {
                      setStrokeColor(color);
                      onStrokeChange?.(true, color, strokeWidth);
                    }}
                    compact
                    disabled={!selectedObject}
                  />
                </div>

                {/* 描边宽度 */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">宽度</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        const newWidth = Math.max(1, strokeWidth - 1);
                        setStrokeWidth(newWidth);
                        onStrokeChange?.(true, strokeColor, newWidth);
                      }}
                      disabled={!selectedObject}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex-1 text-center h-8 flex items-center justify-center border rounded-md">
                      <div className="text-base font-semibold tabular-nums">
                        {strokeWidth}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => {
                        const newWidth = Math.min(20, strokeWidth + 1);
                        setStrokeWidth(newWidth);
                        onStrokeChange?.(true, strokeColor, newWidth);
                      }}
                      disabled={!selectedObject}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 对齐与间距 Tab */}
        <TabsContent value="spacing" className="px-8 py-6 space-y-6">
          {/* 字间距 */}
          <div>
            <label className="text-sm font-semibold mb-3 block">字间距</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  if (!selectedObject) return;
                  const newValue = Math.max(-500, localLetterSpacing - 10);
                  setLocalLetterSpacing(newValue);
                  onLetterSpacingChange?.(newValue);
                }}
                disabled={!selectedObject}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center h-9 flex items-center justify-center border rounded-md">
                <div className="text-base font-semibold tabular-nums">
                  {Math.round(localLetterSpacing)}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  if (!selectedObject) return;
                  const newValue = Math.min(1000, localLetterSpacing + 10);
                  setLocalLetterSpacing(newValue);
                  onLetterSpacingChange?.(newValue);
                }}
                disabled={!selectedObject}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 行间距 */}
          <div>
            <label className="text-sm font-semibold mb-3 block">行间距</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  if (!selectedObject) return;
                  const newValue = Math.max(0.5, Number((localLineHeight - 0.1).toFixed(1)));
                  setLocalLineHeight(newValue);
                  onLineHeightChange?.(newValue);
                }}
                disabled={!selectedObject}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center h-9 flex items-center justify-center border rounded-md">
                <div className="text-base font-semibold tabular-nums">
                  {localLineHeight.toFixed(1)}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  if (!selectedObject) return;
                  const newValue = Math.min(5, Number((localLineHeight + 0.1).toFixed(1)));
                  setLocalLineHeight(newValue);
                  onLineHeightChange?.(newValue);
                }}
                disabled={!selectedObject}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 对齐方式 */}
          <div>
            <label className="text-sm font-semibold mb-3 block">对齐方式</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className={`flex-1 h-10 ${textAlign === 'left' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''}`}
                onClick={() => {
                  setTextAlign('left');
                  onTextAlignChange?.('left');
                }}
                disabled={!selectedObject}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`flex-1 h-10 ${textAlign === 'center' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''}`}
                onClick={() => {
                  setTextAlign('center');
                  onTextAlignChange?.('center');
                }}
                disabled={!selectedObject}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`flex-1 h-10 ${textAlign === 'right' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''}`}
                onClick={() => {
                  setTextAlign('right');
                  onTextAlignChange?.('right');
                }}
                disabled={!selectedObject}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* 画布背景 Tab */}
        <TabsContent value="canvas" className="px-8 py-6 space-y-6">
          {/* 纯色背景选择器 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">纯色背景</label>
              <button
                onClick={() => setShowAllSolidColors(!showAllSolidColors)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {showAllSolidColors ? '收起' : '展开'}
                <svg
                  className={`w-3 h-3 transition-transform ${showAllSolidColors ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {/* 第一个是自定义颜色选择器 */}
              <div className="relative">
                <button
                  onClick={() => setShowCanvasColorPicker(!showCanvasColorPicker)}
                  className="w-full aspect-square rounded-md border-2 border-border hover:border-primary transition-colors flex items-center justify-center bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500"
                >
                  <svg className="w-5 h-5 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </button>
                {showCanvasColorPicker && (
                  <div className="absolute top-full left-0 mt-2 z-50">
                    <div className="fixed inset-0" onClick={() => setShowCanvasColorPicker(false)} />
                    <div className="relative bg-white rounded-lg shadow-lg p-3">
                      <HexColorPicker
                        color={canvasBackgroundColor}
                        onChange={(color) => {
                          setCanvasBackgroundColor(color);
                          setCanvasBackgroundType('solid');
                          setUploadedBackgroundImage(null); // 清除背景图片
                          onCanvasBackgroundChange?.('solid', color);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 预设颜色 */}
              {(() => {
                const allColors = [
                  // 第一行（原有 + 新增）
                  '#FFFFFF', // 纯白
                  '#F5F5F5', // 浅灰
                  '#E8E8E8', // 灰色
                  '#1A1A1A', // 深黑
                  '#000000', // 纯黑
                  // 第二行（暖色系）
                  '#FFE5E5', // 浅粉
                  '#FFB3BA', // 粉红
                  '#FFDFBA', // 浅橙
                  '#FFF4E5', // 米黄
                  '#FFFACD', // 柠檬黄
                  '#FFFBE5', // 浅黄
                  // 第三行（冷色系）
                  '#E5F9FF', // 浅蓝
                  '#BAE1FF', // 天蓝
                  '#E5F0FF', // 淡蓝
                  '#BAFFC9', // 薄荷绿
                  '#E5FFE5', // 浅绿
                  '#F0E5FF', // 淡紫
                  // 第四行（鲜艳色）
                  '#FFE5F5', // 浅粉紫
                  '#FF6B9D', // 玫瑰红
                  '#FF9999', // 珊瑚红
                  '#FFB84D', // 橙色
                  '#FFE066', // 金黄
                  '#67E8F9', // 青色
                  // 第五行（深色系）
                  '#7DD3FC', // 亮蓝
                  '#6EE7B7', // 翠绿
                  '#A7F3D0', // 薄荷
                  '#C77DFF', // 紫色
                  '#9D84FF', // 淡紫
                  '#FF6B6B', // 红色
                ];

                const displayColors = showAllSolidColors ? allColors : allColors.slice(0, 11);

                return displayColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setCanvasBackgroundColor(color);
                      setCanvasBackgroundType('solid');
                      setUploadedBackgroundImage(null); // 清除背景图片
                      onCanvasBackgroundChange?.('solid', color);
                    }}
                    className={`w-full aspect-square rounded-md border-2 hover:border-primary transition-colors ${
                      canvasBackgroundColor === color && canvasBackgroundType === 'solid'
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ));
              })()}
            </div>
          </div>

          {/* 渐变背景 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold">渐变背景</label>
              <button
                onClick={() => setShowAllGradients(!showAllGradients)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {showAllGradients ? '收起' : '展开'}
                <svg
                  className={`w-3 h-3 transition-transform ${showAllGradients ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(() => {
                const allGradients = [
                  // 第一行（新增的特殊渐变）
                  'radial-gradient(circle 311px at 8.6% 27.9%, rgba(62,147,252,0.57) 12.9%, rgba(239,183,192,0.44) 91.2%)',
                  'linear-gradient(109.6deg, rgba(254,253,205,1) 11.2%, rgba(163,230,255,1) 91.1%)',
                  'radial-gradient(circle farthest-corner at 3.2% 49.6%, rgba(80,12,139,0.87) 0%, rgba(161,10,144,0.72) 83.6%)',
                  'radial-gradient(circle 1292px at -13.6% 51.7%, rgba(0,56,68,1) 0%, rgba(163,217,185,1) 51.5%, rgba(255,252,247,1) 88.6%)',
                  // 第二行（新增的特殊渐变）
                  'linear-gradient(89.5deg, rgba(131,204,255,1) 0.4%, rgba(66,144,251,1) 100.3%)',
                  'linear-gradient(174.2deg, rgba(255,244,228,1) 7.1%, rgba(240,246,238,1) 67.4%)',
                  'radial-gradient(circle 918px at 13.1% 25.5%, rgba(249,107,107,1) 0%, rgba(247,231,172,1) 48.9%, rgba(173,247,172,1) 90%)',
                  'linear-gradient(107.7deg, rgba(235,230,44,0.55) 8.4%, rgba(252,152,15,1) 90.3%)',
                  // 第三行（原有渐变）
                  'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  'linear-gradient(135deg, #0575e6 0%, #021b79 100%)',
                  'linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%)',
                  // 第四行（原有渐变）
                  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
                  // 第五行（原有渐变）
                  'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
                  'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
                  'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
                  'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
                  // 第六行（原有渐变）
                  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  // 第七行（原有渐变）
                  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                  'linear-gradient(135deg, #a8caba 0%, #5d4157 100%)',
                  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                  'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
                ];

                const displayGradients = showAllGradients ? allGradients : allGradients.slice(0, 8);

                return displayGradients.map((gradient, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCanvasBackgroundType('solid');
                      setUploadedBackgroundImage(null); // 清除背景图片
                      onCanvasBackgroundChange?.('gradient', gradient);
                    }}
                    className="h-16 rounded-lg border-2 border-border hover:border-primary transition-colors"
                    style={{ background: gradient }}
                  />
                ));
              })()}
            </div>
          </div>

          {/* 图片背景上传 */}
          <div>
            <label className="text-sm font-semibold mb-3 block">图片背景</label>
            <div className="flex gap-3">
              {/* 左侧预览 */}
              <div className="flex-1">
                {uploadedBackgroundImage ? (
                  <div className="relative w-full h-32 rounded-md border-2 border-border overflow-hidden group">
                    <img
                      src={uploadedBackgroundImage}
                      alt="背景预览"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setUploadedBackgroundImage(null);
                          setCanvasBackgroundType('solid');
                          onCanvasBackgroundChange?.('solid', '#FFFFFF');
                        }}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-md border-2 border-dashed border-border flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">暂无图片</span>
                  </div>
                )}
              </div>

              {/* 右侧上传按钮 */}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="canvas-bg-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const imageUrl = event.target?.result as string;
                        setUploadedBackgroundImage(imageUrl);
                        setCanvasBackgroundType('solid'); // 设置类型以便替换
                        onCanvasBackgroundChange?.('image', imageUrl);
                      };
                      reader.readAsDataURL(file);
                    }
                    // 重置input,允许上传同一文件
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor="canvas-bg-upload"
                  className="w-full h-32 rounded-md border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-muted-foreground text-center px-2">
                    {uploadedBackgroundImage ? '点击更换图片' : '点击上传图片'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 装饰 Tab 组 - 只在字体设置Tab时显示 */}
      {activeMainTab === 'font' && (
        <>
          <Separator />
          <Tabs value={activeDecorationTab} onValueChange={(value) => setActiveDecorationTab(value as any)} className="space-y-0">
        <TabsList>
          <TabsTrigger value="background">字体背景</TabsTrigger>
          <TabsTrigger value="underline">下划线</TabsTrigger>
          <TabsTrigger value="border">边框</TabsTrigger>
        </TabsList>

        {/* 背景 Tab 内容 */}
        <TabsContent value="background" className="px-8 py-6 space-y-4">
            {/* 颜色选择 + 不透明度控制 */}
            <div className="flex items-start gap-4">
              {/* 背景颜色 - 小方块 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground h-[18px] leading-[18px]">颜色</label>
                <ColorPicker
                  color={backgroundColor}
                  onChange={(color) => {
                    setBackgroundStyle('solid');
                    setBackgroundColor(color);
                    onBackgroundChange?.('solid', color, backgroundOpacity);
                    addToRecentBackgroundColors(color);
                  }}
                  compact
                  disabled={!selectedObject}
                />
              </div>

              {/* 不透明度 */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground h-[18px] leading-[18px]">不透明度</label>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 active:scale-95 transition-transform"
                    onClick={() => {
                      // 减少不透明度(更透明)
                      const newOpacity = Math.max(0, Number((backgroundOpacity - 0.1).toFixed(1)));
                      setBackgroundOpacity(newOpacity);
                      if (backgroundStyle === 'solid') {
                        onBackgroundChange?.('solid', backgroundColor, newOpacity);
                      }
                    }}
                    disabled={!selectedObject || backgroundOpacity <= 0}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex-1 text-center h-8 flex items-center justify-center">
                    <div className="text-base font-semibold tabular-nums">
                      {Math.round(backgroundOpacity * 100)}%
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 active:scale-95 transition-transform"
                    onClick={() => {
                      // 增加不透明度(更不透明)
                      const newOpacity = Math.min(1, Number((backgroundOpacity + 0.1).toFixed(1)));
                      setBackgroundOpacity(newOpacity);
                      if (backgroundStyle === 'solid') {
                        onBackgroundChange?.('solid', backgroundColor, newOpacity);
                      }
                    }}
                    disabled={!selectedObject || backgroundOpacity >= 1}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 推荐颜色 */}
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">推荐颜色</label>
              <div className="grid grid-cols-11 gap-2">
                {/* 第一个：无背景 */}
                <button
                  onClick={() => {
                    setBackgroundStyle('none');
                    onBackgroundChange?.('none');
                  }}
                  disabled={!selectedObject}
                  className={`w-6 h-6 rounded border transition-all hover:scale-110 flex items-center justify-center ${
                    backgroundStyle === 'none'
                      ? 'border-primary ring-2 ring-primary/20 bg-gray-50'
                      : 'border-border/30 bg-white'
                  }`}
                  title="无背景"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>

                {/* 推荐颜色 */}
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setBackgroundStyle('solid');
                      setBackgroundColor(color);
                      onBackgroundChange?.('solid', color, backgroundOpacity);
                      addToRecentBackgroundColors(color);
                    }}
                    disabled={!selectedObject}
                    className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                      backgroundStyle === 'solid' && backgroundColor === color
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border/30'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* 最近使用 */}
            {recentBackgroundColors.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">最近使用</label>
                <div className="flex gap-1.5">
                  {recentBackgroundColors.slice(0, 2).map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setBackgroundStyle('solid');
                        setBackgroundColor(color);
                        onBackgroundChange?.('solid', color, backgroundOpacity);
                        addToRecentBackgroundColors(color);
                      }}
                      disabled={!selectedObject}
                      className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                        backgroundStyle === 'solid' && backgroundColor === color
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border/30'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
        </TabsContent>

        {/* 下划线 Tab 内容 */}
        <TabsContent value="underline" className="px-8 py-6 space-y-4">

        {/* 样式选择 */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`border-black ${
              underlineStyle === 'none'
                ? 'bg-black text-white hover:bg-black hover:text-white'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
            onClick={() => {
              setUnderlineStyle('none');
              onUnderlineChange?.('none');
            }}
            disabled={!selectedObject}
          >
            无
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`border-black ${
              underlineStyle === 'solid'
                ? 'bg-black text-white hover:bg-black hover:text-white'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
            onClick={() => {
              setUnderlineStyle('solid');
              onUnderlineChange?.('solid', underlineWidth, underlineColor);
            }}
            disabled={!selectedObject}
          >
            直线
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`border-black ${
              underlineStyle === 'wavy'
                ? 'bg-black text-white hover:bg-black hover:text-white'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
            onClick={() => {
              setUnderlineStyle('wavy');
              onUnderlineChange?.('wavy', underlineWidth, underlineColor);
            }}
            disabled={!selectedObject}
          >
            波浪
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`border-black ${
              underlineStyle === 'dotted'
                ? 'bg-black text-white hover:bg-black hover:text-white'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
            onClick={() => {
              setUnderlineStyle('dotted');
              onUnderlineChange?.('dotted', underlineWidth, underlineColor);
            }}
            disabled={!selectedObject}
          >
            点线
          </Button>
        </div>

        {/* 颜色和粗细 */}
        {underlineStyle !== 'none' && (
          <div className="space-y-4">
            {/* 颜色选择 + 粗细控制 */}
            <div className="flex items-start gap-4">
              {/* 下划线颜色 - 小方块 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground h-[18px] leading-[18px]">颜色</label>
                <ColorPicker
                  color={underlineColor}
                  onChange={(color) => {
                    setUnderlineColor(color);
                    onUnderlineChange?.(underlineStyle, underlineWidth, color);
                  }}
                  compact
                  disabled={!selectedObject}
                />
              </div>

              {/* 粗细 */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground h-[18px] leading-[18px]">粗细</label>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 active:scale-95 transition-transform"
                    onClick={() => {
                      const newWidth = Math.max(1, underlineWidth - 1);
                      setUnderlineWidth(newWidth);
                      onUnderlineChange?.(underlineStyle, newWidth, underlineColor);
                    }}
                    disabled={!selectedObject || underlineWidth <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex-1 text-center h-8 flex items-center justify-center">
                    <div className="text-base font-semibold tabular-nums">
                      {underlineWidth}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 active:scale-95 transition-transform"
                    onClick={() => {
                      const newWidth = Math.min(20, underlineWidth + 1);
                      setUnderlineWidth(newWidth);
                      onUnderlineChange?.(underlineStyle, newWidth, underlineColor);
                    }}
                    disabled={!selectedObject || underlineWidth >= 20}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 推荐颜色 */}
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">推荐颜色</label>
              <div className="grid grid-cols-10 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setUnderlineColor(color);
                      onUnderlineChange?.(underlineStyle, underlineWidth, color);
                    }}
                    disabled={!selectedObject}
                    className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                      underlineColor === color
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border/30'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        </TabsContent>

        {/* 边框 Tab 内容 */}
        <TabsContent value="border" className="px-8 py-6 space-y-4">

        {/* 样式选择 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 border-black ${
              borderStyle === 'none'
                ? 'bg-black text-white hover:bg-black hover:text-white'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
            onClick={() => {
              setBorderStyle('none');
              onBorderChange?.('none');
            }}
            disabled={!selectedObject}
          >
            无
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 border-black ${
              borderStyle === 'solid'
                ? 'bg-black text-white hover:bg-black hover:text-white'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
            onClick={() => {
              setBorderStyle('solid');
              onBorderChange?.('solid', borderWidth, borderColor);
            }}
            disabled={!selectedObject}
          >
            实线
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 border-black ${
              borderStyle === 'dashed'
                ? 'bg-black text-white hover:bg-black hover:text-white'
                : 'bg-white text-black hover:bg-gray-50'
            }`}
            onClick={() => {
              setBorderStyle('dashed');
              onBorderChange?.('dashed', borderWidth, borderColor);
            }}
            disabled={!selectedObject}
          >
            虚线
          </Button>
        </div>

        {/* 颜色和粗细 */}
        {borderStyle !== 'none' && (
          <div className="space-y-4">
            {/* 颜色选择 + 粗细控制 */}
            <div className="flex items-start gap-4">
              {/* 边框颜色 - 小方块 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground h-[18px] leading-[18px]">颜色</label>
                <ColorPicker
                  color={borderColor}
                  onChange={(color) => {
                    setBorderColor(color);
                    onBorderChange?.(borderStyle, borderWidth, color);
                  }}
                  compact
                  disabled={!selectedObject}
                />
              </div>

              {/* 粗细 */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground h-[18px] leading-[18px]">粗细</label>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 active:scale-95 transition-transform"
                    onClick={() => {
                      const newWidth = Math.max(1, borderWidth - 1);
                      setBorderWidth(newWidth);
                      onBorderChange?.(borderStyle, newWidth, borderColor);
                    }}
                    disabled={!selectedObject || borderWidth <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex-1 text-center h-8 flex items-center justify-center">
                    <div className="text-base font-semibold tabular-nums">
                      {borderWidth}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 active:scale-95 transition-transform"
                    onClick={() => {
                      const newWidth = Math.min(20, borderWidth + 1);
                      setBorderWidth(newWidth);
                      onBorderChange?.(borderStyle, newWidth, borderColor);
                    }}
                    disabled={!selectedObject || borderWidth >= 20}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 推荐颜色 */}
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">推荐颜色</label>
              <div className="grid grid-cols-10 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setBorderColor(color);
                      onBorderChange?.(borderStyle, borderWidth, color);
                    }}
                    disabled={!selectedObject}
                    className={`w-6 h-6 rounded border transition-all hover:scale-110 ${
                      borderColor === color
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border/30'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        </TabsContent>
          </Tabs>
        </>
      )}
    </aside>
  );
}
