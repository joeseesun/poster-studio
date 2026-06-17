'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WeChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WeChatDialog({ isOpen, onClose }: WeChatDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">📱 关注公众号</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <p className="text-center text-muted-foreground">
            扫码关注公众号，获取更多实用工具和教程
          </p>

          <div className="flex flex-col items-center gap-2">
            <div className="w-64 h-64 border-2 border-border rounded-lg overflow-hidden bg-white flex items-center justify-center">
              <img
                src="/wechat-official.jpg"
                alt="公众号二维码"
                className="w-full h-full object-contain p-2"
              />
            </div>
            <p className="text-sm font-medium">向阳乔木推荐看</p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            期待与你在公众号相遇！✨
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
