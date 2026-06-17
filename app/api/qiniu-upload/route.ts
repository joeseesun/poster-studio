import { NextRequest, NextResponse } from 'next/server';
import { uploadBlobToQiniu } from '@/lib/server/qiniu';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const storagePath = formData.get('storagePath');

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: '缺少上传文件' },
        { status: 400 }
      );
    }

    const uploadedFileName = (file as { name?: unknown }).name;
    const fileName =
      typeof uploadedFileName === 'string' && uploadedFileName
        ? uploadedFileName
        : typeof formData.get('fileName') === 'string'
          ? String(formData.get('fileName'))
          : 'upload.jpg';

    const url = await uploadBlobToQiniu({
      blob: file,
      fileName,
      storagePath: typeof storagePath === 'string' ? storagePath : undefined,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('七牛云上传失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    );
  }
}
