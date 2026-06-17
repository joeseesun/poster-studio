// 图片转图片对话框
'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronDown, ChevronUp, Plus, Pencil, Trash2, X } from 'lucide-react';
import { getImageToImagePromptsManager, ImageToImagePrompt } from '@/lib/image-to-image-prompts';

interface ImageToImageDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, size: '1K' | '2K' | '4K') => Promise<void>;
  imageCount: number; // 选中的图片/对象数量
}

export default function ImageToImageDialog({
  open,
  onClose,
  onGenerate,
  imageCount
}: ImageToImageDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 快捷提示词相关状态
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<ImageToImagePrompt[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPromptText, setNewPromptText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // 加载快捷提示词
  useEffect(() => {
    if (open) {
      const manager = getImageToImagePromptsManager();
      setQuickPrompts(manager.getAll());
    }
  }, [open]);

  // 对话框打开时自动聚焦输入框
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      // 调用生成函数（现在是异步的，会立即返回）
      await onGenerate(prompt, size);

      // 立即清空输入并关闭对话框
      setPrompt('');
      onClose();

      // 提示用户图片正在后台生成
      console.log('💡 图片正在后台生成，请稍候...');
    } catch (error) {
      console.error('启动生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter提交,Shift+Enter换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Esc关闭
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // 添加快速提示词
  const handleAddPrompt = () => {
    if (!newPromptText.trim()) return;
    const manager = getImageToImagePromptsManager();
    manager.add(newPromptText);
    setQuickPrompts(manager.getAll());
    setNewPromptText('');
    setIsAdding(false);
  };

  // 更新快速提示词
  const handleUpdatePrompt = (id: string) => {
    if (!editingText.trim()) return;
    const manager = getImageToImagePromptsManager();
    manager.update(id, editingText);
    setQuickPrompts(manager.getAll());
    setEditingId(null);
    setEditingText('');
  };

  // 删除快速提示词
  const handleDeletePrompt = (id: string) => {
    const manager = getImageToImagePromptsManager();
    manager.delete(id);
    setQuickPrompts(manager.getAll());
  };

  // 开始编辑
  const startEdit = (promptItem: ImageToImagePrompt) => {
    setEditingId(promptItem.id);
    setEditingText(promptItem.text);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 对话框内容 */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[600px] overflow-hidden">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            AI 图片转换
            <span className="text-xs font-normal text-gray-400">（预计10-30s生图）</span>
            <span className="ml-auto text-sm font-normal text-gray-500">
              已选择 {imageCount} 个对象
            </span>
          </h2>
        </div>

        {/* 内容区 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Prompt输入 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-900">
                描述转换效果
              </label>
              <button
                type="button"
                onClick={() => setShowQuickPrompts(!showQuickPrompts)}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                快捷提示词
                {showQuickPrompts ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* 快捷提示词列表（折叠/展开） */}
            {showQuickPrompts && (
              <div className="mb-3 space-y-2">
                {/* 新增按钮 */}
                {!isAdding && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(true);
                      setNewPromptText('');
                    }}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:border-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    新增
                  </button>
                )}

                {/* 提示词列表容器 */}
                <div className="max-h-[150px] overflow-y-auto space-y-2">
                  {/* 新增输入框 */}
                  {isAdding && (
                    <div className="relative">
                      <input
                        type="text"
                        value={newPromptText}
                        onChange={(e) => setNewPromptText(e.target.value)}
                        placeholder="输入新的提示词,按Enter保存,Esc取消"
                        className="w-full px-3 py-2 pr-20 text-xs border border-gray-300 rounded bg-gray-50 focus:outline-none focus:border-gray-900 placeholder:text-gray-400"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPrompt();
                          }
                          if (e.key === 'Escape') {
                            setIsAdding(false);
                            setNewPromptText('');
                          }
                        }}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button
                          type="button"
                          onClick={handleAddPrompt}
                          className="px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAdding(false);
                            setNewPromptText('');
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 提示词列表 */}
                  {quickPrompts.map((promptItem) => (
                    <div key={promptItem.id} className="group relative">
                      {editingId === promptItem.id ? (
                        // 编辑模式
                        <div className="relative">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            placeholder="按Enter保存,Esc取消"
                            className="w-full px-3 py-2 pr-20 text-xs border border-gray-300 rounded bg-gray-50 focus:outline-none focus:border-gray-900 placeholder:text-gray-400"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleUpdatePrompt(promptItem.id);
                              }
                              if (e.key === 'Escape') cancelEdit();
                            }}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdatePrompt(promptItem.id)}
                              className="px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
                            >
                              保存
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 显示模式
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setPrompt(promptItem.text)}
                            disabled={isGenerating}
                            className="w-full text-left px-3 py-2 pr-20 text-xs border border-gray-200 rounded hover:border-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {promptItem.text}
                          </button>

                          {/* Hover时显示的编辑/删除按钮 */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1 bg-white">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(promptItem);
                              }}
                              disabled={isGenerating}
                              className="p-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                              title="编辑"
                            >
                              <Pencil className="h-3.5 w-3.5 text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePrompt(promptItem.id);
                              }}
                              disabled={isGenerating}
                              className="p-1.5 border border-gray-300 rounded hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                              title="删除"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                imageCount > 1
                  ? "例如: 将图1的服装换为图2的服装"
                  : "例如: 生成狗狗趴在草地上的近景画面"
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 resize-none text-sm placeholder:text-gray-400"
              rows={4}
              disabled={isGenerating}
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter 提交 · Shift+Enter 换行 · Esc 关闭
            </p>
          </div>

          {/* 尺寸选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              输出尺寸
            </label>
            <div className="flex gap-2">
              {(['1K', '2K', '4K'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  disabled={isGenerating}
                  className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                    size === s
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 按钮组 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="flex-1 py-2.5 px-4 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                '生成图片'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
