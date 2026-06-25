'use client';

import { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { PRESET_TEMPLATES } from '@/lib/preset-templates';

export default function GenerateThumbnailsPage() {
  const [progress, setProgress] = useState<string[]>([]);
  const [thumbnails, setThumbnails] = useState<Array<{ name: string; url: string; size: number }>>([]);

  useEffect(() => {
    generateAllThumbnails();
  }, []);

  const generateAllThumbnails = async () => {
    const results: Array<{ name: string; url: string; size: number }> = [];

    for (const template of PRESET_TEMPLATES) {
      try {
        setProgress(prev => [...prev, `🎨 生成: ${template.name}`]);

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

        // 加载 JSON
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

        results.push({
          name: template.name,
          url: dataURL,
          size: dataURL.length,
        });

        setProgress(prev => [...prev, `✅ 生成完成: ${template.name} (${(dataURL.length / 1024).toFixed(2)} KB)`]);

        // 🆕 自动保存到服务器
        fetch('/api/save-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: template.name, dataURL }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setProgress(prev => [...prev, `💾 已保存到服务器: ${data.fileName}`]);
            } else {
              setProgress(prev => [...prev, `❌ 保存失败: ${template.name}`]);
            }
          })
          .catch(err => {
            setProgress(prev => [...prev, `❌ 保存失败: ${template.name} - ${err.message}`]);
          });

        fabricCanvas.dispose();
      } catch (error) {
        setProgress(prev => [...prev, `❌ 失败: ${template.name} - ${error}`]);
      }
    }

    setThumbnails(results);
    setProgress(prev => [...prev, '\n🎉 全部完成！请点击下方按钮下载缩略图']);
  };

  const downloadThumbnail = (name: string, dataURL: string) => {
    const fileName = name
      .replace(/·/g, '-')
      .replace(/\s+/g, '-')
      .toLowerCase() + '.png';

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = fileName;
    link.click();
  };

  const downloadAll = () => {
    thumbnails.forEach((thumbnail, index) => {
      setTimeout(() => {
        downloadThumbnail(thumbnail.name, thumbnail.url);
      }, index * 500); // 每500ms下载一个，避免浏览器阻止
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">生成预设模板缩略图</h1>

        {/* 进度日志 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">生成进度</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {progress.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>

        {/* 缩略图预览 */}
        {thumbnails.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">缩略图预览</h2>
              <button
                onClick={downloadAll}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                下载全部 ({thumbnails.length} 个)
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {thumbnails.map((thumbnail) => (
                <div key={thumbnail.name} className="border rounded p-3">
                  <img
                    src={thumbnail.url}
                    alt={thumbnail.name}
                    className="w-full h-auto border mb-2"
                  />
                  <div className="text-xs text-gray-600 mb-1">{thumbnail.name}</div>
                  <div className="text-xs text-gray-400 mb-2">
                    {(thumbnail.size / 1024).toFixed(2)} KB
                  </div>
                  <button
                    onClick={() => downloadThumbnail(thumbnail.name, thumbnail.url)}
                    className="w-full px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                  >
                    下载
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-2">✅ 自动保存说明</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>缩略图生成后会<strong>自动保存</strong>到 <code className="bg-gray-200 px-1 rounded">public/templates/</code> 目录</li>
            <li>查看进度日志中的 &quot;💾 已保存到服务器&quot; 消息</li>
            <li>生成完成后，直接刷新主页面即可看到缩略图</li>
            <li>如果需要手动下载，可以点击&quot;下载全部&quot;或单独下载按钮</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
