import Link from 'next/link';
import { signOutAction } from '@/lib/server/actions/auth/signOut.action';
import { auth } from '@/lib/server/auth/auth';
import db from '@/lib/server/db/db';
import styles from './page.module.css';

export const instant = false;

export default async function AdminPage() {
  const session = await auth();
  const displayEmail = session?.user?.email ?? '';

  const [productCount, categoryCount] = await Promise.all([
    db.product.count(),
    db.category.count(),
  ]);

  return (
    <div className={styles.container}>
      <section className={styles.welcome}>
        <h1 className={styles.title}>Bienvenido, {displayEmail}</h1>
        <p className={styles.subtitle}>
          Acá vas a gestionar categorías, productos y stock. Esta pantalla es solo un placeholder de
          Fase 1.
        </p>
      </section>

      <section className={styles.stats}>
        <article className={styles.card}>
          <p className={styles.cardLabel}>Productos</p>
          <p className={styles.cardValue}>{productCount}</p>
        </article>
        <article className={styles.card}>
          <p className={styles.cardLabel}>Categorías</p>
          <p className={styles.cardValue}>{categoryCount}</p>
        </article>
      </section>

      <section className={styles.actions}>
        <Link href="/" className={styles.linkButton}>
          Ir al inicio público
        </Link>
        <form action={signOutAction}>
          <button type="submit" className={styles.dangerButton}>
            Cerrar sesión
          </button>
        </form>
      </section>
    </div>
  );
}
