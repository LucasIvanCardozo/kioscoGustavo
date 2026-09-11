import { cacheTag } from 'next/cache';
import { categoryUseCases } from '@/lib/server/useCases';
import { productUseCases } from '@/lib/server/useCases';
import { ProductsTable } from './_components/ProductsTable';
import styles from './page.module.css';

export const instant = false;

export default async function ProductosPage() {
  'use cache';
  cacheTag('kiosco:products');
  cacheTag('kiosco:categories');

  const [products, categories] = await Promise.all([
    productUseCases.getAllWithCategory(),
    categoryUseCases.getAll(),
  ]);

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Productos</h1>
          <p className={styles.subtitle}>
            Gestioná el catálogo: nombre, descripción, precio, stock, imagen y categoría. El stock
            en cero se oculta al cliente de inmediato.
          </p>
        </div>
      </header>

      <ProductsTable products={products} categories={categoryOptions} />
    </div>
  );
}