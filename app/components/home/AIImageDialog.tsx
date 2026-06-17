'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Plus, Pencil, Trash2, X } from 'lucide-react';
import { getQuickPromptsManager, QuickPrompt } from '@/lib/quick-prompts';

interface AIImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (prompt: string, size: string) => Promise<void>;
}

// 尺寸选项（总像素数必须 ≥ 921600）
const sizeOptions = [
  { label: '1:1 (1024x1024)', value: '1024x1024', ratio: '1:1', pixels: 1048576 },
  { label: '4:3 (1152x864)', value: '1152x864', ratio: '4:3', pixels: 995328 },
  { label: '3:4 (864x1152)', value: '864x1152', ratio: '3:4', pixels: 995328 },
  { label: '16:9 (1280x720)', value: '1280x720', ratio: '16:9', pixels: 921600 },
  { label: '21:9 (1680x720)', value: '1680x720', ratio: '21:9', pixels: 1209600 },
  { label: '9:16 (720x1280)', value: '720x1280', ratio: '9:16', pixels: 921600 },
];

export function AIImageDialog({ open, onOpenChange, onGenerate }: AIImageDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024'); // 默认 1:1
  const [isGenerating, setIsGenerating] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<QuickPrompt[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newPromptText, setNewPromptText] = useState('');

  // 加载快速提示词
  useEffect(() => {
    const manager = getQuickPromptsManager();
    setQuickPrompts(manager.getAll());
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('请输入提示词');
      return;
    }

    setIsGenerating(true);
    try {
      // 调用生成函数（现在是异步的，会立即返回）
      await onGenerate(prompt, size);

      // 立即清空输入并关闭对话框
      setPrompt('');
      onOpenChange(false);

      // 提示用户图片正在后台生成
      console.log('💡 图片正在后台生成，请稍候...');
    } catch (error) {
      console.error('启动生成失败:', error);
      alert(`启动生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter 生成
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  // 添加快速提示词
  const handleAddPrompt = () => {
    if (!newPromptText.trim()) return;
    const manager = getQuickPromptsManager();
    manager.add(newPromptText);
    setQuickPrompts(manager.getAll());
    setNewPromptText('');
    setIsAdding(false);
  };

  // 更新快速提示词
  const handleUpdatePrompt = (id: string) => {
    if (!editingText.trim()) return;
    const manager = getQuickPromptsManager();
    manager.update(id, editingText);
    setQuickPrompts(manager.getAll());
    setEditingId(null);
    setEditingText('');
  };

  // 删除快速提示词
  const handleDeletePrompt = (id: string) => {
    const manager = getQuickPromptsManager();
    manager.delete(id);
    setQuickPrompts(manager.getAll());
  };

  // 开始编辑
  const startEdit = (prompt: QuickPrompt) => {
    setEditingId(prompt.id);
    setEditingText(prompt.text);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gray-700" />
            AI 生成图片
            <span className="text-xs font-normal text-gray-400 ml-1">（预计10-30s生图）</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 尺寸选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              图片尺寸
            </label>
            <div className="flex gap-2 flex-wrap">
              {sizeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSize(option.value)}
                  disabled={isGenerating}
                  className={`px-3 py-2 text-xs rounded border transition-colors ${
                    size === option.value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {option.ratio}
                </button>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              当前选择：{sizeOptions.find(o => o.value === size)?.label}
            </div>
          </div>

          {/* 提示词输入 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              提示词
              <span className="text-muted-foreground ml-2 text-xs">
                (Cmd/Ctrl + Enter 生成)
              </span>
            </label>
            <Textarea
              placeholder="描述你想要生成的图片，例如：星际穿越，黑洞，电影大片..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={5}
              className="resize-none placeholder:text-gray-400"
              disabled={isGenerating}
            />
          </div>

          {/* 快速提示词 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                快速提示词（点击使用）
              </label>
              {/* 新增按钮 - 移到标题右侧 */}
              {!isAdding && (
                <button
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
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
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
                      if (e.key === 'Enter') handleAddPrompt();
                      if (e.key === 'Escape') {
                        setIsAdding(false);
                        setNewPromptText('');
                      }
                    }}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      onClick={handleAddPrompt}
                      className="px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
                    >
                      保存
                    </button>
                    <button
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
                <div
                  key={promptItem.id}
                  className="group relative"
                >
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
                          if (e.key === 'Enter') handleUpdatePrompt(promptItem.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button
                          onClick={() => handleUpdatePrompt(promptItem.id)}
                          className="px-2 py-1 text-xs bg-gray-900 text-white rounded hover:bg-gray-800"
                        >
                          保存
                        </button>
                        <button
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
                        onClick={() => setPrompt(promptItem.text)}
                        disabled={isGenerating}
                        className="w-full text-left px-3 py-2 pr-20 text-xs border border-gray-200 rounded hover:border-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {promptItem.text}
                      </button>

                      {/* Hover时显示的编辑/删除按钮 */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1 bg-white">
                        <button
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

          {/* 生成按钮 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              取消
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="bg-gray-900 hover:bg-gray-800 text-white border border-gray-900"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成图片
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
