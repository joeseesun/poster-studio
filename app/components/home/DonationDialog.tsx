'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DonationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationDialog({ isOpen, onClose }: DonationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">💖 打赏支持</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          <p className="text-center text-muted-foreground">
            如果这个工具对你有帮助，欢迎打赏支持！
          </p>

          <div className="flex flex-col items-center gap-2">
            <div className="w-80 h-80 border-2 border-border rounded-lg overflow-hidden bg-white flex items-center justify-center">
              <img
                src="/wechat-donation.jpg"
                alt="打赏二维码"
                className="w-full h-full object-contain p-2"
              />
            </div>
            <p className="text-sm text-muted-foreground">扫码打赏</p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            感谢你的支持！❤️
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
