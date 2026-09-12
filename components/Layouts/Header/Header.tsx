import { env } from '@/lib/env';
import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="/" className={styles.brand}>
          <span className={styles.logoPlaceholder} aria-hidden="true">
            📰
          </span>
          <span className={styles.brandName}>{env.NEXT_PUBLIC_APP_NAME}</span>
        </a>
      </div>
    </header>
  );
}