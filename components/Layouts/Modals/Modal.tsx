'use client';

import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/UI/Button';
import styles from './modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large';
  children: ReactNode;
}

export const Modal = ({ open, onClose, title, size = 'medium', children }: ModalProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.show();
    }
    return () => {
      if (dialog?.open) dialog.close();
      previouslyFocusedRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sizeClass = size === 'small' ? styles.small : size === 'large' ? styles.large : '';

  return createPortal(
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label="Cerrar modal"
        tabIndex={-1}
      />
      <dialog
        ref={dialogRef}
        className={`${styles.modal} ${sizeClass}`}
        aria-labelledby={title ? titleId : undefined}
      >
        <div className={styles.content}>
          <Button
            variant="transparent"
            onClick={onClose}
            className={styles.close}
            aria-label="Cerrar"
            tabIndex={-1}
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
          {title && (
            <span id={titleId} className={styles.srOnly}>
              {title}
            </span>
          )}
          {children}
        </div>
      </dialog>
    </div>,
    document.body,
  );
};
