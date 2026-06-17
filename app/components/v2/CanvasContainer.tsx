// 画布容器 - 自适应缩放
'use client';

import { useEffect, useRef, useState } from 'react';
import { COLORS, CanvasSize } from '@/lib/types';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface CanvasContainerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  canvasSize: CanvasSize;
  onScaleChange?: (scale: number) => void;
}

export default function CanvasContainer({ canvasRef, canvasSize, onScaleChange }: CanvasContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [manualScale, setManualScale] = useState(100);

  // 计算自适应缩放
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth - 64; // 减去 padding
      const containerHeight = container.clientHeight - 64;

      const scaleByWidth = containerWidth / canvasSize.width;
      const scaleByHeight = containerHeight / canvasSize.height;

      const autoScale = Math.min(scaleByWidth, scaleByHeight, 1);
      const finalScale = (autoScale * manualScale) / 100;

      setScale(finalScale);
      onScaleChange?.(finalScale);
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [manualScale, canvasSize, onScaleChange]);

  const handleZoomIn = () => {
    setManualScale(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setManualScale(prev => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setManualScale(100);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center relative"
      style={{
        backgroundColor: COLORS.background,
      }}
    >
      {/* 画布 */}
      <div
        className="shadow-2xl rounded-lg overflow-hidden"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.2s ease-out',
        }}
      >
        <canvas ref={canvasRef} />
      </div>

      {/* 缩放控制 */}
      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
        style={{
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <button
          onClick={handleZoomOut}
          disabled={manualScale <= 50}
          className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ZoomOut size={16} style={{ color: COLORS.icon.default }} />
        </button>

        <button
          onClick={handleZoomReset}
          className="px-3 py-1 text-sm rounded hover:bg-gray-100 transition-colors"
          style={{ color: COLORS.text.primary }}
        >
          {manualScale}%
        </button>

        <button
          onClick={handleZoomIn}
          disabled={manualScale >= 200}
          className="p-1 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ZoomIn size={16} style={{ color: COLORS.icon.default }} />
        </button>
      </div>

      {/* 画布尺寸提示 */}
      <div
        className="absolute top-4 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded text-xs"
        style={{
          backgroundColor: `${COLORS.text.primary}90`,
          color: COLORS.surface,
        }}
      >
        {canvasSize.width} × {canvasSize.height} px ({canvasSize.ratio})
      </div>
    </div>
  );
}
