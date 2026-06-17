/**
 * 创建共享素材 API
 * POST /api/materials/public/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, imageUrl, width, height } = body;

    // 验证必填字段
    if (!name || !imageUrl) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 生成唯一 ID
    const id = nanoid(10);

    // 创建共享素材数据
    const material = {
      id,
      name,
      imageUrl,
      type: 'image',
      width: width || 0,
      height: height || 0,
      createdAt: Date.now(),
    };

    // 保存到 Vercel KV
    // 使用 material:public:{id} 作为 key
    await kv.set(`material:public:${id}`, material, {
      ex: 60 * 60 * 24 * 365, // 1年过期
    });

    // 将素材 ID 添加到共享素材列表
    await kv.sadd('material:public:list', id);

    console.log('✅ 共享素材创建成功:', { id, name });

    return NextResponse.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error('❌ 创建共享素材失败:', error);
    return NextResponse.json(
      { success: false, message: '创建共享素材失败' },
      { status: 500 }
    );
  }
}
