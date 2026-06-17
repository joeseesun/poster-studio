/**
 * SVG 图标属性面板
 * 用于编辑插入的 SVG 图标的颜色、大小等属性
 */

'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ColorPicker from '../ColorPicker';

interface SVGPropertiesPanelProps {
  selectedObject: any;
  onFillColorChange: (color: string) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onOpacityChange: (opacity: number) => void;
  onScaleChange: (scale: number) => void;
}

export default function SVGPropertiesPanel({
  selectedObject,
  onFillColorChange,
  onStrokeColorChange,
  onStrokeWidthChange,
  onOpacityChange,
  onScaleChange,
}: SVGPropertiesPanelProps) {
  // 获取当前属性值
  const getFillColor = () => {
    if (selectedObject?.type === 'group') {
      // Group: 获取第一个有 fill 的子对象的颜色
      const children = (selectedObject as any)._objects || [];
      for (const child of children) {
        if (child.fill && child.fill !== 'transparent') {
          return child.fill;
        }
      }
      return '#000000';
    }
    return selectedObject?.fill || '#000000';
  };

  const getStrokeColor = () => {
    if (selectedObject?.type === 'group') {
      // Group: 获取第一个有 stroke 的子对象的颜色
      const children = (selectedObject as any)._objects || [];
      for (const child of children) {
        if (child.stroke && child.stroke !== 'transparent') {
          return child.stroke;
        }
      }
      return '#000000';
    }
    return selectedObject?.stroke || '#000000';
  };

  const getStrokeWidth = () => {
    if (selectedObject?.type === 'group') {
      // Group: 获取第一个有 strokeWidth 的子对象的宽度
      const children = (selectedObject as any)._objects || [];
      for (const child of children) {
        if (child.strokeWidth !== undefined) {
          return child.strokeWidth;
        }
      }
      return 2;
    }
    return selectedObject?.strokeWidth || 2;
  };

  const fillColor = getFillColor();
  const strokeColor = getStrokeColor();
  const strokeWidth = getStrokeWidth();
  const opacity = selectedObject?.opacity !== undefined ? selectedObject.opacity * 100 : 100;
  const scale = selectedObject?.scaleX || 1;

  // 检查是否有填充和描边
  const hasFill = (() => {
    if (selectedObject?.type === 'group') {
      const children = (selectedObject as any)._objects || [];
      return children.some((child: any) => child.fill && child.fill !== 'transparent');
    }
    return selectedObject?.fill && selectedObject.fill !== 'transparent';
  })();

  const hasStroke = (() => {
    if (selectedObject?.type === 'group') {
      const children = (selectedObject as any)._objects || [];
      return children.some((child: any) => child.stroke && child.stroke !== 'transparent');
    }
    return selectedObject?.stroke && selectedObject.stroke !== 'transparent';
  })();

  // 输入框状态
  const [strokeWidthInput, setStrokeWidthInput] = useState(String(strokeWidth));
  const [opacityInput, setOpacityInput] = useState(String(Math.round(opacity)));
  const [scaleInput, setScaleInput] = useState(String(Math.round(scale * 100)));

  useEffect(() => {
    setStrokeWidthInput(String(strokeWidth));
  }, [strokeWidth]);

  useEffect(() => {
    setOpacityInput(String(Math.round(opacity)));
  }, [opacity]);

  useEffect(() => {
    setScaleInput(String(Math.round(scale * 100)));
  }, [scale]);

  return (
    <aside
      className="flex flex-col overflow-y-auto bg-background"
      style={{ width: '360px', borderLeft: '1px solid hsl(var(--border))' }}
    >
      <div className="p-4 space-y-6">
        <h3 className="text-sm font-semibold">图标属性</h3>

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
                onChange={(e) => setStrokeWidthInput(e.target.value)}
                onBlur={() => {
                  const value = parseFloat(strokeWidthInput);
                  if (!isNaN(value) && value >= 0 && value <= 50) {
                    onStrokeWidthChange(value);
                  } else {
                    setStrokeWidthInput(String(strokeWidth));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-16 h-8 text-xs text-right"
                min={0}
                max={50}
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
              max={50}
              step={0.5}
              className="w-full"
            />
          </div>
        )}

        {/* 大小 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">大小</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={scaleInput}
                onChange={(e) => setScaleInput(e.target.value)}
                onBlur={() => {
                  const value = parseFloat(scaleInput);
                  if (!isNaN(value) && value >= 10 && value <= 500) {
                    onScaleChange(value / 100);
                  } else {
                    setScaleInput(String(Math.round(scale * 100)));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-16 h-8 text-xs text-right"
                min={10}
                max={500}
                step={5}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <Slider
            value={[scale * 100]}
            onValueChange={(value) => {
              const newValue = value[0];
              setScaleInput(String(Math.round(newValue)));
              onScaleChange(newValue / 100);
            }}
            min={10}
            max={500}
            step={5}
            className="w-full"
          />
        </div>

        {/* 透明度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">透明度</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={opacityInput}
                onChange={(e) => setOpacityInput(e.target.value)}
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
                    e.currentTarget.blur();
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
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          💡 提示: 这是一个 SVG 图标对象
        </div>
      </div>
    </aside>
  );
}
