/**
 * 创建公开模板 API
 * POST /api/templates/public/create
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, canvasSize, canvasJSON, thumbnail } = body;

    // 验证必填字段
    if (!name || !category || !canvasSize || !canvasJSON) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 生成唯一 ID
    const id = nanoid(10);

    // 创建公开模板数据
    const publicTemplate = {
      id,
      name,
      category,
      canvasSize,
      canvasJSON,
      thumbnail,
      createdAt: Date.now(),
    };

    // 保存到 Vercel KV
    // 使用 template:public:{id} 作为 key
    await kv.set(`template:public:${id}`, publicTemplate, {
      ex: 60 * 60 * 24 * 365, // 1年过期
    });

    // 将模板 ID 添加到公开模板列表
    await kv.sadd('template:public:list', id);

    console.log('✅ 公开模板创建成功:', { id, name });

    return NextResponse.json({
      success: true,
      template: publicTemplate,
    });
  } catch (error) {
    console.error('❌ 创建公开模板失败:', error);
    return NextResponse.json(
      { success: false, message: '创建公开模板失败' },
      { status: 500 }
    );
  }
}
