'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Image as ImageIcon } from 'lucide-react';
import { getImageLibrary, ImageLibraryItem } from '@/lib/image-library';
import ConfirmDialog from '../ui/ConfirmDialog';

interface ImageLibraryProps {
  onClose: () => void;
  onSelectImage: (url: string) => void;
}

export default function ImageLibrary({ onClose, onSelectImage }: ImageLibraryProps) {
  const [images, setImages] = useState<ImageLibraryItem[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    url: string;
  }>({ open: false, url: '' });

  // 加载图片库
  const loadImages = () => {
    const library = getImageLibrary();
    const loadedImages = library.getImages();
    console.log('📚 图片库加载:', loadedImages.length, '张图片');
    setImages(loadedImages);
  };

  // 初始加载
  useEffect(() => {
    loadImages();
  }, []);

  // 监听storage事件,当其他标签页或组件更新图库时自动刷新
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'image-library') {
        console.log('📚 检测到图库更新,重新加载');
        loadImages();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 定期刷新图库(每2秒检查一次)
  useEffect(() => {
    const interval = setInterval(() => {
      const library = getImageLibrary();
      const currentCount = library.getCount();
      if (currentCount !== images.length) {
        console.log('📚 图库数量变化,重新加载:', images.length, '→', currentCount);
        loadImages();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [images.length]);

  // 选择图片
  const handleSelectImage = (url: string) => {
    setSelectedUrl(url);
    onSelectImage(url);
    onClose();
  };

  // 删除图片
  const handleDeleteImage = (url: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止触发选择
    setDeleteConfirm({ open: true, url });
  };

  // 确认删除
  const confirmDelete = () => {
    const library = getImageLibrary();
    library.removeImage(deleteConfirm.url);
    loadImages(); // 重新加载
    setDeleteConfirm({ open: false, url: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] max-w-4xl h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">图片库</h2>
            <span className="text-sm text-muted-foreground">
              ({images.length} 张图片)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 图片网格 */}
        <div className="flex-1 overflow-y-auto p-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg">图片库为空</p>
              <p className="text-sm mt-2">上传或粘贴图片后会自动保存到这里</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((item) => (
                <div
                  key={item.url}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-all"
                  onClick={() => handleSelectImage(item.url)}
                >
                  {/* 图片 */}
                  <img
                    src={item.url}
                    alt={item.filename || '图片'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* 悬浮遮罩 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => handleDeleteImage(item.url, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* 文件名(如果有) */}
                  {item.filename && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.filename}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="px-6 py-4 border-t bg-muted/30">
          <p className="text-sm text-muted-foreground">
            💡 提示: 点击图片插入到画布,悬停后可删除
          </p>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="删除图片"
        message="确定要从图库中删除这张图片吗?"
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ open: false, url: '' })}
      />
    </div>
  );
}
