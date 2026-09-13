import Image from 'next/image';
import { CategoryTabs } from '@/components/Features/Client/CategoryTabs/CategoryTabs';
import { ProductGrid } from '@/components/Features/Client/ProductGrid/ProductGrid';
import { env } from '@/lib/env';
import { categoryUseCases } from '@/lib/server/useCases';
import styles from './HomePage.module.css';

type RootCategory = { id: string; name: string };
type ProductCardData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  isActive: boolean;
  category: { id: string; name: string };
};

type Props = {
  roots: RootCategory[];
  products: ProductCardData[];
  selectedCategoryId: string | null;
};

export async function HomePage({ roots, products, selectedCategoryId }: Props) {
  const visibleProducts = products.filter((p) => p.isActive && p.stock > 0);

  let allCategories: { id: string; parentId: string | null }[] = [];
  if (selectedCategoryId !== null) {
    allCategories = await categoryUseCases.getAll();
  }

  const filteredProducts =
    selectedCategoryId === null
      ? visibleProducts
      : visibleProducts.filter((product) => {
          if (product.category.id === selectedCategoryId) return true;
          const parentOfProduct = allCategories.find((c) => c.id === product.category.id);
          return parentOfProduct?.parentId === selectedCategoryId;
        });

  const selectedRoot = selectedCategoryId ? roots.find((r) => r.id === selectedCategoryId) : null;
  const noCategoriesAtAll = roots.length === 0;
  const empty = filteredProducts.length === 0;

  let emptyMessage: string | null = null;
  if (empty) {
    if (noCategoriesAtAll || (selectedCategoryId === null && visibleProducts.length === 0)) {
      emptyMessage = 'Próximamente cargamos el catálogo.';
    } else {
      emptyMessage = 'No hay productos disponibles en esta categoría por ahora.';
    }
  }

  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.logoWrap}>
            <Image
              src="/logo.png"
              alt={`${env.NEXT_PUBLIC_APP_NAME} - Diarios, revistas y figuras`}
              width={400}
              height={400}
              priority
              sizes="(min-width: 768px) 320px, 240px"
              className={styles.logo}
            />
          </div>
          <p className={styles.brandLine}>{env.NEXT_PUBLIC_APP_NAME}</p>
          <h1 className={styles.claim}>Siempre lo que te gusta</h1>
          <p className={styles.subtitle}>
            Diarios, revistas y figuras. Hacé tu pedido por WhatsApp y te lo tenemos listo.
          </p>
        </section>

        {roots.length > 0 && (
          <div className={styles.tabsWrap}>
            <CategoryTabs roots={roots} selectedId={selectedCategoryId} />
          </div>
        )}

        {selectedRoot && (
          <p className={styles.filterBadge}>
            Filtrando por: <strong>{selectedRoot.name}</strong>
          </p>
        )}

        {emptyMessage ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>{emptyMessage}</p>
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            whatsappNumber={env.NEXT_PUBLIC_WHATSAPP_NUMBER}
          />
        )}
      </main>
    </div>
  );
}

export type { RootCategory, ProductCardData };
