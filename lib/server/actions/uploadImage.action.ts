'use server';

import { auth } from '@/lib/server/auth/auth';
import { utapi } from '@/lib/server/uploadthing/utapi';
import { MAX_UPLOAD_SIZE } from '@/lib/shared/constants/upload';

export type UploadFileResult =
  | { success: true; url: string; fileKey: string }
  | { success: false; error: string };

export async function uploadImageAction(file: File): Promise<UploadFileResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'No autorizado' };
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      success: false,
      error: `La imagen no puede pesar más de ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)} MB`,
    };
  }

  try {
    const { UTFile } = await import('uploadthing/server');
    const customId = `kiosco/products/${crypto.randomUUID().slice(0, 8)}`;
    const utFile = new UTFile([file], file.name, { customId, lastModified: file.lastModified });
    const result = await utapi.uploadFiles([utFile]);
    const first = result[0];
    if (first?.data) {
      return { success: true, url: first.data.ufsUrl, fileKey: first.data.key };
    }
    if (first && 'error' in first && first.error) {
      const message =
        typeof first.error === 'object' && 'message' in first.error
          ? String(first.error.message)
          : 'Error al subir la imagen';
      return { success: false, error: message };
    }
    return { success: false, error: 'Error al subir la imagen' };
  } catch (error) {
    console.error('UploadThing: Error uploading file:', error);
    return { success: false, error: 'Error al subir la imagen' };
  }
}