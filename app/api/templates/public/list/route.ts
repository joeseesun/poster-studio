/**
 * 获取所有公开模板 API
 * GET /api/templates/public/list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPublicStore } from '@/lib/server/public-store';

export async function GET(request: NextRequest) {
  try {
    const store = getPublicStore();

    // 获取所有公开模板 ID
    const templateIds = await store.smembers('template:public:list');

    if (!templateIds || templateIds.length === 0) {
      return NextResponse.json({
        success: true,
        templates: [],
      });
    }

    // 批量获取模板数据
    const templates = await Promise.all(
      templateIds.map(async (id) => {
        const template = await store.get(`template:public:${id}`);
        return template;
      })
    );

    // 过滤掉 null 值（已过期的模板）
    const validTemplates = templates.filter((t) => t !== null);

    // 按创建时间倒序排序
    validTemplates.sort((a: any, b: any) => b.createdAt - a.createdAt);

    console.log('✅ 获取公开模板成功，数量:', validTemplates.length);

    return NextResponse.json({
      success: true,
      templates: validTemplates,
    });
  } catch (error) {
    console.error('❌ 获取公开模板失败:', error);
    return NextResponse.json(
      { success: false, message: '获取公开模板失败' },
      { status: 500 }
    );
  }
}
