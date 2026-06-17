// 七牛云上传工具（通过服务端 API 生成签名并上传）
export class QiniuUploader {
  private uploadEndpoint = '/api/qiniu-upload';
  private storagePath = 'xhs-cover';

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('storagePath', this.storagePath);

    const response = await fetch(this.uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `上传失败 (${response.status})`);
    }

    const result = await response.json();
    if (!result.url) {
      throw new Error('上传接口未返回图片 URL');
    }

    return result.url;
  }

  uploadBlob(blob: Blob): Promise<string> {
    const file = new File([blob], 'clipboard-image.png', { type: blob.type });
    return this.uploadFile(file);
  }

  uploadBase64(base64Data: string, fileName: string): Promise<string> {
    const byteString = atob(base64Data);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'image/png' });
    const file = new File([blob], fileName, { type: 'image/png' });
    return this.uploadFile(file);
  }
}
