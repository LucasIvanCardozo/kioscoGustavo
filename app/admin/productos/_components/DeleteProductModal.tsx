'use client';

import { useTransition } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Layouts/Modals';
import { Button } from '@/components/UI/Button';
import { ModalActions } from '@/components/UI/ModalActions';
import { deleteProduct } from '@/lib/server/actions/product.action';
import type { ProductWithCategory } from '@/lib/shared/types/product.types';
import styles from './DeleteProductModal.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  product: ProductWithCategory;
};

export const DeleteProductModal = ({ open, onClose, product }: Props) => {
  const [isLoading, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProduct({ id: product.id });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success('Producto eliminado');
      onClose();
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Eliminar producto" size="small">
      <h2 className={styles.title}>Eliminar producto</h2>
      <p className={styles.description}>
        ¿Estás seguro de que querés eliminar el producto{' '}
        <strong>{product.name}</strong>? Esta acción no se puede deshacer y también borra su
        imagen subida.
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