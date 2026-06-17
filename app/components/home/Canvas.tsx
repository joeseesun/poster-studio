// 画布容器
'use client';

import { useEffect, useState, RefObject } from 'react';
import { CanvasSize } from '@/lib/types';
import { ZoomIn, ZoomOut, Hand } from 'lucide-react';

interface CanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  canvasSize: CanvasSize;
  userZoom?: number; // 用户手动缩放（50-200）
  isPanMode?: boolean; // 是否锁定拖拽模式
  onScaleChange?: (scale: number) => void;
  onUserZoomChange?: (zoom: number) => void; // 新增：通知父组件用户缩放变化
  onContextMenu?: (e: React.MouseEvent<HTMLCanvasElement>) => void; // 右键菜单
}

export default function Canvas({
  canvasRef,
  canvasSize,
  userZoom = 100,
  isPanMode = false,
  onScaleChange,
  onUserZoomChange,
  onContextMenu,
}: CanvasProps) {
  const [autoScale, setAutoScale] = useState(1);

  // 画布平移状态
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // 判断是否可以拖拽：仅锁定模式（移除空格键快捷键）
  const canPan = isPanMode;

  // 测试原生contextmenu事件
  useEffect(() => {
    if (!canvasRef.current) return;

    const handleNativeContextMenu = (e: MouseEvent) => {
      console.log('🟢🟢🟢 原生contextmenu事件触发了!', e.type, e.button);
    };

    canvasRef.current.addEventListener('contextmenu', handleNativeContextMenu);

    return () => {
      canvasRef.current?.removeEventListener('contextmenu', handleNativeContextMenu);
    };
  }, [canvasRef]);

  // 计算自动缩放比例（移除最大值限制，允许缩小显示大画布）
  useEffect(() => {
    const updateScale = () => {
      const container = document.getElementById('canvas-container');
      if (!container) return;

      const containerWidth = container.clientWidth - 80; // 增加边距
      const containerHeight = container.clientHeight - 120; // 增加边距（考虑缩放控制条）

      const scaleByWidth = containerWidth / canvasSize.width;
      const scaleByHeight = containerHeight / canvasSize.height;
      // 移除 Math.min(..., 1) 限制，允许画布自动缩小以适应容器
      const newAutoScale = Math.min(scaleByWidth, scaleByHeight);

      setAutoScale(newAutoScale);
    };

    // 立即执行一次
    updateScale();

    // 监听窗口大小变化
    window.addEventListener('resize', updateScale);

    // 使用 setTimeout 确保在画布尺寸改变后重新计算
    const timer = setTimeout(updateScale, 100);

    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(timer);
    };
  }, [canvasSize]);

  // 通知父组件缩放变化
  useEffect(() => {
    const finalScale = (autoScale * userZoom) / 100;
    onScaleChange?.(finalScale);
  }, [autoScale, userZoom, onScaleChange]);

  // 双指缩放（触控板手势）
  useEffect(() => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // 检测是否是触控板双指缩放手势（ctrlKey 为 true）
      if (e.ctrlKey) {
        e.preventDefault();

        // 触控板双指缩放手势：
        // - 双指分开(放大): deltaY < 0
        // - 双指合拢(缩小): deltaY > 0
        // 因此需要取反: zoomChange = -deltaY
        const zoomSpeed = 0.3;
        const zoomChange = -e.deltaY * zoomSpeed;

        // 计算新的缩放值（限制在 50-200 之间）
        const newZoom = Math.min(200, Math.max(50, userZoom + zoomChange));

        // 通知父组件更新缩放
        onUserZoomChange?.(newZoom);
      }
    };

    // 添加事件监听器，使用 passive: false 以允许 preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [userZoom, onUserZoomChange]);

  // 🔥 移除空格键快捷键功能
  // 原因：空格键会干扰输入框、文本编辑等场景
  // 用户可以使用顶部工具栏的「手型」按钮来切换拖拽模式

  // 处理画布拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (canPan) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && canPan) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  // 处理容器点击,用于退出文本编辑模式
  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const canvasElement = canvasRef.current;

    console.log('🖱️ Container clicked:', {
      target: target.tagName,
      targetId: target.id,
      canvasElement: canvasElement?.tagName,
      isCanvas: target === canvasElement,
      targetIsCanvas: target.tagName === 'CANVAS',
    });

    // 如果点击的是CANVAS标签,说明点击了canvas元素,不触发退出
    if (target.tagName === 'CANVAS') {
      console.log('⏭️ Clicked on canvas element, skipping');
      return;
    }

    // 点击的是灰色区域或其他元素,触发退出编辑
    console.log('✅ Clicked outside canvas, dispatching custom event');
    const customEvent = new CustomEvent('canvas-container-click', {
      bubbles: true,
      detail: { target }
    });
    document.dispatchEvent(customEvent);
  };

  const finalScale = (autoScale * userZoom) / 100;

  return (
    <div
      id="canvas-container"
      className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundColor: '#F7F8FA',
        cursor: canPan ? (isPanning ? 'grabbing' : 'grab') : 'default',
      }}
      onClick={handleContainerClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* 画布容器（带边框和阴影） */}
      <div
        style={{
          width: `${canvasSize.width * finalScale}px`,
          height: `${canvasSize.height * finalScale}px`,
          borderRadius: '4px',
          border: '1px solid hsl(var(--border-medium))',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          backgroundColor: '#fff',
          overflow: 'hidden',
          transition: isPanning ? 'none' : 'all 0.2s ease-out',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          pointerEvents: canPan ? 'none' : 'auto',
        }}
      >
        {/* 画布（缩放） */}
        <div
          style={{
            transform: `scale(${finalScale})`,
            transformOrigin: 'top left',
            width: `${canvasSize.width}px`,
            height: `${canvasSize.height}px`,
          }}
        >
          <canvas
            ref={canvasRef}
            onContextMenu={(e) => {
              console.log('🔴🔴🔴 Canvas内部: contextmenu事件触发了!', e.type);
              onContextMenu?.(e);
            }}
            style={{
              display: 'block',
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`,
            }}
          />
        </div>
      </div>

      {/* 提示信息 */}
      {canPan && !isPanMode && (
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-lg text-sm font-medium pointer-events-none"
          style={{ zIndex: 1000 }}
        >
          按住空格键拖拽画布
        </div>
      )}
      {isPanMode && (
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium pointer-events-none flex items-center gap-2"
          style={{ zIndex: 1000 }}
        >
          <Hand className="h-4 w-4" />
          拖拽模式已激活
        </div>
      )}
    </div>
  );
}
