'use client';

import { faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo, useOptimistic, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Button } from '@/components/UI/Button';
import type { ProductWithCategory } from '@/lib/shared/types/product.types';
import {
  decrementStock,
  incrementStock,
  toggleProductActive,
} from '@/lib/server/actions/product.action';
import { DeleteProductModal } from './DeleteProductModal';
import { ProductModal } from './ProductModal';
import styles from './ProductsTable.module.css';

type CategoryOption = { id: string; name: string };

type Props = {
  products: ProductWithCategory[];
  categories: CategoryOption[];
};

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; product: ProductWithCategory }
  | { kind: 'delete'; product: ProductWithCategory };

type StatusFilter = 'all' | 'active' | 'paused' | 'outOfStock';

type OptimisticAdjustment =
  | { kind: 'increment'; productId: string }
  | { kind: 'decrement'; productId: string }
  | { kind: 'toggle'; productId: string };

const formatPrice = (price: number): string => `$ ${new Intl.NumberFormat('es-AR').format(price)}`;

const stockVariant = (stock: number): 'high' | 'medium' | 'low' | 'empty' => {
  if (stock === 0) return 'empty';
  if (stock <= 3) return 'low';
  if (stock <= 10) return 'medium';
  return 'high';
};

export const ProductsTable = ({ products, categories }: Props) => {
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [, startTransition] = useTransition();

  const close = () => setModal({ kind: 'closed' });

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== '' && product.categoryId !== selectedCategory) return false;
      if (statusFilter === 'active' && !product.isActive) return false;
      if (statusFilter === 'paused' && product.isActive) return false;
      if (statusFilter === 'outOfStock' && product.stock !== 0) return false;
      return true;
    });
  }, [products, selectedCategory, statusFilter]);

  const [optimisticProducts, applyOptimistic] = useOptimistic<
    ProductWithCategory[],
    OptimisticAdjustment
  >(filteredProducts, (current, adjustment) => {
    if (adjustment.kind === 'toggle') {
      return current.map((product) =>
        product.id === adjustment.productId ? { ...product, isActive: !product.isActive } : product,
      );
    }
    if (adjustment.kind === 'increment') {
      return current.map((product) =>
        product.id === adjustment.productId
          ? {
              ...product,
              stock: product.stock + 1,
              stockZeroAt: null,
            }
          : product,
      );
    }
    return current.map((product) =>
      product.id === adjustment.productId
        ? {
            ...product,
            stock: Math.max(0, product.stock - 1),
            stockZeroAt: product.stock - 1 <= 0 ? new Date() : product.stockZeroAt,
          }
        : product,
    );
  });

  const renderRows = () => {
    if (optimisticProducts.length === 0) {
      return (
        <tr>
          <td colSpan={7} className={styles.empty}>
            No hay productos que coincidan con los filtros.
          </td>
        </tr>
      );
    }

    return optimisticProducts.map((product) => {
      const variant = stockVariant(product.stock);
      const stockLabel = product.stock === 0 ? 'Sin stock' : `${product.stock} u.`;

      return (
        <tr key={product.id} className={styles.row}>
          <td>
            <div className={styles.thumbnailCell}>
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={40}
                  height={40}
                  className={styles.thumbnail}
                />
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <span aria-hidden="true">—</span>
                </div>
              )}
            </div>
          </td>
          <td className={styles.nameCell}>
            <span className={styles.name}>{product.name}</span>
            {product.description && (
              <span className={styles.description}>{product.description}</span>
            )}
          </td>
          <td className={styles.mutedCell}>{product.category.name}</td>
          <td className={styles.priceCell}>{formatPrice(product.price)}</td>
          <td>
            <div className={styles.stockCell}>
              <span className={`${styles.stockBadge} ${styles[`stock-${variant}`]}`}>
                {stockLabel}
              </span>
              <div className={styles.stockButtons}>
                <button
                  type="button"
                  className={styles.stockButton}
                  onClick={() => {
                    startTransition(async () => {
                      applyOptimistic({ kind: 'increment', productId: product.id });
                      const result = await incrementStock({ id: product.id, delta: 1 });
                      if (!result.success) {
                        toast.error(result.error.message);
                      }
                    });
                  }}
                  disabled={product.stock >= 9999}
                  aria-label={`Sumar 1 al stock de ${product.name}`}
                  title="Sumar 1"
                >
                  +1
                </button>
                <button
                  type="button"
                  className={styles.stockButton}
                  onClick={() => {
                    startTransition(async () => {
                      applyOptimistic({ kind: 'decrement', productId: product.id });
                      const result = await decrementStock({ id: product.id, delta: 1 });
                      if (!result.success) {
                        toast.error(result.error.message);
                      }
                    });
                  }}
                  disabled={product.stock === 0}
                  aria-label={`Restar 1 al stock de ${product.name}`}
                  title="Restar 1"
                >
                  −1
                </button>
              </div>
            </div>
          </td>
          <td>
            <label className={styles.statusToggle}>
              <input
                type="checkbox"
                checked={product.isActive}
                onChange={() => {
                  startTransition(async () => {
                    applyOptimistic({ kind: 'toggle', productId: product.id });
                    const result = await toggleProductActive({ id: product.id });
                    if (!result.success) {
                      toast.error(result.error.message);
                    }
                  });
                }}
                className={styles.statusCheckbox}
                aria-label={`${product.isActive ? 'Pausar' : 'Activar'} ${product.name}`}
              />
              <span
                className={`${styles.statusBadge} ${
                  product.isActive ? styles.statusActive : styles.statusPaused
                }`}
              >
                {product.isActive ? 'Activo' : 'Pausado'}
              </span>
            </label>
          </td>
          <td className={styles.actionsCell}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModal({ kind: 'edit', product })}
              aria-label={`Editar ${product.name}`}
            >
              <FontAwesomeIcon icon={faEdit} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModal({ kind: 'delete', product })}
              aria-label={`Eliminar ${product.name}`}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </td>
        </tr>
      );
    });
  };

  const categoryFilterOptions = [
    { option: 'Todas las categorías', value: '' },
    ...categories.map((category) => ({ option: category.name, value: category.id })),
  ];

  const statusChips: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Activos' },
    { id: 'paused', label: 'Pausados' },
    { id: 'outOfStock', label: 'Sin stock' },
  ];

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.filterRow}>
          <label htmlFor="category-filter" className={styles.filterLabel}>
            Categoría
          </label>
          <select
            id="category-filter"
            className={styles.filterSelect}
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {categoryFilterOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.option}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.chipRow}>
          {statusChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`${styles.chip} ${statusFilter === chip.id ? styles.chipActive : ''}`}
              onClick={() => setStatusFilter(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <div className={styles.toolbar}>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setModal({ kind: 'create' })}
          >
            <FontAwesomeIcon icon={faPlus} /> Nuevo producto
          </Button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th aria-label="Imagen" />
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
        </table>
      </div>

      {(modal.kind === 'create' || modal.kind === 'edit') && (
        <ProductModal
          open
          onClose={close}
          mode={modal.kind === 'create' ? 'create' : 'edit'}
          categories={categories}
          product={modal.kind === 'edit' ? modal.product : undefined}
        />
      )}

      {modal.kind === 'delete' && (
        <DeleteProductModal open onClose={close} product={modal.product} />
      )}
    </>
  );
};
