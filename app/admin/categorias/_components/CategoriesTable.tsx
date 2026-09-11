'use client';

import { faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
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
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });

  const close = () => setModal({ kind: 'closed' });

  const renderRows = () => {
    if (categories.length === 0) {
      return (
        <tr>
          <td colSpan={6} className={styles.empty}>
            Todavía no hay categorías. Creá la primera con el botón de arriba.
          </td>
        </tr>
      );
    }

    return categories.map((category) => (
      <tr key={category.id} className={styles.row}>
        <td className={styles.nameCell}>
          <span className={styles.name}>{category.name}</span>
          {category.description && (
            <span className={styles.description}>{category.description}</span>
          )}
        </td>
        <td className={styles.mutedCell}>{category.parent?.name ?? '—'}</td>
        <td className={styles.countCell}>{category.order}</td>
        <td className={styles.countCell}>{category._count.products}</td>
        <td className={styles.countCell}>{category._count.children}</td>
        <td className={styles.actionsCell}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setModal({ kind: 'edit', category })}
            aria-label={`Editar ${category.name}`}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setModal({ kind: 'delete', category })}
            aria-label={`Eliminar ${category.name}`}
            disabled={category._count.products > 0 || category._count.children > 0}
            title={
              category._count.products > 0
                ? 'Tiene productos asociados'
                : category._count.children > 0
                  ? 'Tiene subcategorías'
                  : 'Eliminar'
            }
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </td>
      </tr>
    ));
  };

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
            <tr>
              <th>Nombre</th>
              <th>Padre</th>
              <th>Orden</th>
              <th># Productos</th>
              <th># Subcategorías</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
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
