'use client';

import type { HTMLAttributes } from 'react';
import styles from './Loading.module.css';

export type LoadingSize = 'sm' | 'md' | 'lg';

export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  size?: LoadingSize;
  label?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
}

export default function Loading({
  size = 'md',
  label,
  variant = 'spinner',
  className = '',
  ...props
}: LoadingProps) {
  const classNames = [styles.wrapper, className].filter(Boolean).join(' ');

  return (
    <div className={classNames} role="status" aria-live="polite" {...props}>
      {variant === 'spinner' && (
        <span className={`${styles.spinner} ${styles[size]}`}>
          <span className={styles.spinnerRing} />
        </span>
      )}
      {variant === 'dots' && (
        <span className={styles.dots}>
          <span className={`${styles.dot} ${styles.dot1}`} />
          <span className={`${styles.dot} ${styles.dot2}`} />
          <span className={`${styles.dot} ${styles.dot3}`} />
        </span>
      )}
      {variant === 'pulse' && <span className={`${styles.pulse} ${styles[size]}`} />}
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
