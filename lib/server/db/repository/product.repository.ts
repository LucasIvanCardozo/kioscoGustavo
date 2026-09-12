import type { Prisma, PrismaClient } from '@/lib/generated/prisma/client';

export type CreateProductInput = {
  name: string;
  description?: string;
  price: number;
  stock: number;
  stockZeroAt?: Date | null;
  image?: string;
  imageFileKey?: string | null;
  categoryId: string;
  isActive?: boolean;
};

export type UpdateProductInput = Partial<CreateProductInput> & {
  stockZeroAt?: Date | null;
};

const PRODUCT_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ProductInclude;

export const productRepository = (db: PrismaClient | Prisma.TransactionClient) => ({
  getAll({ categoryId, isActive }: { categoryId?: string; isActive?: boolean } = {}) {
    return db.product.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: PRODUCT_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    });
  },

  getAllWithCategory() {
    return db.product.findMany({
      include: PRODUCT_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
    });
  },

  getById({ id }: { id: string }) {
    return db.product.findFirst({
      where: { id },
      include: PRODUCT_INCLUDE,
    });
  },

  async create({ data }: { data: CreateProductInput }) {
    return db.product.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        stock: data.stock,
        stockZeroAt: data.stockZeroAt ?? null,
        image: data.image ?? null,
        imageFileKey: data.imageFileKey ?? null,
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
      },
    });
  },

  async update({ id, data }: { id: string; data: UpdateProductInput }) {
    const updateData: Prisma.ProductUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.stockZeroAt !== undefined) updateData.stockZeroAt = data.stockZeroAt;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.imageFileKey !== undefined) updateData.imageFileKey = data.imageFileKey;
    if (data.categoryId !== undefined) {
      updateData.category = { connect: { id: data.categoryId } };
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return db.product.update({
      where: { id },
      data: updateData,
    });
  },

  async delete({ id }: { id: string }) {
    return db.product.delete({ where: { id } });
  },

  async setActive({ id, isActive }: { id: string; isActive: boolean }) {
    return db.product.update({
      where: { id },
      data: { isActive },
    });
  },

  async setStock({
    id,
    stock,
    stockZeroAt,
  }: {
    id: string;
    stock: number;
    stockZeroAt: Date | null;
  }) {
    return db.product.update({
      where: { id },
      data: { stock, stockZeroAt },
    });
  },

  findExpiredZeroStock({ before }: { before: Date }) {
    return db.product.findMany({
      where: {
        stock: 0,
        stockZeroAt: { not: null, lt: before },
      },
      select: {
        id: true,
        name: true,
        imageFileKey: true,
      },
    });
  },
});
