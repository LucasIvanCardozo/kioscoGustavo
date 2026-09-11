'use client';

import type { ReactNode } from 'react';
import styles from './section-form.module.css';

interface Props {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const SectionForm = ({ title, icon, children, className }: Props) => {
  return (
    <section className={`${styles.section} ${className ?? ''}`}>
      <h4 className={styles.sectionTitle}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {title}
      </h4>
      {children}
    </section>
  );
};
