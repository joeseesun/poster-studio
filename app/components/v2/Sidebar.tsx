// 左侧工具栏 - 纯图标设计
'use client';

import { Type, Square, Palette, AlignCenter, Highlighter, Undo2, Redo2 } from 'lucide-react';
import { COLORS } from '@/lib/types';

interface SidebarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const tools = [
  { id: 'text', icon: Type, label: '文本' },
  { id: 'shape', icon: Square, label: '形状' },
  { id: 'background', icon: Palette, label: '背景' },
  { id: 'align', icon: AlignCenter, label: '对齐' },
  { id: 'highlight', icon: Highlighter, label: '高亮' },
];

export default function Sidebar({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: SidebarProps) {
  return (
    <aside
      className="flex flex-col items-center py-4 gap-2"
      style={{
        width: '48px',
        backgroundColor: COLORS.surface,
        borderRight: `1px solid ${COLORS.border}`,
      }}
    >
      {/* 工具按钮 */}
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            title={tool.label}
            className="group relative"
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              backgroundColor: isActive ? `${COLORS.primary}10` : 'transparent',
              color: isActive ? COLORS.icon.active : COLORS.icon.default,
              transition: 'all 0.2s',
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />

            {/* Tooltip */}
            <span
              className="absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap"
              style={{
                backgroundColor: COLORS.text.primary,
                color: COLORS.surface,
                transition: 'opacity 0.2s',
              }}
            >
              {tool.label}
            </span>
          </button>
        );
      })}

      {/* 分隔线 */}
      <div
        style={{
          width: '24px',
          height: '1px',
          backgroundColor: COLORS.border,
          margin: '8px 0',
        }}
      />

      {/* 撤销/重做 */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="撤销"
        className="group relative"
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          color: canUndo ? COLORS.icon.default : COLORS.icon.disabled,
          cursor: canUndo ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        <Undo2 size={20} />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="重做"
        className="group relative"
        style={{
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          color: canRedo ? COLORS.icon.default : COLORS.icon.disabled,
          cursor: canRedo ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
        }}
      >
        <Redo2 size={20} />
      </button>
    </aside>
  );
}
