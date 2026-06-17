// 图形属性面板
'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ColorPicker from '../ColorPicker';

interface ShapePropertiesPanelProps {
  selectedObject: any;
  onFillColorChange: (color: string) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
  onCornerRadiusChange?: (radius: number) => void;
}

export default function ShapePropertiesPanel({
  selectedObject,
  onFillColorChange,
  onStrokeColorChange,
  onStrokeWidthChange,
  onOpacityChange,
  onCornerRadiusChange,
}: ShapePropertiesPanelProps) {
  // 获取当前属性值
  const fillColor = selectedObject?.fill || '#3b82f6';
  const strokeColor = selectedObject?.stroke || '#1e40af';
  const strokeWidth = selectedObject?.strokeWidth || 2;
  const opacity = selectedObject?.opacity !== undefined ? selectedObject.opacity * 100 : 100;
  const cornerRadius = selectedObject?.rx || 0;

  // 是否是矩形(支持圆角)
  const isRect = selectedObject?.type === 'rect';

  // 是否有填充
  const hasFill = selectedObject?.fill !== null && selectedObject?.fill !== undefined;

  // 是否有描边
  const hasStroke = selectedObject?.stroke !== null && selectedObject?.stroke !== undefined;

  const [strokeWidthInput, setStrokeWidthInput] = useState(String(strokeWidth));
  const [opacityInput, setOpacityInput] = useState(String(Math.round(opacity)));
  const [cornerRadiusInput, setCornerRadiusInput] = useState(String(cornerRadius));

  // 同步输入框值
  useEffect(() => {
    setStrokeWidthInput(String(strokeWidth));
  }, [strokeWidth]);

  useEffect(() => {
    setOpacityInput(String(Math.round(opacity)));
  }, [opacity]);

  useEffect(() => {
    setCornerRadiusInput(String(cornerRadius));
  }, [cornerRadius]);

  return (
    <aside
      className="flex flex-col overflow-y-auto bg-background"
      style={{ width: '360px', borderLeft: '1px solid hsl(var(--border))' }}
    >
      <div className="p-4 space-y-6">
        <h3 className="text-sm font-semibold">图形属性</h3>

        {/* 填充颜色 */}
        {hasFill && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">填充颜色</Label>
            <ColorPicker
              color={fillColor}
              onChange={onFillColorChange}
            />
          </div>
        )}

        {/* 描边颜色 */}
        {hasStroke && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">描边颜色</Label>
            <ColorPicker
              color={strokeColor}
              onChange={onStrokeColorChange}
            />
          </div>
        )}

        {/* 描边粗细 */}
        {hasStroke && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">描边粗细</Label>
              <Input
                type="number"
                value={strokeWidthInput}
                onChange={(e) => {
                  setStrokeWidthInput(e.target.value);
                }}
                onBlur={() => {
                  const value = parseFloat(strokeWidthInput);
                  if (!isNaN(value) && value >= 0 && value <= 200) {
                    onStrokeWidthChange(value);
                  } else {
                    setStrokeWidthInput(String(strokeWidth));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseFloat(strokeWidthInput);
                    if (!isNaN(value) && value >= 0 && value <= 200) {
                      onStrokeWidthChange(value);
                    } else {
                      setStrokeWidthInput(String(strokeWidth));
                    }
                  }
                }}
                className="w-20 h-8 text-xs text-right"
                min={0}
                max={200}
                step={0.5}
              />
            </div>
            <Slider
              value={[strokeWidth]}
              onValueChange={(value) => {
                const newValue = value[0];
                setStrokeWidthInput(String(newValue));
                onStrokeWidthChange(newValue);
              }}
              min={0}
              max={200}
              step={0.5}
              className="w-full"
            />
          </div>
        )}

        {/* 不透明度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">不透明度</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={opacityInput}
                onChange={(e) => {
                  setOpacityInput(e.target.value);
                }}
                onBlur={() => {
                  const value = parseFloat(opacityInput);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    onOpacityChange(value / 100);
                  } else {
                    setOpacityInput(String(Math.round(opacity)));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseFloat(opacityInput);
                    if (!isNaN(value) && value >= 0 && value <= 100) {
                      onOpacityChange(value / 100);
                    } else {
                      setOpacityInput(String(Math.round(opacity)));
                    }
                  }
                }}
                className="w-16 h-8 text-xs text-right"
                min={0}
                max={100}
                step={1}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <Slider
            value={[opacity]}
            onValueChange={(value) => {
              const newValue = value[0];
              setOpacityInput(String(Math.round(newValue)));
              onOpacityChange(newValue / 100);
            }}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* 圆角 (仅矩形) */}
        {isRect && onCornerRadiusChange && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">圆角</Label>
              <Input
                type="number"
                value={cornerRadiusInput}
                onChange={(e) => {
                  setCornerRadiusInput(e.target.value);
                }}
                onBlur={() => {
                  const value = parseFloat(cornerRadiusInput);
                  if (!isNaN(value) && value >= 0 && value <= 200) {
                    onCornerRadiusChange(value);
                  } else {
                    setCornerRadiusInput(String(cornerRadius));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = parseFloat(cornerRadiusInput);
                    if (!isNaN(value) && value >= 0 && value <= 200) {
                      onCornerRadiusChange(value);
                    } else {
                      setCornerRadiusInput(String(cornerRadius));
                    }
                  }
                }}
                className="w-16 h-8 text-xs text-right"
                min={0}
                max={200}
                step={1}
              />
            </div>
            <Slider
              value={[cornerRadius]}
              onValueChange={(value) => {
                const newValue = value[0];
                setCornerRadiusInput(String(newValue));
                if (onCornerRadiusChange) {
                  onCornerRadiusChange(newValue);
                }
              }}
              min={0}
              max={200}
              step={1}
              className="w-full"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
