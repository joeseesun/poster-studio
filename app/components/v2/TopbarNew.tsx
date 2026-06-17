// 顶部导航栏 - 使用 Shadcn/ui 重构
'use client';

import { Menu, Plus, Copy, Share2, Download } from 'lucide-react';
import { COLORS, CanvasVersion, CanvasSize } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

export default function TopbarNew({
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
  const activeVersion = versions.find(v => v.id === activeVersionId);

  return (
    <header
      className="flex items-center justify-between px-6 border-b"
      style={{
        height: '48px',
        backgroundColor: COLORS.surface,
        borderColor: COLORS.border,
      }}
    >
      {/* 左侧：Logo + 版本选择 + 尺寸选择 */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Menu size={20} style={{ color: COLORS.icon.default }} />
          <span className="font-semibold" style={{ color: COLORS.text.primary }}>
            小红书封面
          </span>
        </div>

        {/* 版本下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {activeVersion?.name || '版本 1'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {versions.map((version) => (
              <DropdownMenuItem
                key={version.id}
                onClick={() => onVersionChange(version.id)}
              >
                {version.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewVersion}>
              <Plus className="mr-2 h-4 w-4" />
              新建版本
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicateVersion}>
              <Copy className="mr-2 h-4 w-4" />
              复制当前版本
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 画布尺寸选择器 - 暂时保留原组件 */}
        <Button variant="outline" size="sm">
          {canvasSize.name}
        </Button>
      </div>

      {/* 右侧：导出按钮 */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onShare}>
          <Share2 className="mr-2 h-4 w-4" />
          分享
        </Button>
        <Button size="sm" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" />
          导出
        </Button>
      </div>
    </header>
  );
}
