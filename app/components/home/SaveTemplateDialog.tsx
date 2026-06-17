/**
 * 保存为模板对话框
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TemplateCategory } from '@/lib/template-manager';

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, category: TemplateCategory, isPublic: boolean) => void;
}

export default function SaveTemplateDialog({
  open,
  onClose,
  onSave,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true); // 默认勾选

  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入模板名称');
      return;
    }

    // 固定使用"自定义"分类
    onSave(name.trim(), '自定义', isPublic);
    setName('');
    setIsPublic(true); // 重置为默认勾选
    onClose();
  };

  const handleClose = () => {
    setName('');
    setIsPublic(true); // 重置为默认勾选
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>另存为模板</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 模板名称 */}
          <div className="space-y-2">
            <Label htmlFor="template-name">模板名称 *</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：简约红色卡片"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
          </div>

          {/* 公开分享 */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="public-share"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <div className="flex-1">
              <Label htmlFor="public-share" className="cursor-pointer font-normal">
                公开分享
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                勾选后，其他用户可以在「网友分享」中看到并使用此模板
              </p>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
