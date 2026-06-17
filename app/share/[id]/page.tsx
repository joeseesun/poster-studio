import { kv } from '@vercel/kv';
import { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface ShareData {
  imageUrl: string;
  title: string;
  createdAt: number;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await kv.get<ShareData>(`share:${resolvedParams.id}`);

  if (!data) {
    return {
      title: '分享不存在',
    };
  }

  return {
    title: `${data.title}-由乔木画布生成`,
    description: '使用乔木画布创建的精美海报',
    openGraph: {
      title: `${data.title}-由乔木画布生成`,
      description: '使用乔木画布创建的精美海报',
      images: [data.imageUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${data.title}-由乔木画布生成`,
      description: '使用乔木画布创建的精美海报',
      images: [data.imageUrl],
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const data = await kv.get<ShareData>(`share:${resolvedParams.id}`);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 图片区域 - 从顶部开始，完全撑满 */}
      <div className="relative w-full h-screen">
        <Image
          src={data.imageUrl}
          alt={data.title}
          fill
          className="object-contain"
          priority
          unoptimized
        />
      </div>

      {/* 按钮和链接区域 */}
      <div className="px-4 sm:px-8 py-8">
        {/* CTA 按钮 - 黑灰渐变 */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white font-medium rounded-lg hover:from-gray-800 hover:to-gray-600 transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            创建我的海报
          </Link>
        </div>

        {/* 底部链接 */}
        <div className="text-center">
          <a
            href="https://x.com/vista8/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            @乔木画布
          </a>
        </div>
      </div>
    </div>
  );
}
