'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId, useMemo, useTransition } from 'react';
import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Form, InputForm, SectionForm, SelectForm, TextareaForm } from '@/components/Layouts/form';
import { Modal } from '@/components/Layouts/Modals/Modal';
import { Button } from '@/components/UI/Button';
import { ModalActions } from '@/components/UI/ModalActions';
import { createCategory, updateCategory } from '@/lib/server/actions/category.action';
import { categoryFormSchema, type CategoryFormValues } from '@/lib/shared/schemas/category.schemas';
import type { CategoryWithCount } from '@/lib/shared/types/category.types';
import styles from './CategoryModal.module.css';

type CategoryOption = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  roots: CategoryOption[];
  category?: CategoryWithCount;
};

export const CategoryModal = ({ open, onClose, mode, roots, category }: Props) => {
  const [isLoading, startTransition] = useTransition();
  const titleId = useId();

  const defaultValues = useMemo<CategoryFormValues>(
    () => ({
      name: category?.name ?? '',
      description: category?.description ?? '',
      order: category?.order ?? 0,
      parentId: category?.parentId ?? '',
    }),
    [category],
  );

  const { control, handleSubmit, reset, formState } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });

  const { errors } = formState;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const onSubmit: SubmitHandler<CategoryFormValues> = (formData) => {
    startTransition(async () => {
      if (mode === 'edit' && !category) return;
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        order: Number(formData.order) || 0,
        parentId: formData.parentId || undefined,
      };

      const result =
        mode === 'create'
          ? await createCategory({ data: payload })
          : await updateCategory({ id: category?.id ?? '', data: payload });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(mode === 'create' ? 'Categoría creada con éxito' : 'Categoría actualizada');
      onClose();
    });
  };

  const title = mode === 'create' ? 'Nueva categoría' : `Editar categoría: ${category?.name ?? ''}`;

  const parentOptions = roots
    .filter((root) => root.id !== category?.id)
    .map((root) => ({ option: root.name, value: root.id }));

  return (
    <Modal open={open} onClose={onClose} title={title} size="medium">
      <h2 id={titleId} className={styles.modalTitle}>
        {title}
      </h2>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <SectionForm title="Datos básicos">
          <InputForm<CategoryFormValues>
            name="name"
            control={control}
            label="Nombre"
            autoFocus
            error={errors.name}
            data-testid="category-name-input"
          />
          <TextareaForm<CategoryFormValues>
            name="description"
            control={control}
            label="Descripción"
            placeholder="Opcional"
            error={errors.description}
          />
          <InputForm<CategoryFormValues>
            name="order"
            control={control}
            label="Orden"
            type="number"
            min={0}
            error={errors.order}
          />
        </SectionForm>

        <SectionForm title="Ubicación">
          <SelectForm<CategoryFormValues>
            name="parentId"
            control={control}
            label="Categoría padre"
            options={parentOptions}
            error={errors.parentId}
          />
          <p className={styles.helper}>
            Dejalo vacío si querés que sea una categoría raíz. Solo se permiten 2 niveles.
          </p>
        </SectionForm>

        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {mode === 'create' ? 'Crear' : 'Guardar'}
          </Button>
        </ModalActions>
      </Form>
    </Modal>
  );
};
