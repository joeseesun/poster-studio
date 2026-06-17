'use client';

import { X } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: '工具',
    items: [
      { key: 'T', description: '文本工具' },
      { key: 'R', description: '矩形工具' },
      { key: 'O', description: '圆形工具' },
      { key: 'L', description: '线条工具' },
      { key: 'Shift + L', description: '箭头工具' },
      { key: 'P', description: '画笔工具' },
      { key: 'V', description: '选择工具' },
      { key: 'H', description: '手型工具(拖拽画布)' },
      { key: 'Space', description: '临时手型工具(按住拖拽)' },
    ],
  },
  {
    category: '编辑',
    items: [
      { key: '⌘/Ctrl + C', description: '复制' },
      { key: '⌘/Ctrl + V', description: '粘贴' },
      { key: '⌘/Ctrl + D', description: '原地复制' },
      { key: '⌘/Ctrl + Z', description: '撤销' },
      { key: '⌘/Ctrl + Shift + Z', description: '重做' },
      { key: 'Delete/Backspace', description: '删除选中对象' },
    ],
  },
  {
    category: '图层',
    items: [
      { key: '⌘/Ctrl + ]', description: '上移一层' },
      { key: '⌘/Ctrl + [', description: '下移一层' },
      { key: '⌘/Ctrl + Shift + ]', description: '置于顶层' },
      { key: '⌘/Ctrl + Shift + [', description: '置于底层' },
    ],
  },
  {
    category: '其他',
    items: [
      { key: '⌘/Ctrl + Shift + D', description: '下载选中对象' },
      { key: 'Tab', description: 'AI图片转换' },
      { key: 'Esc', description: '退出编辑/关闭对话框' },
    ],
  },
];

export default function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 对话框内容 */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            键盘快捷键
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 快捷键列表 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-2 gap-6">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            按 <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 border border-gray-300 rounded">?</kbd> 或 <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 border border-gray-300 rounded">⌘/Ctrl + /</kbd> 打开此帮助
          </p>
        </div>
      </div>
    </div>
  );
}
