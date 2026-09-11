'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Form, InputForm, SectionForm, SelectForm, TextareaForm } from '@/components/Layouts/form';
import { Modal } from '@/components/Layouts/Modals/Modal';
import { Button } from '@/components/UI/Button';
import { ImageForm } from '@/components/UI/ImageForm';
import { ModalActions } from '@/components/UI/ModalActions';
import { Switch } from '@/components/UI/Switch';
import { createProduct, updateProduct } from '@/lib/server/actions/product.action';
import { productFormSchema, type ProductFormValues } from '@/lib/shared/schemas/product.schemas';
import type { ImageValue } from '@/lib/shared/types/image';
import type { ProductWithCategory } from '@/lib/shared/types/product.types';
import styles from './ProductModal.module.css';

type CategoryOption = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  categories: CategoryOption[];
  product?: ProductWithCategory;
};

type FormInput = z.input<typeof productFormSchema>;

const toImageValue = (product: ProductWithCategory | undefined): ImageValue => {
  if (!product?.image || !product.imageFileKey) return '';
  return { url: product.image, fileKey: product.imageFileKey };
};

export const ProductModal = ({ open, onClose, mode, categories, product }: Props) => {
  const [isLoading, startTransition] = useTransition();
  const titleId = useId();
  const [imageError, setImageError] = useState<string | null>(null);

  const defaultValues = useMemo<FormInput>(
    () => ({
      name: product?.name ?? '',
      description: product?.description ?? '',
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      categoryId: product?.categoryId ?? '',
      image: toImageValue(product),
      isActive: product?.isActive ?? true,
    }),
    [product],
  );

  const { control, handleSubmit, reset, setValue, watch, formState } = useForm<
    FormInput,
    unknown,
    ProductFormValues
  >({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const { errors } = formState;

  const imageValue = watch('image');

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setImageError(null);
    }
  }, [open, reset, defaultValues]);

  const onSubmit: SubmitHandler<ProductFormValues> = (formData) => {
    setImageError(null);
    startTransition(async () => {
      if (mode === 'edit' && !product) return;

      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,
        categoryId: formData.categoryId,
        image: formData.image,
        isActive: Boolean(formData.isActive),
      };

      const result =
        mode === 'create'
          ? await createProduct({ data: payload })
          : await updateProduct({ id: product?.id ?? '', data: payload });

      if (!result.success) {
        if (result.error.message.toLowerCase().includes('imagen')) {
          setImageError(result.error.message);
        } else {
          toast.error(result.error.message);
        }
        return;
      }

      toast.success(mode === 'create' ? 'Producto creado con éxito' : 'Producto actualizado');
      onClose();
    });
  };

  const title = mode === 'create' ? 'Nuevo producto' : `Editar producto: ${product?.name ?? ''}`;

  const categoryOptions = categories.map((category) => ({
    option: category.name,
    value: category.id,
  }));

  return (
    <Modal open={open} onClose={onClose} title={title} size="large">
      <h2 id={titleId} className={styles.modalTitle}>
        {title}
      </h2>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <SectionForm title="Datos básicos">
          <InputForm<FormInput>
            name="name"
            control={control}
            label="Nombre"
            autoFocus
            error={errors.name}
            data-testid="product-name-input"
          />
          <TextareaForm<FormInput>
            name="description"
            control={control}
            label="Descripción"
            placeholder="Opcional"
            error={errors.description}
          />
          <div className={styles.gridTwo}>
            <InputForm<FormInput>
              name="price"
              control={control}
              label="Precio (ARS)"
              type="number"
              min={0}
              inputMode="numeric"
              error={errors.price}
            />
            <InputForm<FormInput>
              name="stock"
              control={control}
              label="Stock"
              type="number"
              min={0}
              inputMode="numeric"
              error={errors.stock}
            />
          </div>
        </SectionForm>

        <SectionForm title="Ubicación">
          <SelectForm<FormInput>
            name="categoryId"
            control={control}
            label="Categoría"
            options={categoryOptions}
            error={errors.categoryId}
          />
        </SectionForm>

        <SectionForm title="Imagen">
          <ImageForm
            value={imageValue}
            onChange={(next) => {
              setValue('image', next ?? '', { shouldDirty: true });
              setImageError(null);
            }}
            label="Subí una foto del producto"
            error={imageError ?? undefined}
          />
          <p className={styles.helper}>
            La imagen se sube al guardar. Máximo 4 MB. JPG, PNG o WEBP.
          </p>
        </SectionForm>

        <SectionForm title="Visibilidad">
          <div className={styles.switchRow}>
            <Switch
              checked={Boolean(watch('isActive'))}
              onChange={(value) => setValue('isActive', value, { shouldDirty: true })}
              label="Producto activo en el catálogo"
            />
            <p className={styles.helper}>
              Si lo pausás, no aparece en la vista del cliente pero sigue contando para el admin.
            </p>
          </div>
        </SectionForm>

        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
          </Button>
        </ModalActions>
      </Form>
    </Modal>
  );
};
