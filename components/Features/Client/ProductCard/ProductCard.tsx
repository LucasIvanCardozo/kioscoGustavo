'use client';

import Image from 'next/image';
import { buildWhatsAppLink } from '@/lib/shared/utils/whatsapp';
import styles from './ProductCard.module.css';

type Props = {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    image: string | null;
    category: { id: string; name: string };
  };
  whatsappNumber: string;
  onImageClick: (src: string, alt: string) => void;
};

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price);

export function ProductCard({ product, whatsappNumber, onImageClick }: Props) {
  const showLastUnit = product.stock === 1;
  const showRemaining = product.stock > 1 && product.stock <= 5;

  const handleImageClick = () => {
    if (product.image) {
      onImageClick(product.image, product.name);
    }
  };

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {product.image ? (
          <button
            type="button"
            onClick={handleImageClick}
            className={styles.imageButton}
            aria-label={`Ampliar imagen de ${product.name}`}
          >
            <Image
              src={product.image}
              alt={product.name}
              width={400}
              height={400}
              sizes="(min-width: 768px) 25vw, 50vw"
              loading="lazy"
              className={styles.image}
            />
          </button>
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true">
            🛍️
          </div>
        )}
        {showLastUnit && (
          <span className={`${styles.badge} ${styles.badgeAlert}`}>Última unidad</span>
        )}
        {showRemaining && (
          <span className={`${styles.badge} ${styles.badgeSoft}`}>Quedan {product.stock}</span>
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.category}>{product.category.name}</p>
        <h3 className={styles.name}>{product.name}</h3>
        {product.description && <p className={styles.description}>{product.description}</p>}
      </div>
      <div className={styles.footer}>
        <span className={styles.price}>{formatPrice(product.price)}</span>
        <a
          href={buildWhatsAppLink(whatsappNumber, product.name)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cta}
        >
          Lo quiero!
        </a>
      </div>
    </article>
  );
}
