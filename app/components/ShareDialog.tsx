'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Share2, X } from 'lucide-react';

interface ShareDialogProps {
  shareUrl: string;
  onClose: () => void;
}

export default function ShareDialog({ shareUrl, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(true); // 默认已复制（自动复制）

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleView = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-50 mx-4">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-gray-700" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">分享成功</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* URL 输入框 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分享链接
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={(e) => e.currentTarget.select()}
            />
            {copied ? (
              <button
                onClick={handleView}
                className="px-4 py-3 rounded-lg transition flex items-center gap-2 font-medium whitespace-nowrap bg-gray-800 text-white hover:bg-gray-700"
              >
                <ExternalLink className="w-4 h-4" />
                去查看
              </button>
            ) : (
              <button
                onClick={handleCopy}
                className="px-4 py-3 rounded-lg transition flex items-center gap-2 font-medium whitespace-nowrap bg-gray-900 text-white hover:bg-gray-800"
              >
                <Copy className="w-4 h-4" />
                复制
              </button>
            )}
          </div>
        </div>

        {/* 提示 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            ✨ 链接已自动复制到剪贴板！分享给好友查看你的作品吧~
          </p>
          <p className="text-xs text-gray-500 mt-2">
            💡 链接有效期 60 天
          </p>
        </div>
      </div>
    </>
  );
}
