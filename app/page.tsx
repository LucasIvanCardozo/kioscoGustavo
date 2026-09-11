import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Kiosco Lucas</h1>
      <p className={styles.subtitle}>Próximamente: catálogo y panel admin.</p>
      <p className={styles.version}>Fase 0 — Setup base</p>
    </main>
  );
}