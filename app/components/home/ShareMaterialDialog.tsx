/**
 * 分享素材对话框
 * 用于分享选中的图片到共享素材库
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ShareMaterialDialogProps {
  open: boolean;
  onClose: () => void;
  onShare: (name: string) => void;
}

export default function ShareMaterialDialog({
  open,
  onClose,
  onShare,
}: ShareMaterialDialogProps) {
  const [name, setName] = useState('');

  // 重置状态
  useEffect(() => {
    if (!open) {
      setName('');
    }
  }, [open]);

  const handleShare = () => {
    if (!name.trim()) {
      alert('请输入素材名称');
      return;
    }

    onShare(name.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>分享素材</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="material-name">素材名称</Label>
            <Input
              id="material-name"
              placeholder="例如：可爱猫咪"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleShare();
                }
              }}
              autoFocus
            />
          </div>

          <p className="text-sm text-gray-500">
            分享后，其他用户可以在「共享素材」中看到并使用此素材
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleShare}>
            分享
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
