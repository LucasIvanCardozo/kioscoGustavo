import type { Prisma } from '@/lib/generated/prisma/client';

const PRODUCT_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_INCLUDE;
}>;

export type ProductFormData = {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  image: string;
  imageFileKey: string | null;
  isActive: boolean;
};