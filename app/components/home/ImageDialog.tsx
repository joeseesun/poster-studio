/**
 * 统一图片对话框
 * 包含三个Tab：本地上传、图库选择、网络搜图
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Search, Loader2, X, Download, ExternalLink, Shuffle, Share2, Trash2 } from 'lucide-react';
import { getImageLibrary, ImageLibraryItem } from '@/lib/image-library';
import { searchPhotos, getRandomPhotos, UnsplashPhoto, getPhotoDownloadUrl } from '@/lib/unsplash-api';

// 常用搜索关键词
const POPULAR_KEYWORDS = [
  { en: 'nature', zh: '自然' },
  { en: 'business', zh: '商务' },
  { en: 'technology', zh: '科技' },
  { en: 'food', zh: '美食' },
  { en: 'travel', zh: '旅行' },
  { en: 'people', zh: '人物' },
  { en: 'architecture', zh: '建筑' },
  { en: 'fashion', zh: '时尚' },
  { en: 'art', zh: '艺术' },
  { en: 'sports', zh: '运动' },
  { en: 'animals', zh: '动物' },
  { en: 'health', zh: '健康' },
];

interface ImageDialogProps {
  open: boolean;
  onClose: () => void;
  onLocalUpload: () => void;
  onSelectImage: (url: string) => void;
}

export default function ImageDialog({
  open,
  onClose,
  onLocalUpload,
  onSelectImage,
}: ImageDialogProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'search' | 'shared'>('search');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 图库相关
  const [libraryImages, setLibraryImages] = useState<ImageLibraryItem[]>([]);
  const [libraryPage, setLibraryPage] = useState(1);
  const LIBRARY_PER_PAGE = 10; // 改为 10 张/页

  // 🆕 共享素材相关
  const [sharedMaterials, setSharedMaterials] = useState<any[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [sharedPage, setSharedPage] = useState(1);
  const [sharedTotalPages, setSharedTotalPages] = useState(0);
  const [sharedTotal, setSharedTotal] = useState(0);
  const [sharedSearchQuery, setSharedSearchQuery] = useState('');
  const SHARED_PER_PAGE = 10; // 改为 10 张/页

  // 搜索相关
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const SEARCH_PER_PAGE = 10;
  const MAX_RECENT_SEARCHES = 3;

  // 加载图片库
  const loadLibrary = () => {
    const library = getImageLibrary();
    setLibraryImages(library.getImages());
  };

  // 初始加载图库
  useEffect(() => {
    if (open && activeTab === 'library') {
      loadLibrary();
      setLibraryPage(1); // 重置到第一页
    }
  }, [open, activeTab]);

  // 🆕 加载共享素材（支持分页和搜索）
  const loadSharedMaterials = async (page = 1, search = '') => {
    setIsLoadingShared(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: SHARED_PER_PAGE.toString(),
        search,
      });
      const response = await fetch(`/api/materials/public/list?${params}`);
      const data = await response.json();
      if (data.success) {
        setSharedMaterials(data.materials || []);
        setSharedTotal(data.total || 0);
        setSharedTotalPages(data.totalPages || 0);
        setSharedPage(page);
      }
    } catch (error) {
      console.error('❌ 加载共享素材失败:', error);
    } finally {
      setIsLoadingShared(false);
    }
  };

  // 初始加载共享素材
  useEffect(() => {
    if (open && activeTab === 'shared') {
      setSharedPage(1);
      setSharedSearchQuery('');
      loadSharedMaterials(1, '');
    }
  }, [open, activeTab]);

  // 🆕 共享素材搜索处理
  const handleSharedSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSharedPage(1);
    loadSharedMaterials(1, sharedSearchQuery);
  };

  // 初始加载随机图片和最近搜索
  useEffect(() => {
    if (open && activeTab === 'search') {
      // 加载最近搜索
      const saved = localStorage.getItem('unsplash_recent_searches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load recent searches:', e);
        }
      }

      // 加载随机图片
      if (searchResults.length === 0 && !searchQuery) {
        loadRandomPhotos();
      }
    }
  }, [open, activeTab]);

  // 监听图库更新
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      if (activeTab === 'library') {
        const library = getImageLibrary();
        const currentCount = library.getCount();
        if (currentCount !== libraryImages.length) {
          loadLibrary();
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [open, activeTab, libraryImages.length]);

  // 加载随机图片
  const loadRandomPhotos = async () => {
    console.log('🎲 [ImageDialog] 加载随机图片');
    setIsLoadingRandom(true);
    setSearchError(null);
    try {
      const photos = await getRandomPhotos(10);
      console.log('✅ [ImageDialog] 随机图片加载成功:', photos.length);
      setSearchResults(photos);
      setSearchPage(1);
      setHasMore(false); // 随机图片不支持分页
    } catch (error) {
      console.error('❌ [ImageDialog] 加载随机图片失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载失败，请稍后重试';
      setSearchError(errorMessage);
    } finally {
      setIsLoadingRandom(false);
    }
  };

  // 添加到最近搜索
  const addToRecentSearches = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setRecentSearches(prev => {
      // 移除重复项
      const filtered = prev.filter(q => q !== trimmedQuery);
      // 添加到开头
      const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      // 保存到 localStorage
      localStorage.setItem('unsplash_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // 搜索图片
  const handleSearch = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      // 如果清空搜索，重新加载随机图片
      setSearchQuery('');
      setSearchResults([]);
      setSearchPage(1);
      loadRandomPhotos();
      return;
    }

    // 只在第一页搜索时添加到最近搜索
    if (page === 1) {
      addToRecentSearches(query);
    }

    console.log('🔍 [ImageDialog] 开始搜索:', { query, page });
    setIsSearching(true);
    setSearchError(null);
    try {
      const result = await searchPhotos(query, page, SEARCH_PER_PAGE);

      console.log('✅ [ImageDialog] 搜索结果:', {
        total: result.total,
        resultsCount: result.results.length,
        page,
        totalPages: result.total_pages
      });

      // 每次搜索都替换结果（不累加）
      setSearchResults(result.results);
      setSearchPage(page);
      setTotalPages(result.total_pages);
      setHasMore(page < result.total_pages);
    } catch (error) {
      console.error('❌ [ImageDialog] 搜索失败:', error);
      const errorMessage = error instanceof Error ? error.message : '搜索失败，请稍后重试';
      setSearchError(errorMessage);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery, 1);
  };

  // 选择图库图片
  const handleSelectLibraryImage = (url: string) => {
    onSelectImage(url);
    onClose();
  };

  // 选择搜索结果图片
  const handleSelectSearchImage = async (photo: UnsplashPhoto) => {
    try {
      // 获取图片URL并触发下载统计
      const imageUrl = await getPhotoDownloadUrl(photo, 'regular');
      onSelectImage(imageUrl);
      onClose();
    } catch (error) {
      console.error('获取图片失败:', error);
    }
  };

  // 🆕 选择共享素材
  const handleSelectSharedMaterial = (imageUrl: string) => {
    onSelectImage(imageUrl);
    onClose();
  };

  // 🆕 删除共享素材（需要输入"我确认"）
  const handleDeleteSharedMaterial = async (materialId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmation = prompt('此操作不可恢复，请输入"我确认"以继续：');
    if (confirmation !== '我确认') {
      return;
    }

    setDeletingMaterialId(materialId);
    try {
      const response = await fetch(`/api/materials/public/${materialId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        // 刷新当前页（保持搜索条件）
        await loadSharedMaterials(sharedPage, sharedSearchQuery);
        alert('素材已删除');
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('❌ 删除共享素材失败:', error);
      alert('删除失败');
    } finally {
      setDeletingMaterialId(null);
    }
  };

  // 删除图库图片
  const handleDeleteLibraryImage = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const library = getImageLibrary();
    library.removeImage(url);
    loadLibrary();
  };

  // 触发本地上传
  const handleTriggerUpload = () => {
    onLocalUpload();
    onClose();
  };

  // 计算图库分页
  const paginatedLibraryImages = React.useMemo(() => {
    const startIndex = (libraryPage - 1) * LIBRARY_PER_PAGE;
    const endIndex = startIndex + LIBRARY_PER_PAGE;
    return libraryImages.slice(startIndex, endIndex);
  }, [libraryImages, libraryPage]);

  const totalLibraryPages = Math.ceil(libraryImages.length / LIBRARY_PER_PAGE);

  // 搜索结果直接显示（分页通过 API 请求实现）
  const paginatedSearchResults = searchResults;

  // 计算总页数
  const totalSearchPages = searchQuery.trim()
    ? totalPages  // 搜索结果：使用 API 返回的总页数
    : (searchResults.length > 0 ? 999 : 0); // 随机图片：显示分页（可以无限换页）

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[calc(85vh+10px)] flex flex-col p-0">
        <DialogTitle className="sr-only">插入图片</DialogTitle>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="mx-6 mt-6 mb-0 grid grid-cols-4 w-auto border-b rounded-none bg-transparent">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>网络搜图</span>
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span>共享素材</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>图库选择</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>本地上传</span>
            </TabsTrigger>
          </TabsList>

          {/* 本地上传 Tab */}
          <TabsContent value="upload" className="flex-1 flex items-center justify-center p-6">
            <button
              onClick={handleTriggerUpload}
              className="flex flex-col items-center justify-center p-12 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-all group cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary max-w-md w-full"
            >
              <Upload className="h-20 w-20 text-primary mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2">上传本地图片</h3>
              <p className="text-muted-foreground text-center">
                点击选择图片上传<br />
                支持 JPG、PNG、GIF 等格式
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                💡 上传的图片会自动保存到图库
              </p>
            </button>
          </TabsContent>

          {/* 🆕 共享素材 Tab */}
          <TabsContent value="shared" className="flex-1 flex flex-col">
            {/* 搜索框 */}
            <div className="px-6 pt-6 pb-4">
              <form onSubmit={handleSharedSearch} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="搜索素材名称..."
                  value={sharedSearchQuery}
                  onChange={(e) => setSharedSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoadingShared}>
                  <Search className="h-4 w-4 mr-2" />
                  搜索
                </Button>
                {sharedSearchQuery && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSharedSearchQuery('');
                      setSharedPage(1);
                      loadSharedMaterials(1, '');
                    }}
                  >
                    清除
                  </Button>
                )}
              </form>
              {/* 显示总数 */}
              {sharedTotal > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  共 {sharedTotal} 个素材
                  {sharedSearchQuery && ` · 搜索"${sharedSearchQuery}"`}
                </p>
              )}
            </div>

            {isLoadingShared ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">加载中...</p>
                </div>
              </div>
            ) : sharedMaterials.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                <Share2 className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg">
                  {sharedSearchQuery ? '未找到匹配的素材' : '暂无共享素材'}
                </p>
                <p className="text-sm mt-2">
                  {sharedSearchQuery ? '尝试其他关键词' : '选中图片后右键「分享素材」即可分享'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="grid grid-cols-5 gap-4">
                    {sharedMaterials.map((material) => (
                      <div
                        key={material.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-all"
                        onClick={() => handleSelectSharedMaterial(material.imageUrl)}
                      >
                        <img
                          src={material.imageUrl}
                          alt={material.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* 素材名称 */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs truncate">{material.name}</p>
                        </div>
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => handleDeleteSharedMaterial(material.id, e)}
                          disabled={deletingMaterialId === material.id}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          title="删除（需输入确认）"
                        >
                          {deletingMaterialId === material.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 分页控件 */}
                {sharedTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-6 py-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSharedMaterials(sharedPage - 1, sharedSearchQuery)}
                      disabled={sharedPage === 1 || isLoadingShared}
                    >
                      上一页
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {sharedPage} / {sharedTotalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadSharedMaterials(sharedPage + 1, sharedSearchQuery)}
                      disabled={sharedPage === sharedTotalPages || isLoadingShared}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* 图库选择 Tab */}
          <TabsContent value="library" className="flex-1 flex flex-col">
            {libraryImages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg">图片库为空</p>
                <p className="text-sm mt-2">上传或粘贴图片后会自动保存到这里</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-5 gap-4">
                    {paginatedLibraryImages.map((item) => (
                      <div
                        key={item.url}
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-all"
                        onClick={() => handleSelectLibraryImage(item.url)}
                      >
                        <img
                          src={item.url}
                          alt={item.filename || '图片'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => handleDeleteLibraryImage(item.url, e)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="删除"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 分页控件 */}
                {totalLibraryPages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-6 py-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLibraryPage(p => Math.max(1, p - 1))}
                      disabled={libraryPage === 1}
                    >
                      上一页
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      第 {libraryPage} / {totalLibraryPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLibraryPage(p => Math.min(totalLibraryPages, p + 1))}
                      disabled={libraryPage === totalLibraryPages}
                    >
                      下一页
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* 网络搜图 Tab */}
          <TabsContent value="search" className="flex-1 flex flex-col">
            {/* 搜索栏 */}
            <div className="px-6 py-4 border-b space-y-3">
              <div className="flex items-center gap-2">
                <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="搜索免费高质量图片..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 pr-8 placeholder:text-muted-foreground/40"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                          setSearchPage(1);
                          loadRandomPhotos();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        title="清除搜索"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </form>

                {/* Unsplash 提供信息 */}
                <a
                  href="https://unsplash.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors whitespace-nowrap"
                  title="访问 Unsplash"
                >
                  Unsplash
                </a>
              </div>

              {/* 常用搜索关键词和最近搜索 */}
              <div className="flex items-start gap-4">
                <div className="flex-1 flex flex-wrap gap-2">
                  {POPULAR_KEYWORDS.map((keyword) => (
                    <button
                      key={keyword.en}
                      type="button"
                      onClick={() => {
                        setSearchQuery(keyword.en);
                        handleSearch(keyword.en, 1);
                      }}
                      className="px-2 py-1 text-xs rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
                    >
                      {keyword.zh}
                    </button>
                  ))}
                </div>

                {/* 最近搜索 */}
                {recentSearches.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground/60 whitespace-nowrap">最近搜索</span>
                    <div className="flex gap-2">
                      {recentSearches.map((query) => (
                        <button
                          key={query}
                          type="button"
                          onClick={() => {
                            setSearchQuery(query);
                            handleSearch(query, 1);
                          }}
                          className="px-2 py-1 text-xs rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 搜索结果 */}
            {searchError ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                <X className="h-16 w-16 mb-4 opacity-20 text-destructive" />
                <p className="text-lg text-destructive">加载失败</p>
                <p className="text-sm mt-2 text-center max-w-md">{searchError}</p>
                <Button
                  variant="outline"
                  onClick={() => searchQuery ? handleSearch(searchQuery, 1) : loadRandomPhotos()}
                  className="mt-4"
                >
                  重试
                </Button>
              </div>
            ) : searchResults.length === 0 && (isSearching || isLoadingRandom) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                <Loader2 className="h-16 w-16 mb-4 animate-spin" />
                <p className="text-lg">{searchQuery ? '搜索中...' : '加载中...'}</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                <Search className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg">搜索免费高质量图片</p>
                <p className="text-sm mt-2">输入关键词开始搜索（如：nature、business、technology）</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-5 gap-4">
                    {paginatedSearchResults.map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-all"
                        onClick={() => handleSelectSearchImage(photo)}
                      >
                        <img
                          src={photo.urls.small}
                          alt={photo.alt_description || photo.description || '图片'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* 作者信息 */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white truncate">
                            by {photo.user.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 分页控件 */}
                {totalSearchPages > 1 && (
                  <div className="flex items-center justify-center gap-2 px-6 py-4 border-t">
                    {searchQuery.trim() ? (
                      // 搜索结果：显示分页
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = Math.max(1, searchPage - 1);
                            handleSearch(searchQuery, newPage);
                          }}
                          disabled={searchPage === 1 || isSearching}
                        >
                          上一页
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          第 {searchPage} / {totalSearchPages} 页
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = Math.min(totalSearchPages, searchPage + 1);
                            handleSearch(searchQuery, newPage);
                          }}
                          disabled={searchPage === totalSearchPages || isSearching}
                        >
                          下一页
                        </Button>
                      </>
                    ) : (
                      // 随机图片：只显示一个居中的"换一批"按钮
                      <Button
                        variant="outline"
                        onClick={loadRandomPhotos}
                        disabled={isLoadingRandom}
                        className="gap-2"
                      >
                        {isLoadingRandom ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>加载中...</span>
                          </>
                        ) : (
                          <>
                            <Shuffle className="h-4 w-4" />
                            <span>换一批</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
