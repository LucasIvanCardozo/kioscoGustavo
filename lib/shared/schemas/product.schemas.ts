import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const imageValueSchema = z.union([
  z.literal(''),
  z.object({
    url: z.string(),
    fileKey: z.string().min(1),
  }),
  z.object({
    file: z.instanceof(File),
  }),
]);

export const productPayloadSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: optionalTrimmedString,
  price: z.coerce.number().int().nonnegative('El precio debe ser mayor o igual a 0'),
  stock: z.coerce.number().int().nonnegative('El stock debe ser mayor o igual a 0').default(0),
  categoryId: z.string().trim().min(1, 'Seleccioná una categoría'),
  image: imageValueSchema.optional(),
  isActive: z.boolean().default(true),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: optionalTrimmedString,
  price: z.coerce.number().int().nonnegative('El precio debe ser mayor o igual a 0'),
  stock: z.coerce.number().int().nonnegative('El stock debe ser mayor o igual a 0'),
  categoryId: z.string().trim().min(1, 'Seleccioná una categoría'),
  image: imageValueSchema.optional(),
  isActive: z.boolean(),
});

export const createProductSchema = z.object({
  data: productPayloadSchema,
});

export const updateProductSchema = z.object({
  id: z.string().min(1),
  data: productPayloadSchema.partial(),
});

export const deleteProductSchema = z.object({
  id: z.string().min(1),
});

export const adjustStockSchema = z.object({
  id: z.string().min(1),
  delta: z.coerce.number().int().positive().default(1),
});

export const toggleProductActiveSchema = z.object({
  id: z.string().min(1),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type ToggleProductActiveInput = z.infer<typeof toggleProductActiveSchema>;
export type ProductPayload = z.infer<typeof productPayloadSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductImageValue = z.infer<typeof imageValueSchema>;
