// 画布尺寸选择器
'use client';

import { useState } from 'react';
import { CANVAS_RATIOS, CanvasSize, COLORS } from '@/lib/types';
import { ChevronDown, Check } from 'lucide-react';

interface CanvasSizeSelectorProps {
  currentSize: CanvasSize;
  onSizeChange: (size: CanvasSize) => void;
}

export default function CanvasSizeSelector({
  currentSize,
  onSizeChange,
}: CanvasSizeSelectorProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<'3:4' | '1:1' | '4:3'>('3:4');

  const handleSizeSelect = (size: CanvasSize) => {
    onSizeChange(size);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      {/* 触发按钮 */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
        style={{
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <span className="text-sm" style={{ color: COLORS.text.primary }}>
          {currentSize.name}
        </span>
        <ChevronDown size={16} style={{ color: COLORS.icon.default }} />
      </button>

      {/* 下拉菜单 */}
      {showMenu && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* 菜单内容 */}
          <div
            className="absolute top-full left-0 mt-2 rounded-lg shadow-xl z-50 overflow-hidden"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              minWidth: '280px',
            }}
          >
            {/* 比例选择 */}
            <div className="flex border-b" style={{ borderColor: COLORS.border }}>
              {(['3:4', '1:1', '4:3'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setSelectedRatio(ratio)}
                  className="flex-1 px-4 py-2 text-sm transition-colors"
                  style={{
                    backgroundColor: selectedRatio === ratio ? `${COLORS.primary}10` : 'transparent',
                    color: selectedRatio === ratio ? COLORS.primary : COLORS.text.secondary,
                    borderBottom: selectedRatio === ratio ? `2px solid ${COLORS.primary}` : 'none',
                  }}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* 尺寸列表 */}
            <div className="py-2">
              {CANVAS_RATIOS[selectedRatio].map((size) => {
                const isSelected = size.name === currentSize.name;
                return (
                  <button
                    key={size.name}
                    onClick={() => handleSizeSelect(size)}
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col items-start">
                      <span
                        className="text-sm font-medium"
                        style={{ color: COLORS.text.primary }}
                      >
                        {size.name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: COLORS.text.secondary }}
                      >
                        {size.ratio}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={16} style={{ color: COLORS.primary }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 提示信息 */}
            <div
              className="px-4 py-2 text-xs border-t"
              style={{
                backgroundColor: COLORS.background,
                color: COLORS.text.secondary,
                borderColor: COLORS.border,
              }}
            >
              💡 3:4 是小红书观感最好的比例
            </div>
          </div>
        </>
      )}
    </div>
  );
}
