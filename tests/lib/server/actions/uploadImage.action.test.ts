import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadImageAction } from '@/lib/server/actions/uploadImage.action';
import { MAX_UPLOAD_SIZE } from '@/lib/shared/constants/upload';

const { mockAuth, mockUploadFiles } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUploadFiles: vi.fn(),
}));

vi.mock('@/lib/server/auth/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/server/uploadthing/utapi', () => ({ utapi: { uploadFiles: mockUploadFiles } }));
vi.mock('uploadthing/server', () => ({
  UTFile: class {
    constructor(
      public parts: unknown[],
      public name: string,
      public options: unknown,
    ) {}
  },
}));

const buildFile = (name: string, sizeBytes: number, type = 'image/webp'): File =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe('uploadImageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1' } });
  });

  it('rejects an unauthenticated request without touching the storage provider', async () => {
    mockAuth.mockResolvedValue(null);

    const result = await uploadImageAction(buildFile('photo.webp', 100 * 1024));

    expect(result).toEqual({ success: false, error: 'No autorizado' });
    expect(mockUploadFiles).not.toHaveBeenCalled();
  });

  it('rejects a file whose mime type is not an allowed image type', async () => {
    const result = await uploadImageAction(buildFile('payload.pdf', 100 * 1024, 'application/pdf'));

    expect(result).toEqual({ success: false, error: 'Formato de imagen no permitido' });
    expect(mockUploadFiles).not.toHaveBeenCalled();
  });

  it('rejects a file above the upload limit', async () => {
    const result = await uploadImageAction(buildFile('photo.webp', MAX_UPLOAD_SIZE + 1));

    expect(result).toEqual({ success: false, error: 'La imagen no puede pesar más de 4 MB' });
    expect(mockUploadFiles).not.toHaveBeenCalled();
  });

  it('uploads an allowed image within the limit and returns its url and key', async () => {
    mockUploadFiles.mockResolvedValueOnce([
      { data: { ufsUrl: 'https://utfs.io/f/photo.webp', key: 'kiosco/products/photo.webp' } },
    ]);

    const result = await uploadImageAction(buildFile('photo.webp', 300 * 1024));

    expect(result).toEqual({
      success: true,
      url: 'https://utfs.io/f/photo.webp',
      fileKey: 'kiosco/products/photo.webp',
    });
    expect(mockUploadFiles).toHaveBeenCalledOnce();
  });
});
