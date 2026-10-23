import { describe, expect, it } from 'vitest';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_SOURCE_FILE_SIZE,
  MAX_UPLOAD_SIZE,
} from '@/lib/shared/constants/upload';
import {
  formatBytes,
  validateCompressedImageSize,
  validateImageType,
  validateSourceImageSize,
} from '@/lib/shared/utils/uploadValidation';

const buildFile = (name: string, sizeBytes: number, type = 'image/jpeg'): File =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe('upload limits contract', () => {
  it('keeps the source limit above the upload limit', () => {
    expect(MAX_SOURCE_FILE_SIZE).toBeGreaterThan(MAX_UPLOAD_SIZE);
  });

  it('exposes the source limit as 25 MB and the upload limit as 4 MB', () => {
    expect(MAX_SOURCE_FILE_SIZE).toBe(25 * 1024 * 1024);
    expect(MAX_UPLOAD_SIZE).toBe(4 * 1024 * 1024);
  });
});

describe('formatBytes', () => {
  it('formats raw bytes below 1 KB', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats kilobytes below 1 MB', () => {
    expect(formatBytes(500 * 1024)).toBe('500 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(25 * 1024 * 1024)).toBe('25 MB');
  });
});

describe('validateImageType', () => {
  it.each(ALLOWED_IMAGE_TYPES)('accepts %s', (type) => {
    expect(validateImageType(buildFile('image.bin', 1024, type))).toBeNull();
  });

  it('rejects a non image type', () => {
    expect(validateImageType(buildFile('doc.pdf', 1024, 'application/pdf'))).toBe(
      'Formato de imagen no permitido',
    );
  });

  it('rejects an unsupported image type', () => {
    expect(validateImageType(buildFile('anim.gif', 1024, 'image/gif'))).toBe(
      'Formato de imagen no permitido',
    );
  });

  it('rejects a file without a mime type', () => {
    expect(validateImageType(buildFile('unknown', 1024, ''))).toBe(
      'Formato de imagen no permitido',
    );
  });
});

describe('validateSourceImageSize', () => {
  it('accepts a typical phone photo of 6 MB, which is compressed before upload', () => {
    expect(validateSourceImageSize(buildFile('photo.jpg', 6 * 1024 * 1024))).toBeNull();
  });

  it('accepts a file exactly at the source limit', () => {
    expect(validateSourceImageSize(buildFile('photo.jpg', MAX_SOURCE_FILE_SIZE))).toBeNull();
  });

  it('rejects a file above the source limit', () => {
    expect(validateSourceImageSize(buildFile('photo.jpg', MAX_SOURCE_FILE_SIZE + 1))).toBe(
      'Este archivo es demasiado grande para procesarlo (máximo 25 MB)',
    );
  });
});

describe('validateCompressedImageSize', () => {
  it('accepts a compressed image well below the limit', () => {
    expect(
      validateCompressedImageSize(buildFile('photo.webp', 300 * 1024, 'image/webp')),
    ).toBeNull();
  });

  it('accepts a compressed image exactly at the limit', () => {
    expect(
      validateCompressedImageSize(buildFile('photo.webp', MAX_UPLOAD_SIZE, 'image/webp')),
    ).toBeNull();
  });

  it('rejects a compressed image above the limit', () => {
    expect(
      validateCompressedImageSize(buildFile('photo.webp', MAX_UPLOAD_SIZE + 1, 'image/webp')),
    ).toBe('La imagen no puede pesar más de 4 MB');
  });
});
