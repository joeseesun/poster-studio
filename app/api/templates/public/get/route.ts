/**
 * 获取单个公开模板 API
 * GET /api/templates/public/get?id=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少模板 ID' },
        { status: 400 }
      );
    }

    // 从 KV 获取公开模板
    const template = await kv.get(`template:public:${id}`);

    if (!template) {
      return NextResponse.json(
        { success: false, message: '模板不存在或已过期' },
        { status: 404 }
      );
    }

    console.log('✅ 获取公开模板成功:', id);

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    console.error('❌ 获取公开模板失败:', error);
    return NextResponse.json(
      { success: false, message: '获取公开模板失败' },
      { status: 500 }
    );
  }
}
