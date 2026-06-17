// 左侧工具栏 - 使用 Shadcn/ui 重构
'use client';

import { Type, Square, Palette, AlignCenter, Highlighter, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

const tools = [
  { id: 'text', icon: Type, label: '文本' },
  { id: 'shape', icon: Square, label: '形状' },
  { id: 'background', icon: Palette, label: '背景' },
  { id: 'align', icon: AlignCenter, label: '对齐' },
  { id: 'highlight', icon: Highlighter, label: '高亮' },
];

export default function SidebarNew({
  activeTool,
  onToolChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: SidebarProps) {
  return (
    <aside
      className="flex flex-col items-center py-4 gap-2 border-r bg-background"
      style={{ width: '56px' }}
    >
      <TooltipProvider delayDuration={300}>
        {/* 工具按钮 */}
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => onToolChange(tool.id)}
                  className="relative"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* 分隔线 */}
        <Separator className="w-6 my-2" />

        {/* 撤销/重做 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>撤销</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <Redo2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>重做</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </aside>
  );
}
