import crypto from 'crypto';

interface QiniuConfig {
  accessKey: string;
  secretKey: string;
  bucket: string;
  uploadUrl: string;
  domain: string;
  storagePath: string;
}

export function isQiniuConfigured(): boolean {
  return Boolean(getQiniuConfig(false));
}

export async function uploadBlobToQiniu({
  blob,
  fileName,
  storagePath,
}: {
  blob: Blob;
  fileName: string;
  storagePath?: string;
}): Promise<string> {
  const config = getQiniuConfig(true)!;
  const key = generateObjectKey(storagePath || config.storagePath, fileName);
  const token = generateUploadToken(config, key);

  const formData = new FormData();
  formData.append('token', token);
  formData.append('key', key);
  formData.append('x:name', fileName);
  formData.append('file', blob);

  const uploadResponse = await fetch(config.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`七牛云上传失败: ${uploadResponse.status} ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  return `${config.domain.replace(/\/+$/, '')}/${uploadResult.key}`;
}

export async function persistRemoteImageToQiniu(
  imageUrl: string,
  fileName = 'ai-generated.jpg',
  storagePath = 'xhs-cover'
): Promise<{ url: string; persisted: boolean; originalUrl: string }> {
  if (!isQiniuConfigured()) {
    return { url: imageUrl, persisted: false, originalUrl: imageUrl };
  }

  if (imageUrl.startsWith('data:')) {
    const blob = dataUrlToBlob(imageUrl);
    const url = await uploadBlobToQiniu({ blob, fileName, storagePath });
    return { url, persisted: true, originalUrl: imageUrl };
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`下载图片失败: ${imageResponse.statusText}`);
  }

  const blob = await imageResponse.blob();
  const url = await uploadBlobToQiniu({ blob, fileName, storagePath });
  return { url, persisted: true, originalUrl: imageUrl };
}

function getQiniuConfig(throwIfMissing: boolean): QiniuConfig | null {
  const config: QiniuConfig = {
    accessKey: process.env.QINIU_ACCESS_KEY || '',
    secretKey: process.env.QINIU_SECRET_KEY || '',
    bucket: process.env.QINIU_BUCKET || '',
    uploadUrl: process.env.QINIU_UPLOAD_URL || 'https://upload.qiniup.com',
    domain: process.env.QINIU_DOMAIN || '',
    storagePath: process.env.QINIU_STORAGE_PATH || 'xhs-cover',
  };

  const missing = [
    ['QINIU_ACCESS_KEY', config.accessKey],
    ['QINIU_SECRET_KEY', config.secretKey],
    ['QINIU_BUCKET', config.bucket],
    ['QINIU_DOMAIN', config.domain],
  ]
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    if (throwIfMissing) {
      throw new Error(`缺少七牛云环境变量: ${missing.join(', ')}`);
    }
    return null;
  }

  return config;
}

function generateUploadToken(config: QiniuConfig, key: string): string {
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const putPolicy = {
    scope: `${config.bucket}:${key}`,
    deadline,
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
  };

  const encodedPutPolicy = base64urlEscape(
    Buffer.from(JSON.stringify(putPolicy)).toString('base64')
  );
  const encodedSign = base64urlEscape(
    crypto.createHmac('sha1', config.secretKey).update(encodedPutPolicy).digest('base64')
  );

  return `${config.accessKey}:${encodedSign}:${encodedPutPolicy}`;
}

function generateObjectKey(storagePath: string, fileName: string): string {
  const safePath = storagePath.replace(/^\/+|\/+$/g, '') || 'xhs-cover';
  const extension = getExtension(fileName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 12);
  return `${safePath}/${timestamp}-${random}.${extension}`;
}

function getExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ext || 'jpg';
}

function base64urlEscape(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_');
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const contentType = header.match(/^data:(.*?);base64$/)?.[1] || 'image/png';
  const buffer = Buffer.from(base64 || '', 'base64');
  return new Blob([buffer], { type: contentType });
}
