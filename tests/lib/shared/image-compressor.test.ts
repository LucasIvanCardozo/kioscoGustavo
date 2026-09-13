import imageCompression from 'browser-image-compression';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compressImageForUpload, DEFAULT_COMPRESS_OPTIONS } from '@/lib/shared/image-compressor';

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

const mockedCompression = vi.mocked(imageCompression);

const buildFile = (name: string, sizeBytes: number, type = 'image/jpeg'): File =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe('compressImageForUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the original file when size is at or below the skip threshold (no compression call)', async () => {
    const small = buildFile('small.jpg', 100 * 1024, 'image/jpeg');
    const result = await compressImageForUpload(small);
    expect(result).toBe(small);
    expect(mockedCompression).not.toHaveBeenCalled();
  });

  it('returns the original file when size is exactly at the threshold', async () => {
    const atThreshold = buildFile('at.jpg', 500 * 1024);
    const result = await compressImageForUpload(atThreshold);
    expect(result).toBe(atThreshold);
    expect(mockedCompression).not.toHaveBeenCalled();
  });

  it('calls imageCompression with the documented defaults for files above the threshold', async () => {
    const blobResult = new Blob([new Uint8Array(200 * 1024)], { type: 'image/webp' });
    mockedCompression.mockResolvedValueOnce(blobResult as unknown as File);

    const large = buildFile('big.jpg', 5 * 1024 * 1024);
    const result = await compressImageForUpload(large);

    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('big.webp');
    expect(result.type).toBe('image/webp');
    expect(mockedCompression).toHaveBeenCalledOnce();
    const [fileArg, optionsArg] = mockedCompression.mock.calls[0] as [
      File,
      Record<string, unknown>,
    ];
    expect(fileArg).toBe(large);
    expect(optionsArg.maxSizeMB).toBe(DEFAULT_COMPRESS_OPTIONS.maxSizeMB);
    expect(optionsArg.maxWidthOrHeight).toBe(DEFAULT_COMPRESS_OPTIONS.maxWidthOrHeight);
    expect(optionsArg.initialQuality).toBe(DEFAULT_COMPRESS_OPTIONS.initialQuality);
    expect(optionsArg.useWebWorker).toBe(true);
    expect(optionsArg.preserveExif).toBe(false);
  });

  it('forces image/webp as the compression output type (png input)', async () => {
    mockedCompression.mockResolvedValueOnce(buildFile('out.webp', 100 * 1024, 'image/webp'));

    await compressImageForUpload(buildFile('logo.png', 2 * 1024 * 1024, 'image/png'));

    const optionsArg = (mockedCompression.mock.calls[0] as [File, Record<string, unknown>])[1];
    expect(optionsArg.fileType).toBe('image/webp');
  });

  it('outputs WebP even when the input is JPEG', async () => {
    mockedCompression.mockResolvedValueOnce(buildFile('out.webp', 100 * 1024, 'image/webp'));

    await compressImageForUpload(buildFile('photo.jpg', 2 * 1024 * 1024, 'image/jpeg'));

    const optionsArg = (mockedCompression.mock.calls[0] as [File, Record<string, unknown>])[1];
    expect(optionsArg.fileType).toBe('image/webp');
  });

  it('disables EXIF preservation for privacy', async () => {
    mockedCompression.mockResolvedValueOnce(buildFile('out.webp', 100 * 1024, 'image/webp'));

    await compressImageForUpload(buildFile('big.jpg', 5 * 1024 * 1024));

    const optionsArg = (mockedCompression.mock.calls[0] as [File, Record<string, unknown>])[1];
    expect(optionsArg.preserveExif).toBe(false);
  });

  it('uses Web Workers by default (does not block the main thread)', async () => {
    mockedCompression.mockResolvedValueOnce(buildFile('out.webp', 100 * 1024, 'image/webp'));

    await compressImageForUpload(buildFile('big.jpg', 5 * 1024 * 1024));

    const optionsArg = (mockedCompression.mock.calls[0] as [File, Record<string, unknown>])[1];
    expect(optionsArg.useWebWorker).toBe(true);
  });

  it('wraps a Blob result into a File so instanceof File holds downstream', async () => {
    const blobResult = new Blob([new Uint8Array(1000)], { type: 'image/webp' });
    mockedCompression.mockResolvedValueOnce(blobResult as unknown as File);

    const source = buildFile('product-photo.jpg', 5 * 1024 * 1024, 'image/jpeg');
    const result = await compressImageForUpload(source);

    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe('image/webp');
  });

  it('renames the output File to use the .webp extension regardless of the source extension', async () => {
    const blobResult = new Blob([new Uint8Array(1000)], { type: 'image/webp' });
    mockedCompression.mockResolvedValueOnce(blobResult as unknown as File);

    const source = buildFile('product-photo.jpg', 5 * 1024 * 1024, 'image/jpeg');
    const result = await compressImageForUpload(source);

    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('product-photo.webp');
  });

  it('renames the output File even when the source already ends in .webp', async () => {
    const blobResult = new Blob([new Uint8Array(1000)], { type: 'image/webp' });
    mockedCompression.mockResolvedValueOnce(blobResult as unknown as File);

    const source = buildFile('already.webp', 3 * 1024 * 1024, 'image/webp');
    const result = await compressImageForUpload(source);

    expect(result.name).toBe('already.webp');
  });

  it('always emits an output File with type image/webp even when the underlying Blob has a different type', async () => {
    const blobResult = new Blob([new Uint8Array(1000)], { type: '' });
    mockedCompression.mockResolvedValueOnce(blobResult as unknown as File);

    const source = buildFile('logo.png', 3 * 1024 * 1024, 'image/png');
    const result = await compressImageForUpload(source);

    expect(result).toBeInstanceOf(File);
    expect(result.type).toBe('image/webp');
    expect(result.name).toBe('logo.webp');
  });
});
