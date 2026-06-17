/**
 * 图标库对话框
 * 展示 Lucide 图标库，支持分类、搜索、插入
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ICON_LIBRARY, getCategories, IconCategory, IconConfig } from '@/lib/icon-library';
import { getRecentIcons, addRecentIcon } from '@/lib/recent-icons';

interface IconLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectIcon: (iconConfig: IconConfig) => void;
}

export default function IconLibraryDialog({
  open,
  onClose,
  onSelectIcon,
}: IconLibraryDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<IconCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentIconNames, setRecentIconNames] = useState<string[]>([]);

  // 加载最近使用的图标
  useEffect(() => {
    setRecentIconNames(getRecentIcons());
  }, []);

  // 获取所有分类
  const categories: (IconCategory | 'all')[] = ['all', ...getCategories()];

  // 获取最近使用的图标配置
  const recentIcons = useMemo(() => {
    return recentIconNames
      .map(name => ICON_LIBRARY.find(icon => icon.name === name))
      .filter((icon): icon is IconConfig => icon !== undefined);
  }, [recentIconNames]);

  // 过滤图标
  const filteredIcons = useMemo(() => {
    let icons = ICON_LIBRARY;

    // 按分类过滤
    if (selectedCategory !== 'all') {
      icons = icons.filter(icon => icon.category === selectedCategory);
    }

    // 按搜索词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter(icon =>
        icon.name.toLowerCase().includes(query) ||
        icon.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    return icons;
  }, [selectedCategory, searchQuery]);

  // 处理图标点击
  const handleIconClick = (iconConfig: IconConfig) => {
    // 添加到最近使用
    addRecentIcon(iconConfig.name);
    setRecentIconNames(getRecentIcons());

    onSelectIcon(iconConfig);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>图标库</DialogTitle>
        </DialogHeader>

        {/* 搜索栏 */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索图标..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* 分类标签 */}
        <div className="px-6 py-3 border-b overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="shrink-0"
              >
                {category === 'all' ? '全部' : category}
              </Button>
            ))}
          </div>
        </div>

        {/* 图标网格 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredIcons.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              未找到图标
            </div>
          ) : (
            <div className="space-y-6">
              {/* 最近使用的图标 */}
              {recentIcons.length > 0 && selectedCategory === 'all' && !searchQuery.trim() && (
                <div className="grid grid-cols-8 gap-3 pb-6 border-b">
                  {recentIcons.map(iconConfig => {
                    const IconComponent = iconConfig.component;
                    return (
                      <button
                        key={`recent-${iconConfig.name}`}
                        onClick={() => handleIconClick(iconConfig)}
                        className="group relative aspect-square flex flex-col items-center justify-center p-3 rounded-lg border border-border/40 bg-background hover:border-primary hover:bg-primary/5 transition-all"
                        title={iconConfig.name}
                      >
                        <IconComponent className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                        <span className="mt-1 text-[10px] text-muted-foreground group-hover:text-primary truncate w-full text-center">
                          {iconConfig.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 所有图标 */}
              <div className="grid grid-cols-8 gap-3">
                {filteredIcons.map(iconConfig => {
                  const IconComponent = iconConfig.component;
                  return (
                    <button
                      key={iconConfig.name}
                      onClick={() => handleIconClick(iconConfig)}
                      className="group relative aspect-square flex flex-col items-center justify-center p-3 rounded-lg border border-border/40 bg-background hover:border-primary hover:bg-primary/5 transition-all"
                      title={iconConfig.name}
                    >
                      <IconComponent className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                      <span className="mt-1 text-[10px] text-muted-foreground group-hover:text-primary truncate w-full text-center">
                        {iconConfig.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            💡 提示：点击图标插入到画布，插入后可在右侧属性面板调整颜色和大小
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
