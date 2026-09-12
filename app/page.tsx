import { cacheTag } from 'next/cache';
import { HomePage } from '@/components/Features/Client/HomePage/HomePage';
import { productUseCases } from '@/lib/server/useCases';
import { categoryUseCases } from '@/lib/server/useCases';
import styles from './page.module.css';

export const instant = false;

async function loadCatalog() {
  'use cache';
  cacheTag('kiosco:products');
  cacheTag('kiosco:categories');

  const [roots, products] = await Promise.all([
    categoryUseCases.getAllRoots(),
    productUseCases.getAllWithCategory(),
  ]);

  return { roots, products };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const selectedCategoryId = category ?? null;

  const { roots, products } = await loadCatalog();

  return (
    <div className={styles.page}>
      <HomePage roots={roots} products={products} selectedCategoryId={selectedCategoryId} />
    </div>
  );
}
