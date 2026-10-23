import imageCompression from 'browser-image-compression';
import {
  validateCompressedImageSize,
  validateImageType,
  validateSourceImageSize,
} from '@/lib/shared/utils/uploadValidation';

export const DEFAULT_COMPRESS_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  initialQuality: 0.85,
} as const;

const SKIP_THRESHOLD_BYTES = 500 * 1024;
const WEBP_MIME = 'image/webp';

const buildWebPFileName = (originalName: string): string => {
  const lastDot = originalName.lastIndexOf('.');
  const base = lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
  return `${base}.webp`;
};

export async function compressImageForUpload(file: File): Promise<File> {
  if (file.size <= SKIP_THRESHOLD_BYTES) {
    return file;
  }

  const result = (await imageCompression(file, {
    ...DEFAULT_COMPRESS_OPTIONS,
    useWebWorker: true,
    preserveExif: false,
    fileType: WEBP_MIME,
  })) as Blob;

  const name = buildWebPFileName(file.name);

  if (result instanceof File) {
    return new File([result], name, { type: WEBP_MIME });
  }

  return new File([result], name, { type: WEBP_MIME });
}

export type ImagePreparationResult = { ok: true; file: File } | { ok: false; error: string };

export async function prepareImageForUpload(file: File): Promise<ImagePreparationResult> {
  const typeError = validateImageType(file);
  if (typeError) return { ok: false, error: typeError };

  const sourceSizeError = validateSourceImageSize(file);
  if (sourceSizeError) return { ok: false, error: sourceSizeError };

  const compressed = await compressImageForUpload(file);

  const compressedSizeError = validateCompressedImageSize(compressed);
  if (compressedSizeError) return { ok: false, error: compressedSizeError };

  return { ok: true, file: compressed };
}
