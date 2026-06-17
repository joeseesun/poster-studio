// 顶部导航栏
'use client';


import { CanvasVersion, CanvasSize, CANVAS_RATIOS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Download, Copy, Plus, ZoomIn, ZoomOut, Pencil, Trash2, Check, X, Database, ChevronDown, Palette, Hand, MousePointer2, Settings, Heart, QrCode, Layout, Save, Share2, Loader2, Github, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TopbarProps {
  versions: CanvasVersion[];
  activeVersionId: string;
  canvasSize: CanvasSize;
  canvasScale: number;
  isPanMode?: boolean;
  onVersionChange: (id: string) => void;
  onNewVersion: () => void;
  onDuplicateVersion: () => void;
  onRenameVersion: (id: string, newName: string) => void;
  onDeleteVersion: (id: string) => void;
  onCanvasSizeChange: (size: CanvasSize) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPanModeToggle?: () => void;
  onDownload: () => void;
  onCopy?: () => void;
  onShare: () => void;
  isSharing?: boolean;
  onOpenSettings?: () => void;
  onOpenDonation?: () => void;
  onOpenWeChat?: () => void;
  onOpenTemplateLibrary?: () => void;
  onSaveAsTemplate?: () => void;
}

export default function Topbar({
  versions,
  activeVersionId,
  canvasSize,
  canvasScale,
  isPanMode = false,
  onVersionChange,
  onNewVersion,
  onDuplicateVersion,
  onRenameVersion,
  onDeleteVersion,
  onCanvasSizeChange,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPanModeToggle,
  onDownload,
  onCopy,
  onShare,
  isSharing = false,
  onOpenSettings,
  onOpenDonation,
  onOpenWeChat,
  onOpenTemplateLibrary,
  onSaveAsTemplate,
}: TopbarProps) {
  const [sizeMenuOpen, setSizeMenuOpen] = useState(false);
  const [versionMenuOpen, setVersionMenuOpen] = useState(false);
  const [activeRatio, setActiveRatio] = useState<'3:4' | '1:1' | '4:3' | '16:9' | '21:9' | '9:16'>('3:4');
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const activeVersion = versions.find((v) => v.id === activeVersionId);

  useEffect(() => {
    if (canvasSize.ratio in CANVAS_RATIOS) {
      setActiveRatio(canvasSize.ratio as keyof typeof CANVAS_RATIOS);
    }
  }, [canvasSize.ratio]);

  const handleStartRename = (version: CanvasVersion) => {
    setEditingVersionId(version.id);
    setEditingName(version.name);
  };

  const handleSaveRename = () => {
    if (editingVersionId && editingName.trim()) {
      onRenameVersion(editingVersionId, editingName.trim());
    }
    setEditingVersionId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingVersionId(null);
    setEditingName('');
  };

  return (
    <header
      className="flex items-center justify-between px-8 bg-background"
      style={{ height: '64px', borderBottom: '1px solid hsl(var(--border))' }}
    >
      {/* 左侧：Logo + 版本选择 + 尺寸选择 */}
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-foreground text-base">乔木画布</span>
        </div>

        {/* 版本选择 */}
        <DropdownMenu open={versionMenuOpen} onOpenChange={setVersionMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 px-5 border-gray-200 gap-2">
              {activeVersion?.name || '画布 1'}
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 border-gray-200">
            {/* 版本列表 */}
            <div className="max-h-80 overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`group flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded-sm ${
                    version.id === activeVersionId ? 'bg-gray-100' : ''
                  }`}
                >
                  {editingVersionId === version.id ? (
                    // 编辑模式
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename();
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveRename}
                        className="p-1 hover:bg-gray-50 rounded"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 hover:bg-gray-50 rounded"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    // 正常模式
                    <>
                      <button
                        onClick={() => {
                          onVersionChange(version.id);
                          setVersionMenuOpen(false);
                        }}
                        className="flex-1 text-left px-2 py-1 text-sm"
                      >
                        {version.name}
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(version);
                          }}
                          className="p-1 hover:bg-white rounded"
                          title="重命名"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        {versions.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`确定删除画布"${version.name}"吗？`)) {
                                onDeleteVersion(version.id);
                              }
                            }}
                            className="p-1 hover:bg-white rounded"
                            title="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onNewVersion}>
              <Plus className="mr-2 h-4 w-4" />
              新建画布
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicateVersion}>
              <Copy className="mr-2 h-4 w-4" />
              复制当前画布
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 尺寸选择 */}
        <DropdownMenu open={sizeMenuOpen} onOpenChange={setSizeMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 px-5 border-gray-200 gap-2">
              {canvasSize.name} ({canvasSize.ratio})
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80 border-gray-200">
            {/* 比例 Tab */}
            <div className="flex border-b border-gray-200">
              {(['3:4', '1:1', '4:3', '16:9', '21:9', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setActiveRatio(ratio)}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                    activeRatio === ratio
                      ? 'text-gray-900 border-b-2 border-gray-400'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* 尺寸列表 */}
            <div className="p-3">
              {CANVAS_RATIOS[activeRatio].map((size) => (
                <button
                  key={size.name}
                  onClick={() => {
                    onCanvasSizeChange(size);
                    setSizeMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left rounded-md transition-colors flex items-center justify-between ${
                    canvasSize.name === size.name
                      ? 'bg-gray-100 text-gray-900'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium">{size.name}</span>
                  {canvasSize.name === size.name && (
                    <span className="text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 模板库按钮 */}
        {onOpenTemplateLibrary && (
          <Button
            variant="outline"
            onClick={onOpenTemplateLibrary}
            className="h-10 px-4 border-gray-200 gap-2"
          >
            <Layout className="h-4 w-4" />
            模板
          </Button>
        )}

        {/* 另存为模板按钮 */}
        {onSaveAsTemplate && (
          <Button
            variant="outline"
            onClick={onSaveAsTemplate}
            className="h-10 px-4 border-gray-200 gap-2"
          >
            <Save className="h-4 w-4" />
            另存为模板
          </Button>
        )}
      </div>

      {/* 右侧：缩放控制 + 复制 + 下载 */}
      <div className="flex items-center gap-3">
        {/* 缩放控制 */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-gray-200 bg-background">
          {/* 拖拽模式切换 */}
          <button
            onClick={onPanModeToggle}
            className={`p-1 rounded transition-colors ${
              isPanMode
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'hover:bg-accent text-muted-foreground'
            }`}
            title={isPanMode ? '退出拖拽模式 (点击或按ESC)' : '进入拖拽模式 (或按住空格键)'}
          >
            {isPanMode ? (
              <Hand className="h-4 w-4" />
            ) : (
              <MousePointer2 className="h-4 w-4" />
            )}
          </button>

          <div className="w-px h-4 bg-gray-200" />

          <button
            onClick={onZoomOut}
            className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={onZoomReset}
            className="px-3 py-1 text-sm rounded hover:bg-accent transition-colors text-foreground min-w-[50px]"
          >
            {Math.round(canvasScale * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1 rounded hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {onCopy && (
          <Button className="h-10 px-6 py-2 gap-2 shadow-sm" onClick={onCopy}>
            <Copy className="h-4 w-4" />
            复制
          </Button>
        )}
        <Button className="h-10 px-6 py-2 gap-2 shadow-sm" onClick={onDownload}>
          <Download className="h-4 w-4" />
          下载
        </Button>
        <Button
          className="h-10 px-6 py-2 gap-2 shadow-sm"
          onClick={onShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              分享
            </>
          )}
        </Button>

        {/* 更多菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onOpenSettings && (
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="h-4 w-4 mr-2" />
                设置
              </DropdownMenuItem>
            )}
            {onOpenDonation && (
              <DropdownMenuItem onClick={onOpenDonation}>
                <Heart className="h-4 w-4 mr-2" />
                打赏
              </DropdownMenuItem>
            )}
            {onOpenWeChat && (
              <DropdownMenuItem onClick={onOpenWeChat}>
                <QrCode className="h-4 w-4 mr-2" />
                公众号
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.open('https://github.com/joeseesun/poster-studio', '_blank')}>
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open('https://tuijian.qiaomu.ai/', '_blank')}>
              <Sparkles className="h-4 w-4 mr-2" />
              乔木推荐
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open('https://x.com/vista8', '_blank')}>
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              联系作者
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
