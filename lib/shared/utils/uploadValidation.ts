import {
  ALLOWED_IMAGE_TYPES,
  MAX_SOURCE_FILE_SIZE,
  MAX_UPLOAD_SIZE,
} from '@/lib/shared/constants/upload';

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
};

export const validateImageType = (file: File): string | null =>
  ALLOWED_IMAGE_TYPES.includes(file.type) ? null : 'Formato de imagen no permitido';

export const validateSourceImageSize = (file: File): string | null =>
  file.size <= MAX_SOURCE_FILE_SIZE
    ? null
    : `Este archivo es demasiado grande para procesarlo (máximo ${formatBytes(MAX_SOURCE_FILE_SIZE)})`;

export const validateCompressedImageSize = (file: File): string | null =>
  file.size <= MAX_UPLOAD_SIZE
    ? null
    : `La imagen no puede pesar más de ${formatBytes(MAX_UPLOAD_SIZE)}`;
