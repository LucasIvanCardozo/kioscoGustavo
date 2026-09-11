import type { Prisma } from '@/lib/generated/prisma/client';

export type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: {
    _count: { select: { products: true; children: true } };
    parent: { select: { id: true; name: true; parentId: true } };
  };
}>;

export type CategoryFormData = {
  name: string;
  description?: string;
  order: number;
  parentId?: string;
};
