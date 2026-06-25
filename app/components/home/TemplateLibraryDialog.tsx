/**
 * 模板库对话框
 * 展示模板分类、网格、预览等功能
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2 } from 'lucide-react';
import { getTemplateManager, Template, TemplateCategory } from '@/lib/template-manager';
import { PRESET_TEMPLATES } from '@/lib/preset-templates';
import * as fabric from 'fabric';

interface TemplateLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyTemplate: (templateId: string) => void;
  currentCanvasSize?: { width: number; height: number }; // 🆕 当前画布尺寸
}

export default function TemplateLibraryDialog({
  open,
  onClose,
  onApplyTemplate,
  currentCanvasSize,
}: TemplateLibraryDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Template[]>([]); // 🆕 网友分享的模板
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all' | '网友分享'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmTemplate, setConfirmTemplate] = useState<Template | null>(null);
  const [showAllSizes, setShowAllSizes] = useState(true); // 默认显示所有尺寸
  const [isGenerating, setIsGenerating] = useState(false); // 是否正在生成缩略图
  const [generateProgress, setGenerateProgress] = useState<string[]>([]); // 生成进度日志
  const [debugMode, setDebugMode] = useState(false); // 调试模式（Ctrl+Option+Command+4）
  const [isLoadingPublic, setIsLoadingPublic] = useState(false); // 🆕 是否正在加载公开模板

  // 🆕 清除所有预设模板缓存并重新加载
  const clearPresetCache = () => {
    const manager = getTemplateManager();

    // 删除所有预设模板
    const allTemplates = manager.getAll();
    allTemplates.forEach(template => {
      if (template.isPreset) {
        manager.delete(template.id);
      }
    });

    // 🆕 调试：打印 PRESET_TEMPLATES 的前3个缩略图 URL
    console.log('📋 PRESET_TEMPLATES 的缩略图 URL:');
    PRESET_TEMPLATES.slice(0, 3).forEach(t => {
      console.log(`  ${t.name}: ${t.thumbnail}`);
    });

    // 重新添加预设模板
    manager.addPresetTemplates(PRESET_TEMPLATES);

    // 刷新列表
    const reloadedTemplates = manager.getAll();
    setTemplates(reloadedTemplates);

    // 🆕 调试：打印重新加载后的前3个模板的缩略图 URL
    console.log('📸 重新加载后的模板缩略图 URL:');
    reloadedTemplates.slice(0, 3).forEach(t => {
      console.log(`  ${t.name}: ${t.thumbnail}`);
    });

    console.log('✅ 预设模板缓存已清除并重新加载');
    alert('预设模板缓存已清除！请查看缩略图是否正常显示。');
  };

  // 🆕 生成所有预设模板的缩略图
  const generateAllThumbnails = async () => {
    setIsGenerating(true);
    setGenerateProgress(['🎨 开始生成缩略图...']);

    const manager = getTemplateManager();
    const presetTemplates = PRESET_TEMPLATES;

    for (const template of presetTemplates) {
      try {
        setGenerateProgress(prev => [...prev, `📝 生成: ${template.name}`]);

        // 创建离屏 canvas
        const offscreenCanvas = document.createElement('canvas');
        const { width, height } = template.canvasSize;
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;

        const fabricCanvas = new fabric.Canvas(offscreenCanvas);
        fabricCanvas.setDimensions({ width, height });

        // 背景色映射
        const backgroundColorMap: Record<string, string> = {
          '极简黑白·竖版': '#FFFFFF',
          '引用卡片·蓝色': '#E3F2FD',
          '极简文字·白色': '#FFFFFF',
          '便签纸·粉色': '#FFF0F5',
          '引用卡片·绿色': '#E8F5E9',
          '便签纸·黄色·横版': '#FFFBEA',
          '引用卡片·蓝色·横版': '#E3F2FD',
          '极简文字·白色·方形': '#FFFFFF',
          '便签纸·粉色·方形': '#FFF0F5',
          '极简文字·白色·16:9': '#FFFFFF',
          '便签纸·黄色·9:16': '#FFFBEA',
        };

        const backgroundColor = backgroundColorMap[template.name] || '#FFFFFF';

        // 加载 JSON 并生成缩略图
        const canvasData = JSON.parse(template.canvasJSON);

        await fabricCanvas.loadFromJSON(canvasData);
        fabricCanvas.backgroundColor = backgroundColor;
        fabricCanvas.renderAll();

        // 生成缩略图
        const dataURL = fabricCanvas.toDataURL({
          format: 'png',
          quality: 0.8,
          multiplier: 0.2,
        });

        setGenerateProgress(prev => [...prev, `✅ 生成完成: ${template.name}`]);

        // 保存到服务器
        fetch('/api/save-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: template.name, dataURL }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setGenerateProgress(prev => [...prev, `💾 已保存: ${data.fileName}`]);

              // 🆕 更新 localStorage 中的模板缩略图 URL（添加时间戳强制刷新）
              const manager = getTemplateManager();
              const existingTemplate = manager.getAll().find(t => t.name === template.name);
              if (existingTemplate) {
                const fileName = template.name
                  .replace(/·/g, '-')      // 中文间隔号 → 连字符
                  .replace(/:/g, '-')      // 冒号 → 连字符（用于 16:9, 9:16 等比例）
                  .replace(/\s+/g, '-')    // 空格 → 连字符
                  .toLowerCase() + '.png';
                manager.update(existingTemplate.id, {
                  thumbnail: `/templates/${fileName}?v=${Date.now()}`
                });
              }
            } else {
              setGenerateProgress(prev => [...prev, `❌ 保存失败: ${template.name}`]);
            }
          })
          .catch(err => {
            setGenerateProgress(prev => [...prev, `❌ 保存失败: ${err.message}`]);
          });

        fabricCanvas.dispose();
      } catch (error) {
        setGenerateProgress(prev => [...prev, `❌ 失败: ${template.name} - ${error}`]);
      }
    }

    setGenerateProgress(prev => [...prev, '🎉 全部完成！请刷新页面查看缩略图']);
    setIsGenerating(false);
  };

  // 加载模板
  useEffect(() => {
    if (open) {
      const manager = getTemplateManager();

      // 🆕 清理旧的预设模板（名称不在新列表中的）
      const presetNames = PRESET_TEMPLATES.map(t => t.name);
      const existingTemplates = manager.getAll();
      existingTemplates.forEach(template => {
        if (template.isPreset && !presetNames.includes(template.name)) {
          console.log('🗑️ 删除旧模板:', template.name);
          manager.delete(template.id);
        }
      });

      // 🆕 每次打开都检查并添加缺失的预设模板（已包含静态缩略图 URL）
      manager.addPresetTemplates(PRESET_TEMPLATES);

      // 更新模板列表
      const allTemplates = manager.getAll();
      setTemplates(allTemplates);
      console.log('✅ 预设模板加载完成，共', allTemplates.length, '个模板');

      // 🆕 调试：打印前3个模板的缩略图 URL
      allTemplates.slice(0, 3).forEach(t => {
        console.log(`📸 ${t.name}: ${t.thumbnail?.substring(0, 50)}...`);
      });

      // 🆕 加载公开模板
      loadPublicTemplates();
    }
  }, [open]);

  // 🆕 加载公开模板
  const loadPublicTemplates = async () => {
    setIsLoadingPublic(true);
    try {
      const response = await fetch('/api/templates/public/list');
      const data = await response.json();

      if (data.success) {
        setPublicTemplates(data.templates || []);
        console.log('✅ 加载公开模板成功，数量:', data.templates?.length || 0);
      }
    } catch (error) {
      console.error('❌ 加载公开模板失败:', error);
    } finally {
      setIsLoadingPublic(false);
    }
  };

  // 监听快捷键 Ctrl + Option + Command + 4 来启用调试模式
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 检测 Ctrl + Option + Command + 4
      if (e.ctrlKey && e.altKey && e.metaKey && e.key === '4') {
        e.preventDefault();
        setDebugMode(prev => !prev);
        console.log(debugMode ? '🔧 调试模式已关闭' : '🔧 调试模式已启用');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, debugMode]);

  // 过滤模板
  const filteredTemplates = (() => {
    // 🆕 如果选择「网友分享」，显示公开模板
    if (selectedCategory === '网友分享') {
      return publicTemplates.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 否则显示本地模板
    return templates.filter(template => {
      const matchCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());

      // 🆕 如果不显示所有尺寸，则只显示匹配当前画布比例的模板
      let matchSize = true;
      if (!showAllSizes && currentCanvasSize) {
        const currentRatio = currentCanvasSize.width / currentCanvasSize.height;
        const templateRatio = template.canvasSize.width / template.canvasSize.height;
        matchSize = Math.abs(currentRatio - templateRatio) < 0.05;
      }

      return matchCategory && matchSearch && matchSize;
    });
  })();

  // 获取所有分类（按画布尺寸，自定义提前）
  const categories: (TemplateCategory | 'all' | '网友分享')[] = [
    'all',
    '自定义',
    '网友分享', // 🆕 新增网友分享分类
    '3:4 竖版',
    '1:1 方形',
    '4:3 横版',
    '16:9 横版',
    '9:16 竖版',
    '21:9 超宽',
  ];

  // 删除模板
  const handleDelete = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const manager = getTemplateManager();
    const template = manager.getById(templateId);

    if (template?.isPreset) {
      alert('预设模板不能删除');
      return;
    }

    if (confirm('确定要删除这个模板吗？')) {
      manager.delete(templateId);
      setTemplates(manager.getAll());
    }
  };

  // 点击模板，显示确认对话框
  const handleTemplateClick = (template: Template) => {
    setConfirmTemplate(template);
  };

  // 确认应用模板
  const handleConfirmApply = () => {
    if (confirmTemplate) {
      onApplyTemplate(confirmTemplate.id);
      setConfirmTemplate(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1000px] max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>模板库</DialogTitle>
            {/* 调试按钮：只在按下"aaaa"后显示 */}
            {debugMode && (
              <div className="flex gap-2">
                <button
                  onClick={clearPresetCache}
                  className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  🗑️ 清除缓存
                </button>
                <button
                  onClick={generateAllThumbnails}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isGenerating ? '生成中...' : '🔄 重新生成缩略图'}
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex h-[600px]">
          {/* 左侧分类导航 */}
          <div className="w-48 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="space-y-1">
              {categories.map(category => {
                // 🆕 计算每个分类的模板数量
                const count = category === '网友分享'
                  ? publicTemplates.length
                  : category === 'all'
                  ? templates.length
                  : templates.filter(t => t.category === category).length;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                      selectedCategory === category
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{category === 'all' ? '全部模板' : category}</span>
                    <span className={`text-xs ${selectedCategory === category ? 'text-gray-300' : 'text-gray-400'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右侧模板展示 */}
          <div className="flex-1 flex flex-col bg-white">
            {/* 搜索栏和筛选 */}
            <div className="p-4 border-b space-y-3 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="搜索模板..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 🆕 尺寸筛选提示 */}
              {currentCanvasSize && (
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    当前画布：{currentCanvasSize.width} × {currentCanvasSize.height}
                    {!showAllSizes && (
                      <span className="ml-2 text-gray-900">（仅显示匹配比例）</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAllSizes(!showAllSizes)}
                    className="text-gray-900 hover:text-gray-700 underline"
                  >
                    {showAllSizes ? '只看匹配比例' : '显示所有尺寸'}
                  </button>
                </div>
              )}
            </div>

            {/* 模板网格 */}
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {/* 🆕 加载状态 */}
              {selectedCategory === '网友分享' && isLoadingPublic ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <div>加载中...</div>
                  </div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {selectedCategory === '网友分享' ? '暂无公开模板' : '暂无模板'}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-4">
                  {filteredTemplates.map(template => (
                    <div
                      key={template.id}
                      className="group cursor-pointer"
                      onClick={() => handleTemplateClick(template)}
                    >
                      {/* 缩略图 */}
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 hover:border-gray-900 hover:shadow-xl transition-all duration-200" style={{ aspectRatio: '3/4', backgroundColor: '#f5f5f5' }}>
                        {/* 图片 */}
                        <img
                          src={template.thumbnail || ''}
                          alt={template.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                        />

                        {/* Hover 遮罩 - 只在 hover 时显示，不影响图片 */}
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ pointerEvents: 'none' }}>
                          <div className="bg-white px-4 py-2 rounded-full shadow-lg" style={{ pointerEvents: 'auto' }}>
                            <span className="text-sm font-medium text-gray-900">点击使用</span>
                          </div>
                        </div>

                        {/* 删除按钮（仅自定义模板，网友分享的模板不显示） */}
                        {!template.isPreset && selectedCategory !== '网友分享' && (
                          <button
                            onClick={(e) => handleDelete(template.id, e)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* 模板名称（独立显示在缩略图下方） */}
                      <div className="mt-2 text-center">
                        <div className="font-medium text-sm text-gray-900 truncate px-1">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {template.canvasSize.width} × {template.canvasSize.height}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* 确认对话框 */}
      {confirmTemplate && (
        <Dialog open={!!confirmTemplate} onOpenChange={() => setConfirmTemplate(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>使用模板</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-4">
                确定要使用「<span className="font-semibold text-gray-900">{confirmTemplate.name}</span>」模板吗？
              </p>
              <p className="text-sm text-amber-600">
                ⚠️ 当前画布内容将被替换
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmTemplate(null)}
              >
                取消
              </Button>
              <Button onClick={handleConfirmApply}>
                确定使用
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 🆕 生成进度对话框 */}
      {isGenerating && (
        <Dialog open={isGenerating} onOpenChange={() => {}}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>生成缩略图</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs h-96 overflow-y-auto">
                {generateProgress.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsGenerating(false);
                  setGenerateProgress([]);
                  window.location.reload(); // 刷新页面以加载新缩略图
                }}
                disabled={generateProgress[generateProgress.length - 1]?.includes('全部完成') === false}
              >
                {generateProgress[generateProgress.length - 1]?.includes('全部完成') ? '完成并刷新' : '生成中...'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
