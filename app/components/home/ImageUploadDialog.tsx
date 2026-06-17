'use client';

import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onLocalUpload: () => void;
  onLibrarySelect: () => void;
}

export default function ImageUploadDialog({
  open,
  onClose,
  onLocalUpload,
  onLibrarySelect,
}: ImageUploadDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-md">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">选择图片来源</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 选项 */}
        <div className="p-6 space-y-3">
          {/* 本地上传 */}
          <button
            onClick={() => {
              onLocalUpload();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-base">本地上传</div>
              <div className="text-sm text-muted-foreground">从电脑选择图片上传</div>
            </div>
          </button>

          {/* 图库选择 */}
          <button
            onClick={() => {
              onLibrarySelect();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-base">图库选择</div>
              <div className="text-sm text-muted-foreground">从已上传的图片中选择</div>
            </div>
          </button>
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground">
            💡 提示: 上传的图片会自动保存到图库,方便下次使用
          </p>
        </div>
      </div>
    </div>
  );
}
