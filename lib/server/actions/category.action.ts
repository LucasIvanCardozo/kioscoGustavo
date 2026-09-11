'use server';

import { updateTag } from 'next/cache';
import { createProtectedAction } from '@/lib/server/createProtectedAction';
import { categoryUseCases } from '@/lib/server/useCases';
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from '@/lib/shared/schemas/category.schemas';

export const createCategory = createProtectedAction({
  schema: createCategorySchema,
  handler: async ({ data, db }) => {
    const category = await categoryUseCases.createCategory(db, { data: data.data });
    updateTag('kiosco:categories');
    return category;
  },
});

export const updateCategory = createProtectedAction({
  schema: updateCategorySchema,
  handler: async ({ data, db }) => {
    const category = await categoryUseCases.updateCategory(db, {
      id: data.id,
      data: data.data,
    });
    updateTag('kiosco:categories');
    return category;
  },
});

export const deleteCategory = createProtectedAction({
  schema: deleteCategorySchema,
  handler: async ({ data, db }) => {
    const category = await categoryUseCases.deleteCategory(db, { id: data.id });
    updateTag('kiosco:categories');
    return category;
  },
});
