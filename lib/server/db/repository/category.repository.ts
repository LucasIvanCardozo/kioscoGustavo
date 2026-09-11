import type { Prisma, PrismaClient } from '@/lib/generated/prisma/client';

export type CreateCategoryInput = {
  name: string;
  description?: string;
  order?: number;
  parentId?: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

const CATEGORY_INCLUDE = {
  _count: {
    select: {
      products: true,
      children: true,
    },
  },
  parent: {
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  },
} satisfies Prisma.CategoryInclude;

export const categoryRepository = (db: PrismaClient | Prisma.TransactionClient) => ({
  getAll() {
    return db.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  },

  getAllRoots() {
    return db.category.findMany({
      where: { parentId: null },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  },

  getById({ id }: { id: string }) {
    return db.category.findFirst({
      where: { id },
      include: CATEGORY_INCLUDE,
    });
  },

  getAllWithCount() {
    return db.category.findMany({
      include: CATEGORY_INCLUDE,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  },

  async create({ data }: { data: CreateCategoryInput }) {
    return db.category.create({
      data: {
        name: data.name,
        description: data.description,
        order: data.order ?? 0,
        parentId: data.parentId ?? null,
      },
    });
  },

  async update({ id, data }: { id: string; data: UpdateCategoryInput }) {
    return db.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
      },
    });
  },

  async delete({ id }: { id: string }) {
    return db.category.delete({ where: { id } });
  },
});
