'use client';

import { useCallback, useState } from 'react';
import { ImageViewer } from '@/components/Features/Client/ImageViewer/ImageViewer';
import { ProductCard } from '@/components/Features/Client/ProductCard/ProductCard';
import styles from './ProductGrid.module.css';

type ProductForGrid = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  category: { id: string; name: string };
};

type Props = {
  products: ProductForGrid[];
  whatsappNumber: string;
};

type SelectedImage = { src: string; alt: string };

export function ProductGrid({ products, whatsappNumber }: Props) {
  const [selected, setSelected] = useState<SelectedImage | null>(null);

  const handleImageClick = useCallback((src: string, alt: string) => {
    setSelected({ src, alt });
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <>
      <section className={styles.grid} aria-label="Productos">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            whatsappNumber={whatsappNumber}
            onImageClick={handleImageClick}
          />
        ))}
      </section>
      <ImageViewer image={selected} onClose={handleClose} />
    </>
  );
}
