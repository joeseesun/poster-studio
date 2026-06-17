import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ps.qiaomu.ai'),
  title: "乔木画布 Poster Studio",
  description: "在线制作小红书封面、知识卡片和社媒海报，支持高亮文字、版本管理、AI 生图和一键导出",
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180' },
    ],
  },
  openGraph: {
    title: "乔木画布 Poster Studio",
    description: "在线制作小红书封面、知识卡片和社媒海报",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://ps.qiaomu.ai',
    siteName: "乔木画布",
    type: 'website',
  },
};

const umamiSrc =
  process.env.NEXT_PUBLIC_UMAMI_SRC ||
  (process.env.NEXT_PUBLIC_UMAMI_DOMAIN
    ? `${process.env.NEXT_PUBLIC_UMAMI_DOMAIN.replace(/\/$/, '')}/script.js`
    : '');
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {umamiSrc && umamiWebsiteId ? (
          <script defer src={umamiSrc} data-website-id={umamiWebsiteId}></script>
        ) : null}
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
