'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';
import styles from './button.module.css';
import Loading from './Loading/Loading';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'transparent';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'unset';
  isLoading?: boolean;
  href?: string;
}

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  href,
  type,
  ...props
}: ButtonProps) => {
  const classes = `${styles.button} ${styles[variant]} ${styles[size]} ${className || ''}`;
  const isInactive = Boolean(disabled) || isLoading;

  if (href) {
    const linkProps = props as Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'>;
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={isInactive || undefined}
        tabIndex={isInactive ? -1 : undefined}
        data-isloading={isLoading}
        {...linkProps}
      >
        <span className={styles.content}>{children}</span>
        {isLoading && (
          <span className={styles.spinnerSlot} aria-hidden="true">
            <Loading variant="spinner" size="sm" />
          </span>
        )}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={isInactive}
      data-isloading={isLoading}
      type={type ?? 'button'}
      {...props}
    >
      <span className={styles.content}>{children}</span>
      {isLoading && (
        <span className={styles.spinnerSlot} aria-hidden="true">
          <Loading variant="spinner" size="sm" />
        </span>
      )}
    </button>
  );
};
