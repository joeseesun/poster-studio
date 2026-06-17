/**
 * 删除共享素材 API
 * DELETE /api/materials/public/{id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少素材 ID' },
        { status: 400 }
      );
    }

    // 从 Vercel KV 删除素材数据
    await kv.del(`material:public:${id}`);

    // 从共享素材列表中移除
    await kv.srem('material:public:list', id);

    console.log('✅ 共享素材删除成功:', id);

    return NextResponse.json({
      success: true,
      message: '素材已删除',
    });
  } catch (error) {
    console.error('❌ 删除共享素材失败:', error);
    return NextResponse.json(
      { success: false, message: '删除共享素材失败' },
      { status: 500 }
    );
  }
}
