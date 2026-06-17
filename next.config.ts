import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // 配置 webpack 以支持客户端库
  webpack: (config, { isServer }) => {
    // 仅在客户端处理
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    // 外部化服务端不需要的包
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@imgly/background-removal',
        'onnxruntime-node',
        'onnxruntime-web',
      ];
    }

    return config;
  },

  // 配置静态资源头部（支持 SharedArrayBuffer）
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
