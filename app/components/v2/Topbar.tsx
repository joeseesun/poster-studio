// 顶部导航栏 - 版本管理 + 导出
'use client';

import { useState } from 'react';
import { Menu, ChevronDown, Download, Share2, Plus, Copy } from 'lucide-react';
import { COLORS, CanvasVersion, CanvasSize } from '@/lib/types';
import CanvasSizeSelector from './CanvasSizeSelector';

interface TopbarProps {
  versions: CanvasVersion[];
  activeVersionId: string;
  canvasSize: CanvasSize;
  onVersionChange: (id: string) => void;
  onNewVersion: () => void;
  onDuplicateVersion: () => void;
  onCanvasSizeChange: (size: CanvasSize) => void;
  onDownload: () => void;
  onShare: () => void;
}

export default function Topbar({
  versions,
  activeVersionId,
  canvasSize,
  onVersionChange,
  onNewVersion,
  onDuplicateVersion,
  onCanvasSizeChange,
  onDownload,
  onShare,
}: TopbarProps) {
  const [showVersionMenu, setShowVersionMenu] = useState(false);

  const activeVersion = versions.find(v => v.id === activeVersionId);

  return (
    <header
      className="flex items-center justify-between px-6"
      style={{
        height: '48px',
        backgroundColor: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {/* 左侧：Logo + 版本选择 + 尺寸选择 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Menu size={20} style={{ color: COLORS.icon.default }} />
          <span className="font-semibold" style={{ color: COLORS.text.primary }}>
            小红书封面
          </span>
        </div>

        {/* 版本下拉菜单 */}
        <div className="relative">
          <button
            onClick={() => setShowVersionMenu(!showVersionMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
            style={{
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <span className="text-sm" style={{ color: COLORS.text.primary }}>
              {activeVersion?.name || '版本 1'}
            </span>
            <ChevronDown size={16} style={{ color: COLORS.icon.default }} />
          </button>

          {/* 下拉菜单 */}
          {showVersionMenu && (
            <>
              {/* 遮罩层 */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowVersionMenu(false)}
              />

              {/* 菜单内容 */}
              <div
                className="absolute top-full left-0 mt-1 rounded-lg shadow-lg z-20"
                style={{
                  minWidth: '200px',
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                {/* 版本列表 */}
                <div className="py-1">
                  {versions.map((version) => (
                    <button
                      key={version.id}
                      onClick={() => {
                        onVersionChange(version.id);
                        setShowVersionMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                      style={{
                        color: version.id === activeVersionId ? COLORS.primary : COLORS.text.primary,
                      }}
                    >
                      <span>{version.name}</span>
                      {version.id === activeVersionId && (
                        <span style={{ color: COLORS.primary }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* 分隔线 */}
                <div style={{ height: '1px', backgroundColor: COLORS.border }} />

                {/* 操作按钮 */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      onNewVersion();
                      setShowVersionMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                    style={{ color: COLORS.text.primary }}
                  >
                    <Plus size={16} />
                    <span>新建版本</span>
                  </button>
                  <button
                    onClick={() => {
                      onDuplicateVersion();
                      setShowVersionMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                    style={{ color: COLORS.text.primary }}
                  >
                    <Copy size={16} />
                    <span>复制当前版本</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 画布尺寸选择器 */}
        <CanvasSizeSelector
          currentSize={canvasSize}
          onSizeChange={onCanvasSizeChange}
        />
      </div>

      {/* 右侧：导出按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-1.5 rounded transition-colors"
          style={{
            border: `1px solid ${COLORS.border}`,
            color: COLORS.text.primary,
          }}
        >
          <Share2 size={16} />
          <span className="text-sm">分享</span>
        </button>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-1.5 rounded transition-colors"
          style={{
            backgroundColor: COLORS.primary,
            color: COLORS.surface,
          }}
        >
          <Download size={16} />
          <span className="text-sm">导出</span>
        </button>
      </div>
    </header>
  );
}
