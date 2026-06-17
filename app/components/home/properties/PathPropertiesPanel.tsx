// 线条/路径属性面板
'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ColorPicker from '../ColorPicker';

interface PathPropertiesPanelProps {
  selectedObject: any;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
}

export default function PathPropertiesPanel({
  selectedObject,
  onStrokeColorChange,
  onStrokeWidthChange,
  onOpacityChange,
}: PathPropertiesPanelProps) {
  // 判断对象类型
  const isLine = selectedObject?.type === 'line';
  const isPath = selectedObject?.type === 'path';
  const isArrow = selectedObject?.shapeType === 'arrow';

  // 获取当前属性值
  // 箭头使用 fill 来显示颜色，其他使用 stroke
  const strokeColor = isArrow
    ? (selectedObject?.fill || '#000000')
    : (selectedObject?.stroke || '#000000');
  const strokeWidth = selectedObject?.strokeWidth || 7;
  const opacity = selectedObject?.opacity !== undefined ? selectedObject.opacity * 100 : 100;

  const [strokeWidthInput, setStrokeWidthInput] = useState(String(strokeWidth));
  const [opacityInput, setOpacityInput] = useState(String(Math.round(opacity)));

  // 同步输入框值
  useEffect(() => {
    setStrokeWidthInput(String(strokeWidth));
  }, [strokeWidth]);

  useEffect(() => {
    setOpacityInput(String(Math.round(opacity)));
  }, [opacity]);

  return (
    <aside
      className="flex flex-col overflow-y-auto bg-background"
      style={{ width: '360px', borderLeft: '1px solid hsl(var(--border))' }}
    >
      <div className="p-4 space-y-6">
        <h3 className="text-sm font-semibold">
          {isLine ? '线条属性' : '路径属性'}
        </h3>

        {/* 颜色 */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {isLine ? '线条颜色' : '描边颜色'}
          </Label>
          <ColorPicker
            color={strokeColor}
            onChange={onStrokeColorChange}
          />
        </div>

        {/* 粗细 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {isLine ? '线条粗细' : '描边粗细'}
            </Label>
            <Input
              type="number"
              value={strokeWidthInput}
              onChange={(e) => {
                setStrokeWidthInput(e.target.value);
              }}
              onBlur={() => {
                const value = parseFloat(strokeWidthInput);
                if (!isNaN(value) && value >= 0.5 && value <= 200) {
                  onStrokeWidthChange(value);
                } else {
                  setStrokeWidthInput(String(strokeWidth));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseFloat(strokeWidthInput);
                  if (!isNaN(value) && value >= 0.5 && value <= 200) {
                    onStrokeWidthChange(value);
                  } else {
                    setStrokeWidthInput(String(strokeWidth));
                  }
                }
              }}
              className="w-20 h-8 text-xs text-right"
              min={0.5}
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
            min={0.5}
            max={200}
            step={0.5}
            className="w-full"
          />
        </div>

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

        {/* 提示信息 */}
        {isPath && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            💡 提示: 这是一个{selectedObject?.isShape ? '箭头' : '画笔路径'}对象
          </div>
        )}
      </div>
    </aside>
  );
}
