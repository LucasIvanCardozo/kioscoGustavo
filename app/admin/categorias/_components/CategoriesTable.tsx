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
import { useMemo, useState } from 'react';
import { Button } from '@/components/UI/Button';
import type { CategoryWithCount } from '@/lib/shared/types/category.types';
import { CategoryModal } from './CategoryModal';
import { DeleteCategoryModal } from './DeleteCategoryModal';
import styles from './CategoriesTable.module.css';

type CategoryOption = { id: string; name: string };

type Props = {
  categories: CategoryWithCount[];
  roots: CategoryOption[];
};

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; category: CategoryWithCount }
  | { kind: 'delete'; category: CategoryWithCount };

export const CategoriesTable = ({ categories, roots }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });

  const close = () => setModal({ kind: 'closed' });

  const columns = useMemo<ColumnDef<CategoryWithCount>[]>(
    () => [
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
        id: 'parent',
        accessorFn: (row) => row.parent?.name ?? '',
        header: 'Padre',
        cell: ({ row }) => (
          <span className={styles.mutedCell}>{row.original.parent?.name ?? '—'}</span>
        ),
      },
      {
        id: 'order',
        accessorKey: 'order',
        header: 'Orden',
        cell: ({ getValue }) => <span className={styles.countCell}>{getValue<number>()}</span>,
      },
      {
        id: 'products',
        accessorFn: (row) => row._count.products,
        header: '# Productos',
        cell: ({ getValue }) => <span className={styles.countCell}>{getValue<number>()}</span>,
      },
      {
        id: 'children',
        accessorFn: (row) => row._count.children,
        header: '# Subcategorías',
        cell: ({ getValue }) => <span className={styles.countCell}>{getValue<number>()}</span>,
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
              onClick={() => setModal({ kind: 'edit', category: row.original })}
              aria-label={`Editar ${row.original.name}`}
            >
              <FontAwesomeIcon icon={faEdit} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModal({ kind: 'delete', category: row.original })}
              aria-label={`Eliminar ${row.original.name}`}
              disabled={row.original._count.products > 0 || row.original._count.children > 0}
              title={
                row.original._count.products > 0
                  ? 'Tiene productos asociados'
                  : row.original._count.children > 0
                    ? 'Tiene subcategorías'
                    : 'Eliminar'
              }
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: categories,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <div className={styles.toolbar}>
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => setModal({ kind: 'create' })}
        >
          <FontAwesomeIcon icon={faPlus} /> Nueva categoría
        </Button>
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
                  Todavía no hay categorías. Creá la primera con el botón de arriba.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={styles.row}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(modal.kind === 'create' || modal.kind === 'edit') && (
        <CategoryModal
          open
          onClose={close}
          mode={modal.kind === 'create' ? 'create' : 'edit'}
          roots={roots}
          category={modal.kind === 'edit' ? modal.category : undefined}
        />
      )}

      {modal.kind === 'delete' && (
        <DeleteCategoryModal open onClose={close} category={modal.category} />
      )}
    </>
  );
};

const SortIcon = ({ sorted }: { sorted: false | 'asc' | 'desc' }) => {
  if (sorted === 'asc') return <span aria-hidden="true">↑</span>;
  if (sorted === 'desc') return <span aria-hidden="true">↓</span>;
  return <span aria-hidden="true">↕</span>;
};
