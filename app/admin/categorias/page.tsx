import { cacheTag } from 'next/cache';
import { CategoriesTable } from '@/app/admin/categorias/_components/CategoriesTable';
import { categoryUseCases } from '@/lib/server/useCases/category.usecases';
import styles from './page.module.css';

export const instant = false;

export default async function CategoriasPage() {
  'use cache';
  cacheTag('kiosco:categories');

  const [categories, roots] = await Promise.all([
    categoryUseCases.getAllWithCount(),
    categoryUseCases.getAllRoots(),
  ]);

  const rootOptions = roots.map((root) => ({ id: root.id, name: root.name }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Categorías</h1>
          <p className={styles.subtitle}>
            Gestioná las categorías y subcategorías del catálogo. Máximo 2 niveles.
          </p>
        </div>
      </header>

      <CategoriesTable categories={categories} roots={rootOptions} />
    </div>
  );
}
