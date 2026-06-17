// 左侧工具栏
'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Type,
  AlignLeft,
  Image,
  Smile,
  Undo2,
  Redo2,
  Sparkles,
  Square,
  Shapes,
  Pencil,
  MousePointer2,
} from 'lucide-react';

interface SidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function Sidebar({
  activeTool,
  onToolChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: SidebarProps) {
  const tools = [
    { id: 'select', label: '选择 (V)', icon: MousePointer2 },
    { id: 'text', label: '单行文本', icon: Type },
    { id: 'textbox', label: '多行文本', icon: AlignLeft },
    { id: 'pencil', label: '画笔 (P)', icon: Pencil },
    { id: 'image', label: '图片', icon: Image },
    { id: 'ai-image', label: 'AI 生图', icon: Sparkles },
    { id: 'emoji', label: 'Emoji', icon: Smile },
    { id: 'shape', label: '形状', icon: Square },
    { id: 'icon', label: '图标库', icon: Shapes },
  ];

  return (
    <aside
      className="flex flex-col items-center py-6 gap-2 bg-background"
      style={{ width: '56px', borderRight: '1px solid hsl(var(--border))' }}
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
                  className="relative h-10 w-10"
                >
                  <Icon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={2} align="center" alignOffset={4}>
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Separator className="w-6 my-2" />

        {/* 撤销/重做 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={2} align="center" alignOffset={4}>
            <p>撤销</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <Redo2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={2} align="center" alignOffset={4}>
            <p>重做</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </aside>
  );
}
