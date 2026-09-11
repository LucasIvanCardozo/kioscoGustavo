'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Layouts/Modals';
import { Button } from '@/components/UI/Button';
import { ModalActions } from '@/components/UI/ModalActions';
import { deleteCategory } from '@/lib/server/actions/category.action';
import type { CategoryWithCount } from '@/lib/shared/types/category.types';
import styles from './DeleteCategoryModal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  category: CategoryWithCount;
};

export const DeleteCategoryModal = ({ open, onClose, category }: Props) => {
  const [isLoading, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategory({ id: category.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success('Categoría eliminada');
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Eliminar categoría" size="small">
      <h2 className={styles.title}>Eliminar categoría</h2>
      <p className={styles.description}>
        ¿Estás seguro de que querés eliminar la categoría{' '}
        <strong>{category.name}</strong>? Esta acción no se puede deshacer.
      </p>
      <ModalActions>
        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          isLoading={isLoading}
        >
          Eliminar
        </Button>
      </ModalActions>
    </Modal>
  );
};
