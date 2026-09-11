import type { Prisma, PrismaClient } from '@/lib/generated/prisma/client';
import type { ImageValue } from '@/lib/shared/types/image';
import { resolveImageUpload } from '@/lib/shared/utils/uploadImage';
import { productRepository } from '@/lib/server/db/repository/product.repository';
import type {
  CreateProductInput,
  UpdateProductInput,
} from '@/lib/server/db/repository/product.repository';
import {
  cleanupUploadThingFileIfNeeded,
  compensateOrphanedUpload,
  deleteUploadThingFile,
} from '@/lib/server/uploadthing/cleanup';

const computeStockZeroAt = (stock: number): Date | null => (stock === 0 ? new Date() : null);

const normalizeImageInput = (
  image: ImageValue | undefined,
): { image: string; imageFileKey: string | null } | null => {
  if (image === undefined) return null;
  if (image === '') return { image: '', imageFileKey: null };
  if ('file' in image) return null;
  return { image: image.url, imageFileKey: image.fileKey };
};

export const productUseCases = {
  async getAllWithCategory(filters: { categoryId?: string; isActive?: boolean } = {}) {
    const { default: db } = await import('@/lib/server/db/db');
    return productRepository(db).getAll(filters);
  },

  async getById({ id }: { id: string }) {
    const { default: db } = await import('@/lib/server/db/db');
    return productRepository(db).getById({ id });
  },

  async createProduct(
    db: PrismaClient | Prisma.TransactionClient,
    {
      data,
      onImageError,
    }: {
      data: {
        name: string;
        description?: string;
        price: number;
        stock: number;
        categoryId: string;
        image?: ImageValue;
        isActive: boolean;
      };
      onImageError: (message: string) => void;
    },
  ) {
    const category = await db.category.findFirst({
      where: { id: data.categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new Error('La categoría no existe');
    }

    let resolved: { image: string; imageFileKey: string | null } | null = null;
    let uploadedFileKey: string | null = null;

    if (data.image !== undefined) {
      const result = await resolveImageUpload(data.image, onImageError);
      if (result === null) {
        throw new Error('No se pudo subir la imagen');
      }
      resolved = normalizeImageInput(result.image) ?? null;
      uploadedFileKey = result.uploadedFileKey;
    }

    const createPayload: CreateProductInput = {
      name: data.name,
      description: data.description,
      price: data.price,
      stock: data.stock,
      categoryId: data.categoryId,
      isActive: data.isActive,
      stockZeroAt: computeStockZeroAt(data.stock),
      ...(resolved ? { image: resolved.image, imageFileKey: resolved.imageFileKey } : {}),
    };

    return compensateOrphanedUpload({
      uploadedFileKey,
      save: () => productRepository(db).create({ data: createPayload }),
    });
  },

  async updateProduct(
    db: PrismaClient | Prisma.TransactionClient,
    {
      id,
      data,
      onImageError,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        price?: number;
        stock?: number;
        categoryId?: string;
        image?: ImageValue;
        isActive?: boolean;
      };
      onImageError: (message: string) => void;
    },
  ) {
    const existing = await db.product.findFirst({
      where: { id },
      select: { id: true, stock: true, imageFileKey: true },
    });
    if (!existing) {
      throw new Error('El producto no existe');
    }

    let resolved: { image: string; imageFileKey: string | null } | null = null;
    let uploadedFileKey: string | null = null;

    if (data.image !== undefined) {
      const result = await resolveImageUpload(data.image, onImageError);
      if (result === null) {
        throw new Error('No se pudo subir la imagen');
      }
      resolved = normalizeImageInput(result.image) ?? null;
      uploadedFileKey = result.uploadedFileKey;
    }

    if (data.categoryId !== undefined) {
      const category = await db.category.findFirst({
        where: { id: data.categoryId },
        select: { id: true },
      });
      if (!category) {
        if (uploadedFileKey) {
          await deleteUploadThingFile(uploadedFileKey);
        }
        throw new Error('La categoría no existe');
      }
    }

    const nextStock = data.stock ?? existing.stock;
    const stockZeroAt = data.stock !== undefined ? computeStockZeroAt(nextStock) : undefined;

    const updatePayload: UpdateProductInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(stockZeroAt !== undefined && { stockZeroAt }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(resolved ? { image: resolved.image, imageFileKey: resolved.imageFileKey } : {}),
    };

    const updated = await compensateOrphanedUpload({
      uploadedFileKey,
      save: () => productRepository(db).update({ id, data: updatePayload }),
    });

    if (resolved) {
      await cleanupUploadThingFileIfNeeded(existing.imageFileKey, resolved.imageFileKey);
    }

    return updated;
  },

  async deleteProduct(db: PrismaClient | Prisma.TransactionClient, { id }: { id: string }) {
    const existing = await db.product.findFirst({
      where: { id },
      select: { id: true, imageFileKey: true },
    });
    if (!existing) {
      throw new Error('El producto no existe');
    }

    const deleted = await productRepository(db).delete({ id });

    if (existing.imageFileKey) {
      await deleteUploadThingFile(existing.imageFileKey);
    }

    return deleted;
  },

  async incrementStock(
    db: PrismaClient | Prisma.TransactionClient,
    { id, delta = 1 }: { id: string; delta?: number },
  ) {
    if (delta <= 0) {
      throw new Error('El delta debe ser positivo');
    }

    const existing = await db.product.findFirst({
      where: { id },
      select: { id: true, stock: true },
    });
    if (!existing) {
      throw new Error('El producto no existe');
    }

    const newStock = existing.stock + delta;
    const stockZeroAt = newStock === 0 ? new Date() : null;

    return productRepository(db).setStock({ id, stock: newStock, stockZeroAt });
  },

  async decrementStock(
    db: PrismaClient | Prisma.TransactionClient,
    { id, delta = 1 }: { id: string; delta?: number },
  ) {
    if (delta <= 0) {
      throw new Error('El delta debe ser positivo');
    }

    const existing = await db.product.findFirst({
      where: { id },
      select: { id: true, stock: true },
    });
    if (!existing) {
      throw new Error('El producto no existe');
    }

    const newStock = existing.stock - delta;
    if (newStock < 0) {
      throw new Error('Stock no puede ser negativo');
    }

    const stockZeroAt = newStock === 0 ? new Date() : null;

    return productRepository(db).setStock({ id, stock: newStock, stockZeroAt });
  },

  async toggleProductActive(db: PrismaClient | Prisma.TransactionClient, { id }: { id: string }) {
    const existing = await db.product.findFirst({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!existing) {
      throw new Error('El producto no existe');
    }
    return productRepository(db).setActive({ id, isActive: !existing.isActive });
  },
};
