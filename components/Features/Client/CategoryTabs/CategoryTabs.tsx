import styles from './CategoryTabs.module.css';

type RootCategory = { id: string; name: string };

type Props = {
  roots: RootCategory[];
  selectedId: string | null;
};

export function CategoryTabs({ roots, selectedId }: Props) {
  return (
    <nav className={styles.tabs} aria-label="Categorías">
      <a
        href="/"
        className={selectedId === null ? `${styles.tab} ${styles.active}` : styles.tab}
        aria-current={selectedId === null ? 'page' : undefined}
      >
        Todas
      </a>
      {roots.map((root) => {
        const isActive = root.id === selectedId;
        return (
          <a
            key={root.id}
            href={`/?category=${root.id}`}
            className={isActive ? `${styles.tab} ${styles.active}` : styles.tab}
            aria-current={isActive ? 'page' : undefined}
          >
            {root.name}
          </a>
        );
      })}
    </nav>
  );
}