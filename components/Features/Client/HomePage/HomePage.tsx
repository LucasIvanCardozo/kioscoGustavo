import { Header } from '@/components/Layouts/Header/Header';
import { CategoryTabs } from '@/components/Features/Client/CategoryTabs/CategoryTabs';
import { ProductCard } from '@/components/Features/Client/ProductCard/ProductCard';
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
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.title}>{env.NEXT_PUBLIC_APP_NAME}</h1>
          <p className={styles.subtitle}>
            Figuras, partes y stock del momento. Hacé tu pedido por WhatsApp.
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
          <section className={styles.grid} aria-label="Productos">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export type { RootCategory, ProductCardData };
