// 形状选择对话框
'use client';

import { Square, Circle, Triangle, Star, Heart, Hexagon, Minus, ArrowRight } from 'lucide-react';

interface ShapeDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectShape: (shapeType: string) => void;
}

const shapes = [
  { id: 'rect', label: '矩形', icon: Square },
  { id: 'circle', label: '圆形', icon: Circle },
  { id: 'triangle', label: '三角形', icon: Triangle },
  { id: 'line', label: '线条', icon: Minus },
  { id: 'arrow', label: '箭头', icon: ArrowRight },
  { id: 'star', label: '五角星', icon: Star },
  { id: 'heart', label: '爱心', icon: Heart },
  { id: 'hexagon', label: '六边形', icon: Hexagon },
];

export default function ShapeDialog({ open, onClose, onSelectShape }: ShapeDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 对话框内容 */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-[480px]">
        <h2 className="text-lg font-semibold mb-4">选择形状</h2>

        {/* 形状网格 */}
        <div className="grid grid-cols-3 gap-3">
          {shapes.map((shape) => {
            const Icon = shape.icon;
            return (
              <button
                key={shape.id}
                onClick={() => {
                  onSelectShape(shape.id);
                  onClose();
                }}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Icon className="h-8 w-8" />
                <span className="text-sm font-medium">{shape.label}</span>
              </button>
            );
          })}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 px-4 rounded-md border border-border hover:bg-gray-50 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  );
}
