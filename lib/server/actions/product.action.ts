'use server';

import { updateTag } from 'next/cache';
import { createProtectedAction } from '@/lib/server/createProtectedAction';
import { productUseCases } from '@/lib/server/useCases';
import {
  adjustStockSchema,
  createProductSchema,
  deleteProductSchema,
  toggleProductActiveSchema,
  updateProductSchema,
} from '@/lib/shared/schemas/product.schemas';

const noopImageError = (message: string) => {
  console.error('[product.action] image error:', message);
};

export const createProduct = createProtectedAction({
  schema: createProductSchema,
  handler: async ({ data }) => {
    const product = await productUseCases.createProduct(
      (await import('@/lib/server/db/db')).default,
      { data: data.data, onImageError: noopImageError },
    );
    updateTag('kiosco:products');
    return product;
  },
});

export const updateProduct = createProtectedAction({
  schema: updateProductSchema,
  handler: async ({ data }) => {
    const product = await productUseCases.updateProduct(
      (await import('@/lib/server/db/db')).default,
      { id: data.id, data: data.data, onImageError: noopImageError },
    );
    updateTag('kiosco:products');
    return product;
  },
});

export const deleteProduct = createProtectedAction({
  schema: deleteProductSchema,
  handler: async ({ data }) => {
    const product = await productUseCases.deleteProduct(
      (await import('@/lib/server/db/db')).default,
      { id: data.id },
    );
    updateTag('kiosco:products');
    return product;
  },
});

export const incrementStock = createProtectedAction({
  schema: adjustStockSchema,
  handler: async ({ data }) => {
    const product = await productUseCases.incrementStock(
      (await import('@/lib/server/db/db')).default,
      { id: data.id, delta: data.delta },
    );
    updateTag('kiosco:products');
    return product;
  },
});

export const decrementStock = createProtectedAction({
  schema: adjustStockSchema,
  handler: async ({ data }) => {
    const product = await productUseCases.decrementStock(
      (await import('@/lib/server/db/db')).default,
      { id: data.id, delta: data.delta },
    );
    updateTag('kiosco:products');
    return product;
  },
});

export const toggleProductActive = createProtectedAction({
  schema: toggleProductActiveSchema,
  handler: async ({ data }) => {
    const product = await productUseCases.toggleProductActive(
      (await import('@/lib/server/db/db')).default,
      { id: data.id },
    );
    updateTag('kiosco:products');
    return product;
  },
});