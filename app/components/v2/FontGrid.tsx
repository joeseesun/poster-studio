// 字体网格组件
'use client';

import { useState } from 'react';
import { FONTS, COLORS, FontConfig, LOCAL_OR_SYSTEM_FONTS } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface FontGridProps {
  selectedFont: string;
  onFontChange: (fontFamily: string) => void;
}

export default function FontGrid({ selectedFont, onFontChange }: FontGridProps) {
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
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.text.primary }}>
        字体
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {FONTS.map((font) => {
          const isSelected = selectedFont === font.family;
          const isLoading = loadingFonts.has(font.family);
          const isLoaded = loadedFonts.has(font.family);

          return (
            <button
              key={font.family}
              onClick={() => handleFontClick(font)}
              className="relative group"
              style={{
                height: '80px',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                backgroundColor: isSelected ? `${COLORS.primary}05` : COLORS.surface,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
            >
              {isLoading ? (
                <Loader2
                  size={20}
                  className="animate-spin"
                  style={{ color: COLORS.icon.default }}
                />
              ) : (
                <>
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{
                      fontFamily: isLoaded ? font.family : 'inherit',
                      color: COLORS.text.primary,
                    }}
                  >
                    {font.preview}
                  </div>
                  <div className="text-xs" style={{ color: COLORS.text.secondary }}>
                    {font.name}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
