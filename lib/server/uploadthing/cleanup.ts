import { utapi } from '@/lib/server/uploadthing/utapi';

function shouldCleanupUploadThingFile(
  oldFileKey: string | null | undefined,
  newFileKey: string | null | undefined,
): boolean {
  if (!oldFileKey) return false;
  if (newFileKey === undefined) return false;
  if (newFileKey === null || newFileKey === '') return true;
  return oldFileKey !== newFileKey;
}

export async function deleteUploadThingFile(fileKey: string): Promise<void> {
  if (!fileKey) return;
  try {
    await utapi.deleteFiles([fileKey]);
    console.info('UploadThing: File cleanup success', { fileKey });
  } catch (error) {
    console.error('UploadThing: Error deleting file:', { fileKey, error });
  }
}

export async function cleanupUploadThingFileIfNeeded(
  oldFileKey: string | null | undefined,
  newFileKey: string | null | undefined,
): Promise<void> {
  if (shouldCleanupUploadThingFile(oldFileKey, newFileKey)) {
    await deleteUploadThingFile(oldFileKey as string);
  }
}

export async function compensateOrphanedUpload<T>({
  uploadedFileKey,
  save,
}: {
  uploadedFileKey: string | null;
  save: () => Promise<T>;
}): Promise<T> {
  try {
    return await save();
  } catch (error) {
    if (uploadedFileKey) {
      try {
        await deleteUploadThingFile(uploadedFileKey);
      } catch (cleanupError) {
        console.error('UploadThing: Compensation cleanup failed:', cleanupError);
      }
    }
    throw error;
  }
}