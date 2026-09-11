'use client';

import type { ReactNode } from 'react';
import styles from './Switch.module.css';

interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  id?: string;
}

export const Switch = ({ checked, onChange, label, disabled = false, id }: SwitchProps) => {
  const ariaLabel = typeof label === 'string' ? label : undefined;

  return (
    <label className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        disabled={disabled}
        className={styles.input}
        aria-label={ariaLabel}
      />
      <span className={styles.slider} aria-hidden="true" />
      {label ? <span className={styles.label}>{label}</span> : null}
    </label>
  );
};