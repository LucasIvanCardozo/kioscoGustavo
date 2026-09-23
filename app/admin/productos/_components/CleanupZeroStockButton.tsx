'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/Layouts/Modals';
import { Button } from '@/components/UI/Button';
import { ModalActions } from '@/components/UI/ModalActions';
import {
  executeCleanupZeroStock,
  previewCleanupZeroStock,
} from '@/lib/server/actions/product.action';
import styles from './CleanupZeroStockButton.module.css';

type PreviewItem = {
  id: string;
  name: string;
  stockZeroAt: Date | string | null;
};

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatDate = (value: PreviewItem['stockZeroAt']): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return dateFormatter.format(date);
};

export const CleanupZeroStockButton = () => {
  const [open, setOpen] = useState(false);
  const [isLoadingPreview, startPreviewTransition] = useTransition();
  const [isLoadingExecute, startExecuteTransition] = useTransition();
  const [items, setItems] = useState<PreviewItem[]>([]);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const resetState = () => {
    setItems([]);
    setPreviewLoaded(false);
    setPreviewError(null);
  };

  const handleOpen = () => {
    setOpen(true);
    startPreviewTransition(async () => {
      setPreviewError(null);
      const result = await previewCleanupZeroStock({});
      if (!result.success) {
        setPreviewError(result.error.message);
        setPreviewLoaded(true);
        return;
      }
      setItems(result.data.items);
      setPreviewLoaded(true);
    });
  };

  const handleClose = () => {
    if (isLoadingExecute) return;
    setOpen(false);
    resetState();
  };

  const handleExecute = () => {
    if (items.length === 0) return;
    const ids = items.map((item) => item.id);
    startExecuteTransition(async () => {
      const result = await executeCleanupZeroStock({ ids });
      if (!result.success) {
        toast.error(result.error.message);
        return;
      }
      toast.success(
        result.data.deletedCount === 1
          ? 'Se eliminó 1 producto'
          : `Se eliminaron ${result.data.deletedCount} productos`,
      );
      setOpen(false);
      resetState();
    });
  };

  const confirmLabel =
    items.length === 1 ? 'Eliminar 1 producto' : `Eliminar ${items.length} productos`;

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleOpen}
        disabled={isLoadingPreview || isLoadingExecute}
      >
        Limpiar sin stock (+30 días)
      </Button>

      <Modal open={open} onClose={handleClose} title="Limpiar productos sin stock" size="medium">
        <h2 className={styles.title}>Limpiar productos sin stock</h2>
        <p className={styles.description}>
          Se eliminarán los productos con stock en cero desde hace más de 30 días. Esta acción no se
          puede deshacer y también borra las imágenes subidas de cada producto.
        </p>

        {previewError && <p className={styles.error}>{previewError}</p>}

        {!previewError && previewLoaded && items.length === 0 && (
          <p className={styles.empty}>No hay productos sin stock hace más de 30 días.</p>
        )}

        {!previewError && items.length > 0 && (
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id} className={styles.item}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemDate}>{formatDate(item.stockZeroAt)}</span>
              </li>
            ))}
          </ul>
        )}

        <ModalActions>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoadingExecute}
          >
            {items.length === 0 ? 'Cerrar' : 'Cancelar'}
          </Button>
          {items.length > 0 && (
            <Button
              type="button"
              variant="danger"
              onClick={handleExecute}
              isLoading={isLoadingExecute}
            >
              {confirmLabel}
            </Button>
          )}
        </ModalActions>
      </Modal>
    </>
  );
};
