import z from 'zod';

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const optionalParentId = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const categoryPayloadSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: optionalTrimmedString,
  order: z.coerce.number().int().nonnegative('El orden debe ser mayor o igual a 0').default(0),
  parentId: optionalParentId,
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: optionalTrimmedString,
  order: z.coerce.number().int().nonnegative('El orden debe ser mayor o igual a 0'),
  parentId: optionalParentId,
});

export const createCategorySchema = z.object({
  data: categoryPayloadSchema,
});

export const updateCategorySchema = z.object({
  id: z.string().trim().min(1),
  data: categoryPayloadSchema.partial(),
});

export const deleteCategorySchema = z.object({
  id: z.string().trim().min(1),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
export type CategoryPayload = z.infer<typeof categoryPayloadSchema>;
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
