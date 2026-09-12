'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleIncrement = (productId: string) => {
    startTransition(async () => {
      setPendingId(productId);
      const result = await incrementStock({ id: productId, delta: 1 });
      if (!result.success) {
        setPendingId(null);
        toast.error(result.error.message);
        return;
      }
      toast.success('Stock +1');
      setPendingId(null);
      router.refresh();
    });
  };

  const handleDecrement = (productId: string) => {
    startTransition(async () => {
      setPendingId(productId);
      const result = await decrementStock({ id: productId, delta: 1 });
      if (!result.success) {
        setPendingId(null);
        toast.error(result.error.message);
        return;
      }
      toast.success('Stock −1');
      setPendingId(null);
      router.refresh();
    });
  };

  const handleToggleActive = (productId: string) => {
    startTransition(async () => {
      setPendingId(productId);
      const result = await toggleProductActive({ id: productId });
      if (!result.success) {
        setPendingId(null);
        toast.error(result.error.message);
        return;
      }
      toast.success('Estado actualizado');
      setPendingId(null);
      router.refresh();
    });
  };

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

  const columns: ColumnDef<ProductWithCategory>[] = [
    {
      id: 'image',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className={styles.thumbnailCell}>
          {row.original.image ? (
            <Image
              src={row.original.image}
              alt={row.original.name}
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
      ),
    },
    {
      id: 'name',
      accessorFn: (row) => row.name,
      header: 'Nombre',
      cell: ({ row }) => (
        <div className={styles.nameCell}>
          <span className={styles.name}>{row.original.name}</span>
          {row.original.description && (
            <span className={styles.description}>{row.original.description}</span>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      accessorFn: (row) => row.category.name,
      header: 'Categoría',
      cell: ({ row }) => <span className={styles.mutedCell}>{row.original.category.name}</span>,
    },
    {
      id: 'price',
      accessorKey: 'price',
      header: 'Precio',
      cell: ({ getValue }) => (
        <span className={styles.priceCell}>{formatPrice(getValue<number>())}</span>
      ),
    },
    {
      id: 'stock',
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => {
        const product = row.original;
        const variant = stockVariant(product.stock);
        const stockLabel = product.stock === 0 ? 'Sin stock' : `${product.stock} u.`;
        const isPending = pendingId === product.id;
        return (
          <div className={styles.stockCell}>
            <span className={`${styles.stockBadge} ${styles[`stock-${variant}`]}`}>
              {stockLabel}
            </span>
            <div className={styles.stockButtons}>
              <button
                type="button"
                className={styles.stockButton}
                onClick={() => handleIncrement(product.id)}
                disabled={isPending || product.stock >= 9999}
                aria-label={`Sumar 1 al stock de ${product.name}`}
                title="Sumar 1"
              >
                +1
              </button>
              <button
                type="button"
                className={styles.stockButton}
                onClick={() => handleDecrement(product.id)}
                disabled={isPending || product.stock === 0}
                aria-label={`Restar 1 al stock de ${product.name}`}
                title="Restar 1"
              >
                −1
              </button>
            </div>
          </div>
        );
      },
    },
    {
      id: 'isActive',
      accessorFn: (row) => (row.isActive ? 1 : 0),
      header: 'Estado',
      cell: ({ row }) => {
        const product = row.original;
        const isPending = pendingId === product.id;
        return (
          <label className={styles.statusToggle}>
            <input
              type="checkbox"
              checked={product.isActive}
              onChange={() => handleToggleActive(product.id)}
              disabled={isPending}
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
        );
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className={styles.actionsCell}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setModal({ kind: 'edit', product: row.original })}
            aria-label={`Editar ${row.original.name}`}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setModal({ kind: 'delete', product: row.original })}
            aria-label={`Eliminar ${row.original.name}`}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const sortAttr =
                    sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none';
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={canSort ? styles.sortable : undefined}
                      aria-sort={canSort ? sortAttr : undefined}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && <SortIcon sorted={sorted} />}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  No hay productos que coincidan con los filtros.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={styles.row}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
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

const SortIcon = ({ sorted }: { sorted: false | 'asc' | 'desc' }) => {
  if (sorted === 'asc') return <span aria-hidden="true">↑</span>;
  if (sorted === 'desc') return <span aria-hidden="true">↓</span>;
  return <span aria-hidden="true">↕</span>;
};
