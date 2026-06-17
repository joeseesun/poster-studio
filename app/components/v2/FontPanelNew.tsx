// 右侧字体面板 - 使用 Shadcn/ui 重构
'use client';

import { useState } from 'react';
import { FONTS, HIGHLIGHT_COLORS, FontConfig, LOCAL_OR_SYSTEM_FONTS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface FontPanelNewProps {
  selectedFont: string;
  fontSize: number;
  textColor: string;
  selectedObject: any;
  onFontChange: (fontFamily: string) => void;
  onFontSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onHighlight: (type: 'marker' | 'underline' | 'box', color: string) => void;
}

export default function FontPanelNew({
  selectedFont,
  fontSize,
  textColor,
  selectedObject,
  onFontChange,
  onFontSizeChange,
  onColorChange,
  onHighlight,
}: FontPanelNewProps) {
  const [loadingFonts, setLoadingFonts] = useState<Set<string>>(new Set());
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(
    new Set(LOCAL_OR_SYSTEM_FONTS)
  );

  // 懒加载字体
  const loadFont = async (font: FontConfig) => {
    if (loadedFonts.has(font.family) || loadingFonts.has(font.family)) {
      return;
    }

    setLoadingFonts((prev) => new Set(prev).add(font.family));

    try {
      if (font.cssPath || font.customUrl) {
        const link = document.createElement('link');
        link.href = font.cssPath
          ? `/api/fonts?path=${encodeURIComponent(font.cssPath)}&t=${Date.now()}`
          : font.customUrl!;
        link.rel = 'stylesheet';
        if (font.customUrl) {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);

        await document.fonts.ready;
      }

      setLoadedFonts((prev) => new Set(prev).add(font.family));
    } catch (error) {
      console.error(`Failed to load font: ${font.family}`, error);
    } finally {
      setLoadingFonts((prev) => {
        const next = new Set(prev);
        next.delete(font.family);
        return next;
      });
    }
  };

  const handleFontClick = (font: FontConfig) => {
    loadFont(font);
    onFontChange(font.family);
  };

  return (
    <aside className="flex flex-col overflow-y-auto border-l bg-background" style={{ width: '280px' }}>
      {/* 字体网格 */}
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3">字体</h3>
        <div className="grid grid-cols-3 gap-2">
          {FONTS.map((font) => {
            const isSelected = selectedFont === font.family;
            const isLoading = loadingFonts.has(font.family);
            const isLoaded = loadedFonts.has(font.family);

            return (
              <Button
                key={font.family}
                variant={isSelected ? 'default' : 'outline'}
                className="h-20 flex flex-col items-center justify-center p-2"
                onClick={() => handleFontClick(font)}
              >
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
                    <div className="text-xs text-muted-foreground">{font.name}</div>
                  </>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* 文字属性 */}
      {selectedObject && (
        <>
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">文字属性</h3>

            {/* 字号 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">字号</label>
                <span className="text-xs font-medium">{fontSize}</span>
              </div>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => onFontSizeChange(value[0])}
                min={20}
                max={120}
                step={1}
                className="w-full"
              />
            </div>

            {/* 颜色 */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">颜色</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full h-10 rounded-md border cursor-pointer"
              />
            </div>
          </div>

          <Separator />

          {/* 高亮样式 */}
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold">高亮样式</h3>

            {/* 样式按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10 text-xl"
                onClick={() => onHighlight('marker', HIGHLIGHT_COLORS[0])}
                title="荧光笔"
              >
                🖍️
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => onHighlight('underline', HIGHLIGHT_COLORS[0])}
                title="下划线"
              >
                <span className="underline text-xl">A</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 text-xl"
                onClick={() => onHighlight('box', HIGHLIGHT_COLORS[0])}
                title="边框"
              >
                □
              </Button>
            </div>

            {/* 颜色选择 */}
            <div className="flex gap-2">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => onHighlight('marker', color)}
                  className="w-10 h-10 rounded-md border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
