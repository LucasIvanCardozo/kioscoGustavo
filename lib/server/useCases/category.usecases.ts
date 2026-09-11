import type { Prisma, PrismaClient } from '@/lib/generated/prisma/client';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/lib/server/db/repository/category.repository';

const MAX_CATEGORY_LEVELS = 2;

const validateParentCategory = async ({
  db,
  parentId,
  selfId,
}: {
  db: PrismaClient | Prisma.TransactionClient;
  parentId?: string;
  selfId?: string;
}) => {
  if (!parentId) return null;

  if (selfId && parentId === selfId) {
    throw new Error('Una categoría no puede ser su propia categoría padre');
  }

  const parent = await db.category.findFirst({
    where: { id: parentId },
    select: { id: true, parentId: true },
  });

  if (!parent) {
    throw new Error('La categoría padre no existe');
  }

  if (parent.parentId) {
    throw new Error(`Solo se permiten ${MAX_CATEGORY_LEVELS} niveles de categorías`);
  }

  return parent.id;
};

export const categoryUseCases = {
  async getAll() {
    const { categoryRepository } = await import('@/lib/server/db/repository/category.repository');
    const { default: db } = await import('@/lib/server/db/db');
    return categoryRepository(db).getAll();
  },

  async getAllWithCount() {
    const { categoryRepository } = await import('@/lib/server/db/repository/category.repository');
    const { default: db } = await import('@/lib/server/db/db');
    return categoryRepository(db).getAllWithCount();
  },

  async getAllRoots() {
    const { categoryRepository } = await import('@/lib/server/db/repository/category.repository');
    const { default: db } = await import('@/lib/server/db/db');
    return categoryRepository(db).getAllRoots();
  },

  async getById({ id }: { id: string }) {
    const { categoryRepository } = await import('@/lib/server/db/repository/category.repository');
    const { default: db } = await import('@/lib/server/db/db');
    return categoryRepository(db).getById({ id });
  },

  async createCategory(
    db: PrismaClient | Prisma.TransactionClient,
    { data }: { data: CreateCategoryInput },
  ) {
    const { categoryRepository } = await import('@/lib/server/db/repository/category.repository');

    const parentId = await validateParentCategory({
      db,
      parentId: data.parentId,
    });

    return categoryRepository(db).create({
      data: { ...data, parentId: parentId ?? undefined },
    });
  },

  async updateCategory(
    db: PrismaClient | Prisma.TransactionClient,
    { id, data }: { id: string; data: UpdateCategoryInput },
  ) {
    const { categoryRepository } = await import('@/lib/server/db/repository/category.repository');

    const existing = await db.category.findFirst({
      where: { id },
      select: {
        id: true,
        parentId: true,
        _count: { select: { children: true } },
      },
    });

    if (!existing) {
      throw new Error('La categoría no existe');
    }

    const hasParentUpdate = Object.hasOwn(data, 'parentId');
    const resolvedParentId: string | null | undefined = hasParentUpdate
      ? await validateParentCategory({
          db,
          parentId: data.parentId,
          selfId: id,
        })
      : undefined;

    if (
      resolvedParentId !== undefined &&
      resolvedParentId !== null &&
      existing._count.children > 0
    ) {
      throw new Error(
        'No se puede convertir en subcategoría: esta categoría ya tiene subcategorías',
      );
    }

    const updatePayload: UpdateCategoryInput = { ...data };
    if (hasParentUpdate) {
      updatePayload.parentId = resolvedParentId ?? undefined;
    }

    return categoryRepository(db).update({ id, data: updatePayload });
  },

  async deleteCategory(db: PrismaClient | Prisma.TransactionClient, { id }: { id: string }) {
    const category = await db.category.findFirst({
      where: { id },
      select: {
        id: true,
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      throw new Error('La categoría no existe');
    }

    if (category._count.children > 0) {
      throw new Error(
        'No se puede borrar la categoría porque tiene subcategorías. Borrá las subcategorías primero.',
      );
    }

    if (category._count.products > 0) {
      throw new Error('No se puede borrar la categoría porque tiene productos asociados.');
    }

    try {
      const { categoryRepository } = await import('@/lib/server/db/repository/category.repository');
      return await categoryRepository(db).delete({ id });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2003'
      ) {
        throw new Error('No se puede borrar la categoría porque tiene productos asociados.');
      }
      throw error;
    }
  },
};
