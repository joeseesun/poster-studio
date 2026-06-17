// 颜色选择器
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { getRecentColors, addRecentColor } from '@/lib/recent-colors';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  compact?: boolean; // 紧凑模式：只显示色块，不显示数值
  disabled?: boolean;
}

// 预设颜色
const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF2442', '#FF5722', '#E91E63',
  '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4',
  '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#795548', '#9E9E9E',
];

export default function ColorPicker({ color, onChange, label, compact = false, disabled = false }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // 加载最近使用的颜色
  useEffect(() => {
    setRecentColors(getRecentColors());
  }, []);

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    setInputValue(newColor);

    // 添加到最近使用
    addRecentColor(newColor);
    setRecentColors(getRecentColors());
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      handleColorChange(value);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={compact ? "h-8 w-8 p-0 shrink-0" : "w-full justify-start gap-3 h-12"}
            disabled={disabled}
          >
            {compact ? (
              <div
                className="w-full h-full rounded-sm"
                style={{ backgroundColor: color }}
              />
            ) : (
              <>
                <div
                  className="w-8 h-8 rounded border border-border/40"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-mono">{color.toUpperCase()}</span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-5" align="start">
          <div className="space-y-4">
            {/* 颜色输入 */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">颜色值</label>
              <Input
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="#000000"
                className="font-mono"
              />
            </div>

            {/* 最近使用的颜色 */}
            {recentColors.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">最近使用</label>
                <div className="grid grid-cols-10 gap-2.5">
                  {recentColors.map((recentColor, index) => (
                    <button
                      key={`${recentColor}-${index}`}
                      onClick={() => handleColorChange(recentColor)}
                      className={`w-7 h-7 rounded border transition-all hover:scale-110 ${
                        color.toUpperCase() === recentColor.toUpperCase()
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border/30'
                      }`}
                      style={{ backgroundColor: recentColor }}
                      title={recentColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 预设颜色 */}
            <div className="space-y-3">
              <label className="text-xs text-muted-foreground">预设颜色</label>
              <div className="grid grid-cols-10 gap-2.5">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    onClick={() => handleColorChange(presetColor)}
                    className={`w-7 h-7 rounded border transition-all hover:scale-110 ${
                      color.toUpperCase() === presetColor.toUpperCase()
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border/30'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
            </div>

            {/* 原生颜色选择器 */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">自定义颜色</label>
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-10 rounded-md border cursor-pointer"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
