// 文字属性组件
'use client';

import { COLORS, HIGHLIGHT_COLORS } from '@/lib/types';

interface TextPropertiesProps {
  fontSize: number;
  textColor: string;
  onFontSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onHighlight: (type: 'marker' | 'underline' | 'box', color: string) => void;
}

export default function TextProperties({
  fontSize,
  textColor,
  onFontSizeChange,
  onColorChange,
  onHighlight,
}: TextPropertiesProps) {
  return (
    <>
      {/* 文字属性 */}
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
          文字属性
        </h3>

        {/* 字号 */}
        <div>
          <label className="text-xs mb-2 block" style={{ color: COLORS.text.secondary }}>
            字号: {fontSize}
          </label>
          <input
            type="range"
            min="20"
            max="120"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full"
            style={{
              accentColor: COLORS.primary,
            }}
          />
        </div>

        {/* 颜色 */}
        <div>
          <label className="text-xs mb-2 block" style={{ color: COLORS.text.secondary }}>
            颜色
          </label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
            style={{
              border: `1px solid ${COLORS.border}`,
            }}
          />
        </div>
      </div>

      {/* 分隔线 */}
      <div style={{ height: '1px', backgroundColor: COLORS.border, margin: '0 16px' }} />

      {/* 高亮样式 */}
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: COLORS.text.primary }}>
          高亮样式
        </h3>

        {/* 样式按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => onHighlight('marker', HIGHLIGHT_COLORS[0])}
            title="荧光笔"
            className="flex-1 h-10 rounded flex items-center justify-center text-xl hover:bg-gray-50 transition-colors"
            style={{
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            🖍️
          </button>
          <button
            onClick={() => onHighlight('underline', HIGHLIGHT_COLORS[0])}
            title="下划线"
            className="flex-1 h-10 rounded flex items-center justify-center text-xl hover:bg-gray-50 transition-colors"
            style={{
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            <span style={{ textDecoration: 'underline' }}>A</span>
          </button>
          <button
            onClick={() => onHighlight('box', HIGHLIGHT_COLORS[0])}
            title="边框"
            className="flex-1 h-10 rounded flex items-center justify-center text-xl hover:bg-gray-50 transition-colors"
            style={{
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.surface,
            }}
          >
            □
          </button>
        </div>

        {/* 颜色选择 */}
        <div className="flex gap-2">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onHighlight('marker', color)}
              className="w-10 h-10 rounded border-2 transition-all hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: COLORS.border,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
