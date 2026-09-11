import { uploadImageAction } from '@/lib/server/actions/uploadImage.action';
import type { ImageValue, ResolvedImage } from '@/lib/shared/types/image';

export type ResolveImageResult = {
  image: ResolvedImage;
  uploadedFileKey: string | null;
};

export async function resolveImageUpload(
  imageValue: ImageValue | undefined,
  onError: (message: string) => void,
): Promise<ResolveImageResult | null> {
  const image = imageValue ?? '';
  if (image === '') return { image: '', uploadedFileKey: null };
  if ('file' in image) {
    const result = await uploadImageAction(image.file);
    if (!result.success) {
      onError(result.error);
      return null;
    }
    return {
      image: { url: result.url, fileKey: result.fileKey },
      uploadedFileKey: result.fileKey,
    };
  }
  return { image, uploadedFileKey: null };
}