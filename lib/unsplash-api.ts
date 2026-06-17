/**
 * Unsplash API 工具
 * 用于搜索和获取免费高质量图片
 */

// 使用 Next.js API Route 代理，避免在客户端暴露 Access Key
const UNSPLASH_PROXY_BASE = '/api/unsplash';

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
    download: string;
    download_location: string;
  };
  width: number;
  height: number;
}

export interface UnsplashSearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

/**
 * 搜索图片
 * @param query 搜索关键词
 * @param page 页码（从1开始）
 * @param perPage 每页数量（默认20，最大30）
 */
export async function searchPhotos(
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<UnsplashSearchResult> {
  try {
    const url = new URL(`${UNSPLASH_PROXY_BASE}`, window.location.origin);
    url.searchParams.append('action', 'search');
    url.searchParams.append('query', query);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', Math.min(perPage, 30).toString());

    const fullUrl = url.toString();

    console.log('🔍 [Unsplash] 开始搜索:', {
      query,
      page,
      perPage,
      url: fullUrl
    });

    const response = await fetch(fullUrl);

    console.log('📡 [Unsplash] 响应状态:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: {
        contentType: response.headers.get('content-type'),
        rateLimit: response.headers.get('x-ratelimit-limit'),
        rateLimitRemaining: response.headers.get('x-ratelimit-remaining'),
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Unsplash] API 错误详情:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        url: fullUrl
      });

      // 尝试解析错误信息
      let errorMessage = `Unsplash API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorMessage = errorJson.errors.join(', ');
        }
      } catch (e) {
        // 如果不是 JSON，使用原始文本
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ [Unsplash] 搜索成功:', {
      total: data.total,
      totalPages: data.total_pages,
      resultsCount: data.results?.length || 0
    });
    return data;
  } catch (error) {
    console.error('❌ [Unsplash] 搜索失败:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * 获取随机图片
 * @param count 数量（默认10，最大30）
 * @param query 可选的搜索关键词
 */
export async function getRandomPhotos(
  count: number = 10,
  query?: string
): Promise<UnsplashPhoto[]> {
  try {
    const url = new URL(`${UNSPLASH_PROXY_BASE}`, window.location.origin);
    url.searchParams.append('action', 'random');
    url.searchParams.append('count', Math.min(count, 30).toString());

    if (query) {
      url.searchParams.append('query', query);
    }

    const fullUrl = url.toString();

    console.log('🎲 [Unsplash] 获取随机图片:', {
      count,
      query,
      url: fullUrl
    });

    const response = await fetch(fullUrl);

    console.log('📡 [Unsplash] 随机图片响应:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: {
        contentType: response.headers.get('content-type'),
        rateLimit: response.headers.get('x-ratelimit-limit'),
        rateLimitRemaining: response.headers.get('x-ratelimit-remaining'),
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Unsplash] 获取随机图片失败 - 详细信息:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        url: fullUrl
      });

      // 尝试解析错误信息
      let errorMessage = `Unsplash API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorMessage = errorJson.errors.join(', ');
        }
        console.error('❌ [Unsplash] 解析后的错误:', errorJson);
      } catch (e) {
        if (errorText) {
          errorMessage = errorText;
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    const photos = Array.isArray(data) ? data : [data];
    console.log('✅ [Unsplash] 随机图片获取成功:', {
      count: photos.length,
      firstPhotoId: photos[0]?.id
    });
    return photos;
  } catch (error) {
    console.error('❌ [Unsplash] 获取随机图片失败 - 异常:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * 触发下载统计（Unsplash API 要求）
 * 当用户下载图片时必须调用此方法
 */
export async function triggerDownload(downloadLocation: string): Promise<void> {
  try {
    const url = new URL(`${UNSPLASH_PROXY_BASE}`, window.location.origin);
    url.searchParams.append('action', 'download');
    url.searchParams.append('url', downloadLocation);

    await fetch(url.toString());
  } catch (error) {
    console.error('Failed to trigger download:', error);
    // 不抛出错误，因为这不应该阻止用户使用图片
  }
}

/**
 * 获取图片下载URL（带统计）
 * @param photo Unsplash图片对象
 * @param size 图片尺寸（默认regular）
 */
export async function getPhotoDownloadUrl(
  photo: UnsplashPhoto,
  size: 'raw' | 'full' | 'regular' | 'small' | 'thumb' = 'regular'
): Promise<string> {
  // 触发下载统计
  await triggerDownload(photo.links.download_location);

  // 返回图片URL
  return photo.urls[size];
}
