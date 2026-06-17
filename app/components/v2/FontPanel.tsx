// 右侧字体面板 - 组合组件
'use client';

import { COLORS } from '@/lib/types';
import FontGrid from './FontGrid';
import TextProperties from './TextProperties';

interface FontPanelProps {
  selectedFont: string;
  fontSize: number;
  textColor: string;
  selectedObject: any;
  onFontChange: (fontFamily: string) => void;
  onFontSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onHighlight: (type: 'marker' | 'underline' | 'box', color: string) => void;
}

export default function FontPanel({
  selectedFont,
  fontSize,
  textColor,
  selectedObject,
  onFontChange,
  onFontSizeChange,
  onColorChange,
  onHighlight,
}: FontPanelProps) {
  return (
    <aside
      className="flex flex-col overflow-y-auto"
      style={{
        width: '280px',
        backgroundColor: COLORS.surface,
        borderLeft: `1px solid ${COLORS.border}`,
      }}
    >
      {/* 字体网格 */}
      <FontGrid selectedFont={selectedFont} onFontChange={onFontChange} />

      {/* 分隔线 */}
      <div style={{ height: '1px', backgroundColor: COLORS.border, margin: '0 16px' }} />

      {/* 文字属性和高亮样式 */}
      {selectedObject && (
        <TextProperties
          fontSize={fontSize}
          textColor={textColor}
          onFontSizeChange={onFontSizeChange}
          onColorChange={onColorChange}
          onHighlight={onHighlight}
        />
      )}
    </aside>
  );
}
