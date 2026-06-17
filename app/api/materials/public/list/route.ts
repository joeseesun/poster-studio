/**
 * 获取所有共享素材 API
 * GET /api/materials/public/list?page=1&limit=20&search=关键词
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // 获取所有共享素材 ID
    const materialIds = await kv.smembers('material:public:list');

    if (!materialIds || materialIds.length === 0) {
      return NextResponse.json({
        success: true,
        materials: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    // 批量获取素材数据
    const materials = await Promise.all(
      materialIds.map(async (id) => {
        const material = await kv.get(`material:public:${id}`);
        return material;
      })
    );

    // 过滤掉 null 值（已过期的素材）
    let validMaterials = materials.filter((m) => m !== null);

    // 按创建时间倒序排序
    validMaterials.sort((a: any, b: any) => b.createdAt - a.createdAt);

    // 🆕 搜索过滤
    if (search) {
      validMaterials = validMaterials.filter((m: any) =>
        m.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 🆕 分页
    const total = validMaterials.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMaterials = validMaterials.slice(startIndex, endIndex);

    console.log('✅ 获取共享素材成功:', {
      total,
      page,
      limit,
      totalPages,
      returned: paginatedMaterials.length,
      search: search || '无',
    });

    return NextResponse.json({
      success: true,
      materials: paginatedMaterials,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('❌ 获取共享素材失败:', error);
    return NextResponse.json(
      { success: false, message: '获取共享素材失败' },
      { status: 500 }
    );
  }
}
